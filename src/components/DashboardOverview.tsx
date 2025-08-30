import { useState, useEffect } from 'react';
import { getCurrentUser } from '../lib/neon-auth';
import { colors } from '../lib/design-system';
import { FileUpload } from './FileUpload';
import { 
  Files,
  HardDrive,
  Clock,
  Image,
  FileText,
  TrendingUp,
  Upload,
  Sparkles,
  History
} from 'lucide-react';

interface DashboardStats {
  total_files: number;
  total_size: number;
  recent_files: number;
  media_files: number;
  document_files: number;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: string;
}

function StatCard({ title, value, icon, color, trend }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg p-6 border" style={{ borderColor: colors.primary.lightGray }}>
      <div className="flex items-center justify-between mb-4">
        <div 
          className="p-3 rounded-lg"
          style={{ backgroundColor: `${color}15` }}
        >
          {icon}
        </div>
        {trend && (
          <span className="text-sm text-green-600 flex items-center">
            <TrendingUp size={14} className="mr-1" />
            {trend}
          </span>
        )}
      </div>
      <h3 className="text-2xl font-bold mb-1" style={{ color: colors.text.primary }}>
        {value}
      </h3>
      <p className="text-sm" style={{ color: colors.text.secondary }}>
        {title}
      </p>
    </div>
  );
}

