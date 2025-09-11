const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://deepseek-ai-server.vercel.app';

export interface DeepResearchQuery {
  query: string;
  depth?: 'shallow' | 'medium' | 'deep' | 'comprehensive';
  domains?: string[];
  timeframe?: string;
  language?: string;
}

export interface ResearchPhase {
  phase: string;
  query: string;
  results: any[];
  analysis: string;
  keyFindings: string[];
  confidence: number;
}

export interface DeepResearchResult {
  originalQuery: string;
  executionId: string;
  phases: ResearchPhase[];
  synthesis: {
    summary: string;
    keyInsights: string[];
    contradictions?: string[];
    gaps?: string[];
    recommendations?: string[];
  };
  sources: {
    url: string;
    title: string;
    relevance: number;
    credibility: number;
    dateAccessed: string;
  }[];
  metadata: {
    totalSources: number;
    researchDuration: number;
    confidenceScore: number;
    completeness: number;
  };
  formattedSummary: string; // Add formatted markdown summary
}

export interface DeepResearchResponse {
  success: boolean;
  data?: DeepResearchResult;
  error?: string;
  details?: string;
}

export class ResearchApiService {
  static async performDeepResearch(params: DeepResearchQuery, executionId?: string): Promise<DeepResearchResponse> {
    try {
      console.log('🔬 Starting deep research request:', params);

      const requestBody = {
        ...params,
        executionId: executionId || `research_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      const response = await fetch(`${API_BASE_URL}/api/research/deep-research`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        
        // Provide user-friendly error messages for common issues
        if (response.status === 429) {
          errorMessage = 'Research service is temporarily busy. Please try again in a few minutes.';
        } else if (response.status === 500) {
          errorMessage = 'Research service encountered an error. Please try again or contact support.';
        } else if (response.status === 503) {
          errorMessage = 'Research service is temporarily unavailable. Please try again later.';
        }
        
        const error = new Error(errorMessage);
        (error as any).status = response.status;
        (error as any).details = errorData.details;
        (error as any).timestamp = errorData.timestamp;
        throw error;
      }

      const result = await response.json();
      console.log('✅ Deep research completed:', result.data?.metadata);
      return result;
    } catch (error: any) {
      console.error('❌ Deep research error:', error);
      
      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        const networkError = new Error('Network error: Unable to connect to research service. Please check your internet connection.');
        (networkError as any).status = 0;
        throw networkError;
      }
      
      throw error;
    }
  }

  static async cancelResearch(executionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🛑 Cancelling research:', executionId);

      const response = await fetch(`${API_BASE_URL}/api/research/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ executionId }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        return { success: false, error: errorMessage };
      }

      const result = await response.json();
      console.log('✅ Research cancelled successfully');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Cancel research error:', error);
      return { success: false, error: error.message || 'Failed to cancel research' };
    }
  }

  static async getResearchHistory(): Promise<any> {
    // TODO: Implement research history endpoint
    return { success: true, data: [] };
  }

  static async saveResearchSession(researchResult: DeepResearchResult): Promise<any> {
    // TODO: Implement save research session endpoint
    return { success: true };
  }
}
