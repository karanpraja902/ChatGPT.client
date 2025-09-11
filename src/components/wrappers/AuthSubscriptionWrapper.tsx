// 'use client';

// import React from 'react';
// import { useAuth } from '@/contexts/AuthContext';
// import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
// import { ChatProvider } from '@/contexts/ChatContext';

// interface AuthSubscriptionWrapperProps {
//   children: React.ReactNode;
// }

// export default function AuthSubscriptionWrapper({ children }: AuthSubscriptionWrapperProps) {
//   const { userId } = useAuth();
  
//   return (
//     <SubscriptionProvider userId={userId || ''}>
//       <ChatProvider>
//         {children}
//       </ChatProvider>
//     </SubscriptionProvider>
//   );
// }