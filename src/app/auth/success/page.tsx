'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { Loader } from 'lucide-react';

function AuthSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const [retryCount, setRetryCount] = useState(0);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  useEffect(() => {
    const handleAuthSuccess = async () => {
      try {
        const oauthProvider = searchParams.get('oauth');
        const timestamp = searchParams.get('t');
        
        await refreshUser();
        
        window.location.href = '/chat/new';
      } catch (error) {
        console.error('Auth success handling failed:', error);
  
        if (retryCount < 3) {

          setRetryCount(prev => prev + 1);
          return;
        }
        
        const errorDetails = encodeURIComponent(`auth_failed_after_${retryCount + 1}_retries`);
        window.location.href = `/sign-in?error=${errorDetails}`;
      }
    };

    handleAuthSuccess();
  }, [refreshUser, searchParams, retryCount]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="max-w-md w-full bg-gray-900 rounded-lg shadow-lg p-6 flex flex-col">

        <div className="mb-4 self-center">
         <Loader className="w-12 h-12 animate-spin text-white" />
        </div>
        <div className="mb-3 text-center text-white font-semibold text-lg">
          Authentication Successful!
        </div>
        <div className="mb-6 text-center text-gray-300 text-sm">
          {retryCount > 0
            ? `Retrying authentication... (${retryCount}/3)`
            : 'Setting up your session...'}
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto px-2">
          {(process.env.NODE_ENV === 'development' || retryCount > 0) && debugInfo.length > 0 && (
            debugInfo.map((info, index) => (
              <div
                key={index}
                className="bg-gray-700 text-gray-300 rounded-lg p-3 text-xs font-mono break-all"
                style={{ wordWrap: 'break-word' }}
              >
                {info}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="max-w-md w-full bg-[#343541] rounded-lg shadow-lg p-6 text-center">
        <div className="w-12 h-12 border-4 border-t-4 border-t-white border-white rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-white mb-2">Loading authentication...</h2>
        <p className="text-gray-400">Please wait while we set up your session.</p>
      </div>
    </div>
  );
}

export default function AuthSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthSuccessContent />
    </Suspense>
  );
}
