'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserApiService } from '@/services/api/user';

interface Subscription {
  plan: string;
  status: string;
  subscribedAt?: Date;
  currentPeriodEnd?: Date;
  trialEnd?: Date;
}

interface SubscriptionContextType {
  subscription: Subscription | null;
  isLoading: boolean;
  refreshSubscription: () => Promise<void>;
  hasAccess: (feature: 'openrouter' | 'advanced_tools') => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

interface SubscriptionProviderProps {
  children: ReactNode;
  userId: string;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children, userId }) => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSubscription = async () => {
    // Don't make API call if userId is empty
    if (!userId || userId.trim() === '') {
      setIsLoading(false);
      return;
    }
    
    try {
      const profileResponse = await UserApiService.getUserProfile(userId);
      
      if (profileResponse.success && profileResponse.data?.user?.subscription) {
        setSubscription(profileResponse.data.user.subscription);
      } else {
        console.log(' No subscription data found in response');
      }
    } catch (error) {
      console.error('Failed to refresh subscription:', error);
    }
  };

  const hasAccess = (feature: 'openrouter' | 'advanced_tools'): boolean => {
    // If still loading, return false to prevent access until data is loaded
    if (isLoading) {
      return false;
    }
    
    if (!subscription) {
      return false;
    }
    
    // Normalize plan names to handle different formats
    const plan = subscription.plan?.toLowerCase() || '';
    
    // Check for both plan names and keys
    const hasProAccess = plan.includes('pro+') || plan.includes('ultra') || plan.includes('pro-plus') || plan.includes('pro_plus');
    
    switch (feature) {
      case 'openrouter':
        // Only Pro+ and Ultra have access to OpenRouter models
        return hasProAccess;
      case 'advanced_tools':
        // Only Pro+ and Ultra have access to advanced tools
        return hasProAccess;
      default:
        return false;
    }
  };

  useEffect(() => {
    refreshSubscription().finally(() => setIsLoading(false));
  }, [userId]);

  const value: SubscriptionContextType = {
    subscription,
    isLoading,
    refreshSubscription,
    hasAccess,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};
