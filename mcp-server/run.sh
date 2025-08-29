#!/bin/sh
# FileInASnap Universal AI-Powered MCP Server - STDIO Startup Script

set -e

# Change to script directory
cd "$(dirname "$0")"

# Create independent virtual environment (if it doesn't exist)
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..." >&2
    uv venv
    echo "Installing dependencies..." >&2
    echo "Note: Dependency installation may take several minutes. Please wait..." >&2
    uv sync
fi

# Check for required environment variables (optional for OpenRouter free tier)
if [ -z "$OPENROUTER_API_KEY" ] && [ -z "$MINIMAX_API_KEY" ]; then
    echo "Info: Using OpenRouter free tier - some models may have limitations" >&2
    echo "For full functionality, set OPENROUTER_API_KEY or MINIMAX_API_KEY" >&2
fi

# Create necessary directories
mkdir -p "${FILEINASNAP_TEMP_DIR:-/tmp/fileinasnap}"
mkdir -p "${FILEINASNAP_OUTPUT_DIR:-./output}"

# Start STDIO mode MCP server
echo "Starting FileInASnap Universal AI-Powered MCP Server..." >&2
uv run server.py --transport stdio
