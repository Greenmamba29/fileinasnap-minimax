import React, { useState, useEffect } from 'react';
import { aiService } from '../lib/ai-service';
import { colors } from '../lib/design-system';

export const AIDashboard: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const checkStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await aiService.checkProviderStatus();
      setStatus(result);
      setLastUpdated(new Date());
    } catch (error: any) {
      console.error('Status check failed:', error);
      setError(error.message || 'Status check failed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
    // Auto-refresh every 5 minutes
    const interval = setInterval(checkStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (serviceStatus: string) => {
    switch (serviceStatus) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      case 'not_configured': return 'text-gray-500';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (serviceStatus: string) => {
    switch (serviceStatus) {
      case 'healthy': return '✓';
      case 'degraded': return '⚠️';
      case 'error': return '❌';
      case 'not_configured': return '⚙️';
      default: return '❔';
    }
  };

  const getOverallStatusDisplay = () => {
    if (!status) return { text: 'Unknown', color: 'text-gray-400', bg: 'bg-gray-100' };
    
    switch (status.overall_status) {
      case 'healthy': 
        return { text: 'All Systems Operational', color: 'text-green-700', bg: 'bg-green-100' };
      case 'degraded': 
        return { text: 'Some Services Degraded', color: 'text-yellow-700', bg: 'bg-yellow-100' };
      case 'error': 
        return { text: 'System Issues Detected', color: 'text-red-700', bg: 'bg-red-100' };
      case 'partial': 
        return { text: 'Partial Functionality', color: 'text-blue-700', bg: 'bg-blue-100' };
      default: 
        return { text: 'Status Unknown', color: 'text-gray-700', bg: 'bg-gray-100' };
    }
  };

  const renderServiceCard = (serviceName: string, serviceData: any) => {
    return (
      <div key={serviceName} className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold capitalize flex items-center" style={{ color: colors.text.primary }}>
            <span className={`mr-2 ${getStatusColor(serviceData.status)}`}>
              {getStatusIcon(serviceData.status)}
            </span>
            {serviceName.replace('_', ' ')}
          </h3>
          <span className={`text-sm px-2 py-1 rounded ${getStatusColor(serviceData.status)} bg-opacity-10`}>
            {serviceData.status}
          </span>
        </div>

        <div className="space-y-2 text-sm">
          {serviceData.response_time_ms && (
            <div className="flex justify-between">
              <span style={{ color: colors.text.secondary }}>Response Time:</span>
              <span style={{ color: colors.text.primary }}>{serviceData.response_time_ms}ms</span>
            </div>
          )}

          {serviceData.endpoint && (
            <div className="flex justify-between">
              <span style={{ color: colors.text.secondary }}>Endpoint:</span>
              <span className="font-mono text-xs" style={{ color: colors.text.primary }}>
                {serviceData.endpoint.split('/').pop()}
              </span>
            </div>
          )}

          {serviceData.available_models && (
            <div className="flex justify-between">
              <span style={{ color: colors.text.secondary }}>Models:</span>
              <span style={{ color: colors.text.primary }}>{serviceData.available_models}</span>
            </div>
          )}

          {serviceData.total_functions && (
            <div className="flex justify-between">
              <span style={{ color: colors.text.secondary }}>Functions:</span>
              <span style={{ color: colors.text.primary }}>{serviceData.total_functions}</span>
            </div>
          )}

          {serviceData.model_tested && (
            <div className="flex justify-between">
              <span style={{ color: colors.text.secondary }}>Model Tested:</span>
              <span className="font-mono text-xs" style={{ color: colors.text.primary }}>
                {serviceData.model_tested.split('/').pop()}
              </span>
            </div>
          )}

          {serviceData.error && (
            <div className="mt-2 p-2 bg-red-50 rounded text-red-700 text-xs">
              {serviceData.error}
            </div>
          )}

          {serviceData.note && (
            <div className="mt-2 p-2 bg-blue-50 rounded text-blue-700 text-xs">
              {serviceData.note}
            </div>
          )}

          {serviceData.last_check && (
            <div className="text-xs pt-2 border-t" style={{ color: colors.text.secondary }}>
              Last checked: {new Date(serviceData.last_check).toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSystemInfo = () => {
    if (!status?.system_info) return null;

    const systemInfo = status.system_info;

    return (
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text.primary }}>
          🚀 System Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2" style={{ color: colors.text.primary }}>Environment</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span style={{ color: colors.text.secondary }}>Platform:</span>
                <span style={{ color: colors.text.primary }}>{systemInfo.environment}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: colors.text.secondary }}>Deno Version:</span>
                <span style={{ color: colors.text.primary }}>{systemInfo.deno_version}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: colors.text.secondary }}>AI Provider:</span>
                <span style={{ color: colors.text.primary }}>{systemInfo.ai_provider}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2" style={{ color: colors.text.primary }}>Available Models</h4>
            <div className="space-y-1">
              {systemInfo.available_models?.map((model: string, index: number) => (
                <div key={index} className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                  {model.split('/').pop()}
                </div>
              ))}
            </div>
          </div>
        </div>

        {systemInfo.capabilities && (
          <div className="mt-4">
            <h4 className="font-medium mb-2" style={{ color: colors.text.primary }}>AI Capabilities</h4>
            <div className="flex flex-wrap gap-2">
              {systemInfo.capabilities.map((capability: string, index: number) => (
                <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {capability.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (error && !status) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: colors.text.primary }}>
            AI Dashboard
          </h1>
          <p style={{ color: colors.text.secondary }}>Monitor AI system health and capabilities</p>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center mb-2">
            <span className="text-red-600 mr-2">❌</span>
            <h3 className="font-semibold text-red-800">Status Check Failed</h3>
          </div>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={checkStatus}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const overallStatus = getOverallStatusDisplay();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: colors.text.primary }}>
            AI Dashboard
          </h1>
          <p style={{ color: colors.text.secondary }}>Monitor AI system health and capabilities</p>
        </div>
        
        <button
          onClick={checkStatus}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <span>🔄</span>
          )}
          <span>{isLoading ? 'Checking...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Overall Status */}
      {status && (
        <div className={`${overallStatus.bg} rounded-lg p-6 border`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`text-2xl ${overallStatus.color}`}>
                {getStatusIcon(status.overall_status)}
              </div>
              <div>
                <h2 className={`text-xl font-bold ${overallStatus.color}`}>
                  {overallStatus.text}
                </h2>
                <p className={`text-sm ${overallStatus.color.replace('700', '600')}`}>
                  System checked {status.response_time_ms}ms ago
                </p>
              </div>
            </div>
            
            {lastUpdated && (
              <div className="text-right">
                <div className={`text-sm ${overallStatus.color.replace('700', '600')}`}>
                  Last updated
                </div>
                <div className={`font-mono text-sm ${overallStatus.color}`}>
                  {lastUpdated.toLocaleTimeString()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Services Status */}
      {status?.services && (
        <div>
          <h2 className="text-xl font-semibold mb-4" style={{ color: colors.text.primary }}>
            Service Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(status.services).map(([serviceName, serviceData]: [string, any]) =>
              renderServiceCard(serviceName, serviceData)
            )}
          </div>
        </div>
      )}

      {/* System Information */}
      {renderSystemInfo()}

      {/* Loading State */}
      {isLoading && !status && (
        <div className="bg-white rounded-lg border p-12 text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium" style={{ color: colors.text.primary }}>Checking AI System Status...</p>
          <p style={{ color: colors.text.secondary }}>This may take a few moments</p>
        </div>
      )}
    </div>
  );
};