'use client';
import { uploadFilesClient, deleteFileFromCloudinary, UploadedClientFile } from '@/services/api/cloudinary';
import { PdfApiService, AiApiService } from '@/services/api';
import type { ModelInfo } from '@/services/api/ai';
import { getContextStatus, calculateMessageTokens } from '@/services/api/context-manager';
import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Paperclip, X, StopCircle, Loader2, Globe, Image as ImageIcon, Code2, FileText, Table, CloudSun, FlaskConical, Wrench, SlidersHorizontal, Settings, Search, Palette, Square, PlusIcon } from 'lucide-react';
import DictationButton from '../ui/DictationButton';
import { LuCpu } from "react-icons/lu"
import { useSubscription } from '@/contexts/SubscriptionContext';
import { FaLock, FaLockOpen } from 'react-icons/fa';

interface ChatInputProps {
  input: string;
  setInput: (input: string) => void;
  files: UploadedClientFile[];
  setUploadedFiles: (files: UploadedClientFile[]) => void;
  sendMessage: (message: any) => Promise<void>;
  status: string;
  onStop: () => void;
  chatId: string;
  messages: any[];
  model: string;
  setModel: (model: string) => void;
}

export default function ChatInput({
  input,
  setInput,
  files,
  setUploadedFiles,
  sendMessage,
  status,
  onStop,
  chatId,
  messages,
  model,
  setModel
}: ChatInputProps) {
  const [preFile, setPreFile] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState<Boolean>(false)
  const [isDeleting, setIsDeleting] = useState<Boolean>(false)
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [isSending, setIsSending] = useState(false); // Add loading state for sending message
  const [isRecording, setIsRecording] = useState(false); // Handle recording state changes
  const [isGeneratingImage, setIsGeneratingImage] = useState(false); // Add loading state for image generation
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);

  // Subscription context
  const { hasAccess, subscription, isLoading } = useSubscription();
  
  // Local state for access control
  const [hasAdvancedToolsAccess, setHasAdvancedToolsAccess] = useState(false);
  const [hasOpenRouterAccess, setHasOpenRouterAccess] = useState(false);
  
  // Update access states when subscription context changes
  useEffect(() => {
    
    if (!isLoading) {
      const advancedAccess = hasAccess('advanced_tools');
      const openRouterAccess = hasAccess('openrouter');
      
      
      setHasAdvancedToolsAccess(advancedAccess);
      setHasOpenRouterAccess(openRouterAccess);
    } else {
      // Reset to false while loading
      setHasAdvancedToolsAccess(false);
      setHasOpenRouterAccess(false);
    }
  }, [isLoading, subscription, hasAccess]);
  
  const [error, setError] = useState<string>('')
  const [showErrorToast, setShowErrorToast] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [uploadedFileMetadata, setUploadedFileMetadata] = useState<UploadedClientFile[]>([]);
  const formRef = useRef<HTMLFormElement>(null);

  // Tools dropdown state and outside-click handler
  const [showTools, setShowTools] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [documentMode, setDocumentMode] = useState(false);
  const [imageGenerationMode, setImageGenerationMode] = useState(false);
  const [weatherMode, setWeatherMode] = useState(false);
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!showTools) return;
    const onDocClick = (e: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target as Node)) {
        setShowTools(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [showTools]);

  // Model dropdown state and outside-click handler
  const [showModelMenu, setShowModelMenu] = useState(false);
  const modelMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!showModelMenu) return;
    const onDocClick = (e: MouseEvent) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target as Node)) {
        setShowModelMenu(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [showModelMenu]);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      
      // Calculate the new height based on content
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 48), 200); // Min 48px, Max 200px
      textarea.style.height = `${newHeight}px`;
    }
  }, [input]);

  // Memoized values
  const isSubmitDisabled = useMemo(() => {
    return status === 'streaming' || 
           status === 'preparing' || 
           (!input.trim() && files.length === 0) || 
           isProcessingPdf || 
           isSending;
  }, [status, input, files.length, isProcessingPdf, isSending]);

  const isFileUploadDisabled = useMemo(() => {
    return webSearchEnabled || documentMode || imageGenerationMode || weatherMode;
  }, [webSearchEnabled, documentMode, imageGenerationMode, weatherMode]);

  const placeholderText = useMemo(() => {
    if (isRecording) return "Listening... Speak now...";
    if (isProcessingPdf) return "Processing document...";
    if (documentMode) return "Ask about your document...";
    if (imageGenerationMode) return "Describe the image you want to generate...";
    if (weatherMode) return "Enter a city name (e.g., London, New York, Tokyo)...";
    return "Ask me anything...";
  }, [isRecording, isProcessingPdf, documentMode, imageGenerationMode, weatherMode]);

  const containerClassName = useMemo(() => {
    // const baseClass ="flex flex-col sm:flex-col gap-1 bg-[#333333] sm:gap-2 md:gap-3 p-1.5 sm:p-2 md:p-3 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-4xl shadow-3xl  transition-all duration-300 ";
    const baseClass ="relative w-full px-4 py-4 pr-5 bg-[#2f2f2f] rounded-2xl text-white text-lg placeholder-gray-400 focus:outline-none focus:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
    if (isRecording) return `${baseClass} border-red-300 bg-gray-500/80`;
    if (documentMode) return `${baseClass} border-blue-300 bg-gray-500/80`;
    if (imageGenerationMode) return `${baseClass} border-purple-300 bg-purple-50/80`;
    if (weatherMode) return `${baseClass} border-cyan-300 bg-cyan-50/80`;
    return `${baseClass} border-white/20`;
  }, [isRecording, documentMode, imageGenerationMode, weatherMode]);
  // Load available models on component mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsLoadingModels(true);
        const response = await AiApiService.getAvailableModels();
        if (response.success) {
          setAvailableModels(response.data.models);
          // Set default model if not already set
          if (!model && response.data.defaultModel) {
            setModel(response.data.defaultModel);
          }
        }
      } catch (error) {
        console.error('Failed to load models:', error);
        // Fallback to static models
        setAvailableModels([
          { key: 'google', displayName: 'Google Gemini 2.5 Flash', provider: 'google', isDefault: true, isAvailable: true }
        ]);
      } finally {
        setIsLoadingModels(false);
      }
    };

    loadModels();
  }, []); // Only run once on mount, not when model changes

  // Debug model changes
  useEffect(() => {
  }, [model]);

  const modelOptions = useMemo(() => 
    availableModels.map(m => ({ 
      value: m.key, 
      label: m.displayName,
      provider: m.provider,
      isDefault: m.isDefault,
      isAvailable: m.isAvailable
    })), [availableModels]);

  const selectedModelLabel = useMemo(() => {
    return modelOptions.find(m => m.value === model)?.label || 'Google Gen AI (default)';
  }, [modelOptions, model]);

  // Context status check
  const contextStatus = useMemo(() => {
    return getContextStatus(messages, model);
  }, [messages, model]);

  const toolPrompts = useMemo(() => ({
    code: 'Write code for: ',
    doc: 'Analyze this document: ',
    csv: 'Analyze this CSV: ',
    weather: 'Weather in ',
    research: 'Deep research on: '
  }), []);

  // Callback functions
  const handleTranscript = (transcript: string) => {
    setInput(input + transcript);
  };

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPreFile(Array.from(e.target.files))
      try{
      setIsUploading(true)
      const upload = await uploadFilesClient(Array.from(e.target.files))|| [];
      if(upload){
        setUploadedFileMetadata(upload)
        setUploadedFiles(upload);
        setIsUploading(false)
        return;
      }
    }catch(error: any){
      console.error('File upload error:', error);
      let errorMessage = 'Failed to upload file';
      if (error.message) {
        errorMessage = `Upload failed: ${error.message}`;
      } else if (error.response?.data?.error) {
        errorMessage = `Server error: ${error.response.data.error}`;
      }
      setError(errorMessage);
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 8000);
      setIsUploading(false)
      return;
      }
      return;
    }
  }, [setUploadedFiles]);

  const handleDocumentChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('')
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setPreFile([file]);
      setDocumentMode(true);
      setWebSearchEnabled(false);
      setShowTools(false);
      setIsProcessingPdf(true); // Start PDF processing state

      try {
        // First, upload the PDF to Cloudinary
        const upload = await uploadFilesClient([file]);
        console.log("upload:", upload);
        if (upload && upload.length > 0) {
          const uploadedFile = upload[0];
          console.log("uploadedFile:", uploadedFile);
          // Now, send the URL to the new server-side analysis endpoint
          // try {
          //   const analysis = await PdfApiService.analyzePDF(uploadedFile.url, uploadedFile.filename);
          //   uploadedFile.pdfAnalysis = analysis;
          // } catch (analysisError) {
          //   console.warn("PDF analysis failed, continuing without analysis:", analysisError);
          //   // Continue without analysis - the AI can still work with the PDF URL
          // }
          setIsProcessingPdf(false); // End PDF processing state
          setUploadedFileMetadata([uploadedFile]);
          setUploadedFiles([uploadedFile]);
        }
      } catch (error: any) {
        console.error("PDF analysis error:", error);
        let errorMessage = 'Failed to upload or analyze document';
        if (error.message) {
          errorMessage = `Document processing failed: ${error.message}`;
        } else if (error.response?.data?.error) {
          errorMessage = `Server error: ${error.response.data.error}`;
        } else if (error.status) {
          errorMessage = `HTTP ${error.status}: ${error.statusText || 'Request failed'}`;
        }
        setDocumentMode(false)
        setError(errorMessage);
        setShowErrorToast(true);
        setPreFile([])
        setTimeout(() => setShowErrorToast(false), 8000);
      } finally {
        setIsProcessingPdf(false);
         // End PDF processing state
      }
    }
  }, [setUploadedFiles]);
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (status !== 'streaming' && (input.trim() || files.length > 0)) {
        formRef.current?.requestSubmit();
      }
    }
  };

  const removeFile = useCallback(async (index: number) => {
    // Get the metadata for the file being removed
    const fileMetadata = uploadedFileMetadata[index];
    setError('')
    
    // If we have a publicId, delete from Cloudinary
    if (fileMetadata?.publicId) {
      try {
        setIsDeleting(true)
        const deleted = await deleteFileFromCloudinary(fileMetadata.publicId);
        if (deleted) {
          setIsDeleting(false)
        } else {
          setIsDeleting(false)
        }
      } catch (error: any) {
        console.error('Error deleting file from Cloudinary:', error);
        let errorMessage = 'Failed to delete file';
        if (error.message) {
          errorMessage = `File deletion failed: ${error.message}`;
        } else if (error.response?.data?.error) {
          errorMessage = `Server error: ${error.response.data.error}`;
        }
        setError(errorMessage);
        setShowErrorToast(true);
        setTimeout(() => setShowErrorToast(false), 8000);
        setIsDeleting(false)
      }
    }

    // Remove from local state
    const newFiles = [...files];
    newFiles.splice(index, 1);
    const newMetadata = [...uploadedFileMetadata];
    newMetadata.splice(index, 1);
    
    setPreFile([]);
    setUploadedFileMetadata(newMetadata);
    setUploadedFiles(newFiles);
    
    // Reset document mode if no files left
    if (newFiles.length === 0) {
      setDocumentMode(false);
    }
  }, [files, uploadedFileMetadata, setUploadedFiles]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {

    setIsSending(true);
    e.preventDefault();
    
    if ((input.trim() || files.length > 0) && !isProcessingPdf && status !== 'streaming' && status !== 'preparing') {
      
      // Check if we're in image generation mode
      if (imageGenerationMode && input.trim()) {
        try {
          setIsGeneratingImage(true);
          
          
          // Create user message with the prompt and image generation flag
          const userMessage = {
            role: 'user',
            content: input.trim(),
            parts: [{ type: 'text', text: input.trim() }],
            files: [],
            metadata: { 
              chatId,
              model,
              isImageGeneration: true
            },
          };

          console.log("userMessage:", userMessage);

          // Clear input and modes
          setInput('');
          setImageGenerationMode(false);
          setIsGeneratingImage(false);

          // Send the user message - the sendMessage function will handle image generation
          await sendMessage(userMessage);
          
        } catch (error: any) {
          console.error('Error in image generation flow:', error);
          setIsGeneratingImage(false);
          setIsSending(false);
          
          // Provide detailed error message
          let errorMessage = 'Failed to process image generation request';
          if (error.message) {
            errorMessage = `Image generation failed: ${error.message}`;
          } else if (error.response?.data?.error) {
            errorMessage = `Server error: ${error.response.data.error}`;
          } else if (error.status) {
            errorMessage = `HTTP ${error.status}: ${error.statusText || 'Request failed'}`;
          }
          
          setError(errorMessage);
          setShowErrorToast(true);
          // Auto-hide error toast after 8 seconds
          setTimeout(() => setShowErrorToast(false), 8000);
          return;
        }
      } else {
        // Normal message handling
        const textPart = input.trim() ? [{ type: 'text', text: input }] : [];
        const fileParts = files.map(f => ({
          type: 'file',
          url: f.url,
          mediaType: f.mediaType,
          filename: f.filename
        }));
        console.log("submitting model:", model)
        const messageToSend = {
          content: input.trim(),
          parts: [...textPart, ...fileParts],
          metadata: { 
            chatId,
            model,
            enableWebSearch: webSearchEnabled,
            documentMode: documentMode, // Add document mode to metadata
            isWeatherEnabled: weatherMode // Add weather mode to metadata
          },
        };
        console.log("messageToSend:",messageToSend)
        
        // Clear input immediately before sending
        setInput('');
        setPreFile([]);
        setUploadedFiles([]);
        setDocumentMode(false); // Reset document mode after sending
        setWeatherMode(false); // Reset weather mode after sending

        try {
          console.log('Calling sendMessage...');
          await sendMessage(messageToSend);
          console.log('sendMessage completed, current status:', status);
        } catch (error) {
          console.error('Error sending message:', error);
          setIsSending(false);
        } finally {
          setIsSending(false);
        }
      }
      
      console.log("message:", messages);
    }
  }, [input, files, uploadedFileMetadata, isProcessingPdf, status, chatId, model, imageGenerationMode, documentMode, webSearchEnabled, setInput, setUploadedFiles, sendMessage, messages]);

  const handleToolSelect = useCallback((key: string) => {
    console.log("handleToolSelect")
    console.log("hasAdvancedToolsAccess:", hasAdvancedToolsAccess)
    console.log("isLoading:", isLoading)
    
    // Prevent any tool selection while subscription data is loading
    if (isLoading) {
      console.log('🔒 Tool selection blocked: Still loading subscription data');
      setError('Please wait while we load your subscription details...');
      setShowErrorToast(true);
      setShowTools(false);
      return;
    }
    
    // Check for restricted tools using local state
    if (key === 'research' && !hasAdvancedToolsAccess) {
      setError('Deep Research requires Pro+ or Ultra subscription. Please upgrade to access this feature.');
      setShowErrorToast(true);
      setShowTools(false);
      return;
    }
    
    if (key === 'generate-image' && !hasAdvancedToolsAccess) {
      setError('Image Generation requires Pro+ or Ultra subscription. Please upgrade to access this feature.');
      setShowErrorToast(true);
      setShowTools(false);
      return;
    }
    
    if (key === 'doc' && !hasAdvancedToolsAccess) {
      setError('Document Analysis requires Pro+ or Ultra subscription. Please upgrade to access this feature.');
      setShowErrorToast(true);
      setShowTools(false);
      return;
    }
    
    if (key === 'web') {
      if (!documentMode && !imageGenerationMode && !weatherMode) { // Only allow web search if not in other modes
        setWebSearchEnabled(!webSearchEnabled);
      }
      setShowTools(false);
      return;
    }
    
    if (key === 'image') {
      if (!documentMode && !imageGenerationMode && !weatherMode) { // Only allow image upload if not in other modes
        setShowTools(false);
        fileInputRef.current?.click();
      }
      return;
    }

    if (key === 'generate-image') {
      if (!documentMode && !webSearchEnabled && !weatherMode) { // Only allow image generation if not in other modes
        setImageGenerationMode(!imageGenerationMode);
        setWebSearchEnabled(false);
      }
      setShowTools(false);
      return;
    }

    if (key === 'weather') {
      if (!documentMode && !webSearchEnabled && !imageGenerationMode) { // Only allow weather if not in other modes
        setWeatherMode(!weatherMode);
        setWebSearchEnabled(false);
        setImageGenerationMode(false);
      }
      setShowTools(false);
      return;
    }

    if (key === 'doc') {
      if(!preFile.length && documentMode&&!webSearchEnabled && !imageGenerationMode) {
        console.log("documentMode:", documentMode);
        setDocumentMode(false);
        return;
      }
      setDocumentMode(true);
      setWebSearchEnabled(false); // Disable web search when document mode is enabled
      setImageGenerationMode(false); // Disable image generation when document mode is enabled
      setWeatherMode(false); // Disable weather when document mode is enabled
      setShowTools(false);
      documentInputRef.current?.click();
      return;
    }
    
    if (!documentMode && !imageGenerationMode && !weatherMode) { // Only add prompts if not in other modes
      const p = toolPrompts[key as keyof typeof toolPrompts] ?? '';
      setInput(input ? input + '\n' + p : p);
    }
    setShowTools(false);
  }, [documentMode, webSearchEnabled, imageGenerationMode, weatherMode, preFile.length, toolPrompts, input, setInput, hasAdvancedToolsAccess, isLoading]);

  const handleModelSelect = (modelValue: string) => {
    console.log(' Model selection:', { 
      previous: model, 
      new: modelValue, 
      available: availableModels.map(m => m.key) 
    });
    console.log("hasOpenRouterAccess:", hasOpenRouterAccess)
    console.log("isLoading:", isLoading)
    
    // Prevent model selection while subscription data is loading
    if (isLoading) {
      console.log('🔒 Model selection blocked: Still loading subscription data');
      setError('Please wait while we load your subscription details...');
      setShowErrorToast(true);
      setShowModelMenu(false);
      return;
    }
    
    // Check if the selected model is restricted using local state
    const selectedModel = modelOptions.find(m => m.value === modelValue);
    if (selectedModel?.provider === 'openrouter' && !hasOpenRouterAccess) {
      setError('OpenRouter models require Pro+ or Ultra subscription. Please upgrade to access these models.');
      setShowErrorToast(true);
      setShowModelMenu(false);
      return;
    }
    
    setModel(modelValue);
    setShowModelMenu(false);
  };

  // Simple functions - no memoization needed
  const handleToolsToggle = () => {
    setShowTools(v => !v);
  };

  const handleModelMenuToggle = () => {
    setShowModelMenu(v => !v);
  };

  const handleFileInputClick = () => {
    fileInputRef.current?.click();
  };

  const handleDocumentInputClick = () => {
    documentInputRef.current?.click();
  };

  // Add effect to clear loading state when streaming actually starts
  useEffect(() => {
    console.log('Status changed:', status, 'isSending:', isSending);
    if (status === 'streaming' && isSending) {
      console.log('Clearing isSending state');
      setIsSending(false);
    }
  }, [status, isSending]);

  // Fallback: Clear isSending after a reasonable timeout to prevent stuck state
  useEffect(() => {
    if (isSending) {
      const timeout = setTimeout(() => {
        console.log('Timeout: Clearing isSending state after 10 seconds');
        setIsSending(false);
      }, 5000); // 10 seconds timeout

      return () => clearTimeout(timeout);
    }
  }, [isSending]);




  return (
    <div className={`sticky mt-3 bottom-0 z-10 pb-1 sm:pb-2 md:pb-4 lg:pb-6 px-4 sm:px-6 md:px-12 lg:px-20 xl:px-30 2xl:px-40 ${messages.length > 0 ? 'bg-[#212121]' : 'bg-transparent'}`}>
      {/* Context Warning */}
      {contextStatus.status !== 'ok' && (
        <div className={`mx-1 sm:mx-2 md:mx-4 mb-1.5 sm:mb-2 md:mb-3 p-1.5 sm:p-2 md:p-3 rounded-lg text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 border border-gray-400 shadow-md ${
          contextStatus.status === 'danger' 
            ? 'bg-red-100 border border-red-200 text-red-700' 
            : 'bg-yellow-100 border border-yellow-200 text-yellow-700'
        }`}>
          <div className="flex-1">
            <span className="font-medium">
              {contextStatus.percentage}% of context used
            </span>
            <span className="ml-1 sm:ml-2">{contextStatus.message}</span>
          </div>
          <span className="text-xs opacity-75">
            {contextStatus.currentTokens.toLocaleString()}/{contextStatus.limit.toLocaleString()} tokens
          </span>
        </div>
      )}

      {/* Error Toast Notification */}
      {showErrorToast && error && (
        <div className="fixed top-1 sm:top-2 md:top-4 right-1 sm:right-2 md:right-4 z-50 max-w-[260px] sm:max-w-[280px] md:max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg shadow-lg p-2 sm:p-3 md:p-4 animate-in slide-in-from-right duration-300">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-1.5 sm:ml-2 md:ml-3 flex-1">
                <h3 className="text-xs sm:text-sm font-medium text-red-800">Error</h3>
                <div className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-red-700">{error}</div>
                {/* Add upgrade button for subscription-related errors */}
                {(error.includes('Pro+') || error.includes('Ultra') || error.includes('subscription')) && (
                  <button
                    onClick={() => window.open('/settings', '_blank')}
                    className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded transition-colors"
                  >
                    Upgrade Subscription
                  </button>
                )}
              </div>
              <div className="ml-1.5 sm:ml-2 md:ml-4 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowErrorToast(false);
                    setError('');
                  }}
                  className="inline-flex text-red-400 hover:text-red-600"
                >
                  <X className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <form ref={formRef} onSubmit={handleSubmit}>
        {/* File preview section */}
        {preFile.length > 0 && (
          <div className="mb-1.5 sm:mb-2 p-1.5 sm:p-2 bg-[#2f2f2f] rounded-lg border border-gray-200">
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {preFile.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="flex items-center gap-1 sm:gap-2 p-1 sm:p-1.5 md:p-2  rounded border border-gray-200 hover:bg-gray-500/80">
                    {file.type === 'application/pdf' && (
                      <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-red-600" />
                    )}
                    <div className="text-xs sm:text-sm text-gray-100 truncate max-w-[70px] sm:max-w-[80px] md:max-w-[100px] lg:max-w-[120px]">
                      {file.name}
                    </div>
                    <div className="text-xs text-gray-400 hidden sm:block">
                      {(file.size / (1024 * 1024)).toFixed(2)}MB
                    </div>
                    {(!isUploading && !isProcessingPdf && !isDeleting) && (
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                      </button>
                    )}
                  </div>
                  {error && (
                    <div className='flex items-center bg-red-50 border border-red-200 rounded-lg p-3 mb-2'>
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Error</h3>
                        <div className="mt-1 text-sm text-red-700">{error}</div>
                      </div>
                      <div className="ml-auto pl-3">
                        <button
                          type="button"
                          onClick={() => setError('')}
                          className="inline-flex text-red-400 hover:text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                  {
                    isUploading && (<div className='flex items-center bg-white rounded border '>
                      <p className='ml-2 text-gray-500 '>Parsing...</p>
                    </div>)
                  }
                  {
                    isProcessingPdf && (<div className='flex items-center bg-white rounded border '>
                      <p className='ml-2 text-gray-500 '>Processing Document...</p>
                    </div>)
                  }
                  {
                    isDeleting && (<div className='flex items-center bg-white rounded border '>
                      <p className='ml-2 text-gray-500 '>Removing {file.type === 'application/pdf' ? 'Document' : 'Image'}</p>
                    </div>)
                  }
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recording indicator */}
        {isRecording && (
          <div className="mb-1.5 sm:mb-2 p-1.5 sm:p-2 md:p-3 bg-gray-500 border border-red-200 rounded-lg flex items-center gap-1.5 sm:gap-2">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-gray-100 text-xs sm:text-sm font-medium">Recording... Speak now</span>
          </div>
        )}

          {/* Main input container */}
          <div className={containerClassName}>
            
            {/* Plus button - Left side */}
            

            {/* Main textarea container */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={status === 'streaming' || isProcessingPdf}
                placeholder={placeholderText}
                className="w-full bg-transparent text-white placeholder-white text-sm sm:text-base outline-none resize-none overflow-hidden max-h-[120px] sm:max-h-[150px] md:max-h-[200px] min-h-[40px] sm:min-h-[48px] px-2 py-2 sm:py-3"
                rows={1}
              />
            </div>

            {/* Right side buttons */}
            <div className='flex flex-row justify-between'>
            <div className="flex relative justify-center" ref={toolsMenuRef}>
              <button
                type="button"
                onClick={handleToolsToggle}
                // className="px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2 text-xs sm:text-sm text-gray-700 hover:bg-[#555555] rounded-full hover:text-blue-600 hover:border-blue-400 transition-colors relative group/tooltip"
                className="flex border border-gray-600  items-center gap-2 px-3 py-2   bg-[#2f2f2f] hover:bg-[#3f3f3f]  text-gray-400 rounded-lg transition-colors"
                title={(() => {
                  const activeTools = [];
                  if (webSearchEnabled) activeTools.push('Web Search');
                  if (documentMode) activeTools.push('Document Analysis');
                  if (imageGenerationMode) activeTools.push('Image Generation');
                  if (weatherMode) activeTools.push('Weather');
                  
                  if (activeTools.length === 0) {
                    return "Tools & Options";
                  } else {
                    return `Active: ${activeTools.join(', ')}`;
                  }
                })()}
              >
                <div className="flex items-center gap-1 sm:gap-2 justify-center text-white">
                  {(() => {
                    const activeTools = [];
                    if (webSearchEnabled) activeTools.push({ icon: Globe, label: 'Web Search' });
                    if (documentMode) activeTools.push({ icon: FileText, label: 'Document' });
                    if (imageGenerationMode) activeTools.push({ icon: ImageIcon, label: 'Image Gen' });
                    if (weatherMode) activeTools.push({ icon: CloudSun, label: 'Weather' });
                    
                    if (activeTools.length === 0) {
                      return <PlusIcon className="w-6 h-6" />;
                    } else if (activeTools.length === 1) {
                      const ToolIcon = activeTools[0].icon;
                      return <ToolIcon className="w-6 h-6" />;
                    } else {
                      return (
                        <div className="flex items-center gap-1">
                          {activeTools.slice(0, 2).map((tool, index) => {
                            const ToolIcon = tool.icon;
                            return <ToolIcon key={index} className="w-4 h-4" />;
                          })}
                          {activeTools.length > 2 && <span className="text-xs">+{activeTools.length - 2}</span>}
                        </div>
                      );
                    }
                  })()}
                </div>
              </button>
              {showTools && (
                <div className="absolute bottom-full left-0 mb-2 w-48 sm:w-56 md:w-64 lg:w-80 bg-[#222222] rounded-xl border border-gray-200 shadow-lg p-1.5 sm:p-2 z-20">

                  <div className="flex flex-col">
                    {/* File input at the top */}
                    <button
                    type="button"
                    onClick={handleFileInputClick}
                    disabled={isFileUploadDisabled}
                    className={`p-1 text-gray-100 sm:p-1.5 md:p-2 transition-colors relative group/tooltip hover:bg-gray-600/80  rounded-lg ${
                      isFileUploadDisabled
                        ? 'text-gray-300 cursor-not-allowed' 
                        : 'text-gray-100 hover:text-blue-300'
                    }`}
                    title={
                      documentMode 
                        ? "Image upload disabled in document mode"
                        : webSearchEnabled 
                        ? "File upload disabled when web search is enabled"
                        : weatherMode
                        ? "File upload disabled in weather mode"
                        : "Attach files"
                    }
                  >
                    
                   
                    <span className="flex items-center gap-2">
                    <Paperclip className="w-5 h-5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                        Upload image
                       
                      </span>
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                      {documentMode 
                        ? "Image upload disabled in document mode"
                        : webSearchEnabled 
                        ? "File upload disabled when web search is enabled"
                        : weatherMode
                        ? "File upload disabled in weather mode"
                        : "Attach Files"
                    }
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      multiple
                      className="hidden"
                      accept="image/*"
                    />
                  </button>
                    
                    {/* Document Analysis */}
                    <button
                      onClick={() => !isLoading ? handleToolSelect('doc') : null}
                      disabled={imageGenerationMode || webSearchEnabled || weatherMode || isLoading || !hasAdvancedToolsAccess}
                      className={`flex text-gray-100 items-center justify-between w-full gap-2 px-3 py-2 rounded-lg transition-colors ${
                        imageGenerationMode || webSearchEnabled || weatherMode || isLoading || !hasAdvancedToolsAccess
                          ? 'opacity-50 cursor-not-allowed text-gray-400'
                          : documentMode
                          ? 'bg-gray-400/80 text-gray-100 hover:bg-gray-500/80'
                          : 'hover:bg-blue-100 hover:text-gray-900'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Document Analysis
                        {documentMode && <span className="text-xs font-medium">(ON)</span>}
                      </span>
                      {isLoading ? (
                        <div className="w-3 h-3 animate-spin rounded-full border border-gray-400 border-t-transparent" title="Loading subscription..." />
                      ) : !hasAdvancedToolsAccess ? (
                        <FaLock className="w-3 h-3 text-yellow-400" title="Requires Pro+ or Ultra subscription" />
                      ) : (
                        <FaLockOpen className="w-3 h-3 text-green-400" title="Available with your subscription" />
                      )}
                    </button>
                    
                    {/* Web Search */}
                    <button
                      onClick={() => handleToolSelect('web')}
                      disabled={documentMode || weatherMode}
                      className={`flex text-gray-100 items-center justify-between w-full gap-2 px-3 py-2 rounded-lg transition-colors ${
                        documentMode || weatherMode
                          ? 'opacity-50 cursor-not-allowed text-gray-400'
                          : webSearchEnabled
                          ? 'bg-cyan-200 text-cyan-700 hover:bg-cyan-200'
                          : 'hover:bg-cyan-100 hover:text-gray-900'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Web Search
                        {webSearchEnabled && !documentMode && !weatherMode && <span className="text-xs font-medium">(ON)</span>}
                      </span>
                    </button>
                    
                    {/* Weather */}
                    
                    
                    {/* Image Generation */}
                   
                    {/* Deep Research */}
                    <button
                      onClick={() => !isLoading ? handleToolSelect('research') : null}
                      disabled={documentMode || imageGenerationMode || weatherMode || isLoading || !hasAdvancedToolsAccess}
                      className={`flex items-center justify-between w-full gap-2 px-3 py-2 rounded-lg transition-colors ${
                        documentMode || imageGenerationMode || weatherMode || isLoading || !hasAdvancedToolsAccess
                          ? 'opacity-50 cursor-not-allowed text-gray-400'
                          : 'hover:bg-blue-100 hover:text-gray-900'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <FlaskConical className="w-4 h-4" />
                        Deep Research
                      </span>
                      {isLoading ? (
                        <div className="w-3 h-3 animate-spin rounded-full border border-gray-400 border-t-transparent" title="Loading subscription..." />
                      ) : !hasAdvancedToolsAccess ? (
                        <FaLock className="w-3 h-3 text-yellow-400" title="Requires Pro+ or Ultra subscription" />
                      ) : (
                        <FaLockOpen className="w-3 h-3 text-green-400" title="Available with your subscription" />
                      )}
                    </button>
                    
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 sm:gap-2 md:gap-3">

            {/* Hidden document input */}
            <input
              type="file"
              ref={documentInputRef}
              onChange={handleDocumentChange}
              className="hidden"
              accept="application/pdf,.pdf,.doc,.docx,.txt"
            />
            <div className='flex flex-row justify-start ml-2'>
              {messages.length > 0 && (
              <div className="flex items-center mr-2">
                {(() => {
                  const contextStatus = getContextStatus(messages, model);
                  const percentage = contextStatus.percentage;
                  
                  // Determine color based on usage
                  let colorClass = 'text-gray-200';
                  let bgColorClass = 'bg-green-400';
                  if (percentage >= 90) {
                    colorClass = 'text-red-400';
                    bgColorClass = 'bg-red-400';
                  } else if (percentage >= 70) {
                    colorClass = 'text-yellow-400';
                    bgColorClass = 'bg-yellow-400';
                  }
                  
                  return (
                    <div className="relative group/tooltip">
                      <div className="flex items-center gap-1.5 bg-[#2f2f2f] 600">
                        {/* Circular progress indicator */}
                        <div className="relative w-8 h-8">
                          <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 16 16">
                            {/* Background circle */}
                            <circle
                              cx="8"
                              cy="8"
                              r="6"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              fill="none"
                              className="text-gray-600"
                            />
                            {/* Progress circle */}
                            <circle
                              cx="8"
                              cy="8"
                              r="6"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              fill="none"
                              strokeDasharray={`${2 * Math.PI * 6}`}
                              strokeDashoffset={`${2 * Math.PI * 6 * (1 - percentage / 100)}`}
                              className={colorClass}
                              strokeLinecap="round"
                            />
                          </svg>
                        </div>
                        {/* Percentage text */}
                        
                      </div>
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 whitespace-nowrap z-20 border border-gray-600">
                        <div className="space-y-1">
                          <div>
                          <span className={`text-xs font-medium ${colorClass}`}>
                           {percentage}%-
                        </span>
                        Context: {contextStatus.currentTokens.toLocaleString()} / {contextStatus.limit.toLocaleString()} tokens 
                          </div>
                          <div className="text-gray-300">{contextStatus.message}</div>
                          {percentage >= 70 && (
                            <div className="text-yellow-300 text-xs mt-1">
                              Context management may be applied
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
            </div>
            
            {/* Dictation button */}
            <DictationButton
              onTranscript={handleTranscript}
              onRecordingChange={setIsRecording}
              disabled={status === 'streaming' || isProcessingPdf}
              size="md"
              showTooltip={true}
            />

            {/* Context Usage Indicator */}
            

            {/* Submit or stop button */}
            {status === 'streaming' ? (
              
              <button
                type="button"
                onClick={onStop}
                className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-3 bg-gradient-to-r from-gray-500 to-gray-500 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 transition-colors flex items-center justify-center relative group/tooltip"
                title="Stop Generation"
              >
                <div>
           
                <Square className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-red-400 bg-red-400 rounded-sm " >
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                  Stop Generation
                </div>
                </Square>
                
                </div>
              </button>
            ) : (!isRecording && (
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="px-2 sm:px-3 sm:py-2 md:py-3 bg-white text-black rounded-full hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-colors flex items-center justify-center relative group/tooltip"
                title="Send Message"
              >
                {(isSending || status === 'preparing') ? (
                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 animate-spin" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg> 
                  // <ArrowUp01 className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-red-400 bg-red-400 rounded-sm " ></ArrowUp01>
                )}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                  {(isSending || status === 'preparing') ? 'Sending...' : 'Send Message'}
                </div>
              </button>
            ))}
            </div>
            
            </div>
          </div>
      </form>
      <div className="flex justify-center">
        <span className="text-xs text-gray-100 ">
          ChatGPT can make mistakes. Check important info. See Cookie Preferences.
        </span>
      </div>
      
    </div>
  );
}