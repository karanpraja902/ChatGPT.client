import { manageContextWindow, getContextStatus, ContextStrategy } from './context-manager';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://deepseek-ai-server.vercel.app';


export class ChatApiService {
static async addMessage(chatId: string, role: string, content: string, files?: any[], parts?: any[], metadata?: any) {
    try {
      // Validate input before sending
      if (!chatId || !role || !content?.trim()) {
        throw new Error('Invalid message data: missing required fields');
      }


     
      const messageData = { 
        role, 
        content: content.trim(), 
        files: files || [], 
        parts: parts || [], 
        metadata: metadata || {} 
      };

      const response = await fetch(`${API_BASE_URL}/api/chat/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });
      console.log("chatapiservice addMessage response:", response);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to add message: ${response.status} ${response.statusText}${errorData.details ? ` - ${JSON.stringify(errorData.details)}` : ''}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Add message error:', error);
      throw error;
    }
  }
 
  static async sendMessage(
    messages: any[], 
    options?: { 
      signal?: AbortSignal; 
      enableWebSearch?: boolean; 
      userId?: string; 
      model?: string;
      contextStrategy?: ContextStrategy;
      onContextManaged?: (info: { strategy: string; tokensReduced: number; originalTokens: number }) => void;
    }
  ) {
    try {
      // Apply client-side context management
      const modelKey = options?.model || 'google';
      const contextStrategy = options?.contextStrategy || 'smart_trim';
      
      // Get context status before management
      const contextStatus = getContextStatus(messages, modelKey);
      
      let managedMessages = messages;
      let contextInfo = null;
      
      // Apply context management if needed
      if (contextStatus.percentage > 70) { // Apply management at 70% capacity
        const contextResult = manageContextWindow(messages, modelKey, contextStrategy);
        managedMessages = contextResult.messages;
        contextInfo = {
          strategy: contextResult.strategy,
          tokensReduced: contextResult.tokensReduced,
          originalTokens: contextResult.originalTokens
        };
        
        // Notify caller about context management
        if (options?.onContextManaged && contextResult.strategy !== 'none') {
          options.onContextManaged(contextInfo);
        }
        
        console.log(`📊 Client Context Management:
          Strategy: ${contextResult.strategy}
          Original tokens: ${contextResult.originalTokens}
          Final tokens: ${contextResult.originalTokens - contextResult.tokensReduced}
          Tokens reduced: ${contextResult.tokensReduced}`);
      }

      const response = await fetch(`${API_BASE_URL}/api/ai/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          
        },
        body: JSON.stringify({ 
          messages: managedMessages,
          enableWebSearch: options?.enableWebSearch || false,
          userId: options?.userId,
          model: options?.model,
          contextInfo: contextInfo // Send context management info to server
        }),
        signal: options?.signal,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        const error = new Error(errorMessage);
        (error as any).status = response.status;
        (error as any).details = errorData.details;
        (error as any).timestamp = errorData.timestamp;
        (error as any).errorType = errorData.errorType;
        (error as any).response = { status: response.status, data: errorData };
        throw error;
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      return response;
    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    }
  }

  // Add new method for parsing streaming response
  static async parseStreamingResponse(response: Response, onChunk: (chunk: string) => void) {
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        
        // Check for error responses in the stream
        if (chunk.includes('"error"') || chunk.includes('"success":false')) {
          try {
            const errorData = JSON.parse(chunk);
            if (errorData.error) {
              const error = new Error(errorData.error);
              (error as any).status = response.status;
              (error as any).details = errorData.details;
              (error as any).timestamp = errorData.timestamp;
              (error as any).errorType = errorData.errorType;
              throw error;
            }
          } catch (parseError) {
            // If we can't parse as JSON, continue with normal processing
          }
        }
        
        // Handle different streaming formats
        if (chunk.startsWith('data: ')) {
          // Server-Sent Events format
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data !== '[DONE]') {
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.token) {
                    onChunk(parsed.token);
                  }
                } catch (e) {
                  // If not JSON, treat as plain text
                  onChunk(data);
                }
              }
            }
          }
        } else {
          // Plain text streaming
          onChunk(chunk);
        }
      }
    } catch (error) {
      // Re-throw the error to be handled by the caller
      throw error;
    } finally {
      reader.releaseLock();
    }
  }
}