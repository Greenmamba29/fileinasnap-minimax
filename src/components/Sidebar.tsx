import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { colors } from '../lib/design-system';
import { 
  FolderOpen,
  Image,
  FileText,
  Archive,
  Briefcase,
  BarChart3,
  History,
  Lightbulb,
  Activity,
  Sparkles,
  Brain,
  Tags,
  Search,
  FolderTree,
  Copy,
  FileSearch
} from 'lucide-react';

interface SmartFolder {
  id: string;
  name: string;
  folder_type: string;
  icon_name: string;
  color_scheme: string;
  file_count: number;
}

interface SidebarProps {
  isOpen: boolean;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function Sidebar({ isOpen, activeSection, onSectionChange }: SidebarProps) {
  const [folders, setFolders] = useState<SmartFolder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSmartFolders();
  }, []);

  async function fetchSmartFolders() {
    // For now, use mock data since smart folders table structure might be different
    const mockFolders: SmartFolder[] = [
      {
        id: '1',
        name: 'Documents',
        folder_type: 'documents',
        icon_name: 'smart-folder-documents',
        color_scheme: colors.primary.blue,
        file_count: 0
      },
      {
        id: '2', 
        name: 'Media Files',
        folder_type: 'media',
        icon_name: 'smart-folder-media', 
        color_scheme: colors.primary.teal,
        file_count: 0
      },
      {
        id: '3',
        name: 'Projects',
        folder_type: 'projects',
        icon_name: 'smart-folder-projects',
        color_scheme: colors.primary.darkBlue,
        file_count: 0
      },
      {
        id: '4',
        name: 'Archive',
        folder_type: 'archive', 
        icon_name: 'smart-folder-archive',
        color_scheme: colors.primary.gray,
        file_count: 0
      }
    ];
    
    setFolders(mockFolders);
    setLoading(false);
  }

  const getIconComponent = (iconName: string, color: string) => {
    const iconProps = { size: 20, color };
    
    switch (iconName) {
      case 'smart-folder-documents':
        return <FileText {...iconProps} />;
      case 'smart-folder-media':
        return <Image {...iconProps} />;
      case 'smart-folder-projects':
        return <Briefcase {...iconProps} />;
      case 'smart-folder-archive':
        return <Archive {...iconProps} />;
      default:
        return <FolderOpen {...iconProps} />;
    }
  };

  const navigationSections = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, color: colors.primary.blue },
    { id: 'insights', label: 'Media Insights', icon: Lightbulb, color: colors.primary.teal },
    { id: 'history', label: 'File History', icon: History, color: colors.primary.darkBlue },
    { id: 'activity', label: 'Activity Feed', icon: Activity, color: colors.status.success }
  ];

  const aiSections = [
    { id: 'ai-dashboard', label: 'AI Dashboard', icon: Brain, color: '#8B5CF6' },
    { id: 'ai-analysis', label: 'AI Analysis', icon: Sparkles, color: '#06B6D4' },
    { id: 'smart-organizer', label: 'Smart Organizer', icon: FolderTree, color: '#10B981' },
    { id: 'duplicate-detector', label: 'Duplicate Detector', icon: Copy, color: '#F59E0B' },
    { id: 'smart-tagger', label: 'Smart Tagger', icon: Tags, color: '#EF4444' }
  ];

  if (!isOpen) {
    return (
      <div className="w-16 bg-white border-r h-full flex flex-col py-4">
        {/* Regular Navigation */}
        {navigationSections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={`p-3 mx-2 rounded-lg transition-colors ${
                activeSection === section.id ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
              title={section.label}
            >
              <Icon 
                size={20} 
                color={activeSection === section.id ? colors.primary.blue : colors.text.secondary}
              />
            </button>
          );
        })}
        
        {/* Divider */}
        <div className="mx-3 my-2 border-t" style={{ borderColor: colors.primary.lightGray }}></div>
        
        {/* AI Navigation */}
        {aiSections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={`p-3 mx-2 rounded-lg transition-colors ${
                activeSection === section.id ? 'bg-purple-50' : 'hover:bg-gray-50'
              }`}
              title={section.label}
            >
              <Icon 
                size={20} 
                color={activeSection === section.id ? section.color : colors.text.secondary}
              />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div 
      className="w-64 bg-white border-r h-full flex flex-col"
      style={{ borderColor: colors.primary.lightGray }}
    >
      {/* Navigation Sections */}
      <div className="p-4">
        <h2 
          className="text-sm font-semibold mb-3"
          style={{ color: colors.text.secondary }}
        >
          Navigation
        </h2>
        <nav className="space-y-1">
          {navigationSections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            
            return (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <Icon 
                  size={18} 
                  color={isActive ? colors.primary.blue : colors.text.secondary}
                />
                <span 
                  className="text-sm font-medium"
                  style={{ color: isActive ? colors.primary.blue : colors.text.primary }}
                >
                  {section.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* AI Tools */}
      <div className="p-4 border-t" style={{ borderColor: colors.primary.lightGray }}>
        <h2 
          className="text-sm font-semibold mb-3 flex items-center"
          style={{ color: colors.text.secondary }}
        >
          <Sparkles size={16} className="mr-1" style={{ color: '#8B5CF6' }} />
          AI Tools
        </h2>
        <nav className="space-y-1">
          {aiSections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            
            return (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-purple-50 text-purple-700' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <Icon 
                  size={18} 
                  color={isActive ? section.color : colors.text.secondary}
                />
                <span 
                  className="text-sm font-medium flex items-center"
                  style={{ color: isActive ? section.color : colors.text.primary }}
                >
                  {section.label}
                  <Sparkles size={12} className="ml-1 opacity-60" />
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Smart Folders */}
      <div className="p-4 border-t" style={{ borderColor: colors.primary.lightGray }}>
        <h2 
          className="text-sm font-semibold mb-3"
          style={{ color: colors.text.secondary }}
        >
          Smart Folders
        </h2>
        
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {folders.map((folder) => (
              <button
                key={folder.id}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                onClick={() => onSectionChange(`folder-${folder.folder_type}`)}
              >
                <div className="flex items-center space-x-3">
                  {getIconComponent(folder.icon_name, folder.color_scheme)}
                  <span 
                    className="text-sm font-medium"
                    style={{ color: colors.text.primary }}
                  >
                    {folder.name}
                  </span>
                </div>
                <span 
                  className="text-xs px-2 py-1 rounded-full"
                  style={{ 
                    backgroundColor: `${folder.color_scheme}15`,
                    color: folder.color_scheme
                  }}
                >
                  {folder.file_count}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}