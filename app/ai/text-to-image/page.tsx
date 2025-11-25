"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import PaymentModal from "@/components/Modals/PaymentModal";
import { useTranslation } from 'react-i18next';
import { toast, Toaster } from 'react-hot-toast';
import { Copy, Check, ArrowUp, Image as ImageIcon, RefreshCw, Trash, Pencil, Plus, Menu, Download, X, Sparkles } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Link from "next/link";
import TextType from "@/components/TextType";

type CreditsRecord = {
  users_credits_id: number;
  user_id: number;
  plan_id: number;
  plan_name: string;
  period: "day" | "month" | "year" | string;
  total_credits: number;
  remaining_credits: number;
  endedAt: string;
  createdAt: string;
  plan?: { plan_id: number; plan_name: string; period: string; credits_per_image: number; tokens_per_credit: number };
};

const PROMPT_PRESETS: { labelKey: string; value: string }[] = [
  { labelKey: "ai.default", value: "" },
  { labelKey: "ai.photorealistic", value: "photorealistic style, ultra-detailed, 8k" },
  { labelKey: "ai.anime", value: "anime style, vibrant colors, dynamic lighting" },
  { labelKey: "ai.oilPainting", value: "oil painting, canvas texture, baroque lighting" },
  { labelKey: "ai.pixelArt", value: "pixel art, low resolution, retro palette" },
];

const IMAGE_SIZES: { labelKey: string; value: string; creditsMultiplier: number }[] = [
  { labelKey: "ai.square", value: "1024x1024", creditsMultiplier: 1 },
  { labelKey: "ai.landscape", value: "1792x1024", creditsMultiplier: 1.5 },
  { labelKey: "ai.portrait", value: "1024x1792", creditsMultiplier: 1.5 },
];

