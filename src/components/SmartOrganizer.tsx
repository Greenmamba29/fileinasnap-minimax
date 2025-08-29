import React, { useState } from 'react';
import { aiService } from '../lib/ai-service';
import { colors } from '../lib/design-system';

interface SmartOrganizerProps {
  files: Array<{
    fileName: string;
    filePath?: string;
    mimeType?: string;
    size?: number;
    content?: string;
    tags?: string[];
    category?: string;
  }>;
  onOrganizationComplete?: (suggestions: any) => void;
}

export const SmartOrganizer: React.FC<SmartOrganizerProps> = ({ files, onOrganizationComplete }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentStructure, setCurrentStructure] = useState('');
  const [organizationGoals, setOrganizationGoals] = useState('');

  const handleAnalyze = async () => {
    if (!files || files.length === 0) {
      setError('No files provided for analysis');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await aiService.suggestOrganization(
        files,
        currentStructure || undefined,
        organizationGoals || undefined
      );

      setSuggestions(result);
      if (onOrganizationComplete) {
        onOrganizationComplete(result);
      }
    } catch (error: any) {
      console.error('Organization analysis failed:', error);
      setError(error.message || 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderQuickWins = (quickWins: any[]) => {
    if (!quickWins || quickWins.length === 0) return null;

    return (
      <div className="mb-6">
        <h4 className="font-semibold mb-3 flex items-center" style={{ color: colors.text.primary }}>
          ⚡ Quick Wins
        </h4>
        <div className="space-y-3">
          {quickWins.map((win, index) => (
            <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-green-800">{win.action}</h5>
                <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded">
                  {win.files_affected} files
                </span>
              </div>
              <p className="text-green-700 text-sm">{win.benefit}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderFolderStructure = (structure: any) => {
    if (!structure) return null;

    return (
      <div className="mb-6">
        <h4 className="font-semibold mb-3 flex items-center" style={{ color: colors.text.primary }}>
          📁 Recommended Folder Structure
        </h4>
        <div className="space-y-3">
          {Object.entries(structure).map(([folderName, details]: [string, any]) => (
            <div key={folderName} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-blue-800">📁 {folderName}</h5>
                {details.estimated_files && (
                  <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    ~{details.estimated_files} files
                  </span>
                )}
              </div>
              
              <p className="text-blue-700 text-sm mb-3">{details.description}</p>
              
              {details.file_types && details.file_types.length > 0 && (
                <div className="mb-2">
                  <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">File Types:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {details.file_types.map((type: string, index: number) => (
                      <span key={index} className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {details.subfolders && details.subfolders.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">Subfolders:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {details.subfolders.map((subfolder: string, index: number) => (
                      <span key={index} className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">
                        📂 {subfolder}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderOrganizationPrinciples = (principles: string[]) => {
    if (!principles || principles.length === 0) return null;

    return (
      <div className="mb-6">
        <h4 className="font-semibold mb-3 flex items-center" style={{ color: colors.text.primary }}>
          💡 Organization Principles
        </h4>
        <ul className="space-y-2">
          {principles.map((principle, index) => (
            <li key={index} className="flex items-start space-x-2">
              <span className="text-yellow-500 mt-1">•</span>
              <span className="text-sm" style={{ color: colors.text.secondary }}>{principle}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderMaintenanceTips = (tips: string[]) => {
    if (!tips || tips.length === 0) return null;

    return (
      <div className="mb-6">
        <h4 className="font-semibold mb-3 flex items-center" style={{ color: colors.text.primary }}>
          🔧 Maintenance Tips
        </h4>
        <ul className="space-y-2">
          {tips.map((tip, index) => (
            <li key={index} className="flex items-start space-x-2">
              <span className="text-green-500 mt-1">✓</span>
              <span className="text-sm" style={{ color: colors.text.secondary }}>{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center" style={{ color: colors.text.primary }}>
          🗂️ Smart Organization
        </h2>
        <span className="text-sm px-3 py-1 bg-gray-100 rounded" style={{ color: colors.text.secondary }}>
          {files.length} files to analyze
        </span>
      </div>

      {/* Input Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
            Current Structure (optional)
          </label>
          <textarea
            value={currentStructure}
            onChange={(e) => setCurrentStructure(e.target.value)}
            placeholder="Describe your current folder structure..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
            Organization Goals (optional)
          </label>
          <textarea
            value={organizationGoals}
            onChange={(e) => setOrganizationGoals(e.target.value)}
            placeholder="What do you want to achieve? (e.g., easier finding, better workflow...)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>
      </div>

      {/* Analyze Button */}
      <button
        onClick={handleAnalyze}
        disabled={isAnalyzing}
        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mb-6"
      >
        {isAnalyzing ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Analyzing Organization...</span>
          </>
        ) : (
          <>
            <span>🗂️</span>
            <span>Generate Smart Organization</span>
          </>
        )}
      </button>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Results */}
      {suggestions && (
        <div>
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm" style={{ color: colors.text.secondary }}>Provider: {suggestions.provider}</span>
                <span className="text-sm" style={{ color: colors.text.secondary }}>•</span>
                <span className="text-sm" style={{ color: colors.text.secondary }}>
                  {new Date(suggestions.timestamp).toLocaleTimeString()}
                </span>
              </div>
              {suggestions.organization_suggestions?.confidence && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm" style={{ color: colors.text.secondary }}>Confidence:</span>
                  <span className="text-sm font-medium">
                    {Math.round(suggestions.organization_suggestions.confidence * 100)}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Wins */}
          {renderQuickWins(suggestions.organization_suggestions?.quick_wins)}

          {/* Folder Structure */}
          {renderFolderStructure(suggestions.organization_suggestions?.recommended_structure)}

          {/* Organization Principles */}
          {renderOrganizationPrinciples(suggestions.organization_suggestions?.organization_principles)}

          {/* Maintenance Tips */}
          {renderMaintenanceTips(suggestions.organization_suggestions?.maintenance_tips)}

          {/* Estimated Time */}
          {suggestions.organization_suggestions?.estimated_time_to_organize && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <span>⏱️</span>
                <span className="font-medium" style={{ color: colors.text.primary }}>Estimated Organization Time:</span>
                <span style={{ color: colors.text.secondary }}>
                  {suggestions.organization_suggestions.estimated_time_to_organize}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};