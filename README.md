# FileInASnap - AI-Powered File Management

A modern React application built with TypeScript, Vite, and Tailwind CSS that provides intelligent file management capabilities with AI integration.

## 🚀 Features

- **AI-Powered File Analysis**: Analyze documents and images with advanced AI capabilities
- **Smart Organization**: Get AI-powered suggestions for organizing files efficiently  
- **Duplicate Detection**: Find and manage duplicate files with AI similarity detection
- **Smart Tagging**: Generate intelligent tags for files using AI analysis
- **Multi-language Support**: Built-in internationalization (i18n) support
- **Dark/Light Theme**: Theme switching with system preference detection
- **Responsive Design**: Mobile-first responsive design using Tailwind CSS
- **File Management Interface**: Grid/list toggle views with advanced filtering

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS + Tailwind UI components
- **State Management**: React Context API
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React
- **Internationalization**: react-i18next

## 📦 Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd fileinasnap_minimax-main
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Fill in your Supabase credentials and other environment variables.

4. Start the development server:
   ```bash
   pnpm dev
   ```

## 🏗️ Build & Deploy

### Development
```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm preview      # Preview production build
pnpm lint         # Run ESLint
```

### Production Build
```bash
pnpm build:prod   # Build for production with optimizations
```

### Vercel Deployment

This project is optimized for Vercel deployment:

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

The `vercel.json` configuration is already included for optimal deployment.

## 🧪 Quality Assurance

All code has been tested and passes:
- ✅ TypeScript compilation with zero errors
- ✅ ESLint checks with only acceptable warnings  
- ✅ Production build successful
- ✅ All React hooks properly configured
- ✅ Fast refresh optimized

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file with:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_AI_SERVICE_URL=your_ai_service_url
```

### Supabase Setup

1. Create a new Supabase project
2. Run the SQL migrations in `/supabase` folder
3. Set up authentication providers
4. Configure storage buckets for file uploads

## 🌐 Internationalization

The app supports multiple languages:
- English (en)
- Spanish (es) 
- French (fr)
- German (de)
- Japanese (ja)
- Chinese (zh)

Add new translations in `/src/locales/[lang]/` directories.

## 🎨 UI Guidelines

Following the user's preferences for:
- File management interface with grid/list toggle
- Tailwind conditional styling for dark mode
- Collapsible sticky filter panels  
- Smooth transitions and hover effects
- Notification and quick upload buttons with glow effects

## 📱 Mobile Optimization

- Mobile-first responsive design
- Touch-friendly interface
- Optimized for various screen sizes
- Progressive Web App (PWA) ready

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🚀 Live Demo

Once deployed to Vercel, the app will be available at your Vercel domain.

---

Built with ❤️ using React, TypeScript, and modern web technologies.

# FileInASnap MiniMax - AI-Powered File Management

[![Deploy Status](https://img.shields.io/badge/Deploy-Active-success)](https://823repj5ezsa.space.minimax.io)
[![AI Powered](https://img.shields.io/badge/AI-Powered-blue)](https://openrouter.ai/)
[![MCP Server](https://img.shields.io/badge/MCP-Server-purple)](./mcp-server/)

A modern, AI-enhanced file management application inspired by SparkleShare, featuring intelligent document analysis, smart categorization, and automated organization powered by OpenRouter's free AI models.

## 🚀 Live Demo

**🌐 [Try FileInASnap MiniMax](https://823repj5ezsa.space.minimax.io)**

## ✨ Features

### Core File Management
- **Smart Folders** - Intelligent file organization with AI-powered suggestions
- **Real-time Sync** - Instant file updates and synchronization
- **Multi-language Support** - Available in 6 languages (EN, ES, FR, DE, ZH, JA)
- **SparkleShare-inspired UI** - Clean, modern interface with intuitive navigation

### AI-Powered Capabilities
- **📄 Document Analysis** - Extract entities, categorize content, and identify document types
- **🏷️ Smart Tagging** - Automated tag generation based on content analysis
- **📊 File Categorization** - Intelligent classification using content-aware AI models
- **🖼️ Image Analysis** - Computer vision with object detection and OCR capabilities
- **🔍 Duplicate Detection** - Advanced similarity detection beyond simple checksums
- **📝 Content Summarization** - AI-generated summaries for any file type
- **🗂️ Organization Suggestions** - AI-recommended folder structures and workflows
- **⚡ Real-time Monitoring** - Live status of all AI system capabilities

## 🏗️ Architecture

### Frontend (React + Vite + TypeScript)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: TailwindCSS with custom SparkleShare-inspired theme
- **UI Components**: Custom component library with accessibility features
- **Internationalization**: Multi-language support with dynamic switching

### Backend (Supabase + Edge Functions)
- **Database**: PostgreSQL with real-time subscriptions
- **Authentication**: Supabase Auth with social providers
- **Storage**: Secure file storage with access controls
- **API**: Serverless Edge Functions for AI integration

### AI Integration (MCP Server)
- **Primary Provider**: OpenRouter free tier models
- **Fallback Ready**: MiniMax integration scaffolded for future activation
- **Models**: Mistral-7B, Llama-3.1-8B, Qwen2-7B for text processing
- **Architecture**: Universal provider abstraction for easy switching

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or pnpm
- Supabase account
- OpenRouter API key (free tier available)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Greenmamba29/fileinasnap_minimax.git
   cd fileinasnap_minimax
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Environment Setup**
   Copy `.env.example` to `.env.local` and configure:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   OPENROUTER_API_KEY=your_openrouter_api_key
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

5. **Build for Production**
   ```bash
   npm run build
   # or  
   pnpm build
   ```

## 🤖 MCP Server Setup

The AI capabilities are powered by a custom MCP (Model Context Protocol) server located in the `./mcp-server/` directory.

### Local MCP Server Development

1. **Navigate to MCP server directory**
   ```bash
   cd mcp-server
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment**
   ```bash
   export OPENROUTER_API_KEY="your_openrouter_api_key"
   ```

