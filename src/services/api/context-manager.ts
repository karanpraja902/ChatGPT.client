// Context management for token limits and conversation flow

interface ContextStatus {
  status: 'ok' | 'warning' | 'danger';
  percentage: number;
  currentTokens: number;
  limit: number;
  message: string;
}

// Token limits for different models (with safety buffer)
const MODEL_TOKEN_LIMITS: Record<string, number> = {
  'google': 150000, // Gemini 2.5 Flash - buffer from 163840 max
  'deepseek-r1': 150000, // Based on error message showing ~163840 limit
  'llama-3.1': 120000, // Conservative estimate
  'gpt-oss': 8000, // Conservative estimate for smaller models
  'claude-3': 180000, // Claude 3 models
  'gpt-4': 120000, // GPT-4 models
  'gpt-3.5': 15000, // GPT-3.5 models
  'mistral': 30000, // Mistral models
  'llama-2': 4000, // Llama 2 models
};

// Rough token estimation (words * 1.3 for average token-to-word ratio)
export const estimateTokens = (text: string): number => {
  if (!text || typeof text !== 'string') return 0;
  // Simple estimation: split by whitespace and multiply by average token ratio
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words * 1.3);
};

// Calculate total tokens in messages
export const calculateMessageTokens = (messages: any[]): number => {
  let totalTokens = 0;
  
  for (const message of messages) {
    // Handle different message formats
    if (message.parts && Array.isArray(message.parts)) {
      for (const part of message.parts) {
        if (part.type === 'text' && part.text) {
          totalTokens += estimateTokens(part.text);
        }
        // Add minimal tokens for other content types
        else if (part.type === 'image') {
          totalTokens += 100; // Rough estimate for image processing
        }
        else if (part.type === 'file') {
          totalTokens += 50; // Minimal for file references
        }
      }
    } else if (message.content) {
      if (typeof message.content === 'string') {
        totalTokens += estimateTokens(message.content);
      } else if (Array.isArray(message.content)) {
        for (const item of message.content) {
          if (item.type === 'text' && item.text) {
            totalTokens += estimateTokens(item.text);
          }
        }
      }
    }
    
    // Add overhead for message structure
    totalTokens += 10;
  }
  
  return totalTokens;
};

// Get token limit for a model
export const getTokenLimit = (modelKey: string): number => {
  return MODEL_TOKEN_LIMITS[modelKey] || 8000; // Default conservative limit
};

// Get context status for UI display
export const getContextStatus = (messages: any[], modelKey: string): ContextStatus => {
  const currentTokens = calculateMessageTokens(messages);
  const limit = getTokenLimit(modelKey);
  const percentage = Math.round((currentTokens / limit) * 100);
  
  let status: 'ok' | 'warning' | 'danger' = 'ok';
  let message = 'Context usage is within normal limits';
  
  if (percentage >= 90) {
    status = 'danger';
    message = 'Context nearly full - consider starting a new conversation';
  } else if (percentage >= 70) {
    status = 'warning';
    message = 'Context getting full - may need to truncate soon';
  }
  
  return {
    status,
    percentage,
    currentTokens,
    limit,
    message
  };
};

// Validate context before sending to model
export const validateContext = (messages: any[], modelKey: string): { valid: boolean; tokens: number; limit: number; suggestion?: string } => {
  const tokens = calculateMessageTokens(messages);
  const limit = getTokenLimit(modelKey);
  
  const valid = tokens <= limit;
  
  const result: any = {
    valid,
    tokens,
    limit
  };
  
  if (!valid) {
    result.suggestion = `Consider using a model with higher token limit or reduce conversation length. Current: ${tokens}, Limit: ${limit}`;
  }
  
  return result;
};

// Truncate messages to fit within token limit (client-side preview)
export const truncateMessages = (messages: any[], modelKey: string, systemPromptTokens: number = 500): any[] => {
  const tokenLimit = getTokenLimit(modelKey);
  const availableTokens = tokenLimit - systemPromptTokens - 1000; // Reserve tokens for response
  
  if (messages.length === 0) return messages;
  
  // Always keep the last message (current user input)
  const lastMessage = messages[messages.length - 1];
  const lastMessageTokens = calculateMessageTokens([lastMessage]);
  
  if (lastMessageTokens > availableTokens) {
    console.warn(` Single message too long: ${lastMessageTokens} tokens`);
    // If even the last message is too long, just return it (server will handle)
    return [lastMessage];
  }
  
  // Work backwards from the last message to include as many as possible
  const truncatedMessages = [lastMessage];
  let currentTokens = lastMessageTokens;
  
  for (let i = messages.length - 2; i >= 0; i--) {
    const messageTokens = calculateMessageTokens([messages[i]]);
    
    if (currentTokens + messageTokens <= availableTokens) {
      truncatedMessages.unshift(messages[i]);
      currentTokens += messageTokens;
    } else {
      // If we can't fit the entire message, break
      break;
    }
  }
  
  const finalTokens = calculateMessageTokens(truncatedMessages);
  
  return truncatedMessages;
};

