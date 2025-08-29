# FileInASnap Universal AI-Powered MCP Server

A comprehensive Model Context Protocol (MCP) server that transforms FileInASnap into an intelligent, AI-powered file management system. Built with universal provider architecture supporting OpenRouter's free APIs and scaffolded for MiniMax integration.

## 🚀 Features

### **Universal AI Provider Architecture**
- **OpenRouter Integration**: Primary backend with free tier models (Mistral-7B, Llama-3.1-8B, Qwen2-7B)
- **MiniMax Scaffolding**: Ready-to-activate support for advanced media generation
- **Automatic Fallback**: Seamless provider switching and error handling
- **Load Balancing**: Intelligent model selection and request routing

### **Intelligent Document Processing**
- **AI-Powered Analysis**: Extract insights, categorize documents, identify entities
- **Multi-format Support**: PDF, Word, Excel, text, markdown, and more
- **Content Summarization**: Generate intelligent summaries of any length
- **Metadata Enhancement**: Automatic metadata extraction and enrichment

### **Advanced Media Processing**
- **Image Analysis**: Content detection, OCR, object recognition, description generation
- **Video Processing**: Metadata extraction, content analysis (scaffolded for AI analysis)
- **Audio Analysis**: Transcription and metadata extraction capabilities
- **Thumbnail Generation**: Smart preview creation for various file types

### **Smart File Organization**
- **Content-Based Categorization**: AI-powered file classification beyond file extensions
- **Duplicate Detection**: Advanced similarity detection including perceptual hashing
- **Folder Structure Suggestions**: AI-recommended organization strategies
- **Automated Tagging**: Intelligent tag generation based on content analysis

### **FileInASnap Integration**
- **Media Insights UI**: Direct integration with file analysis dashboards
- **File History Timeline**: AI-enhanced activity tracking
- **Smart Folders**: Dynamic content-based organization
- **Batch Processing**: Efficient handling of large file collections

## 🛠️ Installation & Setup

### Prerequisites
- Python 3.10 or higher
- `uv` package manager (recommended) or `pip`
- 2GB+ RAM for optimal performance

### Quick Start

1. **Clone or Download the Server**
   ```bash
   git clone <repository-url>
   cd fileinasnap-mcp-server
   ```

2. **Install Dependencies**
   ```bash
   # Using uv (recommended)
   uv sync
   
   # Or using pip
   pip install -r requirements.txt
   ```

3. **Configure Environment** (Optional)
   ```bash
   cp .env.example .env
   # Edit .env with your preferences
   ```

4. **Test the Server**
   ```bash
   # Test STDIO mode
   python server.py --transport stdio
   ```

### MCP Client Configuration

#### Claude Desktop
Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "fileinasnap-universal-ai": {
      "command": "sh",
      "args": ["/path/to/fileinasnap-mcp-server/run.sh"],
      "env": {
        "OPENROUTER_API_KEY": "your-openrouter-key-optional",
        "FILEINASNAP_PRIMARY_PROVIDER": "openrouter",
        "FILEINASNAP_DEBUG": "false"
      }
    }
  }
}
```

#### Cursor IDE
Go to `Cursor -> Preferences -> MCP -> Add new global MCP Server`:
- **Name**: FileInASnap Universal AI
- **Command**: `sh`
- **Args**: `/path/to/fileinasnap-mcp-server/run.sh`
- **Environment**: (optional API keys)

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `FILEINASNAP_PRIMARY_PROVIDER` | `openrouter` | Primary AI provider (openrouter/minimax) |
| `FILEINASNAP_FALLBACK_PROVIDER` | `None` | Fallback provider when primary fails |
| `OPENROUTER_API_KEY` | `None` | OpenRouter API key (optional for free tier) |
| `MINIMAX_API_KEY` | `None` | MiniMax API key (scaffolded) |
| `MINIMAX_API_HOST` | `https://api.minimax.io` | MiniMax API endpoint |
| `FILEINASNAP_MAX_FILE_SIZE_MB` | `100` | Maximum file size to process (MB) |
| `FILEINASNAP_TEMP_DIR` | `/tmp/fileinasnap` | Temporary processing directory |
| `FILEINASNAP_OUTPUT_DIR` | `./output` | Output directory for generated files |
| `FILEINASNAP_DEBUG` | `false` | Enable debug logging |

