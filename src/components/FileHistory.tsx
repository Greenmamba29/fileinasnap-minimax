import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase, FileRecord } from '../lib/supabase';
import { colors } from '../lib/design-system';
import { format } from 'date-fns';
import { 
  History, 
  FileText,
  Edit3,
  Move,
  Tag,
  Clock,
  User,
  ChevronRight,
  GitBranch
} from 'lucide-react';

interface FileHistoryEntry {
  id: string;
  file_id: string;
  user_id: string;
  version_number: number;
  change_type: 'created' | 'modified' | 'renamed' | 'moved' | 'metadata_changed' | 'tags_changed';
  previous_values: Record<string, any>;
  new_values: Record<string, any>;
  change_summary?: string;
  created_at: string;
  file_name?: string;
  user_name?: string;
}

interface HistoryItemProps {
  entry: FileHistoryEntry;
  isLatest?: boolean;
}

function HistoryItem({ entry, isLatest }: HistoryItemProps) {
  const { t } = useTranslation('history');
  const [expanded, setExpanded] = useState(false);

  const getChangeIcon = (changeType: string) => {
    const iconProps = { size: 16 };
    
    switch (changeType) {
      case 'created':
        return <FileText {...iconProps} color={colors.status.success} />;
      case 'modified':
        return <Edit3 {...iconProps} color={colors.primary.blue} />;
      case 'renamed':
        return <Edit3 {...iconProps} color={colors.primary.darkBlue} />;
      case 'moved':
        return <Move {...iconProps} color={colors.primary.teal} />;
      case 'metadata_changed':
        return <Edit3 {...iconProps} color={colors.status.warning} />;
      case 'tags_changed':
        return <Tag {...iconProps} color={colors.primary.blue} />;
      default:
        return <Edit3 {...iconProps} color={colors.text.secondary} />;
    }
  };

  const getChangeDescription = (entry: FileHistoryEntry): string => {
    const base = entry.file_name || 'file';
    
    switch (entry.change_type) {
      case 'created':
        return t('changeTypes.created', { name: base });
      case 'modified':
        return t('changeTypes.modified', { name: base });
      case 'renamed': {
        const oldName = entry.previous_values?.name;
        const newName = entry.new_values?.name;
        return oldName && newName ? 
          t('changeTypes.renamed', { oldName, newName }) : 
          t('changeTypes.renamedSimple', { name: base });
      }
      case 'moved': {
        const oldPath = entry.previous_values?.path;
        const newPath = entry.new_values?.path;
        return oldPath && newPath ? 
          t('changeTypes.moved', { oldPath, newPath }) : 
          t('changeTypes.movedSimple', { name: base });
      }
      case 'metadata_changed':
        return t('changeTypes.metadataChanged', { name: base });
      case 'tags_changed':
        return t('changeTypes.tagsChanged', { name: base });
      default:
        return t('changeTypes.updated', { name: base });
    }
  };

  const hasDetails = entry.change_summary || 
    (entry.previous_values && Object.keys(entry.previous_values).length > 0) ||
    (entry.new_values && Object.keys(entry.new_values).length > 0);

  return (
    <div className="relative">
      {/* Timeline line */}
      {!isLatest && (
        <div 
          className="absolute left-6 top-12 bottom-0 w-0.5"
          style={{ backgroundColor: colors.primary.lightGray }}
        />
      )}
      
      <div className="flex items-start space-x-4 pb-6">
        {/* Icon */}
        <div 
          className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center relative z-10"
          style={{ 
            backgroundColor: isLatest ? colors.primary.blue : colors.background.accent,
            border: isLatest ? `2px solid ${colors.primary.blue}` : `2px solid ${colors.primary.lightGray}`
          }}
        >
          {getChangeIcon(entry.change_type)}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="font-medium" style={{ color: colors.text.primary }}>
                {t('version', { number: entry.version_number })}
              </span>
              {isLatest && (
                <span 
                  className="px-2 py-1 text-xs rounded-full"
                  style={{ 
                    backgroundColor: `${colors.status.success}15`,
                    color: colors.status.success
                  }}
                >
                  {t('latest')}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 text-sm" style={{ color: colors.text.muted }}>
              <Clock size={14} />
              <span>{format(new Date(entry.created_at), 'MMM d, HH:mm')}</span>
            </div>
          </div>
          
          <p className="text-sm mb-2" style={{ color: colors.text.primary }}>
            {getChangeDescription(entry)}
          </p>
          
          <div className="flex items-center space-x-2 text-xs mb-3" style={{ color: colors.text.secondary }}>
            <User size={12} />
            <span>{entry.user_name || 'Unknown User'}</span>
          </div>
          
          {entry.change_summary && (
            <p className="text-sm mb-2" style={{ color: colors.text.secondary }}>
              {entry.change_summary}
            </p>
          )}
          
          {hasDetails && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ChevronRight 
                size={14} 
                className={`transform transition-transform ${expanded ? 'rotate-90' : ''}`}
              />
              <span>{expanded ? t('details.hide') : t('details.show')}</span>
            </button>
          )}
          
          {expanded && hasDetails && (
            <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: colors.background.accent }}>
              {entry.previous_values && Object.keys(entry.previous_values).length > 0 && (
                <div className="mb-2">
                  <h4 className="text-xs font-medium mb-1" style={{ color: colors.text.primary }}>
                    Previous Values:
                  </h4>
                  <pre className="text-xs overflow-x-auto" style={{ color: colors.text.secondary }}>
                    {JSON.stringify(entry.previous_values, null, 2)}
                  </pre>
                </div>
              )}
              
              {entry.new_values && Object.keys(entry.new_values).length > 0 && (
                <div>
                  <h4 className="text-xs font-medium mb-1" style={{ color: colors.text.primary }}>
                    New Values:
                  </h4>
                  <pre className="text-xs overflow-x-auto" style={{ color: colors.text.secondary }}>
                    {JSON.stringify(entry.new_values, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function FileHistory() {
  const { t } = useTranslation('history');
  const [historyEntries, setHistoryEntries] = useState<FileHistoryEntry[]>([]);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFileHistory = useCallback(async (fileId: string) => {
    try {
      const { data, error } = await supabase
        .from('file_versions')
        .select(`
          id,
          file_id,
          user_id,
          version_number,
          change_type,
          previous_values,
          new_values,
          change_summary,
          created_at,
          profiles(full_name)
        `)
        .eq('file_id', fileId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching file history:', error);
        setHistoryEntries([]);
      } else {
        // Transform the data to match our interface
        const transformedData: FileHistoryEntry[] = (data || []).map(entry => ({
          id: entry.id,
          file_id: entry.file_id,
          user_id: entry.user_id,
          version_number: entry.version_number,
          change_type: entry.change_type,
          previous_values: entry.previous_values || {},
          new_values: entry.new_values || {},
          change_summary: entry.change_summary,
          created_at: entry.created_at,
          file_name: files.find(f => f.id === fileId)?.name,
          user_name: (entry.profiles as any)?.full_name || 'Unknown User'
        }));
        
        setHistoryEntries(transformedData);
      }
    } catch (error) {
      console.error('Error fetching file history:', error);
      setHistoryEntries([]);
    }
  }, [files]);

  useEffect(() => {
    if (selectedFile) {
      fetchFileHistory(selectedFile);
    }
  }, [selectedFile, fetchFileHistory]);

  async function fetchFiles() {
    try {
      const { data, error } = await supabase
        .from('files')
        .select('id, name, path, size_bytes, mime_type, metadata, tags, category, quarantined, risk_score, user_id, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching files:', error);
        setFiles([]);
      } else {
        setFiles(data || []);
        if (data && data.length > 0) {
          setSelectedFile(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setFiles([]);
    }
    
    setLoading(false);
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 
          className="text-3xl font-bold mb-2"
          style={{ color: colors.text.primary }}
        >
          {t('title')}
        </h1>
        <p style={{ color: colors.text.secondary }}>
          {t('description')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* File List */}
        <div className="bg-white rounded-lg border" style={{ borderColor: colors.primary.lightGray }}>
          <div className="p-4 border-b" style={{ borderColor: colors.primary.lightGray }}>
            <h2 className="font-semibold" style={{ color: colors.text.primary }}>
              {t('recentFiles')}
            </h2>
          </div>
          
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: colors.primary.lightGray }}>
              {files.map((file) => (
                <button
                  key={file.id}
                  onClick={() => setSelectedFile(file.id)}
                  className={`w-full text-left p-4 transition-colors ${
                    selectedFile === file.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <FileText size={16} color={selectedFile === file.id ? colors.primary.blue : colors.text.secondary} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {file.name}
                      </p>
                      <p className="text-sm" style={{ color: colors.text.muted }}>
                        {format(new Date(file.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <ChevronRight size={16} color={colors.text.muted} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="lg:col-span-2 bg-white rounded-lg border" style={{ borderColor: colors.primary.lightGray }}>
          <div className="p-4 border-b" style={{ borderColor: colors.primary.lightGray }}>
            <div className="flex items-center space-x-2">
              <GitBranch size={18} color={colors.text.primary} />
              <h2 className="font-semibold" style={{ color: colors.text.primary }}>
                {t('versionHistory')}
              </h2>
            </div>
          </div>
          
          <div className="p-6">
            {selectedFile ? (
              historyEntries.length > 0 ? (
                <div className="space-y-0">
                  {historyEntries.map((entry, index) => (
                    <HistoryItem 
                      key={entry.id} 
                      entry={entry} 
                      isLatest={index === 0}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full" style={{ backgroundColor: colors.primary.lightGray }}>
                    <History size={32} color={colors.text.muted} />
                  </div>
                  <h3 className="text-lg font-medium mb-2" style={{ color: colors.text.primary }}>
                    {t('noHistory')}
                  </h3>
                  <p style={{ color: colors.text.secondary }}>
                    {t('noHistoryDescription')}
                  </p>
                </div>
              )
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full" style={{ backgroundColor: colors.primary.lightGray }}>
                  <FileText size={32} color={colors.text.muted} />
                </div>
                <h3 className="text-lg font-medium mb-2" style={{ color: colors.text.primary }}>
                  {t('selectFile')}
                </h3>
                <p style={{ color: colors.text.secondary }}>
                  {t('selectFileDescription')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}