// Context management strategies
export type ContextStrategy = 'truncate' | 'sliding_window' | 'summarize' | 'smart_trim';

// Advanced context window handling with multiple strategies
export const manageContextWindow = (
  messages: any[], 
  modelKey: string, 
  strategy: ContextStrategy = 'smart_trim',
  systemPromptTokens: number = 500
): { messages: any[], strategy: string, tokensReduced: number, originalTokens: number } => {
  const originalTokens = calculateMessageTokens(messages);
  const tokenLimit = getTokenLimit(modelKey);
  const safeLimit = Math.floor(tokenLimit * 0.85); // 85% safety margin
  
  // If we're within limits, return as-is
  if (originalTokens <= safeLimit) {
    return {
      messages,
      strategy: 'none',
      tokensReduced: 0,
      originalTokens
    };
  }
  
  let managedMessages: any[];
  let appliedStrategy: string;
  
  switch (strategy) {
    case 'truncate':
      managedMessages = truncateMessages(messages, modelKey, systemPromptTokens);
      appliedStrategy = 'truncate';
      break;
      
    case 'sliding_window':
      managedMessages = slidingWindowTrim(messages, modelKey, systemPromptTokens);
      appliedStrategy = 'sliding_window';
      break;
      
    case 'summarize':
      managedMessages = summarizeAndTrim(messages, modelKey, systemPromptTokens);
      appliedStrategy = 'summarize';
      break;
      
    case 'smart_trim':
    default:
      managedMessages = smartTrim(messages, modelKey, systemPromptTokens);
      appliedStrategy = 'smart_trim';
      break;
  }
  
  const finalTokens = calculateMessageTokens(managedMessages);
  
  return {
    messages: managedMessages,
    strategy: appliedStrategy,
    tokensReduced: originalTokens - finalTokens,
    originalTokens
  };
};

// Sliding window approach - keeps recent messages and some early context
export const slidingWindowTrim = (messages: any[], modelKey: string, systemPromptTokens: number = 500): any[] => {
  const tokenLimit = getTokenLimit(modelKey);
  const availableTokens = tokenLimit - systemPromptTokens - 1000; // Reserve for response
  
  if (messages.length <= 2) return messages;
  
  // Always keep the first message (often contains important context) and last message
  const firstMessage = messages[0];
  const lastMessage = messages[messages.length - 1];
  const middleMessages = messages.slice(1, -1);
  
  const firstTokens = calculateMessageTokens([firstMessage]);
  const lastTokens = calculateMessageTokens([lastMessage]);
  const reservedTokens = firstTokens + lastTokens;
  
  if (reservedTokens >= availableTokens) {
    // If first and last messages are too big, just keep the last one
    return [lastMessage];
  }
  
  const remainingTokens = availableTokens - reservedTokens;
  const recentMessages = [];
  let currentTokens = 0;
  
  // Add recent messages from the end
  for (let i = middleMessages.length - 1; i >= 0; i--) {
    const messageTokens = calculateMessageTokens([middleMessages[i]]);
    if (currentTokens + messageTokens <= remainingTokens) {
      recentMessages.unshift(middleMessages[i]);
      currentTokens += messageTokens;
    } else {
      break;
    }
  }
  
  return [firstMessage, ...recentMessages, lastMessage];
};

// Smart trim - preserves conversation flow and important messages
export const smartTrim = (messages: any[], modelKey: string, systemPromptTokens: number = 500): any[] => {
  const tokenLimit = getTokenLimit(modelKey);
  const availableTokens = tokenLimit - systemPromptTokens - 1000;
  
  if (messages.length <= 1) return messages;
  
  // Priority system: recent messages have higher priority
  const prioritizedMessages = messages.map((msg, index) => ({
    message: msg,
    priority: calculateMessagePriority(msg, index, messages.length),
    tokens: calculateMessageTokens([msg]),
    index
  }));
  
  // Sort by priority (higher first)
  prioritizedMessages.sort((a, b) => b.priority - a.priority);
  
  const selectedMessages = [];
  let totalTokens = 0;
  
  for (const item of prioritizedMessages) {
    if (totalTokens + item.tokens <= availableTokens) {
      selectedMessages.push(item);
      totalTokens += item.tokens;
    }
  }
  
  // Sort back to original order
  selectedMessages.sort((a, b) => a.index - b.index);
  
  return selectedMessages.map(item => item.message);
};

