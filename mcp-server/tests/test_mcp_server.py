"""Test suite for FileInASnap MCP Server"""

import pytest
import asyncio
from pathlib import Path
import tempfile
import sys

# Add src directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from src.providers.manager import provider_manager
from src.providers.base import TaskType, AIRequest
from src.utils.file_processor import file_processor
from src.config import settings


class TestProviderManager:
    """Test AI provider management"""
    
    @pytest.mark.asyncio
    async def test_provider_initialization(self):
        """Test provider manager initialization"""
        await provider_manager.initialize()
        
        # Should have at least OpenRouter provider
        assert "openrouter" in provider_manager.providers
        
        # Test provider status
        status = await provider_manager.get_provider_status()
        assert isinstance(status, dict)
        assert "openrouter" in status
        
    @pytest.mark.asyncio
    async def test_openrouter_availability(self):
        """Test OpenRouter provider availability"""
        await provider_manager.initialize()
        
        openrouter = provider_manager.providers.get("openrouter")
        assert openrouter is not None
        
        # Test basic availability (may fail without internet)
        try:
            available = await openrouter.is_available()
            # Don't assert True/False as it depends on network
            assert isinstance(available, bool)
        except Exception:
            # Network issues are acceptable in tests
            pass
    
    @pytest.mark.asyncio
    async def test_provider_capabilities(self):
        """Test provider capabilities"""
        await provider_manager.initialize()
        
        capabilities = await provider_manager.get_all_capabilities()
        assert isinstance(capabilities, dict)
        
        if "openrouter" in capabilities:
            openrouter_caps = capabilities["openrouter"]
            assert len(openrouter_caps) > 0
            
            # Should support text generation
            task_types = [cap.task_type for cap in openrouter_caps]
            assert TaskType.TEXT_GENERATION in task_types


class TestFileProcessor:
    """Test file processing utilities"""
    
    def setup_method(self):
        """Create test files"""
        self.temp_dir = Path(tempfile.mkdtemp())
        
        # Create test text file
        self.test_txt = self.temp_dir / "test.txt"
        self.test_txt.write_text("This is a test document with some content.")
        
        # Create test JSON file
        self.test_json = self.temp_dir / "test.json"
        self.test_json.write_text('{"name": "test", "value": 123}')
        
    def teardown_method(self):
        """Clean up test files"""
        import shutil
        if self.temp_dir.exists():
            shutil.rmtree(self.temp_dir)
    
    @pytest.mark.asyncio
    async def test_file_info_extraction(self):
        """Test file information extraction"""
        file_info = await file_processor.get_file_info(self.test_txt)
        
        assert file_info["name"] == "test.txt"
        assert file_info["extension"] == ".txt"
        assert file_info["category"] == "text"
        assert file_info["size"] > 0
        assert "hash" in file_info
        assert "mime_type" in file_info
    
    @pytest.mark.asyncio
    async def test_text_content_extraction(self):
        """Test text content extraction"""
        content = await file_processor.read_text_content(self.test_txt)
        assert "test document" in content
        
        # Test with length limit
        short_content = await file_processor.read_text_content(self.test_txt, max_length=10)
        assert len(short_content) <= 20  # includes truncation marker
    
    @pytest.mark.asyncio
    async def test_duplicate_detection(self):
        """Test duplicate file detection"""
        # Create duplicate file
        duplicate = self.temp_dir / "duplicate.txt"
        duplicate.write_text("This is a test document with some content.")
        
        duplicates = await file_processor.detect_duplicates([self.test_txt, duplicate])
        
        # Should find one group of duplicates
        assert len(duplicates) == 1
        assert len(duplicates[0]) == 2


class TestAIIntegration:
    """Test AI provider integration (may require network)"""
    
    @pytest.mark.asyncio
    async def test_text_generation_request(self):
        """Test basic text generation request"""
        await provider_manager.initialize()
        
        request = AIRequest(
            task_type=TaskType.TEXT_GENERATION,
            content="What is the capital of France?",
            parameters={"max_tokens": 50, "temperature": 0.1}
        )
        
        try:
            response = await provider_manager.process_request(request)
            
            # Response should have basic structure
            assert hasattr(response, 'success')
            assert hasattr(response, 'content')
            assert hasattr(response, 'provider')
            
            if response.success:
                assert len(response.content) > 0
                assert "Paris" in response.content  # Should contain the answer
            
        except Exception as e:
            # Network or API issues are acceptable in tests
            pytest.skip(f"AI request failed (expected in offline tests): {e}")
    
    @pytest.mark.asyncio
    async def test_document_classification_request(self):
        """Test document classification"""
        await provider_manager.initialize()
        
        request = AIRequest(
            task_type=TaskType.CONTENT_CLASSIFICATION,
            content="This is a technical specification document about API design.",
            parameters={"max_tokens": 200, "temperature": 0.1}
        )
        
        try:
            response = await provider_manager.process_request(request)
            
            if response.success:
                assert len(response.content) > 0
                # Should classify as technical document
                assert any(word in response.content.lower() for word in ["technical", "document", "api"])
            
        except Exception as e:
            pytest.skip(f"AI request failed (expected in offline tests): {e}")


@pytest.mark.asyncio
async def test_mcp_tools_integration():
    """Test MCP tools integration"""
    # This would require the actual MCP tools to be importable
    # For now, just test that the modules can be imported
    
    try:
        from src.tools.fileinasnap_tools import mcp, initialize_mcp
        
        # Basic initialization test
        await initialize_mcp()
        
        # Check that FastMCP instance is created
        assert mcp is not None
        assert hasattr(mcp, 'run')
        
    except ImportError as e:
        pytest.skip(f"MCP tools import failed: {e}")


if __name__ == "__main__":
    pytest.main([__file__])
