"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useTranslation } from 'react-i18next';
import PaymentModal from "@/components/Modals/PaymentModal";
import { 
  ArrowRight,
  Check, 
  Sparkles,
  Zap,
  Crown,
  Star,
  CreditCard,
  Users,
  Infinity,
  ChevronLeft,
  ShieldCheck,
  ZapOff,
  History,
  HelpCircle,
  ArrowLeft,
  Calendar,
  X
} from 'lucide-react';
import { PremiumButton } from "@/components/PremiumButton";
import { BorderBeam } from "@/components/ui/border-beam";
import Image from "next/image";

type Plan = {
  plan_id: number;
  plan_name: string;
  credits_per_period: number;
  amount: string;
  period: string;
  allowed_tools?: string; // Added field
  description?: string;
  features?: string[];
  popular?: boolean;
  color?: string;
  allowed_tools_list?: string[];
};

const ALL_TOOLS_MAPPING: Record<string, string> = {
  'chat': 'نيكسوس تشات برو',
  'image': 'انشاء صور احترافية',
  'image-to-text': 'استخراج النص من الصورة',
  'upscale': 'رفع دقة الصور',
  'bg-remove': 'حذف الخلفية',
  'restore': 'ترميم الصور',
  'avatar': 'صانع الأفاتار',
  'nano': 'نانو بانانا برو 🍌',
  'product': 'نماذج لمنتجك',
  'colorize': 'تلوين الصور',
  'edit': 'المحرر الذكي',
  'sketch': 'رسم إلى صورة',
  'logo': 'صانع الشعارات',
  'video': 'انشاء فيديوهات احترافية',
  // 'lipsync': 'تحريك الشفاه',
  // 'effects': 'تأثيرات الفيديو',
  // 'long-video': 'الفيديو الطويل',
  'motion': 'تحريك الصور',
  // 'ugc': 'محتوى المستخدم',
  // 'vupscale': 'تحسين الفيديو',
  // 'resize': 'تحجيم الفيديو',
};

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
};

