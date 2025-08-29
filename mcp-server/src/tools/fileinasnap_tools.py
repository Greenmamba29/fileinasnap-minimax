"""FileInASnap-specific MCP tools for intelligent file management"""

from fastmcp import FastMCP
from typing import Dict, Any, List, Optional, Union
from pathlib import Path
import json
import logging
from ..providers.manager import provider_manager
from ..providers.base import TaskType, AIRequest
from ..utils.file_processor import file_processor
from ..config import settings
import asyncio
from datetime import datetime
import base64
import aiofiles

logger = logging.getLogger(__name__)

# Initialize FastMCP
mcp = FastMCP("FileInASnap Universal AI-Powered MCP Server")


@mcp.tool
async def analyze_document(file_path: str, analysis_type: str = "comprehensive", max_content_length: int = 50000) -> Dict[str, Any]:
    """Analyze a document using AI to extract insights, categorize, and generate metadata.
    
    Args:
        file_path: Absolute path to the document file
        analysis_type: Type of analysis - 'comprehensive', 'quick', 'classification', 'summary'
        max_content_length: Maximum content length to analyze (default: 50000)
    
    Returns:
        Dict containing analysis results including document type, summary, entities, tags, etc.
    """
    try:
        file_path = Path(file_path)
        
        if not file_path.exists():
            return {"error": f"File not found: {file_path}", "success": False}
        
        # Get file information
        file_info = await file_processor.get_file_info(file_path)
        
        # Extract text content
        content = await file_processor.read_text_content(file_path, max_content_length)
        
        if not content.strip():
            return {
                "error": "No text content could be extracted from the file",
                "success": False,
                "file_info": file_info
            }
        
        # Prepare AI request based on analysis type
        if analysis_type == "comprehensive":
            task_type = TaskType.DOCUMENT_ANALYSIS
        elif analysis_type in ["classification", "categorization"]:
            task_type = TaskType.CONTENT_CLASSIFICATION
        else:
            task_type = TaskType.DOCUMENT_ANALYSIS
        
        ai_request = AIRequest(
            task_type=task_type,
            content=content,
            parameters={
                "max_tokens": 2000,
                "temperature": 0.1
            },
            metadata={
                "file_path": str(file_path),
                "analysis_type": analysis_type,
                "file_info": file_info
            }
        )
        
        # Process with AI
        response = await provider_manager.process_request(ai_request)
        
        result = {
            "success": response.success,
            "file_info": file_info,
            "content_preview": content[:1000] + "..." if len(content) > 1000 else content,
            "analysis_type": analysis_type,
            "provider_used": response.provider,
            "model_used": response.model_used
        }
        
        if response.success:
            if isinstance(response.content, dict):
                result["analysis"] = response.content
            else:
                result["analysis"] = {"raw_response": response.content}
                
            # Add usage stats if available
            if response.usage_stats:
                result["usage_stats"] = response.usage_stats
        else:
            result["error"] = response.error_message
        
        return result
        
    except Exception as e:
        logger.error(f"Document analysis failed: {e}")
        return {"error": str(e), "success": False}


