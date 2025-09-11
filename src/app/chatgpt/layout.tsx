import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "ChatGPT",
  description: "AI-powered chat assistant",
};

export default function ChatGPTLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#212121]">
      {children}
    </div>
  );
}