export function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [recentFiles, setRecentFiles] = useState<any[]>([]);
  const user = getCurrentUser();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  async function fetchDashboardStats() {
    try {
      console.log('🔍 Fetching dashboard stats for user:', user?.email);
      
      // For demo, get stats from localStorage or use mock data
      const storedFiles = localStorage.getItem('uploaded_files');
      let uploadedFiles = [];
      
      if (storedFiles) {
        try {
          uploadedFiles = JSON.parse(storedFiles);
        } catch (error) {
          console.warn('Error parsing stored files:', error);
        }
      }
      
      // Calculate stats from uploaded files or use mock data
      const totalFiles = uploadedFiles.length || 156;
      const mediaFiles = uploadedFiles.filter((f: any) => 
        f.file?.type?.startsWith('image/') || f.file?.type?.startsWith('video/')
      ).length || 48;
      const documentFiles = uploadedFiles.filter((f: any) => 
        f.file?.type?.includes('pdf') || f.file?.type?.includes('document')
      ).length || 89;
      
      const totalSize = uploadedFiles.reduce((acc: number, f: any) => 
        acc + (f.file?.size || 0), 0
      ) || 2547328000;
      
      setStats({
        total_files: totalFiles,
        total_size: totalSize,
        recent_files: Math.min(uploadedFiles.length, 12),
        media_files: mediaFiles,
        document_files: documentFiles
      });
      
      setRecentFiles(uploadedFiles.slice(-5)); // Show last 5 files
      
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Use mock data
      setStats({
        total_files: 156,
        total_size: 2547328000,
        recent_files: 12,
        media_files: 48,
        document_files: 89
      });
    }
    
    setLoading(false);
  }

  function formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg p-6 border animate-pulse">
            <div className="h-12 w-12 bg-gray-200 rounded-lg mb-4" />
            <div className="h-8 bg-gray-200 rounded mb-2" />
            <div className="h-4 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 
          className="text-3xl font-bold mb-2"
          style={{ color: colors.text.primary }}
        >
          Dashboard
        </h1>
        <p style={{ color: colors.text.secondary }}>
          Welcome to your FileInASnap dashboard. Here's an overview of your files and activity.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Files"
          value={stats.total_files.toLocaleString()}
          icon={<Files size={24} color={colors.primary.blue} />}
          color={colors.primary.blue}
          trend="+12%"
        />
        
        <StatCard
          title="Storage Used"
          value={formatFileSize(stats.total_size)}
          icon={<HardDrive size={24} color={colors.primary.teal} />}
          color={colors.primary.teal}
          trend="+5.2%"
        />
        
        <StatCard
          title="Recent Files"
          value={stats.recent_files}
          icon={<Clock size={24} color={colors.primary.darkBlue} />}
          color={colors.primary.darkBlue}
          trend="+8 this week"
        />
        
        <StatCard
          title="Media Files"
          value={stats.media_files}
          icon={<Image size={24} color={colors.status.success} />}
          color={colors.status.success}
        />
      </div>

      {/* File Type Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 border" style={{ borderColor: colors.primary.lightGray }}>
          <h2 
            className="text-lg font-semibold mb-4"
            style={{ color: colors.text.primary }}
          >
            File Distribution
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText size={18} color={colors.primary.blue} />
                <span style={{ color: colors.text.primary }}>Documents</span>
              </div>
              <div className="flex items-center space-x-2">
                <div 
                  className="w-24 h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: colors.primary.lightGray }}
                >
                  <div 
                    className="h-full rounded-full"
                    style={{ 
                      backgroundColor: colors.primary.blue,
                      width: `${(stats.document_files / stats.total_files) * 100}%`
                    }}
                  />
                </div>
                <span className="text-sm font-medium" style={{ color: colors.text.primary }}>
                  {stats.document_files}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Image size={18} color={colors.primary.teal} />
                <span style={{ color: colors.text.primary }}>Media</span>
              </div>
              <div className="flex items-center space-x-2">
                <div 
                  className="w-24 h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: colors.primary.lightGray }}
                >
                  <div 
                    className="h-full rounded-full"
                    style={{ 
                      backgroundColor: colors.primary.teal,
                      width: `${(stats.media_files / stats.total_files) * 100}%`
                    }}
                  />
                </div>
                <span className="text-sm font-medium" style={{ color: colors.text.primary }}>
                  {stats.media_files}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Files size={18} color={colors.primary.gray} />
                <span style={{ color: colors.text.primary }}>Other</span>
              </div>
              <div className="flex items-center space-x-2">
                <div 
                  className="w-24 h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: colors.primary.lightGray }}
                >
                  <div 
                    className="h-full rounded-full"
                    style={{ 
                      backgroundColor: colors.primary.gray,
                      width: `${((stats.total_files - stats.media_files - stats.document_files) / stats.total_files) * 100}%`
                    }}
                  />
                </div>
                <span className="text-sm font-medium" style={{ color: colors.text.primary }}>
                  {stats.total_files - stats.media_files - stats.document_files}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg p-6 border" style={{ borderColor: colors.primary.lightGray }}>
          <h2 
            className="text-lg font-semibold mb-4"
            style={{ color: colors.text.primary }}
          >
            Quick Actions
          </h2>
          
          <div className="space-y-3">
            <button 
              onClick={() => setShowUpload(true)}
              className="w-full flex items-center space-x-3 p-3 rounded-lg transition-colors hover:bg-opacity-20"
              style={{ backgroundColor: `${colors.primary.blue}15` }}
            >
              <Upload size={18} color={colors.primary.blue} />
              <span className="text-sm font-medium" style={{ color: colors.primary.blue }}>
                Upload Files
              </span>
            </button>
            
            <button 
              onClick={() => alert('Media analysis feature - coming soon!')}
              className="w-full flex items-center space-x-3 p-3 rounded-lg transition-colors hover:bg-opacity-20"
              style={{ backgroundColor: `${colors.primary.teal}15` }}
            >
              <Sparkles size={18} color={colors.primary.teal} />
              <span className="text-sm font-medium" style={{ color: colors.primary.teal }}>
                Analyze Media
              </span>
            </button>
            
            <button 
              onClick={() => alert('File history feature - coming soon!')}
              className="w-full flex items-center space-x-3 p-3 rounded-lg transition-colors hover:bg-opacity-20"
              style={{ backgroundColor: `${colors.primary.darkBlue}15` }}
            >
              <History size={18} color={colors.primary.darkBlue} />
              <span className="text-sm font-medium" style={{ color: colors.primary.darkBlue }}>
                View History
              </span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Recent Files Section */}
      {recentFiles.length > 0 && (
        <div className="bg-white rounded-lg p-6 border" style={{ borderColor: colors.primary.lightGray }}>
          <h2 
            className="text-lg font-semibold mb-4"
            style={{ color: colors.text.primary }}
          >
            Recent Files
          </h2>
          
          <div className="space-y-3">
            {recentFiles.map((fileItem, idx) => (
              <div key={idx} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                  <FileText size={16} color={colors.primary.blue} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate" style={{ color: colors.text.primary }}>
                    {fileItem.file?.name || 'Unknown file'}
                  </p>
                  <p className="text-sm" style={{ color: colors.text.secondary }}>
                    {fileItem.file?.size ? formatFileSize(fileItem.file.size) : 'Unknown size'} • Analyzed
                  </p>
                </div>
                <div className="text-green-600">
                  <Sparkles size={16} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* File Upload Modal */}
      {showUpload && (
        <FileUpload
          onFilesUploaded={(files) => {
            // Store files in localStorage for demo purposes
            const existingFiles = localStorage.getItem('uploaded_files');
            let allFiles = [];
            
            if (existingFiles) {
              try {
                allFiles = JSON.parse(existingFiles);
              } catch (error) {
                console.warn('Error parsing existing files:', error);
              }
            }
            
            allFiles.push(...files);
            localStorage.setItem('uploaded_files', JSON.stringify(allFiles));
            
            // Refresh dashboard stats
            fetchDashboardStats();
            
            setShowUpload(false);
            
            // Show success message
            alert(`Successfully uploaded and analyzed ${files.length} file(s)!`);
          }}
          onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  );
}
