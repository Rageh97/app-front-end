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
  Layers,
  Sparkle,
  X
} from 'lucide-react';
import { BorderBeam } from "@/components/ui/border-beam";

type Plan = {
  plan_id: number;
  plan_name: string;
  credits_per_period: number;
  amount: string;
  period: string;
  allowed_tools?: string;
  description?: string;
  popular?: boolean;
  color?: string;
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

const parseNumericValue = (val: any): number => {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const cleaned = String(val).replace(/,/g, '').replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

const formatPrice = (plan: any): string => {
  const raw = plan?.amount ?? plan?.monthly_price ?? plan?.price ?? 0;
  return parseNumericValue(raw).toLocaleString('en-US');
};

const formatCredits = (plan: any): string => {
  const raw = plan?.credits_per_period ?? plan?.monthly_credits ?? plan?.credits ?? 0;
  return parseNumericValue(raw).toLocaleString('en-US');
};

const getPlanColor = (plan: any): string => {
  const credits = parseNumericValue(plan?.credits_per_period);
  if (credits <= 100) return "from-[#804A00] via-[#B87333] to-[#4D2D00]";
  if (credits <= 500) return "from-[#71706E] via-[#E5E4E2] to-[#3B3C36]";
  if (credits <= 1000) return "from-[#BF953F] via-[#FCF6BA] to-[#AA771C]";
  return "from-[#30CFD0] via-[#330867] to-[#30CFD0]";
};

const getPlanTierData = (plan: any, index: number, total: number) => {
  const credits = parseNumericValue(plan?.credits_per_period);
  
  if (index === 0) {
    return {
      tierName: "باقة البداية",
      description: "مثالية للمبتدئين وتجربة أدوات الذكاء الاصطناعي وتوليد الصور والمهام البسيطة.",
      features: [
        "جميع موديلات الذكاء الاصطناعي متاحة بالكامل",
        "توليد وتعديل الصور والرسومات الذكية",
        "سرعة معالجة قياسية في السيرفرات",
        "دعم فني مستمر",
      ]
    };
  } else if (total === 3 ? index === 1 : (credits <= 600 || index === 1)) {
    return {
      tierName: "باقة المحترفين",
      description: "لصناع المحتوى والمحترفين لإنتاج مستمر وتوليد الفيديوهات والصور بجودة عالية.",
      features: [
        "جميع موديلات الذكاء الاصطناعي متاحة بالكامل",
        "توليد الفيديو السينمائي، تحريك الصور، واستنساخ الصوت",
        "جودة فائقة مع أولوية متقدمة في طابور المعالجة",
        "دعم فني مباشر وسريع",
      ]
    };
  } else if (total === 4 && index === 2) {
    return {
      tierName: "باقة الأعمال",
      description: "للمبدعين والفرق التي تحتاج رصيداً وفيراً وسرعة معالجة مضاعفة للمشاريع الكبيرة.",
      features: [
        "جميع موديلات الذكاء الاصطناعي متاحة بالكامل",
        "توليد غير مقيد بجودة 4K وأولوية معالجة سريعة (Priority Queue)",
        "توليد الفيديوهات الطويلة والمهام المعقدة بدون انتظار",
        "دعم فني مخصص ذو أولوية عالية",
      ]
    };
  } else {
    return {
      tierName: "باقة النخبة",
      description: "طاقة توليد قصوى ومفتوحة مخصصة للاستوديوهات والشركات ذات الاستهلاك اليومي المكثف.",
      features: [
        "جميع موديلات الذكاء الاصطناعي متاحة بالكامل",
        "توليد غير مقيد لكافة أدوات الفيديو والصور والصوت",
        "أعلى أولوية معالجة فورية بالسيرفرات (VIP Priority)",
        "دعم فني VIP مخصص على مدار 24 ساعة",
      ]
    };
  }
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
          "User-Client": (global as any)?.clientId1328 || (typeof window !== 'undefined' ? localStorage.getItem("clientId1328") : "")
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
          popular: plan.plan_name.toLowerCase().includes('pro') || 
                   plan.plan_name.toLowerCase().includes('premium') ||
                   plan.plan_name.includes('المميزة') ||
                   plan.plan_name.includes('بلس'),
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

  const onSelectPlan = async (plan: Plan) => {
    setSelectedPlan(plan);
    setOpenPaymentModal(true);
  };

  useEffect(() => {
    loadPlans();
    fetchBalance();
  }, []);

  return (
    <div className="min-h-screen bg-[#06070B] text-white selection:bg-purple-500/30 font-sans overflow-x-hidden relative" dir="rtl">
      {/* Background Ambience */}
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none z-0"></div>

      {/* Navbar Container */}
      <header className="h-20 flex items-center justify-between px-6 sm:px-8 border-b border-white/[0.08] bg-[#0B0D14]/90 backdrop-blur-2xl sticky top-0 z-[60]">
        <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/ai" className="p-2.5 sm:p-3 hover:bg-[#121520] rounded-xl transition-all border border-transparent hover:border-white/[0.08] text-gray-400 hover:text-white group">
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <div className="flex flex-col">
                <h2 className="text-base sm:text-lg font-bold tracking-tight leading-none mb-1">باقات واشتراكات الذكاء الاصطناعي</h2>
                <span className="text-[10px] font-bold uppercase text-gray-500 tracking-widest">اختر الخطة المناسبة لإطلاق إبداعك</span>
            </div>
        </div>

        <Link href="/ai" className="px-4 sm:px-5 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5">
            <span>العودة للاستوديو</span>
            <ChevronLeft size={14} strokeWidth={3} />
        </Link>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        
        {/* Title Section */}
        <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#121520] border border-white/[0.08] mb-6">
                <Sparkles size={14} className="text-amber-400" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-gray-300">خطط احترافية مع إتاحة كافة الموديلات</span>
            </div>
            
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black mb-6 leading-tight tracking-tight text-white">
                باقات رصيد الذكاء الاصطناعي
            </h1>

            {/* Tabs for Website vs AI Plans */}
            <div className="flex justify-center mb-8">
              <div className="flex bg-[#190237] p-1.5 rounded-xl border border-[#ff7702]/30 shadow-xl">
                <Link 
                  href="/plans" 
                  className="px-6 py-2.5 rounded-lg font-bold transition-all text-sm md:text-base text-gray-400 hover:text-white hover:bg-white/5"
                >
                  باقات المواقع
                </Link>
                <div className="px-6 py-2.5 rounded-lg font-bold transition-all text-sm md:text-base bg-[#ff7702] text-white shadow-lg cursor-default">
                  باقات الذكاء الاصطناعي
                </div>
              </div>
            </div>

            <p className="max-w-2xl mx-auto text-gray-400 text-sm sm:text-base md:text-lg font-medium leading-relaxed mb-10">
                انطلق إلى آفاق جديدة مع باقات نيكسوس برو. احصل على نقاط كافية، وصول كامل وغير مقيد لكافة الموديلات المتقدمة، وسرعة معالجة قصوى.
            </p>

            {/* Current Balance Card */}
            {balance && (
                <div className="max-w-md mx-auto p-6 rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-3xl shadow-2xl relative overflow-hidden group hover:border-white/20 transition-all mb-12">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/15 blur-[50px] rounded-full -mr-16 -mt-16"></div>
                    
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
                            <span>الرصيد المتبقي</span>
                            <span>{Math.round((balance.remaining_credits / (balance.total_credits || 1)) * 100)}%</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-purple-500 to-emerald-500 transition-all duration-1000" 
                                style={{ width: `${Math.min(100, Math.round((balance.remaining_credits / (balance.total_credits || 1)) * 100))}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Plans Grid - Identical to External Plans Design with Tiered Descriptions & Signature Button */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto w-full px-4 mb-24 justify-center">
            {loadingPlans ? (
                Array(2).fill(0).map((_, i) => (
                    <div key={i} className="h-[520px] rounded-[2.5rem] bg-[#12141C] animate-pulse border border-white/10"></div>
                ))
            ) : plans.length === 0 ? (
                <div className="col-span-full text-center py-16 text-zinc-400">
                    لا توجد باقات معروضة حالياً
                </div>
            ) : (
                [...plans]
                  .sort((a: any, b: any) => parseNumericValue(a.credits_per_period) - parseNumericValue(b.credits_per_period))
                  .map((plan, index, arr) => {
                    const color = plan.color || getPlanColor(plan);
                    const periodText = plan.period === 'year' ? 'سنوياً' : 'شهرياً';
                    const tier = getPlanTierData(plan, index, arr.length);

                    return (
                        <div 
                            key={plan.plan_id} 
                            className="group relative flex flex-col p-8 rounded-[2.5rem] bg-[#12141C] border border-white/10 hover:border-white/20 backdrop-blur-sm transition-all duration-300"
                        >
                            {/* Crown & Title */}
                            <div className="mb-6 text-center relative">
                                <div className="relative mx-auto mb-4 w-fit">
                                    <div className={`absolute inset-0 bg-gradient-to-br ${color} blur-[30px] opacity-30 rounded-full scale-150`}></div>
                                    <Crown 
                                        size={46} 
                                        className="text-amber-400 drop-shadow-lg mx-auto relative z-10"
                                        strokeWidth={1.5}
                                    />
                                </div>
                                
                                <h3 className="text-xl font-black mb-1 text-white">{plan.plan_name}</h3>
                                <p className="text-gray-400 text-xs font-medium leading-relaxed px-2">{tier.description}</p>
                            </div>

                            {/* Price Section with IQD Gradient */}
                            <div className="mb-6 flex flex-col items-center">
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-3xl sm:text-4xl font-black text-white">
                                        <span className="bg-gradient-to-r from-[#FF0000] via-[#FFFFFF] to-[#000000] bg-clip-text text-transparent font-bold">IQD </span>
                                        {formatPrice(plan)}
                                    </span>
                                    <span className="text-gray-400 text-xs font-bold">/ {plan.period === 'year' ? 'سنة' : 'شهر'}</span>
                                </div>
                            </div>

                            {/* Credits Info Box */}
                            <div className="mb-6 flex flex-col justify-center">
                                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-center space-y-1.5">
                                    <div className="text-emerald-400 font-extrabold text-base sm:text-lg">
                                        {formatCredits(plan)} نقطة / {periodText}
                                    </div>
                                    <p className="text-gray-300 text-[11px] sm:text-xs font-medium leading-relaxed">
                                        صالحة لجميع أدوات واستوديو الذكاء الاصطناعي
                                    </p>
                                </div>
                            </div>

                            {/* Features List - Tier Specific with All Models Included */}
                            <div className="flex-1 mb-8 space-y-2.5">
                                {tier.features.map((feat: string, fIdx: number) => (
                                    <div key={fIdx} className="flex items-center gap-2 text-xs text-gray-300 font-medium">
                                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${fIdx === 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-emerald-400'}`}>
                                            <Check size={10} strokeWidth={3} />
                                        </div>
                                        <span className={fIdx === 0 ? 'text-emerald-400 font-bold' : ''}>{feat}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Signature NEXUS Generate-Style Button */}
                            <div className="w-full px-1.5 py-0.5 flex justify-center mt-auto">
                                <button 
                                    type="button"
                                    onClick={() => onSelectPlan(plan)}
                                    className="relative group w-full py-3.5 px-5 transition-all duration-300 font-bold text-sm select-none skew-x-[-22deg] rounded-[15px] overflow-hidden bg-[linear-gradient(135deg,_#4f008c_0%,_#3d006e_50%,_#190237_100%)] hover:bg-[linear-gradient(135deg,_#6100ad_0%,_#4c008a_50%,_#21034a_100%)] text-white border border-[#ff7702]/60 hover:border-[#ff7702] gradient-border-packet shadow-[0_4px_20px_rgba(79,0,140,0.4)] hover:shadow-[0_6px_25px_rgba(255,119,2,0.35),0_0_20px_rgba(79,0,140,0.5)] active:scale-[0.98]"
                                >
                                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.14] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none rounded-[15px]" />
                                    <div className="skew-x-[22deg] flex items-center justify-center w-full gap-2 text-white">
                                        <CreditCard size={16} className="text-[#ff9933] group-hover:scale-110 transition-transform duration-200 shrink-0" />
                                        <span className="font-extrabold text-sm tracking-wide text-white">اختيار الباقة</span>
                                        <ArrowLeft size={14} className="text-white/80 shrink-0" />
                                    </div>
                                </button>
                            </div>

                            {/* Border Beam Animation Effect */}
                            <BorderBeam 
                                size={300}
                                duration={8}
                                colorFrom="#9c40ff"
                                colorTo="#40ffaa"
                                borderWidth={1.5}
                            />
                        </div>
                    );
                })
            )}
        </div>

        {/* FAQ Section */}
        <section className="mb-24">
            <div className="text-center mb-16">
                <h2 className="text-3xl sm:text-4xl font-black mb-4">الأسئلة الشائعة</h2>
                <div className="w-20 h-1 bg-gradient-to-r from-purple-500 to-blue-500 mx-auto rounded-full"></div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                {[
                    { q: "ما هي نقاط نيكسوس (Credits)؟", a: "هي الرصيد الرقمي المستخدم لتشغيل جميع أدوات الذكاء الاصطناعي في المنصة. كل عملية توليد صورة، فيديو، أو صوت تستهلك عدداً محدداً من النقاط." },
                    { q: "هل جميع الموديلات متاحة في كل الباقات؟", a: "نعم، كافة الموديلات المتقدمة والمحركات الاحترافية (مثل Kling, Midjourney, Flux, Hailuo, Wan, Runway) متاحة لجميع المشتركين بدون أي قيود." },
                    { q: "هل تنتهي صلاحية النقاط؟", a: "تتبع النقاط دورة اشتراكك المحددة (شهرياً أو سنوياً) ويتم تجديدها تلقائياً عند تجديد الباقة لضمان استمرارية استخدامك." },
                    { q: "كيف يمكنني الترقية لباقة أعلى؟", a: "يمكنك الترقية في أي وقت بكل سهولة من خلال اختيار الباقة التي تناسبك وسيتم تفعيل رصيدك الإضافي فوراً." }
                ].map((item, i) => (
                    <div key={i} className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0 group-hover:bg-purple-500/20 transition-colors">
                                <HelpCircle size={20} className="text-purple-400" />
                            </div>
                            <div>
                                <h3 className="text-base sm:text-lg font-black text-white mb-2">{item.q}</h3>
                                <p className="text-gray-400 font-medium text-xs sm:text-sm leading-relaxed">{item.a}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>

        {/* Guarantee Banner */}
        <div className="relative p-10 sm:p-12 rounded-[3rem] bg-gradient-to-tr from-[#080a14] to-[#121422] border border-white/10 text-center overflow-hidden group shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
            <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 bg-purple-500/10 border border-purple-500/20 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <ShieldCheck size={32} className="text-purple-400" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-black mb-3">اشترك الآن بأعلى موثوقية وأمان</h2>
                <p className="text-gray-400 font-medium text-xs sm:text-sm max-w-xl mx-auto mb-8 leading-relaxed">
                    نضمن لك استقرار الأداء وسرعة تنفيذ خوارزميات التوليد، مع دعم فني مستمر لتجربة إبداعية استثنائية.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 opacity-70">
                    <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400">✓ الفعالية 99.9%</span>
                    <span className="text-[11px] font-black uppercase tracking-widest text-blue-400">✓ تشفير كامل للبيانات</span>
                    <span className="text-[11px] font-black uppercase tracking-widest text-purple-400">✓ دعم فني فوري</span>
                </div>
            </div>
        </div>

      </main>

      {/* Payment Modal */}
      {openPaymentModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-[1000] p-4 sm:p-6 animate-fade-in text-right">
            <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-[#050505] border border-white/10 rounded-[2.5rem] sm:rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,1)] relative custom-scrollbar">
                <button 
                    onClick={() => setOpenPaymentModal(false)}
                    className="absolute top-6 left-6 p-3 sm:p-4 bg-white/5 hover:bg-white/10 rounded-full transition-all text-gray-400 hover:text-white z-50"
                >
                    <ArrowLeft size={20} />
                </button>
                
                <div className="p-6 sm:p-10 pr-8 sm:pr-12">
                    <PaymentModal
                      modalOpen={openPaymentModal}
                      setModalOpen={setOpenPaymentModal}
                      productType="credits"
                      period={selectedPlan.period as any}
                      productId={selectedPlan.plan_id}
                      productData={{
                        tool_name: selectedPlan.plan_name,
                        pack_name: selectedPlan.plan_name,
                        monthly_price: String(parseNumericValue(selectedPlan.amount) || selectedPlan.amount),
                        yearly_price: String(parseNumericValue(selectedPlan.amount) || selectedPlan.amount),
                        tool_day_price: String(parseNumericValue(selectedPlan.amount) || selectedPlan.amount),
                        amount: String(parseNumericValue(selectedPlan.amount) || selectedPlan.amount)
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
        .animate-fade-in {
            animation: fadeIn 0.5s ease-out forwards;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}