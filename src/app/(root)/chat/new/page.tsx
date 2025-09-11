'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function NewChatPage() {
  const router = useRouter();
  const { userId } = useAuth();
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  useEffect(() => {
    const createChatAndRedirect = async () => {
      if (!userId) return;

      try {
        setIsCreatingChat(true);
        // Use chat actions to create a new chat
        const { createChatAction } = await import('@/lib/chat-actions');
        const response = await createChatAction();
        // create a new chat with user context
        if (response.success && response.data?.chat) {
          const id = response.data.chat.id;
          router.push(`/chat/${id}`); // redirect to chat page
        } else {
          throw new Error('Failed to create chat: No chat data received');
        }
      } catch (error) {
        console.error('Failed to create chat:', error);
        // Fallback: redirect to a default chat or show error page
        router.push('/chat/default');
      } finally {
        setIsCreatingChat(false);
      }
    };

    createChatAndRedirect();
  }, [userId, router]);

  if (isCreatingChat) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#212121]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-300">Creating your chat...</p>
        </div>
      </div>
    );
  }

  return (
      <div className="min-h-screen flex items-center justify-center bg-[#212121]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-300">Preparing your chat...</p>
        </div>
      </div>
  );
}
