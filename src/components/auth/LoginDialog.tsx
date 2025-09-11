'use client';

import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LoginDialogProps {
  onClose: () => void;
  onLogin: () => void;
  onSignUp: () => void;
  onStayLoggedOut: () => void;
}

export default function LoginDialog({
  onClose,
  onLogin,
  onSignUp,
  onStayLoggedOut
}: LoginDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#2d2d2d] rounded-2xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Welcome back</h2>
          <p className="text-gray-400 mb-6">
            Log in or sign up to get smarter responses, upload files and images, and more.
          </p>

          <div className="space-y-3">
            <Button
              onClick={onLogin}
              className="w-full bg-white text-black hover:bg-gray-100 py-3 font-medium"
            >
              Log in
            </Button>

            <Button
              onClick={onSignUp}
              className="w-full bg-[#10a37f] text-white hover:bg-[#0d8f6f] py-3 font-medium"
            >
              Sign up for free
            </Button>

            <button
              onClick={onStayLoggedOut}
              className="w-full text-gray-400 hover:text-white transition-colors py-2 text-sm underline"
            >
              Stay logged out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
