import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase, FileActivity } from '../lib/supabase';
import { colors } from '../lib/design-system';
import { format } from 'date-fns';
import { 
  Upload, 
  Edit3, 
  Lightbulb, 
  Move, 
  Share2, 
  Download, 
  Tag,
  Clock,
  User
} from 'lucide-react';

interface ActivityItemProps {
  activity: FileActivity;
}

function ActivityItem({ activity }: ActivityItemProps) {
  const { t } = useTranslation('activity');
  const getActivityIcon = (type: string) => {
    const iconProps = { size: 16 };
    
    switch (type) {
      case 'file_created':
        return <Upload {...iconProps} color={colors.status.success} />;
      case 'file_updated':
        return <Edit3 {...iconProps} color={colors.primary.blue} />;
      case 'metadata_updated':
        return <Edit3 {...iconProps} color={colors.primary.darkBlue} />;
      case 'ai_insights_updated':
        return <Lightbulb {...iconProps} color={colors.status.warning} />;
      case 'file_moved':
        return <Move {...iconProps} color={colors.primary.teal} />;
      case 'file_shared':
        return <Share2 {...iconProps} color={colors.status.info} />;
      case 'file_downloaded':
        return <Download {...iconProps} color={colors.primary.gray} />;
      case 'tags_updated':
        return <Tag {...iconProps} color={colors.primary.blue} />;
      default:
        return <Edit3 {...iconProps} color={colors.text.secondary} />;
    }
  };

  const getActivityDescription = (activity: FileActivity): string => {
    switch (activity.activity_type) {
      case 'file_created':
        return t('activities.fileCreated', { fileName: activity.file_name || t('activities.defaultAction', { fileName: 'a file' }) });
      case 'file_updated':
        return t('activities.fileUpdated', { fileName: activity.file_name || t('activities.defaultAction', { fileName: 'a file' }) });
      case 'metadata_updated':
        return t('activities.metadataUpdated', { fileName: activity.file_name || t('activities.defaultAction', { fileName: 'a file' }) });
      case 'ai_insights_updated':
        return t('activities.aiInsightsUpdated', { fileName: activity.file_name || t('activities.defaultAction', { fileName: 'a file' }) });
      case 'file_moved':
        return t('activities.fileMoved', { fileName: activity.file_name || t('activities.defaultAction', { fileName: 'a file' }) });
      case 'file_shared':
        return t('activities.fileShared', { fileName: activity.file_name || t('activities.defaultAction', { fileName: 'a file' }) });
      case 'file_downloaded':
        return t('activities.fileDownloaded', { fileName: activity.file_name || t('activities.defaultAction', { fileName: 'a file' }) });
      case 'tags_updated':
        return t('activities.tagsUpdated', { fileName: activity.file_name || t('activities.defaultAction', { fileName: 'a file' }) });
      default:
        return t('activities.defaultAction', { fileName: activity.file_name || 'a file' });
    }
  };

  return (
    <div className="flex items-start space-x-3 p-4 hover:bg-gray-50 rounded-lg transition-colors">
      <div 
        className="p-2 rounded-full mt-1"
        style={{ backgroundColor: `${colors.primary.blue}15` }}
      >
        {getActivityIcon(activity.activity_type)}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <User size={14} color={colors.text.secondary} />
          <span className="text-sm font-medium" style={{ color: colors.text.primary }}>
            {activity.user_name}
          </span>
          <span className="text-sm" style={{ color: colors.text.secondary }}>
            {getActivityDescription(activity)}
          </span>
        </div>
        
        <div className="flex items-center space-x-2 text-xs" style={{ color: colors.text.muted }}>
          <Clock size={12} />
          <span>{format(new Date(activity.created_at), 'MMM d, yyyy HH:mm')}</span>
        </div>
        
        {activity.details && Object.keys(activity.details).length > 0 && (
          <div className="mt-2 text-xs p-2 rounded" style={{ backgroundColor: colors.background.accent }}>
            <details>
              <summary className="cursor-pointer" style={{ color: colors.text.secondary }}>
                {t('details.viewDetails')}
              </summary>
              <pre className="mt-1 text-xs overflow-x-auto">
                {JSON.stringify(activity.details, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}

export function ActivityFeed() {
  const { t } = useTranslation('activity');
  const [activities, setActivities] = useState<FileActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchActivities();
  }, []);

  async function fetchActivities() {
    try {
      const { data, error } = await supabase.rpc('get_dashboard_activity', {
        p_limit: 50
      });
      
      if (error) {
        console.error('Error fetching activities:', error);
        setActivities([]);
      } else {
        setActivities(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      setActivities([]);
    }
    
    setLoading(false);
  }

  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true;
    return activity.activity_type === filter;
  });

  const activityTypes = [
    { value: 'all', label: t('filters.all') },
    { value: 'file_created', label: t('filters.uploads') },
    { value: 'ai_insights_updated', label: t('filters.insights') },
    { value: 'metadata_updated', label: t('filters.metadata') },
    { value: 'file_shared', label: t('filters.shares') }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
        
        <div className="flex items-center space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
            style={{ 
              borderColor: colors.primary.lightGray,
              '--tw-ring-color': colors.primary.blue 
            } as React.CSSProperties}
          >
            {activityTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Activity List */}
      <div className="bg-white rounded-lg border" style={{ borderColor: colors.primary.lightGray }}>
        {loading ? (
          <div className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-start space-x-3 animate-pulse">
                  <div className="w-8 h-8 bg-gray-200 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : filteredActivities.length > 0 ? (
          <div className="divide-y" style={{ borderColor: colors.primary.lightGray }}>
            {filteredActivities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full" style={{ backgroundColor: colors.primary.lightGray }}>
              <Clock size={32} color={colors.text.muted} />
            </div>
            <h3 className="text-lg font-medium mb-2" style={{ color: colors.text.primary }}>
              {t('noActivities')}
            </h3>
            <p style={{ color: colors.text.secondary }}>
              {filter === 'all' 
                ? t('noActivitiesDescription')
                : t('noFilteredActivities', { filter: activityTypes.find(type => type.value === filter)?.label.toLowerCase() })
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}