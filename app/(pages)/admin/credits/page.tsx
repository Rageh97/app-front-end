'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  CheckCircle2, 
  AlertCircle,
  MessageSquare,
  ImageIcon,
  Video,
  Settings2,
  Wand2,
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { toast } from 'react-hot-toast';

type CreditPlan = {
  plan_id: number;
  plan_name: string;
  period: string;
  credits_per_period: number;
  amount: string;
  isActive: boolean;
  allowed_tools: string; // JSON string
  chat_profit: number;
  image_profit: number;
  video_profit: number;
};

const ALL_TOOLS = [
  { id: 'chat', name: 'نيكسوس تشات برو', category: 'chat' },
  { id: 'image', name: 'انشاء صور احترافية', category: 'image' },
  { id: 'image-to-text', name: 'استخراج النص من الصورة', category: 'image' },
  { id: 'upscale', name: 'رفع دقة الصور', category: 'image' },
  { id: 'bg-remove', name: 'حذف الخلفية', category: 'image' },
  { id: 'restore', name: 'ترميم الصور', category: 'image' },
  { id: 'avatar', name: 'صانع الأفاتار', category: 'image' },
  { id: 'nano', name: 'نانو بانانا برو', category: 'image' },
  { id: 'product', name: 'نماذج لمنتجك', category: 'image' },
  { id: 'colorize', name: 'تلوين الصور', category: 'image' },
  { id: 'edit', name: 'المحرر الذكي', category: 'image' },
  { id: 'sketch', name: 'رسم إلى صورة', category: 'image' },
  { id: 'logo', name: 'صانع الشعارات', category: 'image' },
  { id: 'video', name: 'انشاء فيديوهات احترافية', category: 'video' },
  // { id: 'lipsync', name: 'تحريك الشفاه', category: 'video' },
  // { id: 'effects', name: 'تأثيرات الفيديو', category: 'video' },
  // { id: 'long-video', name: 'الفيديو الطويل', category: 'video' },
  { id: 'motion', name: 'تحريك الصور', category: 'video' },
  // { id: 'ugc', name: 'محتوى المستخدم', category: 'video' },
  // { id: 'vupscale', name: 'تحسين الفيديو', category: 'video' },
  // { id: 'resize', name: 'تحجيم الفيديو', category: 'video' },
];