@mcp.tool
async def categorize_files(file_paths: List[str], custom_categories: Optional[List[str]] = None) -> Dict[str, Any]:
    """Intelligently categorize multiple files based on content analysis.
    
    Args:
        file_paths: List of absolute paths to files
        custom_categories: Optional list of custom categories to use
    
    Returns:
        Dict containing categorization results for each file
    """
    try:
        results = {
            "categorizations": {},
            "summary": {},
            "errors": {},
            "success": True
        }
        
        # Default categories if none provided
        if custom_categories is None:
            categories = [
                "Documents", "Images", "Videos", "Audio", "Archives",
                "Code", "Presentations", "Spreadsheets", "PDFs", "Text Files"
            ]
        else:
            categories = custom_categories
        
        for file_path_str in file_paths:
            try:
                file_path = Path(file_path_str)
                
                if not file_path.exists():
                    results["errors"][file_path_str] = "File not found"
                    continue
                
                # Get file info
                file_info = await file_processor.get_file_info(file_path)
                
                # Prepare content for classification
                content_summary = f"""
                File: {file_info['name']}
                Type: {file_info['mime_type']}
                Size: {file_info['size_mb']} MB
                Extension: {file_info['extension']}
                Category: {file_info['category']}
                """
                
                # Add text content if available
                if file_info["category"] in ["document", "text"]:
                    text_content = await file_processor.read_text_content(file_path, 5000)
                    if text_content:
                        content_summary += f"\nContent Preview: {text_content[:500]}..."
                
                # Add metadata info
                if file_info.get("metadata"):
                    content_summary += f"\nMetadata: {json.dumps(file_info['metadata'], indent=2)[:1000]}"
                
                ai_request = AIRequest(
                    task_type=TaskType.CONTENT_CLASSIFICATION,
                    content=content_summary,
                    parameters={
                        "max_tokens": 1000,
                        "temperature": 0.1
                    },
                    metadata={
                        "available_categories": categories,
                        "file_path": file_path_str
                    }
                )
                
                response = await provider_manager.process_request(ai_request)
                
                if response.success:
                    if isinstance(response.content, dict):
                        classification = response.content
                    else:
                        # Try to parse as JSON
                        try:
                            classification = json.loads(response.content)
                        except:
                            classification = {"raw_response": response.content}
                    
                    results["categorizations"][file_path_str] = {
                        "file_info": file_info,
                        "classification": classification,
                        "provider_used": response.provider
                    }
                else:
                    results["errors"][file_path_str] = response.error_message
                    
            except Exception as e:
                logger.error(f"Failed to categorize {file_path_str}: {e}")
                results["errors"][file_path_str] = str(e)
        
        # Generate summary
        total_files = len(file_paths)
        successful = len(results["categorizations"])
        failed = len(results["errors"])
        
        results["summary"] = {
            "total_files": total_files,
            "successful": successful,
            "failed": failed,
            "success_rate": f"{(successful/total_files)*100:.1f}%" if total_files > 0 else "0%"
        }
        
        if failed > 0:
            results["success"] = False
            
        return results
        
    except Exception as e:
        logger.error(f"File categorization failed: {e}")
        return {"error": str(e), "success": False}


@mcp.tool
async def generate_file_tags(file_path: str, max_tags: int = 10, tag_categories: Optional[List[str]] = None) -> Dict[str, Any]:
    """Generate intelligent tags for a file based on its content and metadata.
    
    Args:
        file_path: Absolute path to the file
        max_tags: Maximum number of tags to generate (default: 10)
        tag_categories: Optional list of tag categories to focus on
    
    Returns:
        Dict containing generated tags and categorization information
    """
    try:
        file_path = Path(file_path)
        
        if not file_path.exists():
            return {"error": f"File not found: {file_path}", "success": False}
        
        # Get file information
        file_info = await file_processor.get_file_info(file_path)
        
        # Prepare content for tag generation
        content_for_tagging = f"""
        File: {file_info['name']}
        Type: {file_info['mime_type']}
        Category: {file_info['category']}
        """
        
        # Add text content for documents
        if file_info["category"] in ["document", "text"]:
            text_content = await file_processor.read_text_content(file_path, 10000)
            if text_content:
                content_for_tagging += f"\n\nContent:\n{text_content}"
        
        # Add metadata
        if file_info.get("metadata"):
            content_for_tagging += f"\n\nMetadata: {json.dumps(file_info['metadata'], indent=2)}"
        
        # Create tagging prompt
        tag_prompt = f"""
        Generate intelligent tags for the following file. Consider:
        1. Content topics and themes
        2. File type and format
        3. Technical attributes
        4. Potential use cases
        5. Organizational categories
        
        {content_for_tagging}
        
        Generate up to {max_tags} relevant tags. Format as JSON:
        {{
            "tags": ["tag1", "tag2", "tag3"],
            "tag_categories": {{
                "content": ["content-related tags"],
                "technical": ["technical tags"],
                "organizational": ["organizational tags"]
            }},
            "confidence": 0.95
        }}
        """
        
        ai_request = AIRequest(
            task_type=TaskType.TEXT_GENERATION,
            content=tag_prompt,
            parameters={
                "max_tokens": 1500,
                "temperature": 0.3
            }
        )
        
        response = await provider_manager.process_request(ai_request)
        
        result = {
            "success": response.success,
            "file_info": file_info,
            "provider_used": response.provider,
            "model_used": response.model_used
        }
        
        if response.success:
            try:
                # Try to parse JSON response
                tag_data = json.loads(response.content)
                result["tags"] = tag_data
            except json.JSONDecodeError:
                # Fallback: extract tags from text response
                result["tags"] = {"raw_response": response.content}
        else:
            result["error"] = response.error_message
        
        return result
        
    except Exception as e:
        logger.error(f"Tag generation failed: {e}")
        return {"error": str(e), "success": False}


