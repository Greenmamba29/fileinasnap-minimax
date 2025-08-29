import { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { I18nProvider } from './context/I18nContext';
import { useAuth } from './hooks/useAuth';

// Components
import { LoginForm } from './components/Login';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { DashboardOverview } from './components/DashboardOverview';
import { MediaInsights } from './components/MediaInsights';
import { FileHistory } from './components/FileHistory';
import { ActivityFeed } from './components/ActivityFeed';
import { AIDashboard } from './components/AIDashboard';
import { AIAnalysis } from './components/AIAnalysis';
import { SmartOrganizer } from './components/SmartOrganizer';
import { DuplicateDetector } from './components/DuplicateDetector';
import { SmartTagger } from './components/SmartTagger';

// Styles
import { colors } from './lib/design-system';

function AppContent() {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: colors.background.secondary }}
      >
        <div className="text-center">
          <div 
            className="w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: colors.primary.blue }}
          >
            <img 
              src="/icons/logo-fileinasnap.png" 
              alt="FileInASnap" 
              className="w-10 h-10 filter brightness-0 invert"
            />
          </div>
          <div 
            className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: colors.primary.blue }}
          />
          <p className="text-lg font-medium" style={{ color: colors.text.primary }}>
            Loading FileInASnap...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'insights':
        return <MediaInsights />;
      case 'history':
        return <FileHistory />;
      case 'activity':
        return <ActivityFeed />;
      case 'ai-dashboard':
        return <AIDashboard />;
      case 'ai-analysis':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: colors.text.primary }}>
                AI Analysis
              </h1>
              <p style={{ color: colors.text.secondary }}>
                Analyze documents and images with advanced AI capabilities.
              </p>
            </div>
            <AIAnalysis />
          </div>
        );
      case 'smart-organizer':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: colors.text.primary }}>
                Smart Organization
              </h1>
              <p style={{ color: colors.text.secondary }}>
                Get AI-powered suggestions for organizing your files efficiently.
              </p>
            </div>
            <SmartOrganizer 
              files={[
                // Sample files - in a real app, this would come from your file system
                { fileName: 'document1.pdf', mimeType: 'application/pdf', size: 1024000, category: 'document' },
                { fileName: 'image1.jpg', mimeType: 'image/jpeg', size: 512000, category: 'image' },
                { fileName: 'report.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 768000, category: 'document' }
              ]}
              onOrganizationComplete={(suggestions) => console.log('Organization suggestions:', suggestions)}
            />
          </div>
        );
      case 'duplicate-detector':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: colors.text.primary }}>
                Duplicate Detection
              </h1>
              <p style={{ color: colors.text.secondary }}>
                Find and manage duplicate files with AI-powered similarity detection.
              </p>
            </div>
            <DuplicateDetector 
              files={[
                // Sample files - in a real app, this would come from your file system
                { fileName: 'document.pdf', size: 1024000, mimeType: 'application/pdf', hash: 'abc123' },
                { fileName: 'document_copy.pdf', size: 1024000, mimeType: 'application/pdf', hash: 'abc123' },
                { fileName: 'similar_doc.pdf', size: 1020000, mimeType: 'application/pdf', content: 'Similar content here', hash: 'def456' }
              ]}
              onDetectionComplete={(results) => console.log('Duplicate detection results:', results)}
            />
          </div>
        );
      case 'smart-tagger':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: colors.text.primary }}>
                Smart Tagging
              </h1>
              <p style={{ color: colors.text.secondary }}>
                Generate intelligent tags for your files using AI analysis.
              </p>
            </div>
            <SmartTagger 
              fileName="sample_document.pdf"
              mimeType="application/pdf"
              content="This is a sample document about project management and team collaboration strategies for modern workplaces."
              onTagsGenerated={(tags) => console.log('Generated tags:', tags)}
            />
          </div>
        );
      case 'folder-documents':
        return (
          <div className="space-y-6">
            <div>
              <h1 
                className="text-3xl font-bold mb-2"
                style={{ color: colors.text.primary }}
              >
                Documents
              </h1>
              <p style={{ color: colors.text.secondary }}>
                All your document files with AI-powered insights.
              </p>
            </div>
            <div className="bg-white rounded-lg border p-12 text-center">
              <img 
                src="/icons/smart-folder-documents.png" 
                alt="Documents" 
                className="w-16 h-16 mx-auto mb-4 opacity-50"
              />
              <h3 className="text-lg font-medium mb-2" style={{ color: colors.text.primary }}>
                AI-Enhanced Documents Folder
              </h3>
              <p style={{ color: colors.text.secondary }} className="mb-4">
                Your document files will appear here with automatic AI analysis, smart tagging, and organization suggestions.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center">
                  ✨ Auto-tagging
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm flex items-center">
                  📄 Content analysis
                </span>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm flex items-center">
                  🗂️ Smart organization
                </span>
              </div>
            </div>
          </div>
        );
      case 'folder-media':
        return (
          <div className="space-y-6">
            <div>
              <h1 
                className="text-3xl font-bold mb-2"
                style={{ color: colors.text.primary }}
              >
                Media Files
              </h1>
              <p style={{ color: colors.text.secondary }}>
                Images, videos, and audio files with advanced AI insights.
              </p>
            </div>
            <div className="bg-white rounded-lg border p-12 text-center">
              <img 
                src="/icons/smart-folder-media.png" 
                alt="Media" 
                className="w-16 h-16 mx-auto mb-4 opacity-50"
              />
              <h3 className="text-lg font-medium mb-2" style={{ color: colors.text.primary }}>
                AI-Powered Media Folder
              </h3>
              <p style={{ color: colors.text.secondary }} className="mb-4">
                Your media files will appear here with computer vision analysis, object detection, and intelligent categorization.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm flex items-center">
                  👁️ Image analysis
                </span>
                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm flex items-center">
                  🎯 Object detection
                </span>
                <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm flex items-center">
                  📝 OCR text extraction
                </span>
              </div>
            </div>
          </div>
        );
      case 'folder-projects':
        return (
          <div className="space-y-6">
            <div>
              <h1 
                className="text-3xl font-bold mb-2"
                style={{ color: colors.text.primary }}
              >
                Projects
              </h1>
              <p style={{ color: colors.text.secondary }}>
                Organize your project-related files with AI assistance.
              </p>
            </div>
            <div className="bg-white rounded-lg border p-12 text-center">
              <img 
                src="/icons/smart-folder-projects.png" 
                alt="Projects" 
                className="w-16 h-16 mx-auto mb-4 opacity-50"
              />
              <h3 className="text-lg font-medium mb-2" style={{ color: colors.text.primary }}>
                Smart Projects Folder
              </h3>
              <p style={{ color: colors.text.secondary }} className="mb-4">
                Project files and collaborative documents with intelligent organization and duplicate detection.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm flex items-center">
                  🗂️ Project grouping
                </span>
                <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm flex items-center">
                  🔍 Duplicate detection
                </span>
                <span className="px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm flex items-center">
                  📋 Smart summaries
                </span>
              </div>
            </div>
          </div>
        );
      case 'folder-archive':
        return (
          <div className="space-y-6">
            <div>
              <h1 
                className="text-3xl font-bold mb-2"
                style={{ color: colors.text.primary }}
              >
                Archive
              </h1>
              <p style={{ color: colors.text.secondary }}>
                Older files automatically archived with AI-powered organization.
              </p>
            </div>
            <div className="bg-white rounded-lg border p-12 text-center">
              <img 
                src="/icons/smart-folder-archive.png" 
                alt="Archive" 
                className="w-16 h-16 mx-auto mb-4 opacity-50"
              />
              <h3 className="text-lg font-medium mb-2" style={{ color: colors.text.primary }}>
                Intelligent Archive Folder
              </h3>
              <p style={{ color: colors.text.secondary }} className="mb-4">
                Files are automatically moved here based on AI analysis of usage patterns and age.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm flex items-center">
                  ⏰ Auto-archiving
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center">
                  🧠 Usage analysis
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm flex items-center">
                  🔍 Smart search
                </span>
              </div>
            </div>
          </div>
        );
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: colors.background.secondary }}
    >
      {/* Top Bar */}
      <TopBar 
        user={user}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
      />
      
      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar 
          isOpen={sidebarOpen}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-6 py-8">
            {renderActiveSection()}
          </div>
        </main>
      </div>
      
      {/* Mobile Overlay */}
      {sidebarOpen && window.innerWidth < 1024 && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </I18nProvider>
  );
}

export default App;