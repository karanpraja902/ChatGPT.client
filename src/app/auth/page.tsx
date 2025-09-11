"use client";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Apple, Phone } from "lucide-react";

const AuthPage = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleEmailContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    
    try {
      // Here you would typically check if the email exists and route to either login or signup
      // For now, we'll just redirect to the sign-in page with the email
      router.push(`/sign-in?email=${encodeURIComponent(email)}`);
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const { AuthClient } = await import('@/lib/auth-client');
      await AuthClient.initiateGoogleLogin();
    } catch (error) {
      console.error(error);
      toast.error("Failed to initialize Google login");
    }
  };

  const handleMicrosoftAuth = () => {
    toast("Microsoft Account login coming soon!", {
      icon: "🚧",
    });
  };

  const handleAppleAuth = () => {
    toast("Apple login coming soon!", {
      icon: "🚧",
    });
  };

  const handlePhoneAuth = () => {
    toast("Phone login coming soon!", {
      icon: "🚧",
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-[400px] space-y-6">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">ChatGPT</h1>
        </div>

        {/* Main heading */}
        <div className="text-center">
          <h2 className="text-2xl font-medium text-gray-900">
            Log in or sign up
          </h2>
          <p className="mt-3 text-sm text-gray-600">
            You&apos;ll get smarter responses and can upload<br />
            files, images, and more.
          </p>
        </div>

        {/* Email form */}
        <form onSubmit={handleEmailContinue} className="mt-8 space-y-4">
          <div>
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-3 text-base border-gray-300 rounded-lg focus:border-gray-400 focus:ring-0"
              disabled={isLoading}
            />
          </div>
          
          <Button
            type="submit"
            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 rounded-full disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Continue"}
          </Button>
        </form>

        {/* OR divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-4 text-gray-500">OR</span>
          </div>
        </div>

        {/* Social login buttons */}
        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            className="w-full relative border-gray-300 hover:bg-gray-50 text-gray-700 font-normal py-3 rounded-lg"
            onClick={handleGoogleAuth}
          >
            <svg className="absolute left-4 h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full relative border-gray-300 hover:bg-gray-50 text-gray-700 font-normal py-3 rounded-lg"
            onClick={handleMicrosoftAuth}
          >
            <svg className="absolute left-4 h-5 w-5" viewBox="0 0 21 21">
              <rect x="0" y="0" width="10" height="10" fill="#f25022"/>
              <rect x="11" y="0" width="10" height="10" fill="#7fba00"/>
              <rect x="0" y="11" width="10" height="10" fill="#00a4ef"/>
              <rect x="11" y="11" width="10" height="10" fill="#ffb900"/>
            </svg>
            Continue with Microsoft Account
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full relative border-gray-300 hover:bg-gray-50 text-gray-700 font-normal py-3 rounded-lg"
            onClick={handleAppleAuth}
          >
            <Apple className="absolute left-4 h-5 w-5" />
            Continue with Apple
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full relative border-gray-300 hover:bg-gray-50 text-gray-700 font-normal py-3 rounded-lg"
            onClick={handlePhoneAuth}
          >
            <Phone className="absolute left-4 h-4 w-4" />
            Continue with phone
          </Button>
        </div>

        {/* Terms and Privacy */}
        <div className="text-center pt-4">
          <p className="text-xs text-gray-500">
            By continuing, you agree to our{" "}
            <a href="#" className="underline hover:text-gray-700">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="underline hover:text-gray-700">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
