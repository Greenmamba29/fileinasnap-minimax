import React, { useState } from 'react';
import { aiService } from '../lib/ai-service';
import { colors } from '../lib/design-system';

interface DuplicateDetectorProps {
  files: Array<{
    fileName: string;
    filePath?: string;
    content?: string;
    size?: number;
    mimeType?: string;
    hash?: string;
  }>;
  onDetectionComplete?: (result: any) => void;
}

export const DuplicateDetector: React.FC<DuplicateDetectorProps> = ({ files, onDetectionComplete }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.9);
  const [includeSimilar, setIncludeSimilar] = useState(true);

  const handleScan = async () => {
    if (!files || files.length === 0) {
      setError('No files provided for scanning');
      return;
    }

    setIsScanning(true);
    setError(null);

    try {
      const result = await aiService.detectDuplicates(files, similarityThreshold, includeSimilar);
      setResults(result);
      if (onDetectionComplete) {
        onDetectionComplete(result);
      }
    } catch (error: any) {
      console.error('Duplicate detection failed:', error);
      setError(error.message || 'Scan failed');
    } finally {
      setIsScanning(false);
    }
  };

  const renderDuplicateGroups = () => {
    if (!results || !results.duplicate_groups || results.duplicate_groups.length === 0) {
      return (
        <div className="text-center py-8">
          <div className="text-green-600 mb-2">✓</div>
          <p className="text-lg font-medium" style={{ color: colors.text.primary }}>No duplicates found!</p>
          <p className="text-sm" style={{ color: colors.text.secondary }}>Your files appear to be unique.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {results.duplicate_groups.map((group: any, groupIndex: number) => (
          <div key={groupIndex} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-yellow-800">
                Duplicate Group #{groupIndex + 1}
              </h4>
              <div className="flex items-center space-x-4 text-sm">
                <span className="text-yellow-700">
                  {group.files.length} files
                </span>
                <span className="text-yellow-700">
                  {group.total_size_mb.toFixed(2)} MB total
                </span>
                <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded">
                  Save {group.potential_savings_mb.toFixed(2)} MB
                </span>
              </div>
            </div>

            {/* Similarity Info */}
            {group.similarity_score && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-yellow-700">Similarity Score</span>
                  <span className="font-medium">{Math.round(group.similarity_score * 100)}%</span>
                </div>
                <div className="w-full bg-yellow-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-yellow-600 h-2 rounded-full" 
                    style={{ width: `${group.similarity_score * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Files List */}
            <div className="space-y-2">
              {group.files.map((file: any, fileIndex: number) => (
                <div key={fileIndex} className="bg-white rounded-lg p-3 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{file.name}</div>
                    <div className="text-xs text-gray-500">
                      {file.path} • {file.size_mb.toFixed(2)} MB • {file.mime_type}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {fileIndex === 0 ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        Keep (Largest)
                      </span>
                    ) : (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                        Duplicate
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Detection Method */}
            {group.detection_method && (
              <div className="mt-3 text-xs text-yellow-600">
                Detection method: {group.detection_method.replace('_', ' ')}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center" style={{ color: colors.text.primary }}>
          🔍 Duplicate Detection
        </h2>
        <span className="text-sm px-3 py-1 bg-gray-100 rounded" style={{ color: colors.text.secondary }}>
          {files.length} files to scan
        </span>
      </div>

      {/* Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
            Similarity Threshold: {Math.round(similarityThreshold * 100)}%
          </label>
          <input
            type="range"
            min="0.5"
            max="1"
            step="0.05"
            value={similarityThreshold}
            onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs mt-1" style={{ color: colors.text.secondary }}>
            <span>More results</span>
            <span>Exact matches</span>
          </div>
        </div>
        
        <div className="flex items-center justify-center">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={includeSimilar}
              onChange={(e) => setIncludeSimilar(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm" style={{ color: colors.text.primary }}>
              Include similar (not identical) files
            </span>
          </label>
        </div>
      </div>

      {/* Scan Button */}
      <button
        onClick={handleScan}
        disabled={isScanning}
        className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mb-6"
      >
        {isScanning ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Scanning for Duplicates...</span>
          </>
        ) : (
          <>
            <span>🔍</span>
            <span>Scan for Duplicates</span>
          </>
        )}
      </button>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Results Summary */}
      {results && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold" style={{ color: colors.primary.blue }}>
                {results.scan_summary.total_files_scanned}
              </div>
              <div className="text-sm" style={{ color: colors.text.secondary }}>Files Scanned</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {results.scan_summary.duplicate_groups_found}
              </div>
              <div className="text-sm" style={{ color: colors.text.secondary }}>Duplicate Groups</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {results.scan_summary.total_duplicate_files}
              </div>
              <div className="text-sm" style={{ color: colors.text.secondary }}>Duplicate Files</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {results.scan_summary.total_potential_savings_mb.toFixed(1)}MB
              </div>
              <div className="text-sm" style={{ color: colors.text.secondary }}>Potential Savings</div>
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-between text-sm" style={{ color: colors.text.secondary }}>
            <span>Scan method: {results.scan_summary.scan_method}</span>
            <span>{new Date(results.scan_summary.timestamp).toLocaleTimeString()}</span>
          </div>
        </div>
      )}

      {/* Duplicate Groups */}
      {results && renderDuplicateGroups()}
    </div>
  );
};