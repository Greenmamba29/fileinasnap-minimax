import React, { useState } from 'react';
import { aiService } from '../lib/ai-service';
import { colors } from '../lib/design-system';

interface SmartTaggerProps {
  fileName: string;
  filePath?: string;
  mimeType?: string;
  content?: string;
  metadata?: any;
  onTagsGenerated?: (tags: any) => void;
}

export const SmartTagger: React.FC<SmartTaggerProps> = ({
  fileName,
  filePath,
  mimeType,
  content,
  metadata,
  onTagsGenerated
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [tags, setTags] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [maxTags, setMaxTags] = useState(10);
  const [tagCategories, setTagCategories] = useState<string[]>([]);
  const [customCategory, setCustomCategory] = useState('');

  const predefinedCategories = [
    'content', 'technical', 'organizational', 'contextual',
    'project', 'priority', 'status', 'department', 'client'
  ];

  const handleGenerateTags = async () => {
    if (!fileName) {
      setError('File name is required');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const result = await aiService.generateTags(
        fileName,
        filePath,
        mimeType,
        content,
        metadata,
        maxTags,
        tagCategories.length > 0 ? tagCategories : undefined
      );

      setTags(result);
      if (onTagsGenerated) {
        onTagsGenerated(result);
      }
    } catch (error: any) {
      console.error('Tag generation failed:', error);
      setError(error.message || 'Tag generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const addTagCategory = () => {
    if (customCategory && !tagCategories.includes(customCategory)) {
      setTagCategories([...tagCategories, customCategory]);
      setCustomCategory('');
    }
  };

  const removeTagCategory = (category: string) => {
    setTagCategories(tagCategories.filter(c => c !== category));
  };

  const togglePredefinedCategory = (category: string) => {
    if (tagCategories.includes(category)) {
      removeTagCategory(category);
    } else {
      setTagCategories([...tagCategories, category]);
    }
  };

  const renderTagCategories = () => {
    if (!tags || !tags.tags) return null;

    const tagData = tags.tags;

    return (
      <div className="space-y-4">
        {/* All Tags */}
        {tagData.tags && tagData.tags.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center" style={{ color: colors.text.primary }}>
              🏷️ All Generated Tags
            </h4>
            <div className="flex flex-wrap gap-2">
              {tagData.tags.map((tag: string, index: number) => (
                <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Primary Tags */}
        {tagData.primary_tags && tagData.primary_tags.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center" style={{ color: colors.text.primary }}>
              ⭐ Primary Tags
            </h4>
            <div className="flex flex-wrap gap-2">
              {tagData.primary_tags.map((tag: string, index: number) => (
                <span key={index} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Categorized Tags */}
        {tagData.tag_categories && (
          <div>
            <h4 className="font-semibold mb-3" style={{ color: colors.text.primary }}>
              📁 Categorized Tags
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(tagData.tag_categories).map(([category, categoryTags]: [string, any]) => (
                categoryTags && categoryTags.length > 0 && (
                  <div key={category} className="bg-gray-50 rounded-lg p-3">
                    <h5 className="font-medium text-sm capitalize mb-2" style={{ color: colors.text.primary }}>
                      {category.replace('_', ' ')}
                    </h5>
                    <div className="flex flex-wrap gap-1">
                      {categoryTags.map((tag: string, index: number) => (
                        <span key={index} className="px-2 py-1 bg-white text-gray-700 rounded text-xs">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        {/* Tag Rationale */}
        {tagData.tag_rationale && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center" style={{ color: colors.text.primary }}>
              🧠 Tag Rationale
            </h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-2">
                {Object.entries(tagData.tag_rationale).map(([tag, reason]: [string, any]) => (
                  <div key={tag} className="flex items-start space-x-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">#{tag}</span>
                    <span className="text-sm flex-1" style={{ color: colors.text.secondary }}>{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Confidence Score */}
        {tagData.confidence && (
          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium" style={{ color: colors.text.primary }}>Confidence Score</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${tagData.confidence * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{Math.round(tagData.confidence * 100)}%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center" style={{ color: colors.text.primary }}>
          🏷️ Smart Tagger
        </h2>
      </div>

      {/* File Info */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-sm" style={{ color: colors.text.secondary }}>
          <div><strong>File:</strong> {fileName}</div>
          {mimeType && <div><strong>Type:</strong> {mimeType}</div>}
          {filePath && <div><strong>Path:</strong> {filePath}</div>}
          {content && <div><strong>Content:</strong> {content.length} characters</div>}
        </div>
      </div>

      {/* Configuration */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
            Maximum Tags: {maxTags}
          </label>
          <input
            type="range"
            min="5"
            max="20"
            step="1"
            value={maxTags}
            onChange={(e) => setMaxTags(parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Tag Categories */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
            Focus Categories (optional)
          </label>
          
          {/* Predefined Categories */}
          <div className="flex flex-wrap gap-2 mb-2">
            {predefinedCategories.map((category) => (
              <button
                key={category}
                onClick={() => togglePredefinedCategory(category)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  tagCategories.includes(category)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Custom Category Input */}
          <div className="flex space-x-2">
            <input
              type="text"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              placeholder="Add custom category..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              onKeyPress={(e) => e.key === 'Enter' && addTagCategory()}
            />
            <button
              onClick={addTagCategory}
              disabled={!customCategory}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Add
            </button>
          </div>

          {/* Selected Categories */}
          {tagCategories.length > 0 && (
            <div className="mt-2">
              <span className="text-sm font-medium" style={{ color: colors.text.primary }}>Selected:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {tagCategories.map((category) => (
                  <span key={category} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                    {category}
                    <button
                      onClick={() => removeTagCategory(category)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerateTags}
        disabled={isGenerating}
        className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mb-6"
      >
        {isGenerating ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Generating Tags...</span>
          </>
        ) : (
          <>
            <span>🏷️</span>
            <span>Generate Smart Tags</span>
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
      {tags && (
        <div>
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between text-sm" style={{ color: colors.text.secondary }}>
              <span>Provider: {tags.provider}</span>
              <span>Model: {tags.modelUsed}</span>
              <span>{new Date(tags.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>

          {renderTagCategories()}
        </div>
      )}
    </div>
  );
};