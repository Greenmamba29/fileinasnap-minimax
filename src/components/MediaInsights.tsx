import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase, FileRecord } from '../lib/supabase';
import { colors } from '../lib/design-system';
import { 
  Image, 
  Video, 
  Music, 
  FileText,
  Eye,
  Download,
  Share2,
  Tag,
  Calendar,
  HardDrive,
  Lightbulb,
  X
} from 'lucide-react';

interface MediaFile extends FileRecord {
  thumbnail_url?: string;
}

interface MediaInsightsProps {
  file?: MediaFile;
  onClose?: () => void;
}

function MediaInsightsPanel({ file, onClose }: MediaInsightsProps) {
  const { t } = useTranslation('media');
  const [metadata, setMetadata] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'insights' | 'metadata' | 'activity'>('insights');

  useEffect(() => {
    if (file) {
      // Load additional metadata for the file
      setMetadata(file.custom_metadata || {});
    }
  }, [file]);

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image size={20} color={colors.primary.teal} />;
    if (mimeType.startsWith('video/')) return <Video size={20} color={colors.primary.blue} />;
    if (mimeType.startsWith('audio/')) return <Music size={20} color={colors.status.success} />;
    return <FileText size={20} color={colors.text.secondary} />;
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (!file) {
    return (
      <div className="w-80 bg-white border-l" style={{ borderColor: colors.primary.lightGray }}>
        <div className="p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full" style={{ backgroundColor: colors.primary.lightGray }}>
            <Eye size={32} color={colors.text.muted} />
          </div>
          <h3 className="text-lg font-medium mb-2" style={{ color: colors.text.primary }}>
            {t('selectFile')}
          </h3>
          <p style={{ color: colors.text.secondary }}>
            {t('selectFileDescription')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-l flex flex-col" style={{ borderColor: colors.primary.lightGray }}>
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: colors.primary.lightGray }}>
        <h2 className="text-lg font-semibold" style={{ color: colors.text.primary }}>
          {t('fileInsights')}
        </h2>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={18} color={colors.text.secondary} />
          </button>
        )}
      </div>

      {/* File Preview */}
      <div className="p-4 border-b" style={{ borderColor: colors.primary.lightGray }}>
        <div className="flex items-center space-x-3 mb-3">
          {getFileIcon(file.mime_type)}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate" style={{ color: colors.text.primary }}>
              {file.name}
            </h3>
            <p className="text-sm" style={{ color: colors.text.secondary }}>
              {formatFileSize(file.size_bytes)} • {file.mime_type}
            </p>
          </div>
        </div>
        
        {/* Preview thumbnail/icon */}
        {file.mime_type.startsWith('image/') ? (
          <div 
            className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-3"
            style={{ backgroundColor: colors.background.accent }}
          >
            {file.thumbnail_url ? (
              <img 
                src={file.thumbnail_url} 
                alt={file.name}
                className="max-w-full max-h-full object-contain rounded"
              />
            ) : (
              <Image size={48} color={colors.text.muted} />
            )}
          </div>
        ) : (
          <div 
            className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-3"
            style={{ backgroundColor: colors.background.accent }}
          >
            {getFileIcon(file.mime_type)}
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg transition-colors hover:bg-blue-100">
            <Download size={16} />
            <span className="text-sm font-medium">{t('downloadFile')}</span>
          </button>
          <button className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-teal-50 text-teal-700 rounded-lg transition-colors hover:bg-teal-100">
            <Share2 size={16} />
            <span className="text-sm font-medium">{t('shareFile')}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b" style={{ borderColor: colors.primary.lightGray }}>
        <div className="flex">
          {[
            { id: 'insights', label: t('tabs.insights'), icon: Lightbulb },
            { id: 'metadata', label: t('tabs.metadata'), icon: Tag },
            { id: 'activity', label: t('tabs.activity'), icon: Calendar }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center space-x-2 px-3 py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive 
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent hover:text-gray-600'
                }`}
                style={{
                  color: isActive ? colors.primary.blue : colors.text.secondary
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'insights' && (
          <div className="space-y-4">
            {/* AI Summary */}
            {file.ai_summary && (
              <div>
                <h3 className="text-sm font-semibold mb-2" style={{ color: colors.text.primary }}>
                  {t('aiSummary')}
                </h3>
                <p className="text-sm" style={{ color: colors.text.secondary }}>
                  {file.ai_summary}
                </p>
              </div>
            )}
            
            {/* AI Tags */}
            {file.ai_tags && file.ai_tags.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2" style={{ color: colors.text.primary }}>
                  {t('aiTags')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {file.ai_tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 text-xs rounded-full"
                      style={{ 
                        backgroundColor: `${colors.primary.blue}15`,
                        color: colors.primary.blue
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* File Properties */}
            <div>
              <h3 className="text-sm font-semibold mb-2" style={{ color: colors.text.primary }}>
                {t('properties')}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: colors.text.secondary }}>{t('size')}:</span>
                  <span style={{ color: colors.text.primary }}>{formatFileSize(file.size_bytes)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: colors.text.secondary }}>{t('type')}:</span>
                  <span style={{ color: colors.text.primary }}>{file.mime_type}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: colors.text.secondary }}>{t('created')}:</span>
                  <span style={{ color: colors.text.primary }}>
                    {new Date(file.created_at).toLocaleDateString()}
                  </span>
                </div>
                {file.category && (
                  <div className="flex justify-between">
                    <span style={{ color: colors.text.secondary }}>{t('category')}:</span>
                    <span style={{ color: colors.text.primary }}>{file.category}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'metadata' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold mb-2" style={{ color: colors.text.primary }}>
                {t('customMetadata')}
              </h3>
              {Object.keys(metadata).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(metadata).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span style={{ color: colors.text.secondary }}>{key}:</span>
                      <span style={{ color: colors.text.primary }}>
                        {typeof value === 'string' ? value : JSON.stringify(value)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm" style={{ color: colors.text.secondary }}>
                  {t('noCustomMetadata')}
                </p>
              )}
            </div>
            
            <div>
              <h3 className="text-sm font-semibold mb-2" style={{ color: colors.text.primary }}>
                System Metadata
              </h3>
              <div className="space-y-2 text-sm">
                {Object.entries(file.metadata || {}).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span style={{ color: colors.text.secondary }}>{key}:</span>
                    <span style={{ color: colors.text.primary }}>
                      {typeof value === 'string' ? value : JSON.stringify(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'activity' && (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: colors.text.secondary }}>
              Activity history for this file will be displayed here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function MediaInsights() {
  const { t } = useTranslation('media');
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<MediaFile | undefined>();
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'image' | 'video' | 'audio'>('all');

  const fetchMediaFiles = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .like('mime_type', filter === 'all' ? '%' : `${filter}/%`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching media files:', error);
        setFiles([]);
      } else {
        setFiles(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      setFiles([]);
    }
    
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchMediaFiles();
  }, [fetchMediaFiles]);

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image size={20} color={colors.primary.teal} />;
    if (mimeType.startsWith('video/')) return <Video size={20} color={colors.primary.blue} />;
    if (mimeType.startsWith('audio/')) return <Music size={20} color={colors.status.success} />;
    return <FileText size={20} color={colors.text.secondary} />;
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 
              className="text-3xl font-bold mb-2"
              style={{ color: colors.text.primary }}
            >
              {t('insights')}
            </h1>
            <p style={{ color: colors.text.secondary }}>
              {t('description')}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ 
                borderColor: colors.primary.lightGray,
                '--tw-ring-color': colors.primary.blue 
              } as React.CSSProperties}
            >
              <option value="all">{t('filters.allMedia')}</option>
              <option value="image">{t('filters.images')}</option>
              <option value="video">{t('filters.videos')}</option>
              <option value="audio">{t('filters.audio')}</option>
            </select>
          </div>
        </div>

        {/* Files Grid */}
        <div className="bg-white rounded-lg border" style={{ borderColor: colors.primary.lightGray }}>
          {loading ? (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="border rounded-lg p-4 animate-pulse">
                    <div className="h-32 bg-gray-200 rounded mb-3" />
                    <div className="h-4 bg-gray-200 rounded mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                ))}
              </div>
            </div>
          ) : files.length > 0 ? (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {files.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => setSelectedFile(file)}
                    className={`border rounded-lg p-4 text-left transition-colors hover:bg-gray-50 ${
                      selectedFile?.id === file.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    style={{ borderColor: colors.primary.lightGray }}
                  >
                    {/* File Preview */}
                    <div 
                      className="h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-3"
                      style={{ backgroundColor: colors.background.accent }}
                    >
                      {file.mime_type.startsWith('image/') && file.thumbnail_url ? (
                        <img 
                          src={file.thumbnail_url} 
                          alt={file.name}
                          className="max-w-full max-h-full object-cover rounded"
                        />
                      ) : (
                        getFileIcon(file.mime_type)
                      )}
                    </div>
                    
                    {/* File Info */}
                    <div className="space-y-2">
                      <h3 className="font-medium truncate" style={{ color: colors.text.primary }}>
                        {file.name}
                      </h3>
                      <div className="flex items-center justify-between text-sm">
                        <span style={{ color: colors.text.secondary }}>
                          {formatFileSize(file.size_bytes)}
                        </span>
                        <span style={{ color: colors.text.muted }}>
                          {new Date(file.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {/* AI Tags */}
                      {file.ai_tags && file.ai_tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {file.ai_tags.slice(0, 3).map((tag, index) => (
                            <span 
                              key={index}
                              className="px-1.5 py-0.5 text-xs rounded"
                              style={{ 
                                backgroundColor: `${colors.primary.teal}15`,
                                color: colors.primary.teal
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                          {file.ai_tags.length > 3 && (
                            <span className="text-xs" style={{ color: colors.text.muted }}>
                              {t('moreFiles', { count: file.ai_tags.length - 3 })}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full" style={{ backgroundColor: colors.primary.lightGray }}>
                <Image size={32} color={colors.text.muted} />
              </div>
              <h3 className="text-lg font-medium mb-2" style={{ color: colors.text.primary }}>
                {t('noMediaFiles')}
              </h3>
              <p style={{ color: colors.text.secondary }}>
                {t('noMediaFilesDescription')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Insights Panel */}
      <MediaInsightsPanel file={selectedFile} />
    </div>
  );
}