### Provider Configuration

#### OpenRouter (Primary - Free Tier Available)
- **No API Key Required** for basic models (Mistral-7B, Llama-3.1-8B)
- **With API Key**: Access to GPT-4, Claude, and premium models
- **Rate Limits**: Generous for free tier, scalable with subscription

#### MiniMax (Scaffolded - Future Activation)
- **Text Generation**: MiniMax-Text-01 model
- **Image Generation**: Advanced image synthesis
- **Video Generation**: AI-powered video creation
- **Voice Synthesis**: Text-to-speech capabilities

## 🛠️ Available Tools

### Document Analysis Tools

#### `analyze_document`
Comprehensive document analysis using AI.

```python
# Example usage in MCP client
result = await analyze_document(
    file_path="/path/to/document.pdf",
    analysis_type="comprehensive",  # or "quick", "classification", "summary"
    max_content_length=50000
)
```

**Returns:**
- Document type classification
- Key topics and themes
- Named entity extraction (people, places, dates)
- Content summary
- Suggested organizational tags
- Confidence scores

#### `categorize_files`
Batch file categorization with AI-powered classification.

```python
result = await categorize_files(
    file_paths=["/path/to/file1.pdf", "/path/to/image.jpg"],
    custom_categories=["Work", "Personal", "Archive"]  # optional
)
```

#### `generate_file_tags`
Intelligent tag generation for enhanced file organization.

```python
result = await generate_file_tags(
    file_path="/path/to/document.docx",
    max_tags=10,
    tag_categories=["content", "technical", "organizational"]  # optional
)
```

### Media Processing Tools

#### `analyze_image`
Advanced image analysis with AI vision models.

```python
result = await analyze_image(
    image_path="/path/to/image.jpg",
    analysis_type="comprehensive"  # or "objects", "text", "description"
)
```

**Capabilities:**
- Object and scene detection
- Text extraction (OCR)
- Content description generation
- Technical metadata analysis
- Suggested categorization tags

### File Organization Tools

#### `detect_file_duplicates`
AI-powered duplicate detection beyond simple checksums.

```python
result = await detect_file_duplicates(
    directory_path="/path/to/directory",
    similarity_threshold=0.9,
    include_similar=True
)
```

**Features:**
- Exact duplicate detection (hash-based)
- Similar image detection (perceptual hashing)
- Content-based similarity analysis
- Storage space savings calculation

#### `suggest_folder_structure`
AI-recommended folder organization strategies.

```python
result = await suggest_folder_structure(
    directory_path="/path/to/messy/directory",
    max_suggestions=5
)
```

### Content Generation Tools

#### `generate_file_summary`
AI-powered content summarization for any file type.

```python
result = await generate_file_summary(
    file_path="/path/to/file.pdf",
    summary_length="medium"  # "short", "medium", "long"
)
```

### System Tools

#### `get_provider_status`
Monitor AI provider availability and capabilities.

```python
status = await get_provider_status()
```

## 🏗️ Architecture

### Universal Provider System
```
┌─────────────────────────────────────────────────────────────┐
│                    MCP Client (Claude/Cursor)              │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                FileInASnap MCP Tools                       │
│  ┌─────────────────┐ ┌─────────────────┐ ┌────────────────┐ │
│  │ Document Tools  │ │ Media Tools     │ │Organization    │ │
│  │ - analyze_doc   │ │ - analyze_image │ │Tools           │ │
│  │ - categorize    │ │ - process_video │ │ - detect_dups  │ │
│  │ - generate_tags │ │ - transcribe    │ │ - suggest_org  │ │
│  └─────────────────┘ └─────────────────┘ └────────────────┘ │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                AI Provider Manager                         │
│  ┌─────────────────────┐     ┌─────────────────────────────┐ │
│  │ OpenRouter Provider │     │ MiniMax Provider (Scaffold) │ │
│  │ - Free Models       │     │ - Text Generation           │ │
│  │ - Premium Models    │     │ - Image Generation          │ │
│  │ - Image Analysis    │     │ - Video Generation          │ │
│  │ - Text Processing   │     │ - Voice Synthesis           │ │
│  └─────────────────────┘     └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### File Processing Pipeline
```
File Input → Metadata Extraction → Content Analysis → AI Processing → Enhanced Results
    ↓              ↓                   ↓              ↓              ↓
 Format          EXIF/ID3           Text/OCR      Provider APIs    Structured