// Calculate message priority for smart trimming
const calculateMessagePriority = (message: any, index: number, totalMessages: number): number => {
  let priority = 0;
  
  // Recent messages have higher priority (exponential decay)
  const recencyFactor = Math.pow(0.95, totalMessages - index - 1);
  priority += recencyFactor * 100;
  
  // System messages have high priority
  if (message.role === 'system') {
    priority += 200;
  }
  
  // First and last messages have higher priority
  if (index === 0 || index === totalMessages - 1) {
    priority += 150;
  }
  
  // Messages with tool calls or responses have higher priority
  if (message.role === 'tool' || message.toolCalls || message.toolCallId) {
    priority += 100;
  }
  
  // Shorter messages are easier to keep
  const messageTokens = calculateMessageTokens([message]);
  if (messageTokens < 100) {
    priority += 50;
  }
  
  return priority;
};

// Summarization approach - creates summaries of older messages
export const summarizeAndTrim = (messages: any[], modelKey: string, systemPromptTokens: number = 500): any[] => {
  const tokenLimit = getTokenLimit(modelKey);
  const availableTokens = tokenLimit - systemPromptTokens - 1000;
  
  if (messages.length <= 3) return messages;
  
  // Keep the last few messages as-is
  const recentCount = Math.min(5, Math.floor(messages.length * 0.3));
  const recentMessages = messages.slice(-recentCount);
  const olderMessages = messages.slice(0, -recentCount);
  
  const recentTokens = calculateMessageTokens(recentMessages);
  
  if (recentTokens >= availableTokens) {
    // If recent messages are too big, just truncate
    return truncateMessages(messages, modelKey, systemPromptTokens);
  }
  
  // Create a summary of older messages
  const summary = createMessageSummary(olderMessages);
  const summaryMessage = {
    role: 'system',
    content: `[Conversation Summary]: ${summary}`
  };
  
  const summaryTokens = calculateMessageTokens([summaryMessage]);
  const totalTokens = summaryTokens + recentTokens;
  
  if (totalTokens <= availableTokens) {
    return [summaryMessage, ...recentMessages];
  } else {
    // If still too big, fall back to truncation
    return truncateMessages(messages, modelKey, systemPromptTokens);
  }
};

// Create a concise summary of messages
const createMessageSummary = (messages: any[]): string => {
  if (messages.length === 0) return 'No previous conversation.';
  
  const topics = new Set<string>();
  const keyPoints = [];
  let userQuestions = 0;
  let aiResponses = 0;
  
  for (const message of messages) {
    const content = extractMessageContent(message);
    if (!content) continue;
    
    if (message.role === 'user') {
      userQuestions++;
      // Extract potential topics from user messages
      const words = content.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 4 && !['what', 'how', 'why', 'when', 'where', 'which'].includes(word)) {
          topics.add(word);
        }
      });
    } else if (message.role === 'assistant') {
      aiResponses++;
    }
    
    // Keep important short statements
    if (content.length < 200 && (content.includes('important') || content.includes('key') || content.includes('remember'))) {
      keyPoints.push(content.substring(0, 100));
    }
  }
  
  let summary = `Previous conversation had ${userQuestions} user questions and ${aiResponses} AI responses.`;
  
  if (topics.size > 0) {
    const topicList = Array.from(topics).slice(0, 5).join(', ');
    summary += ` Topics discussed: ${topicList}.`;
  }
  
  if (keyPoints.length > 0) {
    summary += ` Key points: ${keyPoints.slice(0, 2).join('; ')}.`;
  }
  
  return summary;
};

// Extract content from various message formats
const extractMessageContent = (message: any): string => {
  if (typeof message.content === 'string') {
    return message.content;
  } else if (message.parts && Array.isArray(message.parts)) {
    return message.parts
      .filter((part: any) => part.type === 'text' && part.text)
      .map((part: any) => part.text)
      .join(' ');
  } else if (Array.isArray(message.content)) {
    return message.content
      .filter((item: any) => item.type === 'text' && item.text)
      .map((item: any) => item.text)
      .join(' ');
  }
  return '';
};

// Legacy function for backward compatibility
export const manageContext = (messages: any[], modelKey: string): any[] => {
  const result = manageContextWindow(messages, modelKey, 'smart_trim');
  return result.messages;
};
