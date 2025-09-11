'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoginDialog from '@/components/auth/LoginDialog';
import GuestChatContainer from '@/components/chat/GuestChatContainer';
import ChatContainer, { ChatContainerRef } from '@/components/chat/ChatContainer';
// We'll create a simplified chat input inline
import { Button } from '@/components/ui/button';
import { MessageSquare, Plus, LogOut, User, Settings, Sparkles, Paperclip, Search, BookOpen, Mic } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ChatGPTPage() {
  const { user, isLoading, logout, isAuthenticated } = useAuth();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [isGuest, setIsGuest] = useState(true); // Enable guest mode by default
  const [requestCount, setRequestCount] = useState(0);
  const chatContainerRef = useRef<ChatContainerRef>(null);
  const router = useRouter();

  const MAX_GUEST_REQUESTS = 3;

  useEffect(() => {
    // Set guest mode for non-authenticated users
    if (!isAuthenticated && !isLoading) {
      setIsGuest(true);
    } else if (isAuthenticated) {
      setIsGuest(false);
    }
  }, [isAuthenticated, isLoading]);

  const handleSendMessage = async (content: string, attachments?: any[]) => {
    console.log('handleSendMessage called with:', content);
    console.log('Current state - isAuthenticated:', isAuthenticated, 'isGuest:', isGuest, 'requestCount:', requestCount);
    
    // Allow guest users to chat with limitations
    if (!isAuthenticated && isGuest && requestCount >= MAX_GUEST_REQUESTS) {
      setShowLoginDialog(true);
      return;
    }

    const newMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      parts: attachments || [],
      createdAt: new Date()
    };

    console.log('Sending message to chat container:', newMessage);
    
    if (chatContainerRef.current) {
      await chatContainerRef.current.sendMessage(newMessage);
      if (isGuest || !isAuthenticated) {
        setRequestCount(prev => prev + 1);
      }
    } else {
      console.error('chatContainerRef.current is null');
    }
  };

  const handleStayLoggedOut = () => {
    setIsGuest(true);
    localStorage.setItem('guestMode', 'true');
    setShowLoginDialog(false);
  };

  const handleLogin = () => {
    localStorage.removeItem('guestMode');
    router.push('/sign-in');
  };

  const handleSignUp = () => {
    localStorage.removeItem('guestMode');
    router.push('/sign-up');
  };

  const handleNewChat = () => {
    setMessages([]);
    setRequestCount(0);
  };

  const handleLogout = async () => {
    await logout();
    localStorage.removeItem('guestMode');
    setIsGuest(false);
    setMessages([]);
    setRequestCount(0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#212121] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#212121] text-white flex">
      {/* Sidebar - Only show for authenticated users */}
      {isAuthenticated && (
        <div className="w-64 bg-[#171717] border-r border-gray-800 flex flex-col">
          <div className="p-4">
            <Button
              onClick={handleNewChat}
              className="w-full bg-transparent border border-gray-600 hover:bg-gray-800 text-gray-300 justify-start gap-2"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Today</div>
              {/* Previous chats would be listed here */}
            </div>
          </div>

          <div className="border-t border-gray-800 p-4">
            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-gray-300 hover:bg-gray-800"
              >
                <User className="w-4 h-4" />
                {user?.name || user?.email}
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-gray-300 hover:bg-gray-800"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Button>
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full justify-start gap-2 text-gray-300 hover:bg-gray-800"
              >
                <LogOut className="w-4 h-4" />
                Log out
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!isAuthenticated && (
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
            )}
            {isAuthenticated && (
              <>
                <MessageSquare className="w-5 h-5" />
                <span className="font-semibold">ChatGPT</span>
              </>
            )}
          </div>
          {!isAuthenticated && (
            <div className="absolute top-4 right-4 flex items-center gap-3">
              <Button
                onClick={() => setShowLoginDialog(true)}
                className="bg-white text-black hover:bg-gray-100 px-4 py-2 rounded-md font-medium"
              >
                Log in
              </Button>
              <Button
                onClick={handleSignUp}
                className="bg-transparent text-white border border-gray-600 hover:bg-gray-800 px-4 py-2 rounded-md font-medium"
              >
                Sign up for free
              </Button>
            </div>
          )}
        </div>

        {/* Chat Container */}
        <div className="flex-1 overflow-hidden flex flex-col relative">
          {/* Always render the chat container but hide it when no messages */}
          <div className={`flex-1 overflow-y-auto ${messages.length === 0 ? 'hidden' : ''}`}>
            {!isAuthenticated ? (
              <GuestChatContainer
                ref={chatContainerRef}
                messages={messages}
                setMessages={setMessages}
              />
            ) : (
              <ChatContainer
                ref={chatContainerRef}
                messages={messages}
                setMessages={setMessages}
                userId={user?.id}
              />
            )}
          </div>
          
          {/* Show centered input when no messages */}
          {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <h1 className="text-5xl font-bold text-white mb-12">ChatGPT</h1>
                  <div className="w-full max-w-3xl px-4">
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        const input = e.currentTarget.message.value;
                        if (input.trim()) {
                          handleSendMessage(input);
                          e.currentTarget.reset();
                        }
                      }}
                    >
                      <div className="relative w-full px-4 py-4 pr-5 bg-[#2f2f2f] rounded-2xl text-white text-lg placeholder-gray-400 focus:outline-none focus:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">
                        <div className="relative">
                        <input
                          name="message"
                          type="text"
                          disabled={isGuest && requestCount >= MAX_GUEST_REQUESTS}
                          placeholder="Ask anything"
                          className="w-full px-5 py-4 pr-12 bg-[#2f2f2f] rounded-2xl text-white text-lg placeholder-gray-400 focus:outline-none focus:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <button
                          type="submit"
                          disabled={isGuest && requestCount >= MAX_GUEST_REQUESTS}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        </button>
                        </div>
                        <div className="flex items-center justify-center gap-4 mt-3">
                        <button
                          type="button"
                          className="flex border border-gray-700  items-center gap-2 px-4 py-2 bg-[#2f2f2f] hover:bg-[#3f3f3f]  text-gray-200 rounded-lg transition-colors"
                        >
                          <Paperclip className="w-4 h-4" />
                          <span className="text-sm">Attach</span>
                        </button>
                        <button
                          type="button"
                          className="flex border border-gray-700  items-center gap-2 px-4 py-2 bg-[#2f2f2f] hover:bg-[#3f3f3f] text-gray-300 rounded-lg transition-colors"
                        >
                          <Search className="w-4 h-4" />
                          <span className="text-sm">Search</span>
                        </button>
                      
                        <button
                          type="button"
                          className="flex border border-gray-700  items-center gap-2 px-4 py-2 bg-[#2f2f2f] hover:bg-[#3f3f3f] text-gray-200 rounded-lg transition-colors ml-auto"
                        >
                          <Mic className="w-4 h-4" />
                          <span className="text-sm">Voice</span>
                        </button>
                      </div>
                       
                      </div>
                      
                    </form>
                    
                    {!isAuthenticated && (
                      <div className="text-center mt-6">
                        <p className="text-sm text-gray-400">
                          {requestCount < MAX_GUEST_REQUESTS ? (
                            <>
                              Guest mode: {MAX_GUEST_REQUESTS - requestCount} free {MAX_GUEST_REQUESTS - requestCount === 1 ? 'message' : 'messages'} remaining.
                              <button
                                onClick={() => setShowLoginDialog(true)}
                                className="ml-2 text-blue-400 hover:text-blue-300 underline"
                              >
                                Sign in for higher  access
                              </button>
                            </>
                          ) : (
                            <>
                              You've reached the free message limit.
                              <button
                                onClick={() => setShowLoginDialog(true)}
                                className="ml-2 text-blue-400 hover:text-blue-300 underline"
                              >
                                Sign in to continue
                              </button>
                            </>
                          )}
                        </p>
                      </div>
                    )}
                    
                    <div className="text-center mt-auto pt-8">
                      <p className="text-xs text-gray-500">
                        By messaging ChatGPT, you agree to our{' '}
                        <a href="#" className="underline hover:text-gray-400">Terms</a>
                        {' '}and have read our{' '}
                        <a href="#" className="underline hover:text-gray-400">Privacy Policy</a>
                        . See{' '}
                        <a href="#" className="underline hover:text-gray-400">Cookie Preferences</a>
                        .
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-t border-gray-800 p-4">
                    {!isAuthenticated && requestCount > 0 && (
                      <div className="text-center mb-3">
                        <p className="text-sm text-gray-400">
                          {requestCount < MAX_GUEST_REQUESTS ? (
                            <>
                              {MAX_GUEST_REQUESTS - requestCount} free {MAX_GUEST_REQUESTS - requestCount === 1 ? 'message' : 'messages'} remaining.
                              <button
                                onClick={() => setShowLoginDialog(true)}
                                className="ml-2 text-blue-400 hover:text-blue-300 underline"
                              >
                                Sign in for unlimited
                              </button>
                            </>
                          ) : (
                            <>
                              Free message limit reached.
                              <button
                                onClick={() => setShowLoginDialog(true)}
                                className="ml-2 text-blue-400 hover:text-blue-300 underline"
                              >
                                Sign in to continue
                              </button>
                            </>
                          )}
                        </p>
                      </div>
                    )}
                    <div className="flex justify-center items-center">
                    <div className="w-full max-w-3xl px-4 justify-center items-center">
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        const input = e.currentTarget.message.value;
                        if (input.trim()) {
                          handleSendMessage(input);
                          e.currentTarget.reset();
                        }
                      }}
                    >

                      <div className="relative  px-4 py-4 pr-5 bg-[#2f2f2f] rounded-2xl text-white text-lg placeholder-gray-400 focus:outline-none focus:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">
                        <div className="relative">
                        <input
                          name="message"
                          type="text"
                          disabled={isGuest && requestCount >= MAX_GUEST_REQUESTS}
                          placeholder="Ask anything"
                          className="w-full px-5 py-4 pr-12 bg-[#2f2f2f] rounded-2xl text-white text-lg placeholder-gray-400 focus:outline-none focus:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <button
                          type="submit"
                          disabled={isGuest && requestCount >= MAX_GUEST_REQUESTS}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        </button>
                        </div>
                        <div className="flex items-center justify-center gap-4 mt-3">
                        <button
                          type="button"
                          className="flex border border-gray-700  items-center gap-2 px-4 py-2 bg-[#2f2f2f] hover:bg-[#3f3f3f]  text-gray-200 rounded-lg transition-colors"
                        >
                          <Paperclip className="w-4 h-4" />
                          <span className="text-sm">Attach</span>
                        </button>
                        <button
                          type="button"
                          className="flex border border-gray-700  items-center gap-2 px-4 py-2 bg-[#2f2f2f] hover:bg-[#3f3f3f] text-gray-300 rounded-lg transition-colors"
                        >
                          <Search className="w-4 h-4" />
                          <span className="text-sm">Search</span>
                        </button>
                      
                        <button
                          type="button"
                          className="flex border border-gray-700  items-center gap-2 px-4 py-2 bg-[#2f2f2f] hover:bg-[#3f3f3f] text-gray-200 rounded-lg transition-colors ml-auto"
                        >
                          <Mic className="w-4 h-4" />
                          <span className="text-sm">Voice</span>
                        </button>
                      </div>
                       
                      </div>
                      
                    </form>
                    </div>
                    </div>
                </div>
              )}
        </div>
      </div>

      {/* Login Dialog */}
      {showLoginDialog && !isAuthenticated && (
        <LoginDialog
          onClose={() => setShowLoginDialog(false)}
          onLogin={handleLogin}
          onSignUp={handleSignUp}
          onStayLoggedOut={handleStayLoggedOut}
        />
      )}
    </div>
  );
}