4. **Run MCP server**
   ```bash
   python server.py
   ```

### Available AI Tools

- `analyze_document` - Document analysis with entity extraction
- `categorize_files` - Batch file classification
- `generate_file_tags` - Intelligent tagging system
- `analyze_image` - Computer vision analysis
- `detect_file_duplicates` - Advanced duplicate detection
- `generate_file_summary` - Content summarization
- `suggest_folder_structure` - Organization suggestions
- `get_provider_status` - System health monitoring

## 🎨 UI/UX Design

### SparkleShare Inspiration
- **Color Palette**: Clean whites, soft grays, and accent blues
- **Typography**: Modern, readable fonts with proper hierarchy
- **Icons**: Custom icon set resembling SparkleShare's folder metaphors
- **Layout**: Grid-based design with intuitive navigation patterns

### AI Integration Indicators
- **Sparkle Icons** - Subtle indicators for AI-powered features
- **Loading States** - Progress indicators for AI operations
- **Result Displays** - Clean presentation of AI insights and suggestions

## 🔧 Development

### Project Structure
```
fileinasnap_minimax/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   ├── pages/             # Page components
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   └── styles/            # CSS and styling
├── public/                # Static assets
├── supabase/              # Supabase configuration
│   ├── functions/         # Edge Functions
│   └── migrations/        # Database migrations
├── mcp-server/            # AI MCP Server
│   ├── src/               # Python source code
│   ├── examples/          # Usage examples
│   └── tests/             # Test suite
└── locales/               # Internationalization files
```

### Key Technologies
- **Frontend**: React, TypeScript, Vite, TailwindCSS
- **Backend**: Supabase, PostgreSQL, Edge Functions
- **AI**: OpenRouter APIs, MCP Protocol
- **Deployment**: Vercel/Netlify (Frontend), Supabase (Backend)

## 🌐 Deployment

The application is deployed using modern cloud platforms:
- **Frontend**: Automatically deployed from main branch
- **Backend**: Supabase Edge Functions for serverless scaling
- **AI Services**: OpenRouter free tier with MiniMax upgrade path

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **SparkleShare** - UI/UX design inspiration
- **OpenRouter** - Free AI model access
- **MiniMax** - Future AI capabilities integration
- **Supabase** - Backend infrastructure
- **React Team** - Amazing frontend framework

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Greenmamba29/fileinasnap_minimax/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Greenmamba29/fileinasnap_minimax/discussions)
- **Email**: support@fileinasnap.com

---

**Built with ❤️ by the FileInASnap team** | [Website](https://823repj5ezsa.space.minimax.io) | [Documentation](./docs/) | [API](./mcp-server/)