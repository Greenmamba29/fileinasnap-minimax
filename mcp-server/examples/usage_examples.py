"""Example usage of FileInASnap MCP Server tools"""

import asyncio
import tempfile
from pathlib import Path
import sys

# Add src directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from src.tools.fileinasnap_tools import (
    analyze_document,
    categorize_files,
    generate_file_tags,
    detect_file_duplicates,
    generate_file_summary,
    suggest_folder_structure,
    get_provider_status,
    initialize_mcp
)


async def create_sample_files():
    """Create sample files for testing"""
    temp_dir = Path(tempfile.mkdtemp())
    print(f"Creating sample files in: {temp_dir}")
    
    # Create various file types
    files = {
        "technical_spec.txt": """
        API Technical Specification
        
        This document outlines the REST API endpoints for the FileInASnap platform.
        
        Endpoints:
        - GET /api/files - List all files
        - POST /api/files - Upload new file
        - DELETE /api/files/{id} - Delete file
        
        Authentication: Bearer token required
        Rate limiting: 100 requests per minute
        """,
        
        "meeting_notes.txt": """
        Weekly Team Meeting - January 15, 2025
        
        Attendees: John Smith, Sarah Johnson, Mike Chen
        
        Discussion Points:
        1. Q1 roadmap planning
        2. New feature requirements
        3. Performance optimization
        
        Action Items:
        - John: Complete user research by Jan 20
        - Sarah: Design mockups for new dashboard
        - Mike: Performance testing of database queries
        
        Next meeting: January 22, 2025
        """,
        
        "financial_report.txt": """
        Q4 2024 Financial Summary
        
        Revenue: $125,000 (+15% YoY)
        Expenses: $98,000
        Net Profit: $27,000
        
        Key Metrics:
        - Customer acquisition cost: $250
        - Customer lifetime value: $1,200
        - Monthly recurring revenue: $42,000
        
        Outlook for Q1 2025: Targeting 20% revenue growth
        """,
        
        "recipe.txt": """
        Chocolate Chip Cookies
        
        Ingredients:
        - 2 cups all-purpose flour
        - 1 tsp baking soda
        - 1 cup butter, softened
        - 3/4 cup brown sugar
        - 1/2 cup white sugar
        - 2 large eggs
        - 2 tsp vanilla extract
        - 2 cups chocolate chips
        
        Instructions:
        1. Preheat oven to 375°F
        2. Mix dry ingredients
        3. Cream butter and sugars
        4. Add eggs and vanilla
        5. Combine wet and dry ingredients
        6. Fold in chocolate chips
        7. Bake for 9-11 minutes
        
        Makes about 48 cookies. Perfect for sharing!
        """
    }
    
    file_paths = []
    for filename, content in files.items():
        file_path = temp_dir / filename
        file_path.write_text(content.strip())
        file_paths.append(str(file_path))
    
    # Create a duplicate file
    duplicate_path = temp_dir / "technical_spec_copy.txt"
    duplicate_path.write_text(files["technical_spec.txt"].strip())
    file_paths.append(str(duplicate_path))
    
    return temp_dir, file_paths


async def demo_provider_status():
    """Demonstrate provider status checking"""
    print("\n=== Provider Status Demo ===")
    
    try:
        status = await get_provider_status()
        print(f"Success: {status['success']}")
        print(f"Primary Provider: {status['primary_provider']}")
        print(f"Fallback Provider: {status['fallback_provider']}")
        
        print("\nProvider Details:")
        for provider, details in status['provider_status'].items():
            print(f"  {provider}:")
            print(f"    Available: {details['available']}")
            print(f"    Capabilities: {', '.join(details['capabilities'])}")
    
    except Exception as e:
        print(f"Error getting provider status: {e}")