@mcp.tool
async def analyze_image(image_path: str, analysis_type: str = "comprehensive") -> Dict[str, Any]:
    """Analyze an image using AI to extract information, objects, and generate descriptions.
    
    Args:
        image_path: Absolute path to the image file
        analysis_type: Type of analysis - 'comprehensive', 'objects', 'text', 'description'
    
    Returns:
        Dict containing image analysis results
    """
    try:
        image_path = Path(image_path)
        
        if not image_path.exists():
            return {"error": f"Image not found: {image_path}", "success": False}
        
        # Get image information
        file_info = await file_processor.get_file_info(image_path)
        
        if file_info["category"] != "image":
            return {"error": f"File is not an image: {file_info['mime_type']}", "success": False}
        
        # Read and encode image
        async with aiofiles.open(image_path, 'rb') as f:
            image_data = await f.read()
            
        # Encode as base64
        image_base64 = base64.b64encode(image_data).decode('utf-8')
        image_url = f"data:{file_info['mime_type']};base64,{image_base64}"
        
        ai_request = AIRequest(
            task_type=TaskType.IMAGE_ANALYSIS,
            content=image_url,
            parameters={
                "max_tokens": 2000,
                "temperature": 0.1
            },
            metadata={
                "analysis_type": analysis_type,
                "file_info": file_info
            }
        )
        
        response = await provider_manager.process_request(ai_request)
        
        result = {
            "success": response.success,
            "file_info": file_info,
            "analysis_type": analysis_type,
            "provider_used": response.provider,
            "model_used": response.model_used
        }
        
        if response.success:
            if isinstance(response.content, dict):
                result["analysis"] = response.content
            else:
                try:
                    # Try to parse JSON
                    analysis_data = json.loads(response.content)
                    result["analysis"] = analysis_data
                except json.JSONDecodeError:
                    result["analysis"] = {"description": response.content}
        else:
            result["error"] = response.error_message
        
        return result
        
    except Exception as e:
        logger.error(f"Image analysis failed: {e}")
        return {"error": str(e), "success": False}


@mcp.tool
async def detect_file_duplicates(directory_path: str, similarity_threshold: float = 0.9, include_similar: bool = True) -> Dict[str, Any]:
    """Detect duplicate and similar files in a directory using AI-powered analysis.
    
    Args:
        directory_path: Absolute path to directory to scan
        similarity_threshold: Similarity threshold for detection (0.0 to 1.0)
        include_similar: Whether to include similar (not exact) duplicates
    
    Returns:
        Dict containing duplicate detection results
    """
    try:
        directory_path = Path(directory_path)
        
        if not directory_path.exists() or not directory_path.is_dir():
            return {"error": f"Directory not found: {directory_path}", "success": False}
        
        # Get all files in directory
        file_paths = []
        for file_path in directory_path.rglob("*"):
            if file_path.is_file():
                file_paths.append(file_path)
        
        if not file_paths:
            return {"message": "No files found in directory", "success": True, "duplicates": []}
        
        # Detect duplicates
        duplicates = await file_processor.detect_duplicates(file_paths, similarity_threshold)
        
        result = {
            "success": True,
            "directory": str(directory_path),
            "total_files_scanned": len(file_paths),
            "duplicate_groups_found": len(duplicates),
            "similarity_threshold": similarity_threshold,
            "duplicates": []
        }
        
        # Format duplicate results
        total_duplicate_files = 0
        for group in duplicates:
            group_info = {
                "files": [],
                "total_size_mb": 0,
                "potential_savings_mb": 0
            }
            
            for file_path in group:
                try:
                    file_info = await file_processor.get_file_info(file_path)
                    group_info["files"].append({
                        "path": str(file_path),
                        "name": file_info["name"],
                        "size_mb": file_info["size_mb"],
                        "hash": file_info["hash"],
                        "modified_at": file_info["modified_at"]
                    })
                    group_info["total_size_mb"] += file_info["size_mb"]
                except Exception as e:
                    logger.warning(f"Failed to get info for {file_path}: {e}")
            
            # Calculate potential savings (keep one, delete others)
            if len(group_info["files"]) > 1:
                largest_file_size = max(f["size_mb"] for f in group_info["files"])
                group_info["potential_savings_mb"] = group_info["total_size_mb"] - largest_file_size
                total_duplicate_files += len(group_info["files"]) - 1
            
            result["duplicates"].append(group_info)
        
        # Calculate total potential savings
        total_savings = sum(group["potential_savings_mb"] for group in result["duplicates"])
        
        result.update({
            "total_duplicate_files": total_duplicate_files,
            "total_potential_savings_mb": round(total_savings, 2)
        })
        
        return result
        
    except Exception as e:
        logger.error(f"Duplicate detection failed: {e}")
        return {"error": str(e), "success": False}