Detection       Properties         Extraction     Processing       Output
```

## 🧪 Testing & Validation

### Basic Functionality Test
```bash
# Test provider connectivity
python -c "
import asyncio
from src.providers.manager import provider_manager

async def test():
    await provider_manager.initialize()
    status = await provider_manager.get_provider_status()
    print('Provider Status:', status)

asyncio.run(test())
"
```

### Tool Testing
```bash
# Test document analysis
python -c "
import asyncio
from src.tools.fileinasnap_tools import analyze_document

async def test():
    result = await analyze_document('/path/to/test/document.pdf')
    print('Analysis Result:', result)

asyncio.run(test())
"
```

## 🚀 Deployment

### Development Deployment
```bash
# Direct execution
python server.py --transport stdio --debug

# With custom configuration
FILEINASNAP_DEBUG=true OPENROUTER_API_KEY=your_key python server.py
```

### Production Deployment
```bash
# Using the startup script
chmod +x run.sh
./run.sh
```

### Docker Deployment (Optional)
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY . .

RUN pip install uv && uv sync

EXPOSE 8000
CMD ["python", "server.py", "--transport", "stdio"]
```

## 🔄 Provider Migration Path

### Activating MiniMax (When Ready)

1. **Get MiniMax Credentials**
   - Register at [MiniMax Platform](https://www.minimax.io)
   - Get API key and select appropriate host

2. **Update Configuration**
   ```bash
   export MINIMAX_API_KEY="your_minimax_key"
   export MINIMAX_API_HOST="https://api.minimax.io"
   export FILEINASNAP_PRIMARY_PROVIDER="minimax"
   export FILEINASNAP_FALLBACK_PROVIDER="openrouter"
   ```

3. **Activate MiniMax Provider**
   - The scaffolded implementation will automatically activate
   - Advanced features like video generation become available
   - Seamless transition with fallback to OpenRouter

## 📊 Performance & Limits

### OpenRouter Free Tier
- **Rate Limits**: 100 requests/hour for free models
- **Model Access**: Mistral-7B, Llama-3.1-8B, Qwen2-7B
- **File Size Limits**: Up to 100MB per file (configurable)
- **Concurrent Requests**: 4 parallel processing jobs

### Recommended System Requirements
- **RAM**: 2GB minimum, 4GB recommended
- **Storage**: 1GB for temporary processing
- **CPU**: 2+ cores for optimal performance
- **Network**: Stable internet for AI provider APIs

## 🛠️ Troubleshooting

### Common Issues

#### "No AI providers available"
- Check internet connection
- Verify OpenRouter API access (no key required for free models)
- Check debug logs: `FILEINASNAP_DEBUG=true python server.py`

#### "File processing failed"
- Ensure file permissions are correct
- Check file size limits (`FILEINASNAP_MAX_FILE_SIZE_MB`)
- Verify supported file formats

#### "MCP connection issues"
- Confirm MCP client configuration
- Check `run.sh` permissions: `chmod +x run.sh`
- Verify Python path and dependencies

### Debug Mode
```bash
# Enable comprehensive logging
export FILEINASNAP_DEBUG=true
python server.py --debug --transport stdio
```

### Provider Testing
```bash
# Test specific provider
python -c "
import asyncio
from src.providers.openrouter import OpenRouterProvider

async def test():
    provider = OpenRouterProvider({})
    available = await provider.is_available()
    print(f'OpenRouter available: {available}')

asyncio.run(test())
"
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Implement changes with tests
4. Submit pull request with detailed description

### Development Setup
```bash
# Install development dependencies
uv sync --dev

# Run tests
pytest tests/

# Code formatting
black src/
ruff check src/
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **FastMCP**: Foundation for MCP server implementation
- **OpenRouter**: Free tier AI model access
- **MiniMax**: Advanced AI capabilities (scaffolded)
- **FileInASnap**: Intelligent file management platform

---

**Built with ❤️ by MiniMax Agent**

Transform your file management with AI-powered intelligence. Start with OpenRouter's free tier and upgrade to MiniMax when ready for advanced capabilities.
