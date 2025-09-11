'use client';

import React, { useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';

export interface ChatContainerRef {
  sendMessage: (message: any) => Promise<void>;
  stop: () => void;
}

interface GuestChatContainerProps {
  messages: any[];
  setMessages: (messages: any[]) => void;
}

const GuestChatContainer = forwardRef<ChatContainerRef, GuestChatContainerProps>(
  ({ messages, setMessages }, ref) => {
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const [status, setStatus] = useState<'idle' | 'processing' | 'streaming'>('idle');
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const streamControllerRef = useRef<AbortController | null>(null);

    const sendMessage = useCallback(async (message: any) => {
      console.log('GuestChatContainer sendMessage called with:', message);
      console.log('Current messages:', messages);
      try {
        setStatus('processing');

        const newUserMessage = {
          id: Date.now().toString(),
          role: 'user',
          content: message.content || message,
          createdAt: new Date()
        };

        // Add user message
        const updatedMessages = [...messages, newUserMessage];
        console.log('Setting messages to:', updatedMessages);
        setMessages(updatedMessages);

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setStatus('streaming');

        // Create assistant message
        const assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '',
          createdAt: new Date()
        };

        const messagesWithAssistant = [...updatedMessages, assistantMessage];
        setMessages(messagesWithAssistant);

        // Generate a helpful response based on the user's input
        const userInput = newUserMessage.content.toLowerCase();
        let mockResponse = '';
        
        if (userInput.includes('hello') || userInput.includes('hi')) {
          mockResponse = `Hello! I'm ChatGPT, an AI assistant here to help you. Feel free to ask me questions about any topic - coding, science, creative writing, or just general knowledge. 

As a guest user, you have limited free messages. Sign in to unlock unlimited conversations and save your chat history.

What would you like to know about today?`;
        } else if (userInput.includes('help')) {
          mockResponse = `I can help you with a wide variety of tasks:

• Answer questions on any topic
• Explain complex concepts simply
• Help with coding and debugging
• Assist with writing and editing
• Provide creative ideas
• Solve math problems
• And much more!

What specific help do you need today?`;
        } else if (userInput.includes('code') || userInput.includes('programming')) {
          mockResponse = `I can help with programming in many languages including Python, JavaScript, Java, C++, and more. I can:

• Write code snippets
• Debug existing code
• Explain programming concepts
• Suggest best practices
• Help with algorithms and data structures

What programming challenge are you working on?`;
        } else {
          // Default helpful response
          mockResponse = `Thank you for your question! ${userInput.length > 50 ? "That's an interesting topic. " : ""}

I'm here to provide helpful, accurate information on a wide range of subjects. While I'm currently in demo mode with limited functionality for guest users, I can still assist with general questions.

For the best experience with unlimited messages and full capabilities, consider signing in or creating a free account.

Would you like me to elaborate on any specific aspect of your question?`;
        }

        let accumulatedText = '';
        const words = mockResponse.split(' ');

        for (let i = 0; i < words.length; i++) {
          if (streamControllerRef.current?.signal.aborted) break;
          
          accumulatedText += (i > 0 ? ' ' : '') + words[i];
          
          const finalMessages = messagesWithAssistant.map(msg =>
            msg.id === assistantMessage.id
              ? { ...msg, content: accumulatedText }
              : msg
          );
          
          setMessages(finalMessages);
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        setStatus('idle');
      } catch (error) {
        console.error('Error in guest chat:', error);
        setStatus('idle');
      }
    }, [messages, setMessages]);

    const stop = useCallback(() => {
      if (streamControllerRef.current) {
        streamControllerRef.current.abort();
        streamControllerRef.current = null;
      }
      setStatus('idle');
    }, []);

    const handleCopy = async (text: string, messageId: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedId(messageId);
        setTimeout(() => setCopiedId(null), 2000);
      } catch (err) {
        console.error('Failed to copy text:', err);
      }
    };

    const renderMessageContent = useCallback((content: string) => {
      return (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ node, inline, className, children, ...props }: any) {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <SyntaxHighlighter
                  style={tomorrow as any}
                  language={match[1]}
                  PreTag="div"
                  className="rounded-lg my-2"
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code className="bg-gray-800 px-1 py-0.5 rounded text-sm" {...props}>
                  {children}
                </code>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      );
    }, []);

    useImperativeHandle(ref, () => ({
      sendMessage,
      stop
    }));

    React.useEffect(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, [messages]);

    return (
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center min-h-full">
            <div className="text-center w-full max-w-4xl px-4">
              <h2 className="text-4xl font-bold text-white mb-6">ChatGPT</h2>
              <p className="text-gray-400 mb-12 text-lg">
                Start a conversation to explore AI-powered assistance.
                Guest users have limited requests.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-3xl mx-auto">
                <div className="bg-[#2d2d2d] rounded-lg p-5 border border-gray-700 hover:border-gray-600 transition-colors">
                  <h3 className="font-semibold text-white mb-3">Examples</h3>
                  <p className="text-sm text-gray-400">
                    "Explain quantum computing in simple terms"
                  </p>
                </div>
                <div className="bg-[#2d2d2d] rounded-lg p-5 border border-gray-700 hover:border-gray-600 transition-colors">
                  <h3 className="font-semibold text-white mb-3">Capabilities</h3>
                  <p className="text-sm text-gray-400">
                    Answers questions and assists with tasks
                  </p>
                </div>
                <div className="bg-[#2d2d2d] rounded-lg p-5 border border-gray-700 hover:border-gray-600 transition-colors">
                  <h3 className="font-semibold text-white mb-3">Limitations</h3>
                  <p className="text-sm text-gray-400">
                    Guest mode: Limited requests, no history
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={`max-w-3xl mx-auto space-y-4 px-4`}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`relative group max-w-[70%] ${
                    message.role === 'user'
                      ? 'bg-[#343541] text-white'
                      : 'text-white'
                  } rounded-2xl px-5 py-3`}
                >
                  <div className="prose prose-invert max-w-none">
                    {renderMessageContent(message.content)}
                  </div>
                  {message.role === 'assistant' && (
                    <button
                      onClick={() => handleCopy(message.content, message.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-600 rounded"
                      aria-label="Copy message"
                    >
                      {copiedId === message.id ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {status === 'processing' && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-5 py-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

GuestChatContainer.displayName = 'GuestChatContainer';

export default GuestChatContainer;
