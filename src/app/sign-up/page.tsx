"use client";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Eye, EyeOff, Lock, Mail, User, AlertCircle, CheckCircle, Apple, Phone } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import toast from "react-hot-toast";

const SignUpPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isEmailValid, setIsEmailValid] = useState(false);

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Email validation function
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle email input change with validation
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const emailValue = e.target.value;
    setEmail(emailValue);

    if (emailValue === "") {
      setEmailError("");
      setIsEmailValid(false);
    } else if (!validateEmail(emailValue)) {
      setEmailError("Please enter a valid email address");
      setIsEmailValid(false);
    } else {
      setEmailError("");
      setIsEmailValid(true);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email before submission
    if (!validateEmail(email)) {
        toast.error('Please enter a valid email address');
        return;
    }
    
    if (password !== confirmPassword) {
        toast.error('Passwords do not match');
        return;
    }

    setIsLoading(true);
    
    try {
        console.log("register request", name, email, password);
        const { AuthClient } = await import('@/lib/auth-client');
        const response = await AuthClient.register(name, email, password);
        
        if (response.success) {
            toast.success(response.message || "Registration successful!");
            return window.location.href = '/chat/new';
        } else {
            toast.error(response.error || "Registration failed");
            return window.location.href = '/sign-in?error=Registration failed';
        }
    } catch (error: unknown) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : "Error during registration";
        toast.error(errorMessage);
    } finally {
        setIsLoading(false);
    }
};

const handleGoogleSignUp = async () => {
    const { AuthClient } = await import('@/lib/auth-client');
    await AuthClient.initiateGoogleLogin();
};



  const handleMicrosoftSignUp = async () => {
    toast.success("Redirecting to Microsoft login...");
  };

  const handleAppleSignUp = async () => {
    toast.success("Redirecting to Apple login...");
  };

  const handlePhoneSignUp = async () => {
    toast.success("Redirecting to Phone login...");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center">
      <nav className="w-full flex items-center h-16 px-6 text-lg">
        <span className="font-semibold">ChatGPT</span>
      </nav>
      <div className="flex-1 flex flex-col justify-center items-center w-full">
        <form
          className="w-full max-w-md mt-8 bg-white shadow-xl rounded-xl p-8"
          onSubmit={handleSubmit}
        >
          <h1 className="text-3xl font-bold text-center mb-2 text-gray-900">Sign up</h1>
          <p className="text-sm text-gray-700 mb-6 text-center">
            You’ll get smarter responses and can upload files, images, and more.
          </p>
          <div className="space-y-3">
            {/* Name */}
            <div className="relative">
              <Input
                id="name"
                placeholder="Full name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="pl-10"
                required
              />
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
            {/* Email */}
            <div className="relative">
              <Input
                id="email"
                placeholder="Email address"
                type="email"
                value={email}
                onChange={handleEmailChange}
                className={`pl-10 pr-10 ${emailError ? "border-red-500" : isEmailValid ? "border-green-500" : ""}`}
                required
              />
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              {email && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isEmailValid ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : emailError ? (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  ) : null}
                </div>
              )}
            </div>
            {emailError && (
              <p className="text-xs text-red-500 ml-1 flex items-center gap-1 mt-0">
                <AlertCircle className="w-3 h-3" />
                {emailError}
              </p>
            )}
            {/* Use different email */}
            <div className="text-right -mt-2 mb-1">
              <button
                type="button"
                className="text-xs text-blue-600 hover:underline"
                onClick={() => setEmail("")}
              >
                Use a different email
              </button>
            </div>
            {/* Password */}
            <div className="relative">
              <Input
                id="password"
                placeholder="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="pl-10 pr-10"
                required
              />
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {/* Confirm password */}
            <div className="relative">
              <Input
                id="confirmPassword"
                placeholder="Confirm password"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="pl-10 pr-10"
                required
              />
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <button
                type="button"
                onClick={() => setShowConfirm(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Button
              type="submit"
              className="w-full bg-black text-white rounded-full font-medium hover:bg-gray-900 mt-1"
              disabled={isLoading || !isEmailValid || !name.trim() || !password || !confirmPassword}
            >
              {isLoading ? "Creating account..." : "Sign up"}
            </Button>
          </div>
          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="mx-3 text-gray-400 text-xs">OR</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>
          {/* Social buttons */}
          <Button
            type="button"
            onClick={handleGoogleSignUp}
            className="w-full flex items-center mb-2 border bg-white hover:bg-gray-50 text-gray-700"
            variant="outline"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48"><g>
              <path
                d="M44.5,20H24v8.5h11.8C34.9,32.7,30.1,36,24,36c-6.6,0-12-5.4-12-12c0-6.6,5.4-12,12-12c3.1,0,6,1.2,8.2,3.1 l6.2-6.2C34.1,7.1,29.3,5,24,5C12.9,5,4,13.9,4,25s8.9,20,20,20s20-8.9,20-20C44,22.3,44.3,21.1,44.5,20z"
                fill="#FFC107" />
              <path
                d="M6.3,14.2l7,5.1C15.1,16.9,19.3,14,24,14c3.1,0,6,1.2,8.2,3.1l6.2-6.2C34.1,7.1,29.3,5,24,5 C16.3,5,9.7,9.7,6.3,14.2z"
                fill="#FF3D00" />
              <path
                d="M24,44c5.1,0,9.7-1.7,13.3-4.6l-6.3-5.2c-2.3,1.4-5.2,2.2-9,2.2c-6.6,0-12-5.4-12-12c0-1.1,0.2-2.1,0.4-3.1 L6.3,32.9C9.7,37.3,16.3,44,24,44z"
                fill="#4CAF50" />
              <path
                d="M44.5,20H24v8.5h11.8c-1,2.9-3.8,5-7.8,5c-6.6,0-12-5.4-12-12c0-6.6,5.4-12,12-12c3.1,0,6,1.2,8.2,3.1l6.2-6.2 C41.2,7.1,44,10.2,44.5,20z"
                fill="#1976D2" />
            </g></svg>
            Continue with Google
          </Button>
          <Button
            type="button"
            onClick={handleMicrosoftSignUp}
            className="w-full flex items-center mb-2 border bg-white hover:bg-gray-50 text-gray-700"
            variant="outline"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <rect fill="#f25022" x="2" y="2" width="9" height="9" />
              <rect fill="#7fba00" x="13" y="2" width="9" height="9" />
              <rect fill="#00a4ef" x="2" y="13" width="9" height="9" />
              <rect fill="#ffb900" x="13" y="13" width="9" height="9" />
            </svg>
            Continue with Microsoft Account
          </Button>
          <Button
            type="button"
            onClick={handleAppleSignUp}
            className="w-full flex items-center mb-2 border bg-white hover:bg-gray-50 text-gray-700"
            variant="outline"
          >
            <Apple className="w-5 h-5 mr-2" />
            Continue with Apple
          </Button>
          <Button
            type="button"
            onClick={handlePhoneSignUp}
            className="w-full flex items-center border bg-white hover:bg-gray-50 text-gray-700"
            variant="outline"
          >
            <Phone className="w-5 h-5 mr-2" />
            Continue with phone
          </Button>
        </form>
        {/* Issues footer */}
        <div className="fixed left-6 bottom-4">
          <button className="flex items-center bg-red-600 text-white px-4 py-2 rounded-full text-sm shadow-lg hover:bg-red-700">
            <span className="bg-white text-red-600 rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs mr-2">N</span>
            2 Issues
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