export default function PlansPage() {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [balance, setBalance] = useState<CreditsRecord | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_URL;

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
    try {
      const res = await fetch(`${apiBase}/api/credits/me/balance`, { 
        headers: { 
          'Authorization': token as any, 
          'Content-Type': 'application/json', 
          "User-Client": (global as any)?.clientId1328 
        } 
      });
      if (res.status === 200) {
        const data = (await res.json()) as CreditsRecord | null;
        setBalance(data);
      }
    } catch (e: any) {
      console.error('Error fetching balance:', e);
    } finally {
      setLoadingBalance(false);
    }
  };

  const loadPlans = async () => {
    if (!apiBase) return;
    setLoadingPlans(true);
    try {
      const res = await fetch(`${apiBase}/api/credits/plans`);
      if (res.status === 200) {
        const data = await res.json();
        const enhancedPlans = data.map((plan: Plan) => ({
          ...plan,
          description: getPlanDescription(plan),
          features: getPlanFeatures(plan),
          allowed_tools_list: JSON.parse(plan.allowed_tools || '["*"]'),
          popular: plan.plan_name.toLowerCase().includes('pro') || plan.plan_name.toLowerCase().includes('premium'),
          color: getPlanColor(plan)
        }));
        setPlans(enhancedPlans);
      }
    } catch (e) {
      console.error('Error loading plans:', e);
    } finally {
      setLoadingPlans(false);
    }
  };

  const getPlanDescription = (plan: Plan): string => {
    if (plan.credits_per_period <= 100) return "مثالي للبدء واستكشاف قدرات الذكاء الاصطناعي";
    if (plan.credits_per_period <= 500) return "باقة رائعة للاستخدام اليومي والمنتظم";
    if (plan.credits_per_period <= 1000) return "مصممة للمبدعين والمستخدمين المحترفين";
    return "إبداع بلا حدود مخصص للمؤسسات والمحترفين";
  };

  const getPlanFeatures = (plan: Plan): string[] => {
    const features: string[] = [`${plan.credits_per_period} نقطة ذكاء اصطناعي`];
    
    try {
      // Parse allowed tools or default to all if "*" is present
      const allowed = JSON.parse(plan.allowed_tools || '["*"]');
      let toolsList: string[] = [];

      if (allowed.includes('*')) {
        // Show ALL tools definitely
        // Prioritize specific tools: Nano, Video, then others
        const priorityTools = ['nano', 'video'];
        
        // Add priority tools first
        priorityTools.forEach(toolId => {
            if (ALL_TOOLS_MAPPING[toolId]) {
                toolsList.push(ALL_TOOLS_MAPPING[toolId]);
            }
        });

        // Add remaining tools
        Object.keys(ALL_TOOLS_MAPPING).forEach(toolId => {
            if (!priorityTools.includes(toolId)) {
                toolsList.push(ALL_TOOLS_MAPPING[toolId]);
            }
        });

      } else {
        // Show only specifically allowed tools
        // Sort to prioritize Nano and Video if they exist in the allowed list
        const sortedTools = allowed.sort((a: string, b: string) => {
            if (a === 'nano') return -1;
            if (b === 'nano') return 1;
            if (a === 'video') return -1;
            if (b === 'video') return 1;
            return 0;
        });

        sortedTools.forEach((toolId: string) => {
          if (ALL_TOOLS_MAPPING[toolId]) {
            toolsList.push(ALL_TOOLS_MAPPING[toolId]);
          }
        });
      }
      
      features.push(...toolsList);

    } catch (e) {
      // Fallback in case of JSON error
      features.push("الوصول لكامل الأدوات");
    }

    return features;
  };

  const getPlanColor = (plan: Plan): string => {
    // Hierarchy: Bronze (Small) -> Silver (Med) -> Gold (Large)
    if (plan.credits_per_period <= 100) return "from-[#804A00] via-[#B87333] to-[#4D2D00]"; // Bronze (True Copper/Brown)
    if (plan.credits_per_period <= 500) return "from-[#71706E] via-[#E5E4E2] to-[#3B3C36]"; // Silver (True Metallic Gray/White)
    if (plan.credits_per_period <= 1000) return "from-[#BF953F] via-[#FCF6BA] to-[#AA771C]"; // Gold (True Rich Metallic Gold)
    return "from-[#30CFD0] via-[#330867] to-[#30CFD0]"; // Platinum/Special
  };

  const onSelectPlan = async (plan: Plan) => {
    setSelectedPlan(plan);
    setOpenPaymentModal(true);
  };

  useEffect(() => {
    loadPlans();
    fetchBalance();
  }, []);

  return (
    <div className="min-h-screen bg-[#000000] text-white selection:bg-purple-500/30 font-sans overflow-x-hidden relative" dir="rtl">
      {/* Background Ambience */}
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none z-0"></div>
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-900/10 blur-[120px] rounded-full pointer-events-none z-0"></div>

      {/* Navbar Container */}
      <header className="h-20 flex items-center justify-between px-8 border-b border-white/5 bg-black/40 backdrop-blur-2xl sticky top-0 z-[60]">
        <div className="flex items-center gap-6">
            <Link href="/ai" className="p-3 hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-white/10 text-gray-400 hover:text-white group">
                <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <div className="flex items-center gap-3">
                <div className="relative w-fit rounded-full overflow-hidden">
                              <Image
                               src="/images/icon.png.png"
                               alt="Logo"
                               width={50}
                               height={50}
                               className="rounded-full"
                             />
                             <BorderBeam size={50} duration={1} className="rounded-full" />
                            </div>
                <div className="flex flex-col">
                    <h2 className="text-lg font-black tracking-tight leading-none mb-1 uppercase">خُطط نيكسوس</h2>
                    <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">اختر مسارك للإبداع</span>
                </div>
            </div>
        </div>

        <Link href="/ai" className="px-6 py-2.5 rounded-full bg-white text-black text-xs font-black transition-all hover:shadow-[0_15px_30px_-10px_rgba(255,255,255,0.4)] hover:scale-105 active:scale-95 flex items-center gap-2">
            <span>الرئيسية </span>
            <ChevronLeft size={14} strokeWidth={3} />
        </Link>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        
        {/* Title Section */}
        <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 animate-fade-in">
                <Sparkles size={14} className="text-purple-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">أسعار مرنة لجميع المستويات</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black mb-8 leading-tight tracking-tight">
                استثمر في <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-400 to-blue-500 animate-gradient bg-300%">إبداعك</span>
            </h1>
            <p className="max-w-2xl mx-auto text-gray-500 text-lg md:text-xl font-bold leading-relaxed mb-12">
                انطلق إلى آفاق جديدة مع باقات نيكسوس برو. احصل على نقاط إضافية، وصول غير محدود للأدوات المتقدمة، ودعم فني مخصص.
            </p>

            {/* Current Balance Card */}
            {balance && (
                <div className="max-w-md mx-auto p-6 rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-3xl shadow-2xl relative overflow-hidden group hover:border-white/20 transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 blur-[50px] rounded-full -mr-16 -mt-16"></div>
                    
                    <div className="relative z-10 flex items-center justify-between gap-6">
                        <div className="text-right">
                            <div className="flex items-center gap-2 mb-1">
                                <History size={14} className="text-purple-400" />
                                <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">رصيدك الحالي</span>
                            </div>
                            <div className="text-3xl font-black text-white">{balance.remaining_credits} <span className="text-sm text-gray-500">نقطة</span></div>
                        </div>

                        <div className="shrink-0 w-px h-12 bg-white/10"></div>

                        <div className="text-right">
                            <div className="flex items-center gap-2 mb-1">
                                <ShieldCheck size={14} className="text-emerald-400" />
                                <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">حالة الاشتراك</span>
                            </div>
                            <div className="text-sm font-black text-emerald-400">{balance.plan_name}</div>
                        </div>

                        <div className="shrink-0 w-px h-12 bg-white/10"></div>

                        <div className="text-right">
                            <div className="flex items-center gap-2 mb-1">
                                <Calendar size={14} className="text-orange-400" />
                                <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">ينتهي في</span>
                            </div>
                            <div className="text-[11px] font-black text-white">
                                {new Date(balance.endedAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-col gap-2">
                        <div className="flex justify-between items-center text-[10px] font-black text-gray-500 uppercase tracking-tighter">
                            <span>التقدم المتبقي</span>
                            <span>{Math.round((balance.remaining_credits / balance.total_credits) * 100)}%</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-1000" 
                                style={{ width: `${(balance.remaining_credits / balance.total_credits) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24">
            {loadingPlans ? (
                Array(4).fill(0).map((_, i) => (
                    <div key={i} className="h-[450px] rounded-[2.5rem] bg-white/5 animate-pulse border border-white/5"></div>
                ))
            ) : (
                plans.map((plan) => (
                    <div key={plan.plan_id} className={`group relative flex flex-col p-8 rounded-[2.5rem] bg-white/[0.03] border backdrop-blur-sm transition-all duration-500 hover:scale-[1.03] hover:-translate-y-2 ${plan.popular ? 'border-purple-500/30 bg-purple-500/[0.02] shadow-[0_30px_60px_-15px_rgba(168,85,247,0.15)]' : 'border-white/5 hover:border-white/10'}`}>
                        
                        {plan.popular && (
                            <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 z-20">
                                <div className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 border border-white/20 whitespace-nowrap">
                                    <Star size={12} fill="currentColor" />
                                    <span>الأكثر طلباً</span>
                                </div>
                            </div>
                        )}

                        <div className="mb-8 text-center relative">
                            <div className="relative mx-auto mb-6 w-fit group-hover:scale-110 transition-transform duration-500">
                                {/* Glow Effect */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${plan.color} blur-[40px] opacity-30 rounded-full scale-150`}></div>
                                
                                <div className="relative z-10">
                                    <svg width="0" height="0" className="absolute">
                                        <defs>
                                            <linearGradient id={`grad-${plan.plan_id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                                {/* Define gradients based on plan logic - simplified mapping */}
                                                <stop offset="0%" stopColor={plan.credits_per_period <= 100 ? "#804A00" : plan.credits_per_period <= 500 ? "#71706E" : plan.credits_per_period <= 1000 ? "#BF953F" : "#30CFD0"} />
                                                <stop offset="100%" stopColor={plan.credits_per_period <= 100 ? "#B87333" : plan.credits_per_period <= 500 ? "#E5E4E2" : plan.credits_per_period <= 1000 ? "#FCF6BA" : "#330867"} />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    
                                    <Crown 
                                        size={50} 
                                        style={{ stroke: `url(#grad-${plan.plan_id})` }}
                                        strokeWidth={1.5}
                                        className="drop-shadow-lg"
                                    />
                                </div>
                            </div>
                            
                            <h3 className="text-xl font-black mb-1 text-white">{plan.plan_name}</h3>
                            <p className="text-gray-500 text-xs font-bold leading-relaxed">{plan.description}</p>
                        </div>

                        <div className="mb-10 flex flex-col items-center">
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black text-white"><span className="bg-gradient-to-r from-[#FF0000] via-[#FFFFFF] to-[#000000] bg-clip-text text-transparent font-bold">
  IQD
</span>{plan.amount}</span>
                                <span className="text-gray-500 text-xs font-bold">/ {plan.period === 'month' ? 'شهر' : 'سنة'}</span>
                            </div>
                        </div>

                        <div className="flex-1 mb-8 overflow-hidden flex flex-col">
                            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                {plan.features?.map((feature, idx) => (
                                    <div key={idx} className="flex items-center gap-2 group/feat transition-all hover:translate-x-1">
                                        <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-emerald-500/10 text-emerald-500 group-hover/feat:bg-emerald-500/20">
                                            <Check size={12} strokeWidth={3} />
                                        </div>
                                        <span className="text-[11px] font-bold text-gray-400 group-hover/feat:text-gray-200 transition-colors">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <PremiumButton 
                            label="اختيار الباقة"
                            icon={CreditCard}
                            secondaryIcon={ArrowLeft}
                            onClick={() => onSelectPlan(plan)}
                            className={`w-full py-4 text-base ${plan.popular ? '' : 'bg-[#1a1a1a]'}`}
                        />

                       
                            <BorderBeam 
                                size={350}
                                duration={8}
                                colorFrom="#9c40ff"
                                colorTo="#40ffaa"
                                borderWidth={2}
                            />
                       
                    </div>
                ))
            )}
        </div>

        {/* FAQ Section */}
        <section className="mb-24">
            <div className="text-center mb-16">
                <h2 className="text-4xl font-black mb-4">الأسئلة الشائعة</h2>
                <div className="w-20 h-1 bg-gradient-to-r from-purple-500 to-blue-500 mx-auto rounded-full"></div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                {[
                    { q: "ما هي نقاط نيكسوس (Credits)؟", a: "هي العملة الرقمية المستخدمة لتشغيل جميع أدوات الذكاء الاصطناعي في المنصة. كل عملية توليد صورة أو محادثة تستهلك عدداً معيناً من النقاط." },
                    { q: "هل تنتهي صلاحية النقاط؟", a: "نعم، النقاط تتبع دورة اشتراكك. في الخطط الشهرية يتم تجديد النقاط كل 30 يوماً، وفي السنوية كل 365 يوماً." },
                    { q: "كيف يمكنني الترقية؟", a: "يمكنك الترقية في أي وقت من خلال اختيار باقة أعلى. سيتم إضافة النقاط الجديدة إلى حسابك فور إتمام عملية الدفع." },
                    // { q: "ما هي وسائل الدفع المدعومة؟", a: "ندعم جميع بطاقات الائتمان، PayPal، بالإضافة إلى وسائل الدفع المحلية المتاحة في منطقتك." }
                ].map((item, i) => (
                    <div key={i} className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0 group-hover:bg-purple-500/20 transition-colors">
                                <HelpCircle size={20} className="text-purple-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-white mb-3">{item.q}</h3>
                                <p className="text-gray-500 font-bold text-sm leading-relaxed">{item.a}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>

        {/* Guarantee Banner */}
        <div className="relative p-12 rounded-[3rem] bg-gradient-to-tr from-[#050505] to-[#0a0a0a] border border-white/5 text-center overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
            <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
                    <ShieldCheck size={32} className="text-emerald-400" />
                </div>
                <h2 className="text-3xl font-black mb-4">اشترك الآن بكل أمان</h2>
                <p className="text-gray-500 font-bold max-w-xl mx-auto mb-8">
                    نحن نضمن لك أسرع أداء وأدق النتائج بمساعدة تقنيات Gemini 2.0 و Stable Diffusion المتطورة.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                    <span className="text-[10px] font-black uppercase tracking-widest">الفعالية 99.9%</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">تشفير كامل للبيانات</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">دعم فني فوري</span>
                </div>
            </div>
        </div>

      </main>

      {/* Payment Modal */}
      {openPaymentModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-[1000] p-6 animate-fade-in text-right">
            <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-[#050505] border border-white/10 rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,1)] relative custom-scrollbar">
                <button 
                    onClick={() => setOpenPaymentModal(false)}
                    className="absolute top-6 left-6 p-4 bg-white/5 hover:bg-white/10 rounded-full transition-all text-gray-500 hover:text-white z-50"
                >
                    <ArrowLeft size={24} />
                </button>
                
                <div className="p-10 pr-12">
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
                        amount: selectedPlan.amount // هذا الحقل مطلوب لعرض السعر في ProductDetail
                      }}
                      onBuySuccess={() => {
                        setOpenPaymentModal(false);
                        fetchBalance();
                      }}
                    />
                </div>
            </div>
        </div>
      )}

      <style jsx global>{`
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
        .animate-fade-in {
            animation: fadeIn 0.8s ease-out forwards;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}