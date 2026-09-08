"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import Link from "next/link";
import { useTranslation } from 'react-i18next';
import { toast, Toaster } from 'react-hot-toast';
import { 
  Copy, 
  Check, 
  ArrowUp, 
  Image as ImageIcon, 
  Plus, 
  Menu, 
  X, 
  Sparkles, 
  Pencil, 
  Trash, 
  ArrowLeft, 
  Send, 
  ArrowRight, 
  MessageSquare, 
  CreditCard, 
  ChevronLeft,
  Wand2,
  Layers,
  Zap,
  MoreVertical,
  History,
  Bot,
  User,
  ExternalLink,
  PanelRightClose,
  PanelRightOpen,
  Sun,
  Moon,
  AlertTriangle,
  Crown,
  FileText,
  Paperclip
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import TextType from "@/components/TextType";
import { BorderBeam } from "@/components/ui/border-beam";
import { PremiumButton } from "@/components/PremiumButton";
import { useMyInfo } from "@/utils/user-info/getUserInfo";
import ConfirmationModal from "@/components/ComfirmationModal";
import PaymentModal from "@/components/Modals/PaymentModal";
import UpgradeModal from "@/components/Modals/UpgradeModal";

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

export default function ChatPage() {
  const { t } = useTranslation();
  const [balance, setBalance] = useState<CreditsRecord | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Chat states
  const [threads, setThreads] = useState<Array<{ thread_id: number; title: string | null; updatedAt: string }>>([]);
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Array<{ id: string; role: "user" | "assistant"; content: string; timestamp: Date; image?: string }>>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [estimatedCredits, setEstimatedCredits] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isTypingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const skipNextLoadRef = useRef(false);

  const stopGeneration = () => {
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
    }
  };
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [chatImage, setChatImage] = useState<string | null>(null);
  const [chatDocument, setChatDocument] = useState<{ content: string; mimeType: string; fileName: string } | null>(null);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const [editingThreadId, setEditingThreadId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);

  // Payment & Plans States
  const [plans, setPlans] = useState<Array<{ plan_id: number; plan_name: string; credits_per_period: number; amount: string; period: string }>>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ plan_id: number; plan_name: string; credits_per_period: number; amount: string; period: string } | null>(null);
  
  // Delete Modal States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [threadToDelete, setThreadToDelete] = useState<number | null>(null);
  const [isDeletingThread, setIsDeletingThread] = useState(false);

  const { data: userInfo } = useMyInfo(true);
  const userName = userInfo?.userData?.firstName || userInfo?.first_name || "";

  const { greeting, icon: GreetingIcon } = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return { greeting: "صباح الخير", icon: Sun };
    if (hour >= 12 && hour < 18) return { greeting: "طاب يومك", icon: Sun };
    return { greeting: "مساء الخير", icon: Moon };
  }, []);

  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL, []);

  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem("a");
    }
    return null;
  };

  const authHeaders = () => {
    const token = getToken();
    return { 'Authorization': token as any, 'Content-Type': 'application/json', 'User-Client': (global as any)?.clientId1328 };
  };

  const fetchBalance = async () => {
    if (!apiBase) return;
    const token = getToken();
    setLoadingBalance(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/credits/me/balance`, { headers: authHeaders() });
      if (res.status === 200) {
        const data = (await res.json()) as CreditsRecord | null;
        setBalance(data);
      }
    } catch (e: any) {
      console.error(e);
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
      loadThreads();
      void loadPlans();
    });
    return () => { cancelled = true; };
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

  const onSelectPlan = async (plan_id: number) => {
    const plan = plans.find(p => p.plan_id === plan_id) || null;
    if (!plan) return;
    setSelectedPlan(plan);
    setShowBuyModal(false);
    setOpenPaymentModal(true);
  };

  const loadThreads = async () => {
    if (!apiBase) return;
    try {
      const res = await fetch(`${apiBase}/api/ai/chat/threads`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setThreads(data.threads || []);
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
        const mapped = (data.messages || []).map((m: any) => ({ 
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

  useEffect(() => {
    if (activeThreadId) {
      if (skipNextLoadRef.current) {
        skipNextLoadRef.current = false;
        return;
      }
      loadThreadMessages(activeThreadId);
    }
  }, [activeThreadId]);

  const sendChatMessage = async () => {
    // Don't do anything if not ready, currently loading, or input is empty
    if (!clientReady || isLoadingChat || (!inputMessage.trim() && !chatImage && !chatDocument)) return;

    // Show upgrade modal if user has no active subscription (no balance record at all)
    // Chat is UNLIMITED for subscribers - no credit check needed
    if (!balance) {
        setShowUpgradeModal(true);
        return;
    }

    const text = inputMessage.trim();
    const imageToSend = chatImage;
    const documentToSend = chatDocument;
    setInputMessage("");
    setChatImage(null);
    setChatDocument(null);
    setIsLoadingChat(true);

    // Setup AbortController
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const tempId = `user_${Date.now()}`;
    const assistantId = `assistant_${Date.now()}`;
    
    // إرسال رسالة المستخدم مع حجز مكان لرسالة البوت (Loader)
    const displayContent = documentToSend 
        ? `📄 ${documentToSend.fileName}\n${text}` 
        : text;
    setMessages(prev => [
        ...prev, 
        { id: tempId, role: 'user', content: displayContent, timestamp: new Date(), image: imageToSend || undefined },
        { id: assistantId, role: 'assistant', content: '', timestamp: new Date() }
    ]);

    try {
      let threadId = activeThreadId;

      const requestBody: Record<string, any> = { message: text };
      if (imageToSend) requestBody.image = imageToSend;
      if (documentToSend) requestBody.document = documentToSend;
      if (threadId) requestBody.thread_id = threadId;

      const res = await fetch(`${apiBase}/api/ai/chat`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      if (res.ok) {
        const data = await res.json();
        const responseText = data.response as string;
        let current = '';
        isTypingRef.current = true;
        
        // البدء في تلوين/كتابة الرد في نفس الحاوية المحجوزة
        const step = 2; // أبطأ قليلاً لتبدو طبيعية أكثر
        for (let i = 0; i <= responseText.length; i += step) {
          if (controller.signal.aborted) break;
          const end = Math.min(i + step, responseText.length);
          current = responseText.slice(0, end);
          setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: current } : m));
          if (end === responseText.length) break;
          await new Promise(r => setTimeout(r, 15)); // تأخير لتأثير الكتابة
        }
        isTypingRef.current = false;
        
        if (!controller.signal.aborted) {
            if (!activeThreadId && data.thread_id) {
                skipNextLoadRef.current = true;
                setActiveThreadId(data.thread_id);
            }
            await fetchBalance();
            await loadThreads();
        }
      } else {
        const errorData = await res.json().catch(() => ({ message: 'فشلت عملية المحادثة' }));
        console.error('[Chat] Error:', errorData);
        toast.error(errorData.message || "فشلت عملية المحادثة");
        setMessages(prev => prev.filter(m => m.id !== assistantId));
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
          // If aborted (stopped by user)
          // If we have content, keep it. If empty, remove it.
          setMessages(prev => {
              const lastMsg = prev.find(m => m.id === assistantId);
              if (lastMsg && !lastMsg.content) {
                  return prev.filter(m => m.id !== assistantId);
              }
              return prev;
          });
      } else {
        toast.error("خطأ في الاتصال");
        setMessages(prev => prev.filter(m => m.id !== assistantId));
      }
    } finally {
      setIsLoadingChat(false);
      abortControllerRef.current = null;
    }
  };

  const createThread = async (title?: string | null, selectNow: boolean = true) => {
    if (!apiBase) return null;
    try {
      const res = await fetch(`${apiBase}/api/ai/chat/threads`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ title: title || null }) });
      if (res.ok) {
        const data = await res.json();
        await loadThreads();
        if (selectNow) {
          setActiveThreadId(data.thread_id);
          setMessages([]);
        }
        return data.thread_id as number;
      }
    } catch {}
    return null;
  };

  
  const confirmDeleteThread = async () => {
    if (!threadToDelete) return;
    setIsDeletingThread(true);
    try {
      const res = await fetch(`${apiBase}/api/ai/chat/threads/${threadToDelete}`, { method: 'DELETE', headers: authHeaders() });
      if (res.ok) {
        await loadThreads();
        if (activeThreadId === threadToDelete) {
          setActiveThreadId(null);
          setMessages([]);
        }
        toast.success('تم الحذف');
        setShowDeleteModal(false);
      }
    } catch {
       toast.error('فشل الحذف');
    } finally {
       setIsDeletingThread(false);
       setThreadToDelete(null);
    }
  };

  const updateThreadTitle = async (threadId: number, newTitle: string) => {
    try {
      const res = await fetch(`${apiBase}/api/ai/chat/threads/${threadId}`, { 
        method: 'PUT', 
        headers: authHeaders(), 
        body: JSON.stringify({ title: newTitle }) 
      });
      if (res.ok) {
        await loadThreads();
        setEditingThreadId(null);
        toast.success('تم التحديث');
      }
    } catch {}
  };

  const handleChatImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setChatImage(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('حجم الملف كبير جداً (الحد الأقصى 10MB)');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setChatDocument({
        content: e.target?.result as string,
        mimeType: file.type,
        fileName: file.name
      });
      toast.success(`تم إرفاق: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  const handleChatKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const renderMessageContent = (content: string) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(<div key={lastIndex} className="whitespace-pre-wrap">{content.slice(lastIndex, match.index)}</div>);
      }
      parts.push(
        <div key={match.index} className="my-4 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
          <div className="bg-white/5 px-4 py-2 flex justify-between items-center border-b border-white/10">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{match[1] || 'code'}</span>
            <button onClick={() => {navigator.clipboard.writeText(match![2]); toast.success('تم نسخ الكود')}} className="p-1 hover:bg-white/10 rounded transition-colors">
              <Copy size={14} className="text-gray-500" />
            </button>
          </div>
          <SyntaxHighlighter language={match[1] || 'text'} style={vscDarkPlus} customStyle={{ margin: 0, padding: '1.5rem', background: '#080808', fontSize: '14px' }}>
            {match[2]}
          </SyntaxHighlighter>
        </div>
      );
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < content.length) {
      parts.push(<div key={lastIndex} className="whitespace-pre-wrap">{content.slice(lastIndex)}</div>);
    }
    return parts.length > 0 ? parts : <div className="whitespace-pre-wrap">{content}</div>;
  };

  return (
    <div className="flex h-screen bg-[#06070B] text-white selection:bg-emerald-500/30 font-sans overflow-hidden" dir="rtl">
      <Toaster position="top-right" />
      
      {/* Dynamic Background Ambience */}
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

      {/* Sidebar - Threads */}
      <aside className={`relative z-30 flex flex-col bg-[#0B0D14] border-l border-white/[0.08] transition-all duration-500 ease-in-out ${sidebarOpen ? 'w-72' : 'w-0'} overflow-hidden shadow-2xl`}>
        <div className="flex flex-col h-full w-72">
            {/* Sidebar Header */}
            <div className="p-4 pb-2">
                <Link href="/ai" className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors mb-4 group">
                   <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                   <span>إستوديو نيكسوس</span>
                </Link>
                
                <button
                    onClick={() => createThread(null)}
                    className="h-10 w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                    <Plus size={14} />
                    <span>محادثة جديدة</span>
                </button>
            </div>

            {/* Threads List */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 custom-scrollbar">
                <div className="flex items-center gap-1.5 px-2 mb-3">
                    <History size={12} className="text-gray-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">السجل الأخير</span>
                </div>
                
                {threads.length === 0 && !isLoadingThread && (
                    <div className="text-center py-8 px-4">
                        <div className="text-gray-600 text-[10px] font-bold leading-relaxed">لا يوجد محادثات سابقة.</div>
                    </div>
                )}

                {threads.map((thread) => (
                    <div
                        key={thread.thread_id}
                        className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-300 border ${
                            activeThreadId === thread.thread_id 
                                ? 'bg-[#121520] border-white/[0.08] text-white shadow-lg' 
                                : 'bg-transparent border-transparent hover:bg-[#121520]/50 text-gray-400 hover:text-white'
                        }`}
                        onClick={() => setActiveThreadId(thread.thread_id)}
                    >
                        <MessageSquare size={14} className={activeThreadId === thread.thread_id ? 'text-emerald-400' : 'text-gray-500'} />
                        
                        <div className="flex-1 min-w-0">
                            {editingThreadId === thread.thread_id ? (
                                <input
                                    value={editingTitle}
                                    onChange={(e) => setEditingTitle(e.target.value)}
                                    onBlur={() => updateThreadTitle(thread.thread_id, editingTitle)}
                                    onKeyDown={(e) => e.key === 'Enter' && updateThreadTitle(thread.thread_id, editingTitle)}
                                    className="w-full bg-[#121520] border-b border-emerald-500 focus:outline-none text-xs py-0.5"
                                    autoFocus
                                />
                            ) : (
                                <div className={`text-xs font-bold truncate ${activeThreadId === thread.thread_id ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                                    {thread.title || "محادثة بدون عنوان"}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); setEditingThreadId(thread.thread_id); setEditingTitle(thread.title || "") }} className="p-1 hover:bg-white/10 rounded-md text-gray-500">
                                <Pencil size={10} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setThreadToDelete(thread.thread_id); setShowDeleteModal(true); }} className="p-1 hover:bg-red-500/20 rounded-md text-red-500/60 hover:text-red-500">
                                <Trash size={10} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Sidebar Footer */}
            <div className="p-4 bg-black/50 border-t border-white/5">
                <div className="mb-4 p-3 rounded-xl bg-white/[0.03] border border-white/5 shadow-inner relative overflow-hidden group">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-16 h-16 bg-purple-600/5 blur-xl rounded-full -mr-8 -mt-8"></div>
                    
                    <div className="relative z-10">
                        <div className="mb-3">
                            <div className="text-[8px] font-black uppercase text-gray-500 tracking-widest mb-0.5 flex items-center gap-1">
                                <Crown size={9} className="text-yellow-500" />
                                <span>باقة الاشتراك</span>
                            </div>
                            <div className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                                {loadingBalance ? (
                                    <div className="h-3 w-20 bg-white/5 animate-pulse rounded"></div>
                                ) : (
                                    <div className="flex flex-col gap-1">
                                        <span>{balance?.plan_name || userInfo?.userPlansData?.[0]?.plan_name || "Free Plan"}</span>
                                        {balance && (
                                            <div className="flex items-center gap-1 w-fit px-1.5 py-0.5 rounded-[4px] bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30">
                                                <Zap size={8} className="text-yellow-400 fill-yellow-400" />
                                                <span className="text-[8px] text-purple-200 tracking-wider font-medium">شات غير محدود</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                                <div className={`w-1.5 h-1.5 rounded-full ${balance && balance.remaining_credits > 0 ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                                <span className="text-[8px] font-black uppercase tracking-tighter text-gray-400">الرصيد المتاح</span>
                            </div>
                            <div className="text-[10px] font-black text-white">
                                {loadingBalance ? (
                                    <div className="h-2.5 w-6 bg-white/5 animate-pulse rounded"></div>
                                ) : (
                                    <span>{balance?.remaining_credits || 0}</span>
                                )}
                            </div>
                        </div>

                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-1000" 
                                style={{ width: `${loadingBalance ? 0 : Math.min(100, ((balance?.remaining_credits || 0) / (balance?.total_credits || 1)) * 100)}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                <Link href="/ai/plans" className="block w-full">
                    <button
                        className="relative inline-flex h-10 w-full active:scale-95 transition overflow-hidden rounded-lg p-[1px] focus:outline-none"
                        onClick={() => {}}
                    >
                        <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#e7029a_0%,#f472b6_50%,#bd5fff_100%)]"></span>
                        <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-lg bg-[#050505] px-3 text-[10px] font-black text-white backdrop-blur-3xl gap-1.5 transition-all hover:bg-black/40">
                            <Zap size={12} className="text-pink-500" />
                            ترقية الباقة
                        </span>
                    </button>
                </Link>
            </div>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col relative min-w-0">
        
        {/* Modern Navbar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-white/[0.08] bg-[#0B0D14] backdrop-blur-2xl relative z-20">
            <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 hover:bg-[#121520] rounded-xl transition-all border border-transparent hover:border-white/[0.08] text-gray-200 hover:text-white"
                >
                  {sidebarOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
                </button>
                
                <div className="flex items-center gap-2">
                    <span className="text-base font-bold">نيكسوس شات</span>
                </div>
            </div>

            <nav className="relative hidden xl:flex items-center gap-1 p-1 bg-[#121520] border border-white/[0.08] rounded-full shadow-lg">
                {[
                    { name: 'الرئيسية', path: '/ai', icon: Sparkles, color: 'text-emerald-400' },
                    { name: 'المحادثة', path: '/ai/chat', icon: MessageSquare, color: 'text-emerald-400' },
                    { name: 'الخطط', path: '/ai/plans', icon: CreditCard, color: 'text-emerald-400' }
                ].map((item, idx) => (
                    <Link 
                        key={idx}
                        href={item.path}
                        className={`group relative px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-1.5 overflow-hidden ${
                            (item.path === '/ai/chat') ? 'bg-emerald-600 text-white shadow-inner' : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <item.icon size={12} className={`transition-all duration-300 ${item.color} ${item.path === '/ai/chat' ? 'opacity-100 scale-110 text-white' : 'opacity-70 group-hover:opacity-100 group-hover:scale-110'}`} />
                        <span className="relative z-10">{item.name}</span>
                    </Link>
                ))}
            </nav>

            <div className="flex items-center gap-3">
                <Link href="/ai" className="px-3 py-1.5 rounded-lg bg-[#121520] text-gray-300 text-xs font-bold border border-white/[0.08] hover:bg-[#161a27] transition-all flex items-center gap-1.5">
                    <ArrowRight size={12} />
                    <span>عودة</span>
                </Link>
                
                <button
                  onClick={() => setShowBuyModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white transition-all shadow-sm border border-emerald-500/40"
                >
                  ترقية
                </button>
            </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative px-6 md:px-0">
            <div className="max-w-4xl mx-auto py-16 space-y-12">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                        <div className="relative mb-10">
                           <div className="spinner">
                <div className="spinner1"></div>
              </div>
                        </div>

                        <div className="space-y-4 max-w-xl">
                            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                                كيف يمكنني مساعدتك اليوم؟
                            </h2>
                            <p className="text-sm text-gray-400 font-medium leading-relaxed">
                                اكتب رسالتك أو استفسارك وسيقوم مساعد نيكسوس الذكي بالإجابة عليك بدقة وسرعة.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-[#0B0D14] border border-white/[0.08] text-gray-100'}`}>
                                    {renderMessageContent(msg.content)}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>
        </div>

        {/* Fixed Bottom Input Area */}
        <footer className="shrink-0 p-4 border-t border-white/[0.08] bg-[#0B0D14]/90 backdrop-blur-xl relative z-20">
            <div className="max-w-4xl mx-auto">
                <div className="relative group/input">
                    <div className="relative bg-[#121520] border border-white/[0.08] rounded-2xl p-2 flex items-end gap-2 transition-all focus-within:border-emerald-500/50 shadow-lg">
                        {/* Image Upload Button */}
                        <label className="flex mb-1 items-center justify-center w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer group/file shrink-0" title="إرفاق صورة">
                            <input type="file" accept="image/*" className="hidden" onChange={handleChatImageUpload} />
                            <ImageIcon size={18} className="group-hover/file:rotate-6 transition-transform" />
                        </label>
                        
                        {/* Document Upload Button */}
                        <label className="flex mb-1 items-center justify-center w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.08] text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 active:scale-95 transition-all cursor-pointer group/doc shrink-0" title="إرفاق وثيقة (PDF, TXT, DOC)">
                            <input type="file" accept=".pdf,.txt,.doc,.docx,application/pdf,text/plain" className="hidden" onChange={handleDocumentUpload} />
                            <Paperclip size={18} className="group-hover/doc:rotate-12 transition-transform" />
                        </label>
                        
                        <div className="flex-1 min-w-0 py-2">
                            <textarea
                                value={inputMessage}
                                onChange={(e) => {
                                    setInputMessage(e.target.value);
                                    e.target.style.height = 'auto';
                                    e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
                                }}
                                onKeyDown={handleChatKeyPress}
                                placeholder="اسأل مساعد نيكسوس عن أي شيء..."
                                className="w-full bg-transparent text-white px-2 py-0.5 focus:outline-none resize-none custom-scrollbar text-sm placeholder:text-gray-500 leading-relaxed font-medium"
                                rows={1}
                                disabled={isLoadingChat}
                            />
                        </div>

                        <button
                            onClick={isLoadingChat ? stopGeneration : sendChatMessage}
                            disabled={!isLoadingChat && (!inputMessage.trim() && !chatImage && !chatDocument)}
                            className={`w-10 h-10 mb-1 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 shrink-0 ${
                                isLoadingChat 
                                    ? 'bg-red-500 text-white hover:bg-red-600' 
                                    : 'bg-emerald-600 text-white hover:bg-emerald-500 disabled:bg-gray-800 disabled:text-gray-600'
                            }`}
                        >
                            {isLoadingChat ? (
                                <div className="w-3 h-3 bg-white rounded-full" />
                            ) : (
                                <ArrowUp size={20} strokeWidth={3} />
                            )}
                        </button>
                    </div>
                </div>

                {/* Footer Metadata */}
                <div className="mt-3 flex items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/[0.03] border border-white/5 rounded-full">
                            <Zap size={8} className="text-yellow-500" fill="currentColor" />
                            <span className="text-[8px] font-black uppercase text-gray-600 tracking-tighter">السرعة القصوى مفعّلة</span>
                        </div>
                    </div>
                    <div className="text-[8px] font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 tracking-widest flex items-center gap-1.5">
                        <Sparkles size={10} className="text-yellow-400" />
                        <span>استخدام مجاني وغير محدود للمشتركين</span>
                    </div>
                </div>
            </div>
        </footer>
      </main>

      {/* Upgrade Modal */}
      <UpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />

      {showBuyModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-[#111] rounded-3xl w-full max-w-lg border border-white/10 overflow-hidden relative" dir="rtl">
            <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500"></div>
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown size={20} className="text-purple-400" />
                <h2 className="text-xl font-bold text-white">إضافة رصيد</h2>
              </div>
              <button onClick={() => setShowBuyModal(false)} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {loadingPlans ? <div className="text-center py-12 animate-pulse text-gray-500">جاري التحميل...</div> : (
                <div className="space-y-4">
                  {plans.map((p) => (
                    <button key={p.plan_id} onClick={() => onSelectPlan(p.plan_id)} className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-right transition-all border border-white/5 hover:border-purple-500/50 group flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white group-hover:text-purple-400 transition-colors">{p.plan_name}</div>
                        <div className="text-gray-400 text-xs mt-1">{p.credits_per_period} نقطة / {p.period}</div>
                      </div>
                      <div className="text-white font-bold text-xl bg-white/10 px-3 py-1 rounded-lg group-hover:bg-purple-500">{p.amount} <span className="bg-gradient-to-r from-[#FF0000] via-[#FFFFFF] to-[#000000] bg-clip-text text-transparent font-bold">IQD</span></div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {openPaymentModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100]">
          <div className="w-full max-w-[1200px]">
            <PaymentModal
              modalOpen={openPaymentModal} setModalOpen={setOpenPaymentModal}
              productType="credits" period={selectedPlan.period as any} productId={selectedPlan.plan_id}
              productData={{ 
                tool_name: selectedPlan.plan_name, 
                pack_name: selectedPlan.plan_name, 
                monthly_price: selectedPlan.amount, 
                yearly_price: selectedPlan.amount, 
                tool_day_price: selectedPlan.amount,
                amount: selectedPlan.amount // هذا الحقل مطلوب لعرض السعر في ProductDetail
              }}
              onBuySuccess={() => { setOpenPaymentModal(false); fetchBalance(); }}
            />
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showDeleteModal && (
          <ConfirmationModal
            title="حذف المحادثة"
            message="هل أنت متأكد من حذف هذه المحادثة؟ لا يمكن التراجع عن هذا الإجراء."
            buttonMessage="حذف نهائي"
            modalOpen={showDeleteModal}
            setModalOpen={setShowDeleteModal}
            action={confirmDeleteThread}
            isLoading={isDeletingThread}
          />
      )}

      <style jsx global>{`
        .animate-float {
            animation: float 6s ease-in-out infinite;
        }
        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
        }
        .custom-scrollbar::-webkit-scrollbar {
            width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.1);
        }
        @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
            animation: fade-in-up 0.4s ease-out forwards;
        }
        .animate-fade-in {
            animation: fadeIn 0.5s ease-out forwards;
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .bg-300% {
            background-size: 300% 300%;
        }
        @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        .animate-gradient {
            animation: gradient 8s linear infinite;
        }
        @keyframes typing-dot {
            0%, 100% { transform: translateY(0); opacity: 0.3; }
            50% { transform: translateY(-4px); opacity: 1; }
        }
        .animate-typing-dot {
            animation: typing-dot 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}