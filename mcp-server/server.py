#!/usr/bin/env python3
"""
FileInASnap Universal AI-Powered MCP Server
Main server entry point supporting both STDIO and SSE transports
"""

import asyncio
import sys
import logging
from pathlib import Path

# Add src directory to Python path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from src.tools.fileinasnap_tools import mcp, initialize_mcp
from src.config import settings
from src.providers.manager import provider_manager

# Configure logging
logging.basicConfig(
    level=logging.INFO if settings.debug_mode else logging.WARNING,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


async def main():
    """Main server entry point"""
    try:
        # Initialize the MCP server and providers
        await initialize_mcp()
        
        logger.info("FileInASnap Universal AI-Powered MCP Server starting...")
        logger.info(f"Primary provider: {settings.primary_provider}")
        logger.info(f"Fallback provider: {settings.fallback_provider}")
        
        # Check provider status
        available_providers = await provider_manager.get_available_providers()
        if available_providers:
            logger.info(f"Available providers: {', '.join(available_providers)}")
        else:
            logger.warning("No AI providers are currently available")
        
        # Start the MCP server with STDIO transport
        await mcp.run()
        
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Server failed to start: {e}")
        raise


if __name__ == "__main__":
    # Handle command line arguments
    import argparse
    
    parser = argparse.ArgumentParser(description="FileInASnap Universal AI-Powered MCP Server")
    parser.add_argument(
        "--transport",
        choices=["stdio", "sse"],
        default="stdio",
        help="Transport protocol to use (default: stdio)"
    )
    parser.add_argument(
        "--host",
        default=settings.server_host,
        help="Host to bind to for SSE transport"
    )
    parser.add_argument(
        "--port",
        type=int,
        default=int(settings.server_port),
        help="Port to bind to for SSE transport"
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Enable debug logging"
    )
    
    args = parser.parse_args()
    
    # Update settings based on arguments
    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)
        settings.debug_mode = True
    
    # Start the server
    if args.transport == "stdio":
        # STDIO mode - standard MCP mode
        asyncio.run(main())
    else:
        # SSE mode would require additional setup
        logger.error("SSE transport not yet implemented")
        sys.exit(1)
