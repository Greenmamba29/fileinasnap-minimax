import { useState, useEffect } from 'react';
import { getCurrentUser } from '../lib/neon-auth';
import { colors } from '../lib/design-system';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  FileIcon, 
  Image, 
  FileText, 
  Video, 
  Music, 
  Archive,
  MoreVertical,
  Download,
  Trash2,
  Eye,
  Edit3,
  Tag,
  Calendar,
  Clock,
  HardDrive,
  ChevronDown,
  Sparkles
} from 'lucide-react';

interface FileItem {
  id: string;
  file: File;
  status: string;
  analysis?: any;
  uploadDate: string;
  tags?: string[];
}

interface FileBrowserProps {
  onFileSelect?: (file: FileItem) => void;
  onFileDelete?: (fileId: string) => void;
  onFilePreview?: (file: FileItem) => void;
}

export function FileBrowser({ onFileSelect, onFileDelete, onFilePreview }: FileBrowserProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('date');
  const [filterType, setFilterType] = useState<'all' | 'images' | 'documents' | 'videos' | 'audio'>('all');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const user = getCurrentUser();

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = () => {
    try {
      const storedFiles = localStorage.getItem('uploaded_files');
      if (storedFiles) {
        const parsedFiles = JSON.parse(storedFiles);
        const formattedFiles = parsedFiles.map((f: any, index: number) => ({
          ...f,
          id: f.id || `file_${index}`,
          uploadDate: f.uploadDate || new Date().toISOString(),
          tags: f.analysis?.tags || f.analysis?.analysis?.suggested_tags || []
        }));
        setFiles(formattedFiles);
      }
    } catch (error) {
      console.error('Error loading files:', error);
    }
  };

  // Get file icon
  const getFileIcon = (file: File, size = 20) => {
    const type = file.type;
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (type.startsWith('image/')) return <Image size={size} color={colors.primary.teal} />;
    if (type.startsWith('video/')) return <Video size={size} color={colors.primary.blue} />;
    if (type.startsWith('audio/')) return <Music size={size} color={colors.primary.darkBlue} />;
    if (type.includes('pdf')) return <FileText size={size} color={colors.status.danger} />;
    if (type.startsWith('text/') || ['doc', 'docx', 'txt'].includes(extension || '')) {
      return <FileText size={size} color={colors.primary.blue} />;
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension || '')) {
      return <Archive size={size} color={colors.primary.gray} />;
    }
    return <FileIcon size={size} color={colors.primary.gray} />;
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  // Filter files
  const filteredFiles = files.filter(fileItem => {
    const matchesSearch = fileItem.file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         fileItem.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFilter = filterType === 'all' || 
      (filterType === 'images' && fileItem.file.type.startsWith('image/')) ||
      (filterType === 'documents' && (fileItem.file.type.includes('pdf') || fileItem.file.type.includes('document'))) ||
      (filterType === 'videos' && fileItem.file.type.startsWith('video/')) ||
      (filterType === 'audio' && fileItem.file.type.startsWith('audio/'));

    return matchesSearch && matchesFilter;
  });

  // Sort files
  const sortedFiles = [...filteredFiles].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.file.name.localeCompare(b.file.name);
      case 'date':
        return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
      case 'size':
        return b.file.size - a.file.size;
      case 'type':
        return a.file.type.localeCompare(b.file.type);
      default:
        return 0;
    }
  });

  // Toggle file selection
  const toggleFileSelection = (fileId: string) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(fileId)) {
      newSelection.delete(fileId);
    } else {
      newSelection.add(fileId);
    }
    setSelectedFiles(newSelection);
  };

  // Delete file
  const deleteFile = (fileId: string) => {
    if (confirm('Are you sure you want to delete this file?')) {
      const updatedFiles = files.filter(f => f.id !== fileId);
      setFiles(updatedFiles);
      localStorage.setItem('uploaded_files', JSON.stringify(updatedFiles));
      
      if (onFileDelete) {
        onFileDelete(fileId);
      }
    }
  };

  // File actions
  const FileActions = ({ fileItem }: { fileItem: FileItem }) => (
    <div className="absolute right-2 top-2 bg-white rounded-lg shadow-lg border py-1 z-10">
      <button
        onClick={() => onFilePreview?.(fileItem)}
        className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-50"
      >
        <Eye size={14} />
        <span>Preview</span>
      </button>
      <button
        onClick={() => alert('Edit feature coming soon!')}
        className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-50"
      >
        <Edit3 size={14} />
        <span>Edit</span>
      </button>
      <button
        onClick={() => alert('Download feature coming soon!')}
        className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-50"
      >
        <Download size={14} />
        <span>Download</span>
      </button>
      <hr className="my-1" />
      <button
        onClick={() => deleteFile(fileItem.id)}
        className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
      >
        <Trash2 size={14} />
        <span>Delete</span>
      </button>
    </div>
  );

  // Grid view file card
  const FileCard = ({ fileItem }: { fileItem: FileItem }) => {
    const isSelected = selectedFiles.has(fileItem.id);
    
    return (
      <div 
        className={`relative bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${
          isSelected ? 'ring-2 ring-blue-500 border-blue-500' : ''
        }`}
        onClick={() => toggleFileSelection(fileItem.id)}
      >
        {/* File Preview/Icon */}
        <div className="mb-3">
          {fileItem.file.type.startsWith('image/') ? (
            <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
              <div className="w-8 h-8">
                {getFileIcon(fileItem.file, 32)}
              </div>
            </div>
          ) : (
            <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
              {getFileIcon(fileItem.file, 48)}
            </div>
          )}
        </div>

        {/* File Info */}
        <div className="space-y-2">
          <h3 
            className="font-medium truncate text-sm" 
            style={{ color: colors.text.primary }}
            title={fileItem.file.name}
          >
            {fileItem.file.name}
          </h3>
          
          <div className="flex items-center justify-between text-xs" style={{ color: colors.text.secondary }}>
            <span>{formatFileSize(fileItem.file.size)}</span>
            <span>{formatDate(fileItem.uploadDate)}</span>
          </div>

          {/* Tags */}
          {fileItem.tags && fileItem.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {fileItem.tags.slice(0, 2).map((tag, idx) => (
                <span
                  key={idx}
                  className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-xs"
                >
                  {tag}
                </span>
              ))}
              {fileItem.tags.length > 2 && (
                <span className="text-xs" style={{ color: colors.text.secondary }}>
                  +{fileItem.tags.length - 2} more
                </span>
              )}
            </div>
          )}

          {/* AI Analysis Badge */}
          {fileItem.analysis && (
            <div className="flex items-center space-x-1 text-xs text-green-600">
              <Sparkles size={12} />
              <span>AI Analyzed</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(showMenu === fileItem.id ? null : fileItem.id);
          }}
          className="absolute top-2 right-2 p-1 rounded hover:bg-gray-100"
        >
          <MoreVertical size={16} color={colors.text.secondary} />
        </button>

        {showMenu === fileItem.id && (
          <FileActions fileItem={fileItem} />
        )}
      </div>
    );
  };

  // List view file row
  const FileRow = ({ fileItem }: { fileItem: FileItem }) => {
    const isSelected = selectedFiles.has(fileItem.id);
    
    return (
      <div 
        className={`flex items-center space-x-4 p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
          isSelected ? 'bg-blue-50 border border-blue-200' : ''
        }`}
        onClick={() => toggleFileSelection(fileItem.id)}
      >
        {/* File Icon */}
        <div className="flex-shrink-0">
          {getFileIcon(fileItem.file, 24)}
        </div>

        {/* File Name */}
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate" style={{ color: colors.text.primary }}>
            {fileItem.file.name}
          </p>
          {fileItem.tags && fileItem.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {fileItem.tags.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* File Size */}
        <div className="text-sm" style={{ color: colors.text.secondary }}>
          {formatFileSize(fileItem.file.size)}
        </div>

        {/* Upload Date */}
        <div className="text-sm" style={{ color: colors.text.secondary }}>
          {formatDate(fileItem.uploadDate)}
        </div>

        {/* AI Analysis Status */}
        <div className="flex-shrink-0">
          {fileItem.analysis ? (
            <div className="flex items-center space-x-1 text-xs text-green-600">
              <Sparkles size={14} />
              <span>Analyzed</span>
            </div>
          ) : (
            <span className="text-xs" style={{ color: colors.text.secondary }}>Pending</span>
          )}
        </div>

        {/* Actions */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(showMenu === fileItem.id ? null : fileItem.id);
          }}
          className="p-1 rounded hover:bg-gray-100"
        >
          <MoreVertical size={16} color={colors.text.secondary} />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: colors.text.primary }}>
            File Browser
          </h1>
          <p style={{ color: colors.text.secondary }}>
            {sortedFiles.length} files • {selectedFiles.size} selected
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
          >
            <Grid size={18} color={viewMode === 'grid' ? colors.primary.blue : colors.text.secondary} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
          >
            <List size={18} color={viewMode === 'list' ? colors.primary.blue : colors.text.secondary} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center space-x-4 space-y-2 sm:space-y-0">
        {/* Search */}
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" size={18} color={colors.text.secondary} />
          <input
            type="text"
            placeholder="Search files and tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
            style={{ 
              borderColor: colors.primary.lightGray,
              '--tw-ring-color': colors.primary.blue 
            } as React.CSSProperties}
          />
        </div>

        {/* Type Filter */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
          style={{ 
            borderColor: colors.primary.lightGray,
            '--tw-ring-color': colors.primary.blue 
          } as React.CSSProperties}
        >
          <option value="all">All Files</option>
          <option value="images">Images</option>
          <option value="documents">Documents</option>
          <option value="videos">Videos</option>
          <option value="audio">Audio</option>
        </select>

        {/* Sort By */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
          style={{ 
            borderColor: colors.primary.lightGray,
            '--tw-ring-color': colors.primary.blue 
          } as React.CSSProperties}
        >
          <option value="date">Sort by Date</option>
          <option value="name">Sort by Name</option>
          <option value="size">Sort by Size</option>
          <option value="type">Sort by Type</option>
        </select>
      </div>

      {/* File List */}
      <div className="relative">
        {sortedFiles.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <FileIcon size={32} color={colors.text.secondary} />
            </div>
            <h3 className="text-lg font-medium mb-2" style={{ color: colors.text.primary }}>
              No files found
            </h3>
            <p style={{ color: colors.text.secondary }}>
              {searchQuery || filterType !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Upload some files to get started'
              }
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedFiles.map((fileItem) => (
              <FileCard key={fileItem.id} fileItem={fileItem} />
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {/* List Header */}
            <div className="flex items-center space-x-4 px-3 py-2 bg-gray-50 rounded-lg text-sm font-medium" style={{ color: colors.text.secondary }}>
              <div className="w-6"></div>
              <div className="flex-1">Name</div>
              <div className="w-20">Size</div>
              <div className="w-24">Date</div>
              <div className="w-20">Status</div>
              <div className="w-8"></div>
            </div>
            
            {/* File Rows */}
            {sortedFiles.map((fileItem) => (
              <FileRow key={fileItem.id} fileItem={fileItem} />
            ))}
          </div>
        )}
      </div>

      {/* Click outside to close menu */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => setShowMenu(null)}
        />
      )}
    </div>
  );
}
