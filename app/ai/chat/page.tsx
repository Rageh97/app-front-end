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

    // Show upgrade modal if user has no credits or no active plan balance
    if (!balance || balance.remaining_credits <= 0) {
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

      const res = await fetch(`${apiBase}/api/ai/chat`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ 
          message: text, 
          image: imageToSend || undefined, 
          document: documentToSend || undefined,
          thread_id: threadId 
        }),
        signal: controller.signal
      });

      if (res.ok) {
        const data = await res.json();
        const responseText = data.response as string;
        let current = '';
        isTypingRef.current = true;
        
        // البدء في تلوين/كتابة الرد في نفس الحاوية المحجوزة
        const step = 25; // Number of characters to add per tick (Faster)
        for (let i = 0; i <= responseText.length; i += step) {
          if (controller.signal.aborted) break;
          const end = Math.min(i + step, responseText.length);
          current = responseText.slice(0, end);
          setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: current } : m));
          if (end === responseText.length) break;
          await new Promise(r => setTimeout(r, 1)); // (سرعة قصوى)
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
        toast.error("فشلت عملية المحادثة");
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
    <div className="flex h-screen bg-[#000000] text-white selection:bg-purple-500/30 font-sans overflow-hidden" dir="rtl">
      <Toaster position="top-right" />
      
      {/* Dynamic Background Ambience */}
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-900/10 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Sidebar - Threads */}
      <aside className={`relative z-30 flex flex-col bg-[#050505] border-l border-white/5 transition-all duration-500 ease-in-out ${sidebarOpen ? 'w-72' : 'w-0'} overflow-hidden shadow-2xl`}>
        <div className="flex flex-col h-full w-72">
            {/* Sidebar Header */}
            <div className="p-4 pb-2">
                <Link href="/ai" className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors mb-4 group">
                   <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                   <span>إستوديو نيكسوس</span>
                </Link>
                
                <PremiumButton 
                    label="محادثة جديدة"
                    icon={Plus}
                    secondaryIcon={ChevronLeft}
                    onClick={() => createThread(null)}
                    className="h-10 w-full text-xs"
                />
            </div>

            {/* Threads List */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 custom-scrollbar">
                <div className="flex items-center gap-1.5 px-2 mb-3">
                    <History size={12} className="text-gray-600" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-600">السجل الأخير</span>
                </div>
                
                {threads.length === 0 && !isLoadingThread && (
                    <div className="text-center py-8 px-4">
                        <div className="text-gray-700 text-[10px] font-bold leading-relaxed">لا يوجد محادثات سابقة.</div>
                    </div>
                )}

                {threads.map((thread) => (
                    <div
                        key={thread.thread_id}
                        className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-300 border ${
                            activeThreadId === thread.thread_id 
                                ? 'bg-white/10 border-white/10 shadow-lg' 
                                : 'bg-transparent border-transparent hover:bg-white/[0.03]'
                        }`}
                        onClick={() => setActiveThreadId(thread.thread_id)}
                    >
                        <MessageSquare size={14} className={activeThreadId === thread.thread_id ? 'text-purple-400' : 'text-gray-600'} />
                        
                        <div className="flex-1 min-w-0">
                            {editingThreadId === thread.thread_id ? (
                                <input
                                    value={editingTitle}
                                    onChange={(e) => setEditingTitle(e.target.value)}
                                    onBlur={() => updateThreadTitle(thread.thread_id, editingTitle)}
                                    onKeyDown={(e) => e.key === 'Enter' && updateThreadTitle(thread.thread_id, editingTitle)}
                                    className="w-full bg-black/50 border-b border-purple-500 focus:outline-none text-xs py-0.5"
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
                                    balance?.plan_name || userInfo?.userPlansData?.[0]?.plan_name || "Free Plan"
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
        <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-black/40 backdrop-blur-2xl relative z-20">
            <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/10 text-gray-200 hover:text-white"
                >
                  {sidebarOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
                </button>
                
                <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">نيكسوس شات</span>
                </div>
            </div>

            <nav className="relative hidden xl:flex items-center gap-1 p-1 bg-black/60 backdrop-blur-3xl border border-white/10 rounded-full shadow-lg">
                {[
                    { name: 'الرئيسية', path: '/ai', icon: Sparkles, color: 'text-purple-400' },
                    { name: 'المحادثة', path: '/ai/chat', icon: MessageSquare, color: 'text-blue-400' },
                    { name: 'الوسائط', path: '/ai/media', icon: Wand2, color: 'text-pink-400' },
                    { name: 'الخطط', path: '/ai/plans', icon: CreditCard, color: 'text-emerald-400' }
                ].map((item, idx) => (
                    <Link 
                        key={idx}
                        href={item.path}
                        className={`group relative px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-1.5 overflow-hidden ${
                            (item.path === '/ai/chat') ? 'bg-white/10 text-white shadow-inner' : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <item.icon size={12} className={`transition-all duration-300 ${item.color} ${item.path === '/ai/chat' ? 'opacity-100 scale-110' : 'opacity-70 group-hover:opacity-100 group-hover:scale-110'}`} />
                        <span className="relative z-10">{item.name}</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    </Link>
                ))}
            </nav>

            <div className="flex items-center gap-3">
                <Link href="/ai" className="px-3 py-1.5 rounded-md bg-white/5 text-gray-300 text-[10px] font-bold border border-white/10 hover:bg-white/10 transition-all flex items-center gap-1.5">
                    <ArrowRight size={12} />
                    <span>عودة</span>
                </Link>
                
                <button
                  onClick={() => setShowBuyModal(true)}
                  className="relative inline-flex h-8 active:scale-95 transition overflow-hidden rounded-lg p-[1px] focus:outline-none"
                >
                  <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#e7029a_0%,#f472b6_50%,#bd5fff_100%)]"></span>
                  <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-lg bg-[#050505] px-3 text-[10px] font-black text-white backdrop-blur-3xl gap-1.5 transition-all hover:bg-black/40">
                    <Crown size={12} className="text-pink-500" />
                    شراء كريديت
                  </span>
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
                          {/* <img className="w-40 h-40" src="/images/Bot.gif" alt="" /> */}
                            {/* <div className="w-24 h-24 bg-gradient-to-tr from-purple-600 to-cyan-500 rounded-[2.5rem] flex items-center justify-center shadow-2xl animate-float">
                                <Sparkles size={48} className="text-white" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-xl">
                                <Bot size={20} className="text-black" />
                            </div> */}
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black mb-8 leading-tight tracking-tight">
                            <div className="flex items-center justify-center gap-3 text-2xl md:text-4xl text-gray-500 mb-4 font-bold animate-fade-in">
                                <GreetingIcon size={32} className={greeting === "صباح الخير" ? "text-yellow-400" : "text-blue-400"} />
                                <span>{greeting}</span>
                                {userName && (
                                    <span className="bg-gradient-to-r from-white via-gray-300 to-gray-500 bg-clip-text text-transparent">
                                        ، {userName}
                                    </span>
                                )}
                            </div>
                            كيف يمكنني <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-400 to-blue-500 animate-gradient bg-300%">مساعدتك؟</span>
                        </h1>

                        {/* Prompt Suggestions */}
                        {/* <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl px-4">
                            {[
                                { t: "اكتب لي كود بايثون لتحليل البيانات", i: Wand2 },
                                { t: "لخص لي كتاب العادات الذرية", i: Layers },
                                { t: "خطط لي رحلة سياحية إلى اليابان", i: Zap },
                                { t: "اشرح لي نظرية النسبية ببساطة", i: Sparkles }
                            ].map((s, i) => (
                                <button key={i} onClick={() => setInputMessage(s.t)} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-right hover:border-purple-500/50 hover:bg-white/[0.05] transition-all group">
                                    <div className="flex items-center justify-between mb-2">
                                        <s.i size={16} className="text-purple-500 opacity-50 group-hover:opacity-100 transition-all" />
                                        <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">اقتراح ذكي</span>
                                    </div>
                                    <div className="text-sm font-bold text-gray-400 group-hover:text-white transition-colors">{s.t}</div>
                                </button>
                            ))}
                        </div> */}
                    </div>
                ) : (
                    messages.map((m, idx) => (
                        <div key={m.id} className={`flex gap-3 group ${m.role === 'user' ? 'flex-row-reverse' : ''} animate-fade-in`}>
                            <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center shadow-lg ${
                                m.role === 'user' ? 'bg-white text-black' : 'bg-gradient-to-tr from-purple-600 to-blue-600'
                            }`}>
                                {m.role === 'user' ? <User size={16} /> : <Bot size={16} className="text-white" />}
                            </div>
                            
                            <div className={`flex flex-col max-w-[85%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                                {m.image && (
                                    <div className="mb-3 rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                                        <img src={m.image} alt="Upload" className="max-h-60 w-auto object-cover" />
                                    </div>
                                )}
                                
                                <div className={`relative px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-sm transition-all duration-300 ${
                                    m.role === 'user' 
                                        ? 'bg-white/[0.07] border border-white/10 text-white rounded-tr-none' 
                                        : ' text-gray-200 '
                                }`}>
                                    {m.role === 'assistant' && m.content === '' ? (
                                        <div className="flex flex-col gap-2 py-1">
                                            <div className="flex gap-1 items-center">
                                                <div className="w-1 h-1 bg-purple-500 rounded-full animate-typing-dot" style={{ animationDelay: '0ms' }}></div>
                                                <div className="w-1 h-1 bg-purple-500 rounded-full animate-typing-dot" style={{ animationDelay: '150ms' }}></div>
                                                <div className="w-1 h-1 bg-purple-500 rounded-full animate-typing-dot" style={{ animationDelay: '300ms' }}></div>
                                            </div>
                                            <span className="text-[10px] text-gray-500 animate-pulse font-mono">نيكسوس يفكر...</span>
                                        </div>
                                    ) : (
                                        renderMessageContent(m.content)
                                    )}
                                    
                                    {m.role === 'assistant' && !m.id.startsWith('typing_') && (
                                        <div className="absolute left-0 top-0 -translate-y-1/2 flex gap-1 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all">
                                            <button 
                                                onClick={() => { navigator.clipboard.writeText(m.content); toast.success('تم النسخ'); setCopiedMessageId(m.id) }} 
                                                className="p-1.5 bg-black border border-white/10 rounded-lg hover:bg-purple-600 transition-all shadow-xl text-gray-400 hover:text-white"
                                            >
                                                {copiedMessageId === m.id ? <Check size={12} /> : <Copy size={12} />}
                                            </button>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="mt-1 text-[9px] font-bold uppercase tracking-widest text-gray-600">
                                    {m.timestamp.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} className="h-20" />
            </div>
        </div>

        {/* Floating Input Area */}
        <footer className="p-6 relative z-20">
            <div className="max-w-3xl mx-auto relative">
                
                {/* Attachments Preview Overlay */}
                {(chatImage || chatDocument) && (
                    <div className="absolute bottom-full left-0 mb-3 animate-fade-in-up flex gap-2">
                        {chatImage && (
                            <div className="relative p-1.5 bg-black border border-white/10 rounded-2xl shadow-xl">
                                <img src={chatImage} alt="preview" className="w-16 h-16 rounded-xl object-cover" />
                                <button onClick={() => setChatImage(null)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                                    <X size={12} strokeWidth={3} />
                                </button>
                            </div>
                        )}
                        {chatDocument && (
                            <div className="relative p-3 bg-black border border-purple-500/30 rounded-2xl shadow-xl flex items-center gap-2">
                                <FileText size={20} className="text-purple-400" />
                                <div>
                                    <div className="text-xs font-bold text-white truncate max-w-[120px]">{chatDocument.fileName}</div>
                                    <div className="text-[9px] text-gray-500">وثيقة مرفقة</div>
                                </div>
                                <button onClick={() => setChatDocument(null)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                                    <X size={12} strokeWidth={3} />
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <div className="relative group/input">
                    <div className="relative bg-[#0d0d0d] border border-white/20 rounded-[2rem] p-2 flex items-end gap-2 transition-all focus-within:border-white/30 shadow-lg">
                        {/* Image Upload Button */}
                        <label className="flex mb-1 items-center justify-center w-10 h-10 rounded-full bg-white/[0.03] border border-white/5 text-gray-500 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer group/file shrink-0" title="إرفاق صورة">
                            <input type="file" accept="image/*" className="hidden" onChange={handleChatImageUpload} />
                            <ImageIcon size={18} className="group-hover/file:rotate-6 transition-transform" />
                        </label>
                        
                        {/* Document Upload Button */}
                        <label className="flex mb-1 items-center justify-center w-10 h-10 rounded-full bg-white/[0.03] border border-white/5 text-gray-500 hover:text-purple-400 hover:bg-purple-500/10 active:scale-95 transition-all cursor-pointer group/doc shrink-0" title="إرفاق وثيقة (PDF, TXT, DOC)">
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
                                className="w-full bg-transparent text-white px-2 py-0.5 focus:outline-none resize-none custom-scrollbar text-sm placeholder:text-gray-600 leading-relaxed font-medium"
                                rows={1}
                                disabled={isLoadingChat}
                            />
                        </div>

                        <button
                            onClick={isLoadingChat ? stopGeneration : sendChatMessage}
                            disabled={!isLoadingChat && (!inputMessage.trim() && !chatImage && !chatDocument)}
                            className={`w-10 h-10 mb-1 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 shrink-0 ${
                                isLoadingChat 
                                    ? 'bg-red-500 text-white hover:bg-red-600' 
                                    : 'bg-white text-black disabled:bg-gray-800 disabled:text-gray-600'
                            }`}
                        >
                            {isLoadingChat ? (
                                <div className="w-3 h-3 bg-white rounded-full" />
                            ) : (
                                <ArrowUp size={20} strokeWidth={3} />
                            )}
                        </button>
                        <BorderBeam 
                            size={100}
                            duration={6}
                            colorFrom="rgba(0, 255, 149, 1)"
                            colorTo="rgba(0, 255, 149, 1)"
                            initialOffset={50}
                            borderWidth={1}
                        />
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
                    {estimatedCredits > 0 && (
                        <div className="text-[8px] font-black uppercase text-purple-400 tracking-widest flex items-center gap-1.5">
                            <span>التكلفة المقدرة: {estimatedCredits} نقطة</span>
                            <div className="w-1 h-1 rounded-full bg-purple-500/50"></div>
                        </div>
                    )}
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
                      <div className="text-white font-bold text-xl bg-white/10 px-3 py-1 rounded-lg group-hover:bg-purple-500">${p.amount}</div>
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