@mcp.tool
async def generate_file_summary(file_path: str, summary_length: str = "medium") -> Dict[str, Any]:
    """Generate an AI-powered summary of a file's content.
    
    Args:
        file_path: Absolute path to the file
        summary_length: Length of summary - 'short', 'medium', 'long'
    
    Returns:
        Dict containing the generated summary
    """
    try:
        file_path = Path(file_path)
        
        if not file_path.exists():
            return {"error": f"File not found: {file_path}", "success": False}
        
        # Get file information
        file_info = await file_processor.get_file_info(file_path)
        
        # Extract content based on file type
        content = ""
        if file_info["category"] in ["document", "text"]:
            content = await file_processor.read_text_content(file_path, 30000)
        elif file_info["category"] == "image":
            # For images, analyze the image first
            image_analysis = await analyze_image(str(file_path), "description")
            if image_analysis.get("success"):
                content = f"Image: {file_info['name']}\nAnalysis: {json.dumps(image_analysis.get('analysis', {}), indent=2)}"
            else:
                content = f"Image file: {file_info['name']} (analysis failed)"
        else:
            content = f"File: {file_info['name']}\nType: {file_info['mime_type']}\nSize: {file_info['size_mb']} MB"
            if file_info.get("metadata"):
                content += f"\nMetadata: {json.dumps(file_info['metadata'], indent=2)}"
        
        if not content.strip():
            return {"error": "No content available for summarization", "success": False}
        
        # Determine summary parameters
        length_params = {
            "short": {"max_tokens": 500, "sentences": "2-3 sentences"},
            "medium": {"max_tokens": 1000, "sentences": "1-2 paragraphs"},
            "long": {"max_tokens": 2000, "sentences": "2-3 paragraphs"}
        }
        
        params = length_params.get(summary_length, length_params["medium"])
        
        # Create summarization prompt
        summary_prompt = f"""
        Please create a {summary_length} summary of the following content in {params['sentences']}:
        
        {content}
        
        Provide the summary in JSON format:
        {{
            "summary": "your summary here",
            "key_points": ["point1", "point2", "point3"],
            "content_type": "type of content",
            "confidence": 0.95
        }}
        """
        
        ai_request = AIRequest(
            task_type=TaskType.TEXT_GENERATION,
            content=summary_prompt,
            parameters={
                "max_tokens": params["max_tokens"],
                "temperature": 0.2
            }
        )
        
        response = await provider_manager.process_request(ai_request)
        
        result = {
            "success": response.success,
            "file_info": file_info,
            "summary_length": summary_length,
            "provider_used": response.provider,
            "model_used": response.model_used
        }
        
        if response.success:
            try:
                # Try to parse JSON response
                summary_data = json.loads(response.content)
                result["summary"] = summary_data
            except json.JSONDecodeError:
                # Fallback to raw text
                result["summary"] = {"summary": response.content}
        else:
            result["error"] = response.error_message
        
        return result
        
    except Exception as e:
        logger.error(f"Summary generation failed: {e}")
        return {"error": str(e), "success": False}


@mcp.tool
async def suggest_folder_structure(directory_path: str, max_suggestions: int = 10) -> Dict[str, Any]:
    """Analyze files in a directory and suggest an optimal folder structure using AI.
    
    Args:
        directory_path: Absolute path to directory to analyze
        max_suggestions: Maximum number of folder structure suggestions
    
    Returns:
        Dict containing suggested folder structure and organization plan
    """
    try:
        directory_path = Path(directory_path)
        
        if not directory_path.exists() or not directory_path.is_dir():
            return {"error": f"Directory not found: {directory_path}", "success": False}
        
        # Analyze all files in directory
        file_analyses = []
        
        for file_path in directory_path.rglob("*"):
            if file_path.is_file():
                try:
                    file_info = await file_processor.get_file_info(file_path)
                    
                    # Get basic classification
                    classification_request = AIRequest(
                        task_type=TaskType.CONTENT_CLASSIFICATION,
                        content=f"""
                        File: {file_info['name']}
                        Type: {file_info['mime_type']}
                        Category: {file_info['category']}
                        Size: {file_info['size_mb']} MB
                        Extension: {file_info['extension']}
                        """,
                        parameters={"max_tokens": 500, "temperature": 0.1}
                    )
                    
                    classification = await provider_manager.process_request(classification_request)
                    
                    analysis = {
                        "file_info": file_info,
                        "relative_path": str(file_path.relative_to(directory_path))
                    }
                    
                    if classification.success and isinstance(classification.content, dict):
                        analysis["classification"] = classification.content
                    
                    file_analyses.append(analysis)
                    
                except Exception as e:
                    logger.warning(f"Failed to analyze {file_path}: {e}")
        
        if not file_analyses:
            return {"message": "No files found to analyze", "success": True}
        
        # Generate folder structure suggestions
        files_summary = "\n".join([
            f"- {analysis['file_info']['name']} ({analysis['file_info']['category']}, {analysis['file_info']['size_mb']}MB)"
            for analysis in file_analyses[:50]  # Limit for prompt
        ])
        
        if len(file_analyses) > 50:
            files_summary += f"\n... and {len(file_analyses) - 50} more files"
        
        structure_prompt = f"""
        Analyze the following files and suggest an optimal folder structure for organization:
        
        Current directory: {directory_path.name}
        Total files: {len(file_analyses)}
        
        Files:
        {files_summary}
        
        Please suggest up to {max_suggestions} folder structures that would help organize these files efficiently.
        Consider:
        1. File types and categories
        2. Logical groupings
        3. User workflow patterns
        4. Scalability
        
        Format your response as JSON:
        {{
            "suggested_structures": [
                {{
                    "name": "Structure Name",
                    "description": "Description of this structure",
                    "folders": [
                        {{
                            "name": "folder_name",
                            "description": "What goes in this folder",
                            "file_types": ["pdf", "docx"],
                            "estimated_files": 10
                        }}
                    ],
                    "benefits": ["benefit1", "benefit2"],
                    "score": 0.9
                }}
            ],
            "current_analysis": {{
                "total_files": {len(file_analyses)},
                "file_types": {{"pdf": 5, "jpg": 10}},
                "organization_score": 0.3
            }}
        }}
        """
        
        ai_request = AIRequest(
            task_type=TaskType.TEXT_GENERATION,
            content=structure_prompt,
            parameters={
                "max_tokens": 3000,
                "temperature": 0.3
            }
        )
        
        response = await provider_manager.process_request(ai_request)
        
        result = {
            "success": response.success,
            "directory": str(directory_path),
            "total_files_analyzed": len(file_analyses),
            "provider_used": response.provider,
            "model_used": response.model_used
        }
        
        if response.success:
            try:
                # Try to parse JSON response
                suggestions = json.loads(response.content)
                result["suggestions"] = suggestions
            except json.JSONDecodeError:
                # Fallback to raw response
                result["suggestions"] = {"raw_response": response.content}
        else:
            result["error"] = response.error_message
        
        return result
        
    except Exception as e:
        logger.error(f"Folder structure suggestion failed: {e}")
        return {"error": str(e), "success": False}


@mcp.tool
async def get_provider_status() -> Dict[str, Any]:
    """Get the current status of all AI providers.
    
    Returns:
        Dict containing provider availability and capabilities
    """
    try:
        # Initialize provider manager if not already done
        if not provider_manager.providers:
            await provider_manager.initialize()
        
        status = await provider_manager.get_provider_status()
        capabilities = await provider_manager.get_all_capabilities()
        
        return {
            "success": True,
            "provider_status": status,
            "capabilities": {k: [cap.dict() for cap in v] for k, v in capabilities.items()},
            "primary_provider": settings.primary_provider.value,
            "fallback_provider": settings.fallback_provider.value if settings.fallback_provider else None,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Provider status check failed: {e}")
        return {"error": str(e), "success": False}


# Initialize provider manager when module is imported
async def initialize_mcp():
    """Initialize the MCP server and provider manager"""
    try:
        await provider_manager.initialize()
        logger.info("FileInASnap MCP Server initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize MCP server: {e}")
        raise