async def demo_document_analysis(file_paths):
    """Demonstrate document analysis"""
    print("\n=== Document Analysis Demo ===")
    
    # Analyze the technical specification
    tech_spec_path = next(path for path in file_paths if "technical_spec.txt" in path)
    
    try:
        result = await analyze_document(
            file_path=tech_spec_path,
            analysis_type="comprehensive"
        )
        
        print(f"Analysis Success: {result['success']}")
        print(f"Provider Used: {result.get('provider_used', 'unknown')}")
        print(f"File Type: {result['file_info']['category']}")
        print(f"File Size: {result['file_info']['size_mb']} MB")
        
        if result['success'] and 'analysis' in result:
            analysis = result['analysis']
            if isinstance(analysis, dict):
                print("\nAnalysis Results:")
                for key, value in analysis.items():
                    if isinstance(value, list) and value:
                        print(f"  {key}: {', '.join(map(str, value[:3]))}{'...' if len(value) > 3 else ''}")
                    elif isinstance(value, str) and len(value) < 200:
                        print(f"  {key}: {value}")
                    elif isinstance(value, (int, float)):
                        print(f"  {key}: {value}")
            else:
                print(f"Raw Analysis: {str(analysis)[:200]}...")
        else:
            print(f"Analysis failed: {result.get('error', 'Unknown error')}")
    
    except Exception as e:
        print(f"Document analysis error: {e}")


async def demo_file_categorization(file_paths):
    """Demonstrate file categorization"""
    print("\n=== File Categorization Demo ===")
    
    try:
        result = await categorize_files(
            file_paths=file_paths[:3],  # First 3 files
            custom_categories=["Technical", "Business", "Meeting Notes", "Personal", "Other"]
        )
        
        print(f"Categorization Success: {result['success']}")
        print(f"Files Processed: {result['summary']['successful']}/{result['summary']['total_files']}")
        
        if result['categorizations']:
            print("\nCategorization Results:")
            for file_path, data in result['categorizations'].items():
                filename = Path(file_path).name
                classification = data.get('classification', {})
                
                if isinstance(classification, dict):
                    primary = classification.get('primary_category', 'Unknown')
                    confidence = classification.get('confidence', 'N/A')
                    print(f"  {filename}: {primary} (confidence: {confidence})")
                else:
                    print(f"  {filename}: {str(classification)[:100]}...")
        
        if result.get('errors'):
            print("\nErrors:")
            for file_path, error in result['errors'].items():
                print(f"  {Path(file_path).name}: {error}")
    
    except Exception as e:
        print(f"File categorization error: {e}")


async def demo_tag_generation(file_paths):
    """Demonstrate tag generation"""
    print("\n=== Tag Generation Demo ===")
    
    # Generate tags for meeting notes
    meeting_notes_path = next(path for path in file_paths if "meeting_notes.txt" in path)
    
    try:
        result = await generate_file_tags(
            file_path=meeting_notes_path,
            max_tags=8
        )
        
        print(f"Tag Generation Success: {result['success']}")
        print(f"File: {result['file_info']['name']}")
        
        if result['success'] and 'tags' in result:
            tags_data = result['tags']
            if isinstance(tags_data, dict) and 'tags' in tags_data:
                print(f"Generated Tags: {', '.join(tags_data['tags'])}")
                
                if 'tag_categories' in tags_data:
                    print("\nTag Categories:")
                    for category, category_tags in tags_data['tag_categories'].items():
                        if category_tags:
                            print(f"  {category}: {', '.join(category_tags)}")
            else:
                print(f"Raw Tags: {str(tags_data)[:200]}...")
        else:
            print(f"Tag generation failed: {result.get('error', 'Unknown error')}")
    
    except Exception as e:
        print(f"Tag generation error: {e}")


async def demo_duplicate_detection(temp_dir):
    """Demonstrate duplicate detection"""
    print("\n=== Duplicate Detection Demo ===")
    
    try:
        result = await detect_file_duplicates(
            directory_path=str(temp_dir),
            similarity_threshold=0.9
        )
        
        print(f"Duplicate Detection Success: {result['success']}")
        print(f"Files Scanned: {result['total_files_scanned']}")
        print(f"Duplicate Groups Found: {result['duplicate_groups_found']}")
        
        if result['duplicates']:
            print("\nDuplicate Groups:")
            for i, group in enumerate(result['duplicates'], 1):
                print(f"  Group {i}: {len(group['files'])} files")
                for file_info in group['files']:
                    filename = Path(file_info['path']).name
                    print(f"    - {filename} ({file_info['size_mb']} MB)")
                print(f"    Potential savings: {group['potential_savings_mb']} MB")
        else:
            print("No duplicates found.")
    
    except Exception as e:
        print(f"Duplicate detection error: {e}")