export default function TextToImagePage() {
  const { t } = useTranslation();
  const [balance, setBalance] = useState<CreditsRecord | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [preset, setPreset] = useState(PROMPT_PRESETS[0].value);
  const [imageSize, setImageSize] = useState(IMAGE_SIZES[0].value);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageB64, setImageB64] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showBuyModal, setShowBuyModal] = useState(false);

  const [plans, setPlans] = useState<Array<{ plan_id: number; plan_name: string; credits_per_period: number; amount: string; period: string }>>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [imageHistory, setImageHistory] = useState<Array<{ image_id: number; prompt: string; style: string; cloudinary_url: string; image_size: string; created_at: string }>>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Image-to-prompt states
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  // Tab system
  const [activeTab, setActiveTab] = useState<'text-to-image' | 'image-to-prompt' | 'chat'>('text-to-image');
  
  // Copy functionality
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  // Chat states (threaded AI chat)
  const [threads, setThreads] = useState<Array<{ thread_id: number; title: string | null; updatedAt: string }>>([]);
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Array<{ id: string; role: "user" | "assistant"; content: string; timestamp: Date; image?: string }>>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [estimatedCredits, setEstimatedCredits] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isTypingRef = useRef(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [chatImage, setChatImage] = useState<string | null>(null);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const [editingThreadId, setEditingThreadId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL, []);

  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem("a");
    }
    return null;
  };

  const fetchBalance = async () => {
    if (!apiBase) return;
    const token = getToken();
    setLoadingBalance(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/credits/me/balance`, { headers: { 'Authorization': token as any, 'Content-Type': 'application/json', "User-Client": (global as any)?.clientId1328 } });
      if (res.status === 200) {
        const data = (await res.json()) as CreditsRecord | null;
        setBalance(data);
      } else if (res.status === 401) {
        setError(t('ai.pleaseSignIn'));
      } else {
        setError(t('ai.couldNotLoadCredits'));
      }
    } catch (e: any) {
      setError("");
    } finally {
      setLoadingBalance(false);
    }
  };

  const [clientReady, setClientReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const ensureClientId = async () => {
      try {
        if (!(global as any)?.clientId1328) {
          const fp = await FingerprintJS.load();
          const result = await fp.get();
          (global as any).clientId1328 = result.visitorId;
        }
        if (!cancelled) setClientReady(true);
      } catch (_) {
        if (!cancelled) setClientReady(false);
      }
    };
    ensureClientId().then(() => {
    fetchBalance();
    void loadPlans();

    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPlans = async () => {
    if (!apiBase) return;
    setLoadingPlans(true);
    try {
      const res = await fetch(`${apiBase}/api/credits/plans`);
      if (res.status === 200) {
        const data = await res.json();
        setPlans(data);
      }
    } finally {
      setLoadingPlans(false);
    }
  };

  const loadImageHistory = async () => {
    if (!apiBase) return;
    setLoadingHistory(true);
    try {
      const token = getToken();
      const res = await fetch(`${apiBase}/api/ai/user-images`, {
        headers: { 'Authorization': token as any, 'Content-Type': 'application/json', "User-Client": (global as any)?.clientId1328 }
      });
      if (res.status === 200) {
        const data = await res.json();
        setImageHistory(data.images || []);
      }
    } catch (e) {
     
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadImageById = async (imageId: number) => {
    if (!apiBase) return;
    try {
      const token = getToken();
      const res = await fetch(`${apiBase}/api/ai/user-images/${imageId}`, {
        headers: { 'Authorization': token as any, 'Content-Type': 'application/json', "User-Client": (global as any)?.clientId1328 }
      });
      if (res.status === 200) {
        const data = await res.json();
        setImageB64(data.cloudinary_url);
        setPrompt(data.prompt);
        setPreset(data.style || "");
        setImageSize(data.image_size || "1024x1024");
      }
    } catch (e) {
     
    }
  };

  const openBuyModal = () => {
    setShowBuyModal(true);
  };

  const closeBuyModal = () => setShowBuyModal(false);

  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ plan_id: number; plan_name: string; credits_per_period: number; amount: string; period: string } | null>(null);

  const onSelectPlan = async (plan_id: number) => {
    const plan = plans.find(p => p.plan_id === plan_id) || null;
    if (!plan) return;
    setSelectedPlan(plan);
    setShowBuyModal(false);
    setOpenPaymentModal(true);
  };

  const selectedSize = IMAGE_SIZES.find(size => size.value === imageSize);
  const baseCredits = balance?.plan?.credits_per_image ?? 1;
  const creditsNeeded = selectedSize ? Math.ceil(baseCredits * selectedSize.creditsMultiplier) : baseCredits;
  const canGenerate = clientReady && !!balance && balance.remaining_credits >= creditsNeeded && !!prompt && !isGenerating;

  const checkCreditsAndShowToast = () => {
    
    
    if (!balance) {
      
      toast.error(t('ai.noActiveCredits'));
      return false;
    }

    if (balance.remaining_credits === 0) {
      
      toast.error(t('ai.creditsExhausted'));
      return false;
    }

    if (balance.remaining_credits < creditsNeeded) {
      
      toast.error(t('ai.insufficientCredits', { needed: creditsNeeded, available: balance.remaining_credits }));
      return false;
    }

    
    return true;
  };

  const copyPromptToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPrompt(true);
      toast.success(t('ai.promptCopied'));
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch (err) {
      toast.error(t('ai.copyFailed'));
    }
  };

  const copyResponseToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      toast.success(t('chat.responseCopied'));
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      toast.error(t('chat.copyFailed'));
    }
  };


  const onGenerate = async () => {
    if (!apiBase) return;
    
    
    
    if (!checkCreditsAndShowToast()) {
      
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    setImageB64(null);
    setGenerationProgress(0);
    
    let progressValue = 0;
    const progressInterval = setInterval(() => {
      progressValue += Math.random() * 2 + 0.8;
      if (progressValue >= 95) {
        progressValue = 95;
        clearInterval(progressInterval);
      }
      setGenerationProgress(progressValue);
    }, 800);
    
    try {
      const token = getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ai/text-to-image`, {
        method: "POST",
        headers: { 'Authorization': token as any, 'Content-Type': 'application/json', "User-Client": (global as any)?.clientId1328 },
        body: JSON.stringify({ prompt, style: preset, size: imageSize }),
      });
      
      clearInterval(progressInterval);
      setGenerationProgress(100);
      
      if (res.status === 200) {
        const data = await res.json();
        const imgSrc = data.image_url || data.cloudinary_url || (data.image_b64 ? `data:image/png;base64,${data.image_b64}` : null);
        setImageB64(imgSrc);
        await fetchBalance();
      } else if (res.status === 402) {
        setError(t('ai.outOfCredits'));
        await fetchBalance();
      } else if (res.status === 401) {
        setError(t('ai.pleaseSignIn'));
      } else {
        const text = await res.text();
        setError(text || t('ai.generationFailed'));
      }
    } catch (e: any) {
      clearInterval(progressInterval);
      setError(t('ai.networkError'));
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  const downloadImage = async () => {
    if (!imageB64) return;
    
    try {
      const sanitizedPrompt = prompt.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').substring(0, 50);
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `generated_image_${sanitizedPrompt}_${timestamp}.png`;
      
      if (imageB64.startsWith('http')) {
        const response = await fetch(imageB64);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      } else {
        const link = document.createElement('a');
        link.href = imageB64;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      window.open(imageB64, '_blank');
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError(t('ai.invalidImageType'));
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError(t('ai.imageTooLarge'));
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const generatePromptFromImage = async () => {
    if (!uploadedImage || !clientReady) return;
    
    if (!checkCreditsAndShowToast()) {
      return;
    }
    
    setIsGeneratingPrompt(true);
    setError(null);
    setGenerationProgress(0);
    
    let progressValue = 0;
    const progressInterval = setInterval(() => {
      progressValue += Math.random() * 2 + 0.8;
      if (progressValue >= 95) {
        progressValue = 95;
        clearInterval(progressInterval);
      }
      setGenerationProgress(progressValue);
    }, 800);
    
    try {
      const getHeaders = () => {
        const token = getToken();
        return {
          'Authorization': token as any,
          'Content-Type': 'application/json',
          'User-Client': (global as any)?.clientId1328
        };
      };

      const res = await fetch(`${apiBase}/api/ai/image-to-prompt`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ image: uploadedImage })
      });

      clearInterval(progressInterval);
      setGenerationProgress(100);

      if (res.status === 200) {
        const data = await res.json();
        setGeneratedPrompt(data.prompt);
        setPrompt(data.prompt);
        await fetchBalance();
      } else if (res.status === 402) {
        setError(t('ai.outOfCredits'));
        await fetchBalance();
      } else if (res.status === 401) {
        setError(t('ai.pleaseSignIn'));
      } else {
        const text = await res.text();
        setError(text || t('ai.promptGenerationFailed'));
      }
    } catch (e: any) {
      clearInterval(progressInterval);
      setError(t('ai.networkError'));
    } finally {
      setIsGeneratingPrompt(false);
      setGenerationProgress(0);
    }
  };

  const clearUploadedImage = () => {
    setUploadedImage(null);
    setImageFile(null);
    setGeneratedPrompt("");
    setError(null);
  };

  const switchTab = (tab: 'text-to-image' | 'image-to-prompt' | 'chat') => {
    setActiveTab(tab);
    if (tab === 'text-to-image') {
      clearUploadedImage();
    }
    if (tab === 'image-to-prompt') {
      setImageB64(null);
      setPrompt("");
      setPreset(PROMPT_PRESETS[0].value);
      setImageSize(IMAGE_SIZES[0].value);
      setError(null);
    }
  };

  const sendChatMessage = async () => {
    if (!clientReady || !balance || balance.remaining_credits === 0 || (!inputMessage.trim() && !chatImage) || isLoadingChat) return;

    const text = inputMessage.trim();
    const imageToSend = chatImage;
    setInputMessage("");
    setChatImage(null);
    setIsLoadingChat(true);
    setError(null);

    const tempId = `user_${Date.now()}`;
    setMessages(prev => [...prev, { id: tempId, role: 'user', content: text, timestamp: new Date(), image: imageToSend || undefined }]);

    try {
      let threadId = activeThreadId;
      if (!threadId) {
        threadId = await createThread(text.slice(0, 60));
        if (!threadId) throw new Error('Failed to create thread');
      }

      const res = await fetch(`${apiBase}/api/ai/chat`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ message: text, image: imageToSend || undefined, thread_id: threadId }),
      });

      if (res.ok) {
        const data = await res.json();
        if (!activeThreadId && data.thread_id) setActiveThreadId(data.thread_id);

        const typingId = `typing_${Date.now()}`;
        setMessages(prev => [...prev, { id: typingId, role: 'assistant', content: '', timestamp: new Date() }]);

        const responseText = data.response as string;
        let current = '';
        isTypingRef.current = true;
        for (let i = 0; i <= responseText.length; i++) {
          current = responseText.slice(0, i);
          setMessages(prev => prev.map(m => m.id === typingId ? { ...m, content: current } : m));
          await new Promise(r => setTimeout(r, 12));
        }
        isTypingRef.current = false;
        setMessages(prev => prev.map(m => m.id === typingId ? { ...m, id: `assistant_${Date.now()}`, content: responseText } : m));
        await fetchBalance();
        await loadThreads();
        await loadThreadMessages(threadId);
      } else if (res.status === 402) {
        setError(t('ai.outOfCredits'));
        await fetchBalance();
      } else if (res.status === 401) {
        setError(t('ai.pleaseSignIn'));
      } else {
        const txt = await res.text();
        setError(txt || t('ai.chatFailed'));
      }
    } catch (e) {
      setError(t('ai.networkError'));
    } finally {
      setIsLoadingChat(false);
    }
  };

  const handleChatImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError(t('ai.invalidImageType'));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError(t('ai.imageTooLarge'));
      return;
    }
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      const maxSize = 1024;
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      ctx?.drawImage(img, 0, 0, width, height);
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      
      setChatImage(compressedDataUrl);
      setError(null);
    };
    
    img.src = URL.createObjectURL(file);
  };

  const handleChatKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  };

  const authHeaders = () => {
    const token = getToken();
    return { 'Authorization': token as any, 'Content-Type': 'application/json', 'User-Client': (global as any)?.clientId1328 };
  };

  const loadThreads = async () => {
    if (!apiBase) return;
    try {
      const res = await fetch(`${apiBase}/api/ai/chat/threads`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setThreads(data || []);
        if (!activeThreadId && data?.length) setActiveThreadId(data[0].thread_id);
      }
    } catch {}
  };

  const loadThreadMessages = async (threadId: number) => {
    if (!apiBase) return;
    setIsLoadingThread(true);
    try {
      const res = await fetch(`${apiBase}/api/ai/chat/threads/${threadId}/messages`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        const mapped = (data || []).map((m: any) => ({ 
          id: `m_${m.message_id}`, 
          role: m.role, 
          content: m.content, 
          timestamp: new Date(m.createdAt),
          image: m.image_url || undefined
        }));
        setMessages(mapped);
      } else {
        setMessages([]);
      }
    } catch {
      setMessages([]);
    } finally {
      setIsLoadingThread(false);
    }
  };

  const createThread = async (title?: string | null) => {
    if (!apiBase) return null;
    try {
      const res = await fetch(`${apiBase}/api/ai/chat/threads`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ title: title || null }) });
      if (res.ok) {
        const data = await res.json();
        await loadThreads();
        setActiveThreadId(data.thread_id);
        setMessages([]);
        return data.thread_id as number;
      }
    } catch {}
    return null;
  };

  const deleteThread = async (threadId: number) => {
    if (!apiBase) return;
    try {
      const res = await fetch(`${apiBase}/api/ai/chat/threads/${threadId}`, { method: 'DELETE', headers: authHeaders() });
      if (res.ok) {
        await loadThreads();
        if (activeThreadId === threadId) {
          setActiveThreadId(null);
          setMessages([]);
        }
        toast.success(t('chat.threadDeleted'));
      }
    } catch {
      toast.error(t('chat.deleteFailed'));
    }
  };

  const updateThreadTitle = async (threadId: number, newTitle: string) => {
    if (!apiBase) return;
    try {
      const res = await fetch(`${apiBase}/api/ai/chat/threads/${threadId}`, { 
        method: 'PUT', 
        headers: authHeaders(), 
        body: JSON.stringify({ title: newTitle }) 
      });
      if (res.ok) {
        await loadThreads();
        setEditingThreadId(null);
        setEditingTitle("");
        toast.success(t('chat.threadRenamed'));
      }
    } catch {
      toast.error(t('chat.renameFailed'));
    }
  };

  const startEditing = (threadId: number, currentTitle: string) => {
    setEditingThreadId(threadId);
    setEditingTitle(currentTitle || "");
  };

  const cancelEditing = () => {
    setEditingThreadId(null);
    setEditingTitle("");
  };

  const renderInlineCode = (text: string, baseKey: string): React.ReactNode[] => {
    const inlineCodeRegex = /`([^`]+)`/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let keyIndex = 0;

    inlineCodeRegex.lastIndex = 0;
    
    while ((match = inlineCodeRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        const beforeText = text.slice(lastIndex, match.index);
        if (beforeText) {
          parts.push(beforeText);
        }
      }
      
      const code = match[1];
      parts.push(
        <code key={`${baseKey}-inline-${keyIndex++}`} className="bg-[#35214f] text-[#00c48c] px-1 py-0.5 rounded text-xs font-mono">
          {code}
        </code>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex);
      if (remainingText) {
        parts.push(remainingText);
      }
    }
    
    return parts.length > 0 ? parts : [text];
  };

  const renderMessageContent = (content: string) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const inlineCodeRegex = /`([^`]+)`/g;
    
    if (!codeBlockRegex.test(content) && !inlineCodeRegex.test(content)) {
      return <div className="whitespace-pre-wrap break-words">{content}</div>;
    }

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    codeBlockRegex.lastIndex = 0;
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        const beforeText = content.slice(lastIndex, match.index);
        if (beforeText) {
          parts.push(
            <div key={`text-${lastIndex}`} className="whitespace-pre-wrap break-words">
              {renderInlineCode(beforeText, `text-${lastIndex}`)}
            </div>
          );
        }
      }

      const language = match[1] || 'text';
      const code = match[2];
      parts.push(
        <div key={`code-${match.index}`} className="my-2">
          <SyntaxHighlighter
            language={language}
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              borderRadius: '8px',
              fontSize: '14px',
              background: '#1a1a1a',
              border: '1px solid #333'
            }}
            showLineNumbers={false}
            wrapLines={true}
            wrapLongLines={true}
          >
            {code}
          </SyntaxHighlighter>
        </div>
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      const remainingText = content.slice(lastIndex);
      if (remainingText) {
        parts.push(
          <div key={`text-${lastIndex}`} className="whitespace-pre-wrap break-words">
            {renderInlineCode(remainingText, `text-${lastIndex}`)}
          </div>
        );
      }
    }

    return <div>{parts}</div>;
  };

  const calculateEstimatedCredits = (message: string) => {
    if (!balance?.plan?.tokens_per_credit) return 1;
    const estimatedTokens = Math.ceil(message.length / 4);
    const tokensPerCredit = balance.plan.tokens_per_credit || 1000;
    return Math.max(1, Math.ceil(estimatedTokens / tokensPerCredit));
  };

  useEffect(() => {
    if (inputMessage && balance?.plan?.tokens_per_credit) {
      setEstimatedCredits(calculateEstimatedCredits(inputMessage));
    } else {
      setEstimatedCredits(0);
    }
  }, [inputMessage, balance]);

  useEffect(() => {
    if (activeTab === 'chat') {
      loadThreads();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeThreadId) {
      setMessages([]);
      loadThreadMessages(activeThreadId);
    }
  }, [activeThreadId]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  };

  useEffect(() => {
    if (!isLoadingChat && !isLoadingThread && messages.length > 0) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          scrollToBottom();
        }, 50);
      });
    }
  }, [isLoadingChat]);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#fff',
            border: '1px solid #374151',
          },
          success: {
            style: {
              background: '#059669',
            },
          },
          error: {
            style: {
              background: '#dc2626',
            },
          },
        }}
      />

      <div className="flex h-screen bg-[#343541] text-white overflow-hidden">
        {/* Sidebar - ChatGPT Style */}
        {(activeTab === 'chat' || activeTab === 'text-to-image') && (
          <div className={`bg-[#202123] transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-0'} overflow-hidden flex flex-col`}>
            {sidebarOpen && (
              <>
                {activeTab === 'chat' && (
                  <>
                    <div className="p-3 border-b border-[#4d4d4f]">
                      <button
                        onClick={() => createThread(null)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 bg-[#343541] hover:bg-[#40414f] rounded-lg transition-colors text-sm border border-[#565869]"
                      >
                        <Plus size={16} />
                        <span>New chat</span>
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                      {threads.map((thread) => (
                        <div
                          key={thread.thread_id}
                          className={`group relative px-3 py-2.5 mb-1 rounded-lg cursor-pointer transition-colors ${
                            activeThreadId === thread.thread_id ? 'bg-[#343541]' : 'hover:bg-[#2d2d2f]'
                          }`}
                          onClick={() => setActiveThreadId(thread.thread_id)}
                        >
                          {editingThreadId === thread.thread_id ? (
                            <div className="flex items-center gap-1">
                              <input
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    updateThreadTitle(thread.thread_id, editingTitle);
                                  } else if (e.key === 'Escape') {
                                    cancelEditing();
                                  }
                                }}
                                className="flex-1 px-2 py-1 text-sm bg-[#40414f] text-white border border-[#565869] rounded"
                                autoFocus
                              />
                              <button
                                onClick={() => updateThreadTitle(thread.thread_id, editingTitle)}
                                className="p-1 text-xs hover:bg-[#565869] rounded"
                              >
                                ✓
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="p-1 text-xs hover:bg-[#565869] rounded"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm text-[#ececf1] truncate">{thread.title || `Chat ${thread.thread_id}`}</div>
                                  <div className="text-xs text-[#8e8ea0] mt-0.5">{new Date(thread.updatedAt).toLocaleDateString()}</div>
                                </div>
                                <div className="flex gap-1  transition-opacity">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEditing(thread.thread_id, thread.title);
                                    }}
                                    className="p-1 hover:bg-[#40414f] rounded"
                                    title="Rename"
                                  >
                                    <Pencil size={14} className="text-[#8e8ea0]" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (confirm(t('chat.confirmDelete'))) {
                                        deleteThread(thread.thread_id);
                                      }
                                    }}
                                    className="p-1 hover:bg-[#40414f] rounded"
                                    title="Delete"
                                  >
                                    <Trash size={14} className="text-[#8e8ea0]" />
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                      {threads.length === 0 && (
                        <div className="px-3 py-2 text-xs text-[#8e8ea0] text-center">{t('chat.noMessages')}</div>
                      )}
                    </div>
                  </>
                )}
                {activeTab === 'text-to-image' && (
                  <div className="flex-1 overflow-y-auto p-3">
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold text-[#ececf1] mb-3">{t('ai.yourGeneratedImages')}</h3>
                      <button
                        onClick={() => {
                          setShowHistory(!showHistory);
                          if (!showHistory) loadImageHistory();
                        }}
                        className="w-full px-3 py-2 bg-[#343541] hover:bg-[#40414f] rounded-lg transition-colors text-sm border border-[#565869] flex items-center justify-center gap-2"
                      >
                        {showHistory ? t('ai.hideHistory') : t('ai.showHistory')}
                      </button>
                    </div>
                    {showHistory && (
                      <div className="space-y-2">
                        {loadingHistory ? (
                          <div className="text-xs text-[#8e8ea0] text-center py-4">{t('ai.loadingHistory')}</div>
                        ) : imageHistory.length === 0 ? (
                          <div className="text-xs text-[#8e8ea0] text-center py-4">{t('ai.noImagesGenerated')}</div>
                        ) : (
                          imageHistory.map((image) => (
                            <div
                              key={image.image_id}
                              onClick={() => loadImageById(image.image_id)}
                              className="p-2 bg-[#343541] hover:bg-[#40414f] rounded-lg cursor-pointer transition-colors border border-[#565869]"
                            >
                              <img
                                src={image.cloudinary_url}
                                alt="Generated"
                                className="w-full h-24 object-cover rounded mb-2"
                              />
                              <div className="text-xs text-[#ececf1] truncate">{image.prompt}</div>
                              <div className="text-[10px] text-[#8e8ea0] mt-1">{new Date(image.created_at).toLocaleDateString()}</div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
                <div className="p-3 border-t border-[#4d4d4f]">
                  <div className="text-xs text-[#8e8ea0] mb-2 px-2">
                    {loadingBalance ? (
                      <span>Loading...</span>
                    ) : balance ? (
                      <div className="space-y-1">
                        <div className="text-[#ececf1]">
                          Credits: <span className={balance.remaining_credits === 0 ? 'text-red-400' : balance.remaining_credits <= 5 ? 'text-yellow-400' : 'text-green-400'}>{balance.remaining_credits}</span> / {balance.total_credits}
                        </div>
                        <div className="text-[10px] text-[#8e8ea0]">
                          Expires: {new Date(balance.endedAt).toLocaleDateString()}
                        </div>
                      </div>
                    ) : (
                      <span className="text-red-400">{t('ai.noActiveCredits')}</span>
                    )}
                  </div>
                  <button
                    onClick={openBuyModal}
                    className="w-full px-3 py-2 bg-[#10a37f] hover:bg-[#0d8f70] rounded-lg text-sm font-medium transition-colors"
                  >
                    {t('ai.purchaseCredits')}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Header Bar */}
          <div className="h-12 bg-[#343541] border-b border-[#565869] flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              {(activeTab === 'chat' || activeTab === 'text-to-image') && (
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-1.5 hover:bg-[#40414f] rounded-lg transition-colors"
                >
                  <Menu size={18} />
                </button>
              )}
              <div className="flex items-center gap-2">
                <Sparkles size={24} className="text-[#10a37f]" />
                <span className="text-lg font-medium">Nexus AI</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
                <Link className="text-lg text-[#8e8ea0] hover:text-[#ececf1]" href="/dashboard">→ عودة الى الرئيسية </Link>
              {/* Credits Display */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#40414f] rounded-lg border border-[#565869]">
                {loadingBalance ? (
                  <span className="text-xs text-[#8e8ea0]">Loading...</span>
                ) : balance ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#8e8ea0]">{t('ai.credits')}:</span>
                    <span className={`text-sm font-semibold ${
                      balance.remaining_credits === 0 
                        ? 'text-red-400' 
                        : balance.remaining_credits <= 5 
                        ? 'text-yellow-400' 
                        : 'text-green-400'
                    }`}>
                      {balance.remaining_credits}
                    </span>
                    <span className="text-xs text-[#8e8ea0]">/ {balance.total_credits}</span>
                    {activeTab === 'text-to-image' && selectedSize && selectedSize.creditsMultiplier > 1 && (
                      <span className="text-xs text-orange-400">
                        ({t('ai.thisSizeCosts')} {creditsNeeded})
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-red-400">{t('ai.noActiveCredits')}</span>
                )}
              </div>
              <div className="flex bg-[#40414f] rounded-lg p-0.5 border border-[#565869]">
                <button
                  onClick={() => switchTab('text-to-image')}
                  className={`px-3 py-1 text-lg rounded transition-colors ${
                    activeTab === 'text-to-image'
                      ? 'bg-[#10a37f] text-white'
                      : 'text-[#8e8ea0] hover:text-[#ececf1]'
                  }`}
                >
                  {t('ai.textToImage')}
                </button>
                <button
                  onClick={() => switchTab('image-to-prompt')}
                  className={`px-3 py-1 text-lg rounded transition-colors ${
                    activeTab === 'image-to-prompt'
                      ? 'bg-[#10a37f] text-white'
                      : 'text-[#8e8ea0] hover:text-[#ececf1]'
                  }`}
                >
                  {t('ai.imageToPrompt')}
                  
                </button>
                <button
                  onClick={() => switchTab('chat')}
                  className={`px-3 py-1 text-lg rounded transition-colors ${
                    activeTab === 'chat'
                      ? 'bg-[#10a37f] text-white'
                      : 'text-[#8e8ea0] hover:text-[#ececf1]'
                  }`}
                >
                 Nexus AI Chat
                </button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto bg-[#343541]">
            {activeTab === 'chat' && (
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl mb-4 flex items-center justify-center">
                            <img src="/images/Bot.gif" alt="bot" className="w-40 h-40 rounded-full" />
                        </div>
                        {/* <div className="text-xl text-[#ececf1] mb-2">How can I help you today?</div> */}
                        <TextType 
  text={["Chat With Power Of Nexus AI", " "]}
  typingSpeed={75}
  loop={true}
  pauseDuration={1500}
  showCursor={true}
  cursorCharacter=""
/>
                        <div className="text-sm text-[#8e8ea0]">Start a conversation or ask a question</div>
                      </div>
                    </div>
                  ) : (
                    messages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex gap-4 p-4 ${
                          m.role === 'user' ? 'bg-[#343541]' : 'bg-[#444654]'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          m.role === 'user' ? 'bg-[#10a37f]' : 'bg-[#00000070]'
                        }`}>
                          {m.role === 'user' ? '👤' : <img src="/images/Bot.gif" alt="bot" className="w-8 h-8 rounded-full" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          {m.image && (
                            <div className="mb-2">
                              <img src={m.image} alt="attached" className="max-w-full h-auto rounded border border-[#565869]" style={{ maxHeight: "200px" }} />
                            </div>
                          )}
                          <div className="text-[#ececf1] whitespace-pre-wrap break-words">
                            {renderMessageContent(m.content)}
                          </div>
                          {m.role === 'assistant' && !m.id.startsWith('typing_') && (
                            <div className="mt-2 flex items-center gap-2">
                              <button
                                onClick={() => copyResponseToClipboard(m.content, m.id)}
                                className="p-1 hover:bg-[#565869] rounded transition-colors"
                                title={t('chat.copyResponse')}
                              >
                                {copiedMessageId === m.id ? (
                                  <Check size={14} className="text-[#10a37f]" />
                                ) : (
                                  <Copy size={14} className="text-[#8e8ea0]" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <div className="border-t border-[#565869] bg-[#343541] p-4">
                  {error && <div className="text-red-400 text-xs mb-2">{error}</div>}
                  <div className="max-w-3xl mx-auto">
                    <div className="flex gap-2 items-end">
                      <div className="flex-1 relative">
                        <textarea
                          value={inputMessage}
                          onChange={(e) => {
                            setInputMessage(e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
                          }}
                          onKeyDown={handleChatKeyPress}
                          placeholder={t('chat.typeMessage')}
                          className="w-full px-4 py-3 pr-12 rounded-lg bg-[#40414f] text-[#ececf1] border border-[#565869] focus:outline-none focus:border-[#10a37f] resize-none overflow-y-auto"
                          rows={1}
                          style={{ minHeight: '52px', maxHeight: '200px' }}
                          disabled={!clientReady || !balance || balance.remaining_credits === 0 || isLoadingChat}
                        />
                        <label className="absolute right-3 bottom-3 cursor-pointer">
                          <input type="file" accept="image/*" className="hidden" onChange={handleChatImageUpload} />
                          <ImageIcon size={20} className="text-[#8e8ea0] hover:text-[#ececf1]" />
                        </label>
                        {chatImage && (
                          <div className="absolute right-12 bottom-3">
                            <div className="relative">
                              <img src={chatImage} alt="preview" className="w-8 h-8 rounded object-cover border border-[#565869]" />
                              <button onClick={() => setChatImage(null)} className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] leading-4 flex items-center justify-center">✕</button>
                            </div>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={sendChatMessage}
                        disabled={!clientReady || !balance || balance.remaining_credits === 0 || !inputMessage.trim() || isLoadingChat}
                        className="p-3 bg-[#10a37f] hover:bg-[#0d8f70] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                      >
                        {isLoadingChat ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <ArrowUp size={20} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'text-to-image' && (
              <div className="max-w-4xl mx-auto p-6 space-y-6">
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-semibold text-[#ececf1] mb-2">Text to Image</h1>
                  {/* <p className="text-[#8e8ea0]">Generate stunning images from your text prompts</p> */}
                  <TextType 
  text={["Generate stunning images from your text prompts", "انشئ الصورة المثالية بأعلى جودة ودقة عالية     "]}
  typingSpeed={75}
 loop={true}
  pauseDuration={1500}
  showCursor={true}
  cursorCharacter=""
/>
                </div>

                <div className="bg-[#40414f] rounded-lg p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#ececf1] mb-2">{t('ai.promptPreset')}</label>
                    <div className="flex flex-wrap gap-2">
                      {PROMPT_PRESETS.map((p) => (
                        <button
                          key={p.labelKey}
                          onClick={() => setPreset(p.value)}
                          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                            preset === p.value
                              ? 'bg-[#10a37f] text-white'
                              : 'bg-[#343541] text-[#8e8ea0] hover:bg-[#565869] hover:text-[#ececf1]'
                          }`}
                        >
                          {t(p.labelKey)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#ececf1] mb-2">{t('ai.imageSize')}</label>
                    <div className="flex flex-wrap gap-2">
                      {IMAGE_SIZES.map((size) => (
                        <button
                          key={size.value}
                          onClick={() => setImageSize(size.value)}
                          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                            imageSize === size.value
                              ? 'bg-[#10a37f] text-white'
                              : 'bg-[#343541] text-[#8e8ea0] hover:bg-[#565869] hover:text-[#ececf1]'
                          }`}
                        >
                          {t(size.labelKey)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#ececf1] mb-2">{t('ai.yourPrompt')}</label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder={t('ai.promptPlaceholder')}
                      className="w-full px-4 py-3 rounded-lg bg-[#343541] text-[#ececf1] border border-[#565869] focus:outline-none focus:border-[#10a37f] resize-none"
                      rows={4}
                    />
                  </div>

                  <button
                    onClick={onGenerate}
                    disabled={!clientReady || !prompt || isGenerating}
                    className="w-full px-4 py-3 bg-[#10a37f] hover:bg-[#0d8f70] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>{t('ai.generating')}... {Math.floor(generationProgress)}%</span>
                      </>
                    ) : (
                      <span>{t('ai.generateImage')}</span>
                    )}
                  </button>

                  {error && <div className="text-red-400 text-sm">{error}</div>}
                </div>

                {imageB64 && (
                  <div className="bg-[#40414f] rounded-lg p-6">
                    <div className="relative">
                      <img
                        src={imageB64}
                        alt="Generated"
                        className="w-full rounded-lg border border-[#565869]"
                      />
                      <div className="absolute top-4 right-4 flex gap-2">
                        <button
                          onClick={downloadImage}
                          className="p-2 bg-[#343541] hover:bg-[#565869] rounded-lg transition-colors"
                          title="Download"
                        >
                          <Download size={18} className="text-[#ececf1]" />
                        </button>
                        <button
                          onClick={() => setImageB64(null)}
                          className="p-2 bg-[#343541] hover:bg-[#565869] rounded-lg transition-colors"
                          title="Clear"
                        >
                          <X size={18} className="text-[#ececf1]" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {!imageB64 && !isGenerating && (
                  <div className="text-center py-12 text-[#8e8ea0]">
               
                    <p className="text-lg">{t('ai.noImageGenerated')}</p>
                    <p className="text-sm">{t('ai.generateImageToSee')}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'image-to-prompt' && (
              <div className="max-w-4xl mx-auto p-6 space-y-6">
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-semibold text-[#ececf1] mb-2">Image to Prompt</h1>
                  {/* <p className="text-[#8e8ea0]">Generate a prompt from your image</p> */}
                  <TextType 
  text={["Generate a prompt from your image", "انشئ البروميت الذي يناسب الصورة"]}
  typingSpeed={75}
  loop={true}
  pauseDuration={1500}
  showCursor={true}
  cursorCharacter=""
/>
                </div>

                <div className="bg-[#40414f] rounded-lg p-6 space-y-4">
                  {!uploadedImage ? (
                    <div className="border-2 border-dashed border-[#565869] rounded-lg p-12 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="cursor-pointer flex flex-col items-center gap-4"
                      >
                        <div className="w-16 h-16 bg-[#10a37f] rounded-full flex items-center justify-center">
                          <ImageIcon size={32} className="text-white" />
                        </div>
                        <div>
                          <p className="text-[#ececf1] text-lg font-medium">{t('ai.uploadImage')}</p>
                          <p className="text-sm text-[#8e8ea0] mt-1">{t('ai.maxFileSize')}</p>
                        </div>
                      </label>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative">
                        <img
                          src={uploadedImage}
                          alt="Uploaded"
                          className="w-full max-h-96 object-contain rounded-lg border border-[#565869]"
                        />
                        <button
                          onClick={clearUploadedImage}
                          className="absolute top-3 right-3 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                        >
                          <X size={18} />
                        </button>
                      </div>

                      {isGeneratingPrompt ? (
                        <div className="flex flex-col items-center gap-4 py-8">
                          <div className="w-16 h-16 border-4 border-[#10a37f]/30 border-t-[#10a37f] rounded-full animate-spin" />
                          <div className="text-[#ececf1]">{t('ai.generatingPrompt')}... {Math.floor(generationProgress)}%</div>
                        </div>
                      ) : (
                        <button
                          onClick={generatePromptFromImage}
                          disabled={!clientReady}
                          className="w-full px-4 py-3 bg-[#10a37f] hover:bg-[#0d8f70] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
                        >
                          {t('ai.generatePrompt')}
                        </button>
                      )}

                      {generatedPrompt && (
                        <div className="bg-[#343541] rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-[#ececf1]">{t('ai.generatedPrompt')}:</h4>
                            <button
                              onClick={() => copyPromptToClipboard(generatedPrompt)}
                              className="flex items-center gap-2 px-3 py-1.5 bg-[#40414f] hover:bg-[#565869] rounded-lg text-sm transition-colors"
                            >
                              {copiedPrompt ? <Check size={16} /> : <Copy size={16} />}
                              <span>{copiedPrompt ? t('ai.copied') : t('ai.copy')}</span>
                            </button>
                          </div>
                          <p className="text-[#ececf1] text-sm leading-relaxed">{generatedPrompt}</p>
                          <button
                            onClick={() => {
                              setPrompt(generatedPrompt);
                              switchTab('text-to-image');
                            }}
                            className="w-full px-4 py-2 bg-[#10a37f] hover:bg-[#0d8f70] rounded-lg text-sm font-medium transition-colors"
                          >
                            {t('ai.useThisPrompt')}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {error && <div className="text-red-400 text-sm">{error}</div>}
              </div>
            )}
          </div>
        </div>
      </div>

      {showBuyModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#40414f] rounded-lg w-full max-w-md p-6 border border-[#565869]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#ececf1]">{t('ai.buyCredits')}</h2>
              <button onClick={closeBuyModal} className="p-1 hover:bg-[#565869] rounded transition-colors">
                <X size={20} className="text-[#8e8ea0]" />
              </button>
            </div>
            {loadingPlans ? (
              <div className="text-sm text-[#8e8ea0]">{t('ai.loadingPlans')}</div>
            ) : plans.length === 0 ? (
              <div className="text-sm text-[#8e8ea0]">{t('ai.noPlansAvailable')}</div>
            ) : (
              <div className="space-y-2">
                {plans.map((p) => (
                  <button
                    key={p.plan_id}
                    onClick={() => onSelectPlan(p.plan_id)}
                    className="w-full px-4 py-3 bg-[#343541] hover:bg-[#565869] rounded-lg text-left transition-colors border border-[#565869]"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-[#ececf1]">{p.plan_name}</div>
                        <div className="text-sm text-[#8e8ea0]">{p.credits_per_period} {t('credits.credits')} / {p.period}</div>
                      </div>
                      <div className="text-[#10a37f] font-semibold">${p.amount}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {openPaymentModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="w-full max-w-[1200px]">
            <PaymentModal
              modalOpen={openPaymentModal}
              setModalOpen={setOpenPaymentModal}
              productType="credits"
              period={selectedPlan.period as any}
              productId={selectedPlan.plan_id}
              productData={{
                tool_name: selectedPlan.plan_name,
                pack_name: selectedPlan.plan_name,
                monthly_price: selectedPlan.amount,
                yearly_price: selectedPlan.amount,
                tool_day_price: selectedPlan.amount,
              }}
              onBuySuccess={() => {
                setOpenPaymentModal(false);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
