'use client';

import React from 'react';
// import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';
// import "@radix-ui/themes/styles.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user } = useAuth();
  
  return (
    <>
      {/* header */}
      {/* chatsidebar */}
      <SubscriptionProvider userId={user?.id || ''}>
        {children}
      </SubscriptionProvider>
      {/* footer */}
    </>
  );
}