export default function AdminCreditsPage() {
  const { t } = useTranslation();
  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL, []);
  const [plans, setPlans] = useState<CreditPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiHubEnabled, setAiHubEnabled] = useState(true);
  const [loadingToggle, setLoadingToggle] = useState(false);

  // Form State
  const [form, setForm] = useState<Partial<CreditPlan>>({ 
    plan_name: '', 
    period: 'month', 
    credits_per_period: 100, 
    amount: '0', 
    isActive: true,
    allowed_tools: '["*"]',
    chat_profit: 0.1,
    image_profit: 1,
    video_profit: 2
  });

  // Editing State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<CreditPlan>>({});

  const headers = useMemo(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('a') : null;
    const clientId = (global as any).clientId1328;
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = token;
    if (clientId) h['User-Client'] = clientId;
    return h;
  }, []);

  const loadPlans = async () => {
    if (!apiBase) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/api/credits/plans`, { headers });
      if (res.status === 200) {
        const data = await res.json();
        setPlans(data);
      } else {
        setError("فشل في تحميل الباقات");
      }
    } catch (e) {
      setError("خطأ في الاتصال بالسيرفر");
    } finally {
      setLoading(false);
    }
  };

  const loadAiHubStatus = async () => {
    if (!apiBase) return;
    try {
      const res = await fetch(`${apiBase}/api/admin/settings/ai_hub_enabled`, { headers });
      if (res.status === 200) {
        const data = await res.json();
        setAiHubEnabled(data.value === 'true');
      }
    } catch (e) {
      console.error('Error loading AI hub status:', e);
    }
  };

  const toggleAiHub = async () => {
    if (!apiBase) return;
    setLoadingToggle(true);
    try {
      const newValue = !aiHubEnabled;
      const res = await fetch(`${apiBase}/api/admin/settings/ai_hub_enabled`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ value: newValue }),
      });
      if (res.status === 200) {
        setAiHubEnabled(newValue);
        // Dispatch event to update sidebar and dashboard in real-time
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('settingsChanged', {
            detail: { key: 'ai_hub_enabled', value: newValue }
          }));
        }
      } else {
        setError("فشل في تحديث حالة مكتبة الذكاء الاصطناعي");
      }
    } catch (e) {
      setError("خطأ في الشبكة");
    } finally {
      setLoadingToggle(false);
    }
  };

  const [aiModelPrices, setAiModelPrices] = useState<Record<string, number>>({});
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [savingPrices, setSavingPrices] = useState(false);

  const loadAiModelPrices = async () => {
    if (!apiBase) return;
    setLoadingPrices(true);
    try {
      const res = await fetch(`${apiBase}/api/admin/settings/ai_pricing_config`, { headers });
      if (res.status === 200) {
        const data = await res.json();
        if (data && data.value) {
          try {
            setAiModelPrices(JSON.parse(data.value));
          } catch (e) {
            console.error("Failed to parse pricing JSON:", e);
          }
        }
      }
    } catch (e) {
      console.error('Error loading AI model prices:', e);
    } finally {
      setLoadingPrices(false);
    }
  };

  const saveAiModelPrices = async () => {
    if (!apiBase) return;
    setSavingPrices(true);
    try {
      const res = await fetch(`${apiBase}/api/admin/settings/ai_pricing_config`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ value: JSON.stringify(aiModelPrices) }),
      });
      if (res.status === 200) {
        toast.success("تم حفظ أسعار الموديلات بنجاح");
      } else {
        toast.error("فشل في حفظ أسعار الموديلات");
        setError("فشل في حفظ أسعار الموديلات");
      }
    } catch (e) {
      toast.error("خطأ في الشبكة");
      setError("خطأ في الشبكة");
    } finally {
      setSavingPrices(false);
    }
  };

  useEffect(() => {
    loadPlans();
    loadAiHubStatus();
    loadAiModelPrices();
  }, []);

  // Filter models for display in sections
  const imageModelList = [
    { id: 'imagen-4', name: 'Imagen 4' },
    { id: 'imagen-3', name: 'Imagen 3' },
    { id: 'dall-e-3', name: 'DALL-E 3' },
    { id: 'nano-standard', name: 'Nano Standard (Imagen 3)' },
    { id: 'nano-ultra', name: 'Nano Ultra (Imagen 4)' },
    { id: 'nano-creative', name: 'Nano Creative (Ultra)' },
  ];

  // Video models with CORRECT durations per API specifications:
  // - Veo (all variants): 4, 6, 8 seconds for text-to-video
  // - Sora 2.0: 4, 8, 12 seconds
  // - Sora 2 Pro: 5, 10, 15, 20 seconds (extended durations)
  const videoModelList = [
    { id: 'veo-ultra', name: 'Veo Ultra', durations: [4, 6, 8] },
    { id: 'veo-pro', name: 'Veo Pro', durations: [4, 6, 8] },
    { id: 'veo-fast', name: 'Veo Fast', durations: [4, 6, 8] },
    { id: 'sora', name: 'Sora 2.0', durations: [4, 8, 12] },
    { id: 'sora-pro', name: 'Sora 2 Pro', durations: [5, 10, 15, 20] },
  ];

  const startEdit = (plan: CreditPlan) => {
    setEditingId(plan.plan_id);
    setForm({
      plan_name: plan.plan_name,
      period: plan.period,
      credits_per_period: plan.credits_per_period,
      amount: plan.amount,
      isActive: plan.isActive,
      allowed_tools: plan.allowed_tools,
      chat_profit: plan.chat_profit,
      image_profit: plan.image_profit,
      video_profit: plan.video_profit
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ 
      plan_name: '', 
      period: 'month', 
      credits_per_period: 100, 
      amount: '0', 
      isActive: true,
      allowed_tools: '["*"]',
      chat_profit: 0.1,
      image_profit: 1,
      video_profit: 2
    });
  };

  const onSave = async () => {
    if (editingId) {
      await onUpdate(editingId, form);
    } else {
      await onCreate();
    }
  };

  const onCreate = async () => {
    if (!apiBase) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/api/credits/plans`, {
        method: 'POST',
        headers,
        body: JSON.stringify(form),
      });
      if (res.status === 200) {
        setForm({ 
          plan_name: '', 
          period: 'month', 
          credits_per_period: 100, 
          amount: '0', 
          isActive: true,
          allowed_tools: '["*"]',
          chat_profit: 0.1,
          image_profit: 1,
          video_profit: 2
        });
        toast.success("تم إنشاء الباقة بنجاح");
        await loadPlans();
      } else {
        toast.error("فشل في إنشاء الباقة");
        setError("فشل في إنشاء الباقة");
      }
    } catch (e) {
      toast.error("خطأ في الشبكة");
      setError("خطأ في الشبكة");
    } finally {
      setSaving(false);
    }
  };

  const onUpdate = async (plan_id: number, data: Partial<CreditPlan>) => {
    if (!apiBase) return;
    setSaving(true);
    try {
      const res = await fetch(`${apiBase}/api/credits/plans/${plan_id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });
      if (res.status === 200) {
        toast.success("تم تحديث الباقة بنجاح");
        setEditingId(null);
        await loadPlans();
      } else {
        toast.error("فشل في تحديث الباقة");
      }
    } catch (e) {
      toast.error("فشل في التحديث");
      setError("فشل في التحديث");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (plan_id: number) => {
    if (!apiBase || !confirm("هل أنت متأكد من حذف هذه الباقة؟")) return;
    setSaving(true);
    try {
      const res = await fetch(`${apiBase}/api/credits/plans/${plan_id}`, {
        method: 'DELETE',
        headers,
      });
      if (res.status === 200) {
        toast.success("تم حذف الباقة بنجاح");
        await loadPlans();
      } else {
        toast.error("فشل في حذف الباقة");
      }
    } catch (e) {
      toast.error("فشل في الحذف");
      setError("فشل في الحذف");
    } finally {
      setSaving(false);
    }
  };

  const toggleTool = (currentTools: string, toolId: string) => {
    let tools = [];
    try {
      tools = JSON.parse(currentTools || '[]');
    } catch {
      tools = [];
    }

    if (tools.includes('*')) {
        // If all tools, and we want to toggle one off, we need to list all others except this one
        tools = ALL_TOOLS.map(t => t.id).filter(id => id !== toolId);
    } else if (tools.includes(toolId)) {
      tools = tools.filter((id: string) => id !== toolId);
    } else {
      tools.push(toolId);
      if (tools.length === ALL_TOOLS.length) tools = ['*'];
    }
    return JSON.stringify(tools);
  };

  const isToolChecked = (currentTools: string, toolId: string) => {
    try {
      const tools = JSON.parse(currentTools || '[]');
      return tools.includes('*') || tools.includes(toolId);
    } catch {
      return false;
    }
  };

  return (
    <div className="p-8  min-h-screen text-white font-sans" dir="rtl">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-tr from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-900/20">
                    <ShieldCheck size={28} className="text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-black tracking-tight">إدارة باقات الذكاء الاصطناعي</h1>
                    <p className="text-gray-500 text-sm">قم بإنشاء وتعديل خطط الاشتراك ونسب الربح لكل أداة</p>
                </div>
            </div>
            
            {/* AI Hub Toggle Button */}
            <button
              onClick={toggleAiHub}
              disabled={loadingToggle}
              className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-bold transition-all shadow-lg ${
                aiHubEnabled
                  ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white'
                  : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loadingToggle ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Wand2 size={20} />
              )}
              <span>{aiHubEnabled ? 'إخفاء مكتبة AI' : 'إظهار مكتبة AI'}</span>
            </button>
        </div>

        {/* Global Error Handle */}
        {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 animate-fade-in">
                <AlertCircle size={20} />
                <span className="text-sm font-bold">{error}</span>
                <button onClick={() => setError(null)} className="mr-auto"><X size={16} /></button>
            </div>
        )}

        {/* --- MODEL PRICING MANAGEMENT --- */}
        <div className="mb-12 gradient-border-analysis border border-white/5 rounded-[2.5rem] p-8 shadow-2xl bg-[#1a1a1a]/50 relative overflow-hidden">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-black flex items-center gap-3">
                        <Wand2 size={24} className="text-purple-400" />
                        <span>تسعير الموديلات (التكلفة الأساسية)</span>
                    </h2>
                    <p className="text-gray-500 text-xs mt-1">حدد السعر الأساسي لكل موديل. السعر النهائي للمستخدم = (السعر الأساسي + ربح الباقة)</p>
                </div>
                <button 
                    onClick={saveAiModelPrices}
                    disabled={savingPrices}
                    className="px-6 py-3 bg-white text-black rounded-xl font-black flex items-center gap-2 hover:scale-105 transition-all disabled:opacity-50"
                >
                    {savingPrices ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : <Save size={18} />}
                    <span>حفظ الأسعار</span>
                </button>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Image Models */}
                <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <ImageIcon size={16} /> نماذج الصور
                    </h3>
                    <div className="grid gap-3">
                        {imageModelList.map(m => (
                            <div key={m.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 hover:border-purple-500/30 transition-all">
                                <span className="font-bold text-gray-300">{m.name}</span>
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="number"
                                        className="w-20 bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-center font-black text-purple-400 outline-none focus:border-purple-500"
                                        value={aiModelPrices[m.id] || 0}
                                        onChange={e => setAiModelPrices({ ...aiModelPrices, [m.id]: parseInt(e.target.value) || 0 })}
                                    />
                                    <span className="text-[10px] text-gray-600 font-bold">كريدت</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Video Models */}
                <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Video size={16} /> نماذج الفيديو (حسب المدة)
                    </h3>
                    <div className="grid gap-4">
                        {videoModelList.map(m => (
                            <div key={m.id} className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:border-blue-500/30 transition-all">
                                <span className="font-bold text-gray-300 block mb-3 border-b border-white/5 pb-2">{m.name}</span>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {m.durations.map(dur => {
                                        const key = `${m.id}-${dur}`;
                                        return (
                                            <div key={key} className="space-y-1">
                                                <label className="text-[10px] text-gray-500 font-bold block text-center">{dur} ثانية</label>
                                                <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg p-1">
                                                    <input 
                                                        type="number"
                                                        className="w-full bg-transparent py-1 px-1 text-center font-black text-blue-400 outline-none"
                                                        value={aiModelPrices[key] || 0}
                                                        onChange={e => setAiModelPrices({ ...aiModelPrices, [key]: parseInt(e.target.value) || 0 })}
                                                    />
                                                    <span className="text-[8px] text-gray-600 font-bold ml-1">C</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-[9px] text-orange-500 p-2 italic bg-orange-500/5 rounded-lg border border-orange-500/10">
                        * ملاحظة: يرجى تحديد السعر لكل مدة زمنية. في حال تركها 0، سيحاول النظام حسابها تلقائياً.
                    </p>
                </div>
            </div>
        </div>

        {/* Create Form Section */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
            
            {/* Basic Info */}
            <div className="lg:col-span-2 space-y-6">
                <div className="gradient-border-analysis border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-purple-600/10 transition-all duration-700"></div>
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                        <Settings2 size={20} className="text-purple-400" />
                        <span>بيانات الباقة الأساسية</span>
                    </h2>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mr-2">اسم الباقة</label>
                            <input 
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:border-purple-500/50 outline-none transition-all font-bold placeholder:text-gray-700"
                                placeholder="  "
                                value={form.plan_name}
                                onChange={e => setForm({...form, plan_name: e.target.value})}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mr-2"> مدة الاشتراك</label>
                            <select 
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:border-purple-500/50 outline-none transition-all font-bold appearance-none"
                                value={form.period}
                                onChange={e => setForm({...form, period: e.target.value})}
                            >
                                <option value="day" className="bg-[#141414]">يومي</option>
                                <option value="month" className="bg-[#141414]">شهري</option>
                                <option value="year" className="bg-[#141414]">سنوي</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mr-2">إجمالي النقاط (Credits)</label>
                            <input 
                                type="number"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:border-purple-500/50 outline-none transition-all font-bold"
                                value={form.credits_per_period}
                                onChange={e => setForm({...form, credits_per_period: parseInt(e.target.value) || 0})}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mr-2">سعر الباقة ($)</label>
                            <input 
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:border-purple-500/50 outline-none transition-all font-bold placeholder:text-gray-700"
                                placeholder="0.00"
                                value={form.amount}
                                onChange={e => setForm({...form, amount: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="mt-10 grid md:grid-cols-3 gap-6">
                         <div className="p-5 rounded-[2rem] bg-white/[0.02] border border-white/5 group/p shadow-inner transition-all hover:border-blue-500/20">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                                    <MessageSquare size={16} />
                                </div>
                                <span className="text-[10px] font-black uppercase text-gray-200">ربح الشات</span>
                            </div>
                            <input 
                                type="number" step="0.01"
                                className="w-full bg-transparent text-xl font-black focus:outline-none text-center"
                                value={form.chat_profit}
                                onChange={e => setForm({...form, chat_profit: parseFloat(e.target.value) || 0})}
                            />
                            <p className="text-[9px] text-orange-400 mt-2 text-center">+ السعر الأساسي</p>
                         </div>

                         <div className="p-5 rounded-[2rem] bg-white/[0.02] border border-white/5 group/p shadow-inner transition-all hover:border-purple-500/20">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                                    <ImageIcon size={16} />
                                </div>
                                <span className="text-[10px] font-black uppercase text-gray-200">ربح الصور</span>
                            </div>
                            <input 
                                type="number" step="0.1"
                                className="w-full bg-transparent text-xl font-black focus:outline-none text-center"
                                value={form.image_profit}
                                onChange={e => setForm({...form, image_profit: parseFloat(e.target.value) || 0})}
                            />
                            <p className="text-[9px] text-orange-400 mt-2 text-center">+ السعر الأساسي</p>
                         </div>

                         <div className="p-5 rounded-[2rem] bg-white/[0.02] border border-white/5 group/p shadow-inner transition-all hover:border-indigo-500/20">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                    <Video size={16} />
                                </div>
                                <span className="text-[10px] font-black uppercase text-gray-200">ربح الفيديو</span>
                            </div>
                            <input 
                                type="number" step="0.1"
                                className="w-full bg-transparent text-xl font-black focus:outline-none text-center"
                                value={form.video_profit}
                                onChange={e => setForm({...form, video_profit: parseFloat(e.target.value) || 0})}
                            />
                            <p className="text-[9px] text-orange-400 mt-2 text-center">+ السعر الأساسي</p>
                         </div>
                    </div>

                    <div className="flex gap-4 mt-10">
                        <button 
                            onClick={onSave}
                            disabled={saving}
                            className={`flex-1 p-5 ${editingId ? 'bg-blue-600 hover:bg-purple-700' : 'bg-white text-black'} rounded-[2rem] font-black text-lg flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl disabled:opacity-50`}
                        >
                            {saving ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div> : (editingId ? <Save size={24} /> : <Plus size={24} />)}
                            <span>{editingId ? 'تحديث الباقة' : 'إنشاء الباقة الآن'}</span>
                        </button>
                        
                        {editingId && (
                            <button 
                                onClick={cancelEdit}
                                className="px-8 p-5 bg-red-500 hover:bg-red-500/40 text-white rounded-[2rem] font-black transition-all"
                            >
                                إلغاء
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Allowed Tools Selector */}
            <div className="gradient-border-analysis border border-white/5 rounded-[2.5rem] p-8 shadow-2xl flex flex-col max-h-[800px]">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                    <Wand2 size={20} className="text-indigo-400" />
                    <span>الأدوات المتاحة للتفعيل</span>
                </h2>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                    {ALL_TOOLS.map(tool => (
                        <div 
                            key={tool.id}
                            onClick={() => setForm({...form, allowed_tools: toggleTool(form.allowed_tools!, tool.id)})}
                            className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border ${isToolChecked(form.allowed_tools!, tool.id) ? 'bg-white/10 border-indigo-500/30' : 'bg-orange-500/10 border-white/5 hover:border-white/10'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl ${tool.category === 'chat' ? 'bg-purple-500/10 text-purple-400' : tool.category === 'video' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                    {tool.category === 'chat' ? <MessageSquare size={16} /> : tool.category === 'video' ? <Video size={16} /> : <ImageIcon size={16} />}
                                </div>
                                <span className={`text-sm font-bold ${isToolChecked(form.allowed_tools!, tool.id) ? 'text-white' : 'text-gray-500'}`}>{tool.name}</span>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isToolChecked(form.allowed_tools!, tool.id) ? 'bg-indigo-500 border-indigo-500' : 'border-white/10'}`}>
                                {isToolChecked(form.allowed_tools!, tool.id) && <CheckCircle2 size={12} className="text-white" />}
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="mt-6 pt-4 border-t border-white/5 flex gap-4">
                    <button 
                         onClick={() => setForm({...form, allowed_tools: '["*"]'})}
                         className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 transition-all font-sans"
                    >
                         تفعيل الجميع
                    </button>
                    <button 
                         onClick={() => setForm({...form, allowed_tools: '[]'})}
                         className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 transition-all"
                    >
                         إلغاء الجميع
                    </button>
                </div>
            </div>
        </div>

        {/* Plans Table */}
        <div className="bg-[#141414] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden">
            <h2 className="text-xl font-bold mb-8">الباقات الحالية</h2>
            
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="font-bold">جاري تحميل الباقات...</p>
                </div>
            ) : plans.length === 0 ? (
                <div className="py-20 text-center text-gray-600 font-bold">لا يوجد باقات مضافة حالياً</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="pb-6 text-[10px] font-black uppercase text-gray-500 tracking-widest">اسم الباقة</th>
                                <th className="pb-6 text-[10px] font-black uppercase text-gray-500 tracking-widest">المدة</th>
                                <th className="pb-6 text-[10px] font-black uppercase text-gray-500 tracking-widest">النقاط</th>
                                <th className="pb-6 text-[10px] font-black uppercase text-gray-500 tracking-widest">السعر</th>
                                <th className="pb-6 text-[10px] font-black uppercase text-gray-500 tracking-widest">هامش الربح (شات/صورة/فيديو)</th>
                                <th className="pb-6 text-[10px] font-black uppercase text-gray-500 tracking-widest">الحالة</th>
                                <th className="pb-6 text-[10px] font-black uppercase text-gray-500 tracking-widest">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {plans.map(p => (
                                <tr key={p.plan_id} className="group hover:bg-white/[0.01] transition-all">
                                    <td className="py-6 pr-4 font-black">{p.plan_name}</td>
                                    <td className="py-6 text-gray-400 font-bold">{p.period === 'month' ? 'شهري' : p.period === 'year' ? 'سنوي' : 'يومي'}</td>
                                    <td className="py-6 text-purple-400 font-black">{p.credits_per_period}</td>
                                    <td className="py-6 font-black text-emerald-400"><span className="bg-gradient-to-r from-[#FF0000] via-[#FFFFFF] to-[#000000] bg-clip-text text-transparent font-bold">IQD</span>{p.amount}</td>
                                    <td className="py-6 font-bold text-gray-500">
                                        <div className="flex items-center gap-2">
                                            <span className="text-blue-500">+{p.chat_profit}</span>
                                            <span>/</span>
                                            <span className="text-purple-500">+{p.image_profit}</span>
                                            <span>/</span>
                                            <span className="text-indigo-500">+{p.video_profit}</span>
                                        </div>
                                    </td>
                                    <td className="py-6">
                                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${p.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${p.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                                            <span>{p.isActive ? 'نشطة' : 'متوقفة'}</span>
                                        </div>
                                    </td>
                                    <td className="py-6">
                                        <div className="flex items-center gap-3 font-bold">
                                            <button 
                                                onClick={() => startEdit(p)}
                                                className="p-3 bg-purple-500/10 text-purple-500 rounded-2xl hover:bg-purple-500 transition-all hover:text-white"
                                                title="تعديل الباقة"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button 
                                                onClick={() => onDelete(p.plan_id)}
                                                className="p-3 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 transition-all hover:text-white"
                                                title="حذف الباقة"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.02);
            border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.1);
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

