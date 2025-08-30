import { useState, useRef, useCallback } from 'react';
import { getCurrentUser } from '../lib/neon-auth';
import { aiService } from '../lib/ai-service';
import { colors } from '../lib/design-system';
import { 
  Upload, 
  X, 
  FileIcon, 
  Image, 
  FileText, 
  Video, 
  Music, 
  Archive,
  CheckCircle,
  AlertCircle,
  Loader,
  Sparkles
} from 'lucide-react';

interface FileUploadItem {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'analyzing' | 'completed' | 'error';
  progress: number;
  preview?: string;
  analysis?: any;
  error?: string;
}

interface FileUploadProps {
  onFilesUploaded?: (files: FileUploadItem[]) => void;
  onClose?: () => void;
  maxFiles?: number;
  maxSizeBytes?: number;
  allowedTypes?: string[];
}

export function FileUpload({ 
  onFilesUploaded, 
  onClose,
  maxFiles = 10,
  maxSizeBytes = 100 * 1024 * 1024, // 100MB
  allowedTypes = [
    'image/*', 
    'application/pdf', 
    'text/*', 
    'video/*', 
    'audio/*',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
}: FileUploadProps) {
  const [files, setFiles] = useState<FileUploadItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get file icon based on type
  const getFileIcon = (file: File) => {
    const type = file.type;
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (type.startsWith('image/')) return <Image size={20} color={colors.primary.teal} />;
    if (type.startsWith('video/')) return <Video size={20} color={colors.primary.blue} />;
    if (type.startsWith('audio/')) return <Music size={20} color={colors.primary.darkBlue} />;
    if (type.includes('pdf')) return <FileText size={20} color={colors.status.danger} />;
    if (type.startsWith('text/') || ['doc', 'docx', 'txt'].includes(extension || '')) {
      return <FileText size={20} color={colors.primary.blue} />;
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension || '')) {
      return <Archive size={20} color={colors.primary.gray} />;
    }
    return <FileIcon size={20} color={colors.primary.gray} />;
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Validate file
  const validateFile = (file: File): string | null => {
    if (file.size > maxSizeBytes) {
      return `File size exceeds ${formatFileSize(maxSizeBytes)} limit`;
    }

    const isAllowedType = allowedTypes.some(type => {
      if (type.includes('*')) {
        const baseType = type.split('/')[0];
        return file.type.startsWith(baseType);
      }
      return file.type === type;
    });

    if (!isAllowedType) {
      return 'File type not supported';
    }

    return null;
  };

  // Create file preview
  const createPreview = async (file: File): Promise<string | undefined> => {
    if (file.type.startsWith('image/')) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
    }
    return undefined;
  };

  // Handle file selection
  const handleFiles = useCallback(async (selectedFiles: FileList | File[]) => {
    const fileArray = Array.from(selectedFiles);
    
    if (files.length + fileArray.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const newFiles: FileUploadItem[] = [];

    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        alert(`${file.name}: ${validationError}`);
        continue;
      }

      const preview = await createPreview(file);
      
      newFiles.push({
        id: Math.random().toString(36).substr(2, 9),
        file,
        status: 'pending',
        progress: 0,
        preview
      });
    }

    setFiles(prev => [...prev, ...newFiles]);
  }, [files.length, maxFiles]);

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  // Remove file
  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  // Simulate file upload and AI analysis
  const processFile = async (fileItem: FileUploadItem): Promise<void> => {
    const { file } = fileItem;
    
    try {
      // Step 1: Simulate upload
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id 
          ? { ...f, status: 'uploading', progress: 0 }
          : f
      ));

      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id 
            ? { ...f, progress }
            : f
        ));
      }

      // Step 2: AI Analysis
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id 
          ? { ...f, status: 'analyzing', progress: 100 }
          : f
      ));

      let analysisResult = null;

      // Perform AI analysis based on file type
      if (file.type.startsWith('image/')) {
        // Convert image to base64 for analysis
        const base64 = await aiService.fileToBase64(file);
        analysisResult = await aiService.analyzeImage(
          base64, 
          file.name, 
          `uploads/${file.name}`,
          'comprehensive'
        );
      } else if (file.type.includes('text') || file.type.includes('pdf') || 
                 file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
        // Extract text content for document analysis
        const textContent = await aiService.extractTextFromFile(file);
        analysisResult = await aiService.analyzeDocument(
          textContent,
          file.name,
          `uploads/${file.name}`,
          'comprehensive'
        );
      } else {
        // Generate tags for other file types
        analysisResult = await aiService.generateTags(
          file.name,
          `uploads/${file.name}`,
          file.type,
          undefined,
          {
            size: file.size,
            lastModified: file.lastModified,
            type: file.type
          }
        );
      }

      // Step 3: Complete
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id 
          ? { ...f, status: 'completed', analysis: analysisResult }
          : f
      ));

    } catch (error) {
      console.error('File processing error:', error);
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id 
          ? { ...f, status: 'error', error: error instanceof Error ? error.message : 'Processing failed' }
          : f
      ));
    }
  };

  // Upload all files
  const uploadFiles = async () => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    
    // Process files concurrently
    const promises = files
      .filter(f => f.status === 'pending')
      .map(file => processFile(file));
    
    await Promise.allSettled(promises);
    
    setIsUploading(false);
    
    // Notify parent component
    if (onFilesUploaded) {
      onFilesUploaded(files);
    }
  };

  // Get status icon
  const getStatusIcon = (status: FileUploadItem['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} color={colors.status.success} />;
      case 'error':
        return <AlertCircle size={16} color={colors.status.danger} />;
      case 'uploading':
      case 'analyzing':
        return <Loader size={16} color={colors.primary.blue} className="animate-spin" />;
      default:
        return null;
    }
  };

  const completedCount = files.filter(f => f.status === 'completed').length;
  const hasErrors = files.some(f => f.status === 'error');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold" style={{ color: colors.text.primary }}>
              Upload Files
            </h2>
            <p className="text-sm mt-1" style={{ color: colors.text.secondary }}>
              Drag & drop files or click to browse. AI analysis will be performed automatically.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} color={colors.text.secondary} />
          </button>
        </div>

        {/* Upload Area */}
        <div className="p-6 border-b">
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload size={48} color={colors.primary.blue} className="mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2" style={{ color: colors.text.primary }}>
              Drop files here or click to browse
            </h3>
            <p className="text-sm mb-4" style={{ color: colors.text.secondary }}>
              Support for images, documents, videos, and more. Max {formatFileSize(maxSizeBytes)} per file.
            </p>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-2 rounded-lg text-white font-medium"
              style={{ backgroundColor: colors.primary.blue }}
            >
              Browse Files
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept={allowedTypes.join(',')}
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
          </div>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="flex-1 overflow-y-auto max-h-96">
            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium" style={{ color: colors.text.primary }}>
                  Files ({files.length})
                </h3>
                <div className="flex items-center space-x-2">
                  {completedCount > 0 && (
                    <span className="text-sm text-green-600">
                      {completedCount} analyzed
                    </span>
                  )}
                  <Sparkles size={16} color={colors.primary.blue} />
                </div>
              </div>
              
              {files.map((fileItem) => (
                <div key={fileItem.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  {/* File Preview/Icon */}
                  <div className="flex-shrink-0">
                    {fileItem.preview ? (
                      <img 
                        src={fileItem.preview} 
                        alt={fileItem.file.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-white rounded flex items-center justify-center border">
                        {getFileIcon(fileItem.file)}
                      </div>
                    )}
                  </div>
                  
                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" style={{ color: colors.text.primary }}>
                      {fileItem.file.name}
                    </p>
                    <p className="text-sm" style={{ color: colors.text.secondary }}>
                      {formatFileSize(fileItem.file.size)}
                    </p>
                    
                    {/* Progress Bar */}
                    {(fileItem.status === 'uploading' || fileItem.status === 'analyzing') && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span style={{ color: colors.text.secondary }}>
                            {fileItem.status === 'uploading' ? 'Uploading...' : 'Analyzing...'}
                          </span>
                          <span style={{ color: colors.text.secondary }}>
                            {fileItem.progress}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="h-1.5 rounded-full transition-all duration-300"
                            style={{ 
                              backgroundColor: colors.primary.blue,
                              width: `${fileItem.progress}%`
                            }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Analysis Results Preview */}
                    {fileItem.status === 'completed' && fileItem.analysis && (
                      <div className="mt-2 text-xs" style={{ color: colors.text.secondary }}>
                        {fileItem.analysis.analysis?.summary && (
                          <p className="truncate">{fileItem.analysis.analysis.summary.substring(0, 100)}...</p>
                        )}
                        {fileItem.analysis.tags && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {fileItem.analysis.tags.slice(0, 3).map((tag: string, idx: number) => (
                              <span 
                                key={idx}
                                className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Error Message */}
                    {fileItem.status === 'error' && fileItem.error && (
                      <p className="text-xs text-red-600 mt-1">{fileItem.error}</p>
                    )}
                  </div>
                  
                  {/* Status & Actions */}
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(fileItem.status)}
                    <button
                      onClick={() => removeFile(fileItem.id)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                      disabled={isUploading}
                    >
                      <X size={14} color={colors.text.secondary} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t flex items-center justify-between">
          <div className="text-sm" style={{ color: colors.text.secondary }}>
            {files.length > 0 && (
              <>
                {completedCount} of {files.length} files processed
                {hasErrors && <span className="text-red-600 ml-2">• Some files failed</span>}
              </>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-lg font-medium transition-colors"
              style={{ 
                borderColor: colors.primary.lightGray,
                color: colors.text.secondary 
              }}
            >
              Cancel
            </button>
            
            <button
              onClick={uploadFiles}
              disabled={files.length === 0 || isUploading}
              className="px-4 py-2 rounded-lg font-medium text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: colors.primary.blue }}
            >
              {isUploading ? 'Processing...' : `Upload ${files.length} Files`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
