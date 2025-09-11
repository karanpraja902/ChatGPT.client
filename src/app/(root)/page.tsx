'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to ChatGPT interface
    router.push('/chatgpt');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#212121]">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-white mb-6">ChatGPT</h1>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-gray-400">Loading...</p>
      </div>
    </div>
  );
}
