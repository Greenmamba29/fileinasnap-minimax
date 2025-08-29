import React, { useState } from 'react';
import { aiService } from '../lib/ai-service';
import { colors } from '../lib/design-system';

interface AIAnalysisProps {
  file?: File;
  fileName?: string;
  fileContent?: string;
  filePath?: string;
  mimeType?: string;
  onAnalysisComplete?: (result: any) => void;
}

export const AIAnalysis: React.FC<AIAnalysisProps> = ({
  file,
  fileName,
  fileContent,
  filePath,
  mimeType,
  onAnalysisComplete
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisType, setAnalysisType] = useState('comprehensive');

  const handleAnalyze = async () => {
    if (!fileName && !file) {
      setError('File name or file is required');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      let content = fileContent;
      const name = fileName || file?.name || 'unknown';
      const type = mimeType || file?.type;

      // Extract content from file if needed
      if (file && !content && type?.startsWith('text/')) {
        content = await aiService.extractTextFromFile(file);
      }

      let result;
      
      // Choose analysis type based on file type
      if (type?.startsWith('image/')) {
        if (file) {
          const base64 = await aiService.fileToBase64(file);
          result = await aiService.analyzeImage(base64, name, filePath, analysisType);
        } else {
          throw new Error('Image file required for image analysis');
        }
      } else {
        // Document analysis
        result = await aiService.analyzeDocument(
          content || 'No content available',
          name,
          filePath,
          analysisType
        );
      }

      setAnalysisResult(result);
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }
    } catch (error: any) {
      console.error('Analysis failed:', error);
      setError(error.message || 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderAnalysisResult = () => {
    if (!analysisResult) return null;

    const { analysis, provider, timestamp } = analysisResult;

    return (
      <div className="mt-6 space-y-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold" style={{ color: colors.text.primary }}>
              ✨ AI Analysis Results
            </h3>
            <div className="flex items-center space-x-2 text-sm" style={{ color: colors.text.secondary }}>
              <span>Provider: {provider}</span>
              <span>•</span>
              <span>{new Date(timestamp).toLocaleTimeString()}</span>
            </div>
          </div>

          {/* Summary */}
          {analysis.summary && (
            <div className="mb-4">
              <h4 className="font-medium mb-2" style={{ color: colors.text.primary }}>Summary</h4>
              <p style={{ color: colors.text.secondary }}>{analysis.summary}</p>
            </div>
          )}

          {/* Document Type */}
          {analysis.document_type && (
            <div className="mb-4">
              <h4 className="font-medium mb-2" style={{ color: colors.text.primary }}>Document Type</h4>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                {analysis.document_type}
              </span>
            </div>
          )}

          {/* Topics */}
          {analysis.main_topics && analysis.main_topics.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium mb-2" style={{ color: colors.text.primary }}>Main Topics</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.main_topics.map((topic: string, index: number) => (
                  <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Entities */}
          {analysis.key_entities && (
            <div className="mb-4">
              <h4 className="font-medium mb-2" style={{ color: colors.text.primary }}>Key Entities</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(analysis.key_entities).map(([category, entities]: [string, any]) => (
                  entities && entities.length > 0 && (
                    <div key={category}>
                      <h5 className="font-medium text-sm capitalize mb-1" style={{ color: colors.text.secondary }}>
                        {category}
                      </h5>
                      <div className="space-y-1">
                        {entities.slice(0, 3).map((entity: string, index: number) => (
                          <div key={index} className="text-sm px-2 py-1 bg-gray-100 rounded">
                            {entity}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {analysis.suggested_tags && analysis.suggested_tags.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium mb-2" style={{ color: colors.text.primary }}>Suggested Tags</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.suggested_tags.map((tag: string, index: number) => (
                  <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Image-specific analysis */}
          {analysis.description && analysisType === 'comprehensive' && (
            <div className="mb-4">
              <h4 className="font-medium mb-2" style={{ color: colors.text.primary }}>Description</h4>
              <p style={{ color: colors.text.secondary }}>{analysis.description}</p>
            </div>
          )}

          {analysis.objects_detected && analysis.objects_detected.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium mb-2" style={{ color: colors.text.primary }}>Objects Detected</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.objects_detected.map((object: string, index: number) => (
                  <span key={index} className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
                    {object}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Confidence Score */}
          {analysis.confidence && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: colors.text.secondary }}>Confidence Score</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(analysis.confidence * 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{Math.round(analysis.confidence * 100)}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold" style={{ color: colors.text.primary }}>
          ✨ AI Analysis
        </h2>
      </div>

      {/* Analysis Type Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
          Analysis Type
        </label>
        <select
          value={analysisType}
          onChange={(e) => setAnalysisType(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="comprehensive">Comprehensive Analysis</option>
          <option value="quick">Quick Analysis</option>
          <option value="classification">Classification Only</option>
          <option value="summary">Summary Only</option>
        </select>
      </div>

      {/* File Info */}
      {(fileName || file) && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm" style={{ color: colors.text.secondary }}>
            <div><strong>File:</strong> {fileName || file?.name}</div>
            {(mimeType || file?.type) && <div><strong>Type:</strong> {mimeType || file?.type}</div>}
            {file?.size && <div><strong>Size:</strong> {(file.size / 1024).toFixed(1)} KB</div>}
          </div>
        </div>
      )}

      {/* Analyze Button */}
      <button
        onClick={handleAnalyze}
        disabled={isAnalyzing}
        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {isAnalyzing ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Analyzing...</span>
          </>
        ) : (
          <>
            <span>✨</span>
            <span>Analyze with AI</span>
          </>
        )}
      </button>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Results */}
      {renderAnalysisResult()}
    </div>
  );
};