async def demo_summary_generation(file_paths):
    """Demonstrate summary generation"""
    print("\n=== Summary Generation Demo ===")
    
    # Generate summary for financial report
    financial_report_path = next(path for path in file_paths if "financial_report.txt" in path)
    
    try:
        result = await generate_file_summary(
            file_path=financial_report_path,
            summary_length="medium"
        )
        
        print(f"Summary Generation Success: {result['success']}")
        print(f"File: {result['file_info']['name']}")
        
        if result['success'] and 'summary' in result:
            summary_data = result['summary']
            if isinstance(summary_data, dict):
                if 'summary' in summary_data:
                    print(f"\nSummary: {summary_data['summary']}")
                
                if 'key_points' in summary_data and summary_data['key_points']:
                    print(f"\nKey Points:")
                    for point in summary_data['key_points']:
                        print(f"  - {point}")
            else:
                print(f"Summary: {str(summary_data)[:300]}...")
        else:
            print(f"Summary generation failed: {result.get('error', 'Unknown error')}")
    
    except Exception as e:
        print(f"Summary generation error: {e}")


async def demo_folder_structure_suggestion(temp_dir):
    """Demonstrate folder structure suggestions"""
    print("\n=== Folder Structure Suggestion Demo ===")
    
    try:
        result = await suggest_folder_structure(
            directory_path=str(temp_dir),
            max_suggestions=3
        )
        
        print(f"Suggestion Success: {result['success']}")
        print(f"Files Analyzed: {result['total_files_analyzed']}")
        
        if result['success'] and 'suggestions' in result:
            suggestions_data = result['suggestions']
            if isinstance(suggestions_data, dict) and 'suggested_structures' in suggestions_data:
                print("\nSuggested Folder Structures:")
                for i, structure in enumerate(suggestions_data['suggested_structures'], 1):
                    print(f"\n  Structure {i}: {structure.get('name', 'Unnamed')}")
                    print(f"  Description: {structure.get('description', 'No description')}")
                    
                    if 'folders' in structure:
                        print("  Folders:")
                        for folder in structure['folders']:
                            folder_name = folder.get('name', 'Unknown')
                            folder_desc = folder.get('description', 'No description')
                            estimated = folder.get('estimated_files', 0)
                            print(f"    - {folder_name}: {folder_desc} (~{estimated} files)")
                    
                    if 'benefits' in structure and structure['benefits']:
                        print(f"  Benefits: {', '.join(structure['benefits'])}")
            else:
                print(f"Raw Suggestions: {str(suggestions_data)[:400]}...")
        else:
            print(f"Suggestion failed: {result.get('error', 'Unknown error')}")
    
    except Exception as e:
        print(f"Folder structure suggestion error: {e}")


async def main():
    """Run all examples"""
    print("FileInASnap MCP Server - Usage Examples")
    print("=" * 50)
    
    try:
        # Initialize the MCP server
        print("Initializing MCP server...")
        await initialize_mcp()
        
        # Create sample files
        temp_dir, file_paths = await create_sample_files()
        print(f"Sample files created in: {temp_dir}")
        
        # Run all demos
        await demo_provider_status()
        await demo_document_analysis(file_paths)
        await demo_file_categorization(file_paths)
        await demo_tag_generation(file_paths)
        await demo_duplicate_detection(temp_dir)
        await demo_summary_generation(file_paths)
        await demo_folder_structure_suggestion(temp_dir)
        
        print("\n=== Demo Complete ===")
        print("\nNote: Some operations may show errors if AI providers are not available")
        print("This is expected behavior for offline testing.")
        
        # Clean up
        import shutil
        shutil.rmtree(temp_dir)
        print(f"\nCleaned up temporary files from: {temp_dir}")
        
    except Exception as e:
        print(f"Demo failed with error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
