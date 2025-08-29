import { supabase } from './supabase';

// Get the Supabase URL from environment or config
const SUPABASE_URL = 'https://vuekwckknfjivjighhfd.supabase.co';

// AI Service for interacting with Edge Functions
class AIService {
  private async callEdgeFunction(functionName: string, payload: any) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.status} - ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || result;
    } catch (error) {
      console.error(`Error calling ${functionName}:`, error);
      throw error;
    }
  }

  // Document Analysis
  async analyzeDocument(fileContent: string, fileName: string, filePath?: string, analysisType: string = 'comprehensive') {
    return this.callEdgeFunction('ai-analyze-document', {
      fileContent,
      fileName,
      filePath,
      analysisType
    });
  }

  // File Categorization
  async categorizeFiles(files: Array<{
    fileName: string;
    filePath?: string;
    mimeType?: string;
    size?: number;
    content?: string;
  }>, customCategories?: string[]) {
    return this.callEdgeFunction('ai-categorize-files', {
      files,
      customCategories
    });
  }

  // Tag Generation
  async generateTags(fileName: string, filePath?: string, mimeType?: string, content?: string, metadata?: any, maxTags: number = 10, tagCategories?: string[]) {
    return this.callEdgeFunction('ai-generate-tags', {
      fileName,
      filePath,
      mimeType,
      content,
      metadata,
      maxTags,
      tagCategories
    });
  }

  // Image Analysis
  async analyzeImage(imageBase64: string, fileName: string, filePath?: string, analysisType: string = 'comprehensive') {
    return this.callEdgeFunction('ai-analyze-image', {
      imageBase64,
      fileName,
      filePath,
      analysisType
    });
  }

  // Duplicate Detection
  async detectDuplicates(files: Array<{
    fileName: string;
    filePath?: string;
    content?: string;
    size?: number;
    mimeType?: string;
    hash?: string;
  }>, similarityThreshold: number = 0.9, includeSimilar: boolean = true) {
    return this.callEdgeFunction('ai-detect-duplicates', {
      files,
      similarityThreshold,
      includeSimilar
    });
  }

  // Content Summary
  async generateSummary(fileName: string, filePath?: string, content?: string, mimeType?: string, metadata?: any, summaryLength: string = 'medium') {
    return this.callEdgeFunction('ai-generate-summary', {
      fileName,
      filePath,
      content,
      mimeType,
      metadata,
      summaryLength
    });
  }

  // Organization Suggestions
  async suggestOrganization(files: Array<{
    fileName: string;
    filePath?: string;
    mimeType?: string;
    size?: number;
    content?: string;
    tags?: string[];
    category?: string;
  }>, currentStructure?: string, organizationGoals?: string) {
    return this.callEdgeFunction('ai-suggest-organization', {
      files,
      currentStructure,
      organizationGoals
    });
  }

  // Provider Status Check
  async checkProviderStatus() {
    return this.callEdgeFunction('ai-provider-status', {});
  }

  // Utility function to convert file to base64
  fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  // Utility function to extract text from file
  async extractTextFromFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }
}

export const aiService = new AIService();
export default AIService;