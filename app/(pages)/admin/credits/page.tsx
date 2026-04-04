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
  ChevronUp,
  CreditCard,
  Upload,
  Edit3
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
  { id: 'id-photo', name: 'صانع الصور الشخصية (جديد) 🆔', category: 'image' },
  { id: 'clothes-extraction', name: 'استخراج الملابس الذكي (جديد) 🔥', category: 'image' },
  { id: 'chat', name: 'نيكسوس تشات برو', category: 'chat' },
  { id: 'image', name: 'انشاء صور احترافية', category: 'image' },
  { id: 'image-to-text', name: 'استخراج النص من الصورة', category: 'image' },
  { id: 'upscale', name: 'رفع دقة الصور', category: 'image' },
  { id: 'bg-remove', name: 'حذف الخلفية', category: 'image' },
  { id: 'restore', name: 'ترميم الصور', category: 'image' },
  { id: 'avatar', name: 'صانع الأفاتار', category: 'image' },
  { id: 'nano', name: 'نانو بنانا (Pro / Standard)', category: 'image' },
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
  const [activeTab, setActiveTab] = useState<'plans' | 'pricing' | 'backgrounds'>('plans');

  // Tool Assets State
  const [toolAssets, setToolAssets] = useState<Record<string, string>>({});
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [savingAssets, setSavingAssets] = useState(false);

  const loadToolAssets = async () => {
    if (!apiBase) return;
    setLoadingAssets(true);
    try {
      const res = await fetch(`${apiBase}/api/admin/settings/ai_tool_assets`, { headers });
      if (res.status === 200) {
        const data = await res.json();
        if (data && data.value) setToolAssets(JSON.parse(data.value));
      }
    } catch (e) { console.error('Error loading AI tool assets:', e); }
    finally { setLoadingAssets(false); }
  };

  const handleToolImageUpload = async (toolId: string, file: File) => {
    if (!apiBase) return;
    const formData = new FormData();
    formData.append('toolImage', file);
    
    try {
      const res = await fetch(`${apiBase}/api/admin/settings/tool_background?toolId=${toolId}`, {
        method: 'PUT',
        headers: {
          'Authorization': headers['Authorization'] || '',
          'User-Client': headers['User-Client'] || ''
        },
        body: formData
      });
      if (res.status === 200) {
        const data = await res.json();
        setToolAssets(prev => ({ ...prev, [toolId]: data.url }));
        toast.success("تم رفع الصورة بنجاح");
      }
    } catch (e) { toast.error("فشل رفع الصورة"); }
  };

  const saveToolAssets = async () => {
    if (!apiBase) return;
    setSavingAssets(true);
    try {
      const res = await fetch(`${apiBase}/api/admin/settings/ai_tool_assets`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ value: toolAssets }),
      });
      if (res.status === 200) toast.success("تم حفظ التغييرات بنجاح");
    } catch (e) { toast.error("خطأ في الاتصال"); }
    finally { setSavingAssets(false); }
  };

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
    loadToolAssets();
  }, []);

  // Filter models for display in sections
  // Image models used for pricing configuration
  const imageModelList = [
    { id: 'imagen-4-ultra', name: 'Imagen 4 Ultra' },
    { id: 'imagen-4', name: 'Imagen 4' },
    { id: 'imagen-3', name: 'Imagen 3' },
    { id: 'dall-e-3', name: 'DALL-E 3' },
    { id: 'nano-pro', name: 'Nano Banana Pro' },
    { id: 'nano-standard', name: 'Nano Banana Standard' },
    { id: 'nano-ultra', name: 'Nano Ultra (Imagen 4)' },
    { id: 'nano-creative', name: 'Nano Creative (Ultra)' },
  ];

  // Video models with CORRECT durations per API specifications:
  // - Veo (all variants): 4, 6, 8 seconds for text-to-video
  // - Sora 2.0: 4, 8, 12 seconds
  // - Sora 2 Pro: 5, 10, 15, 20 seconds (extended durations)
  const videoModelList = [
    { id: 'veo-ultra', name: 'Veo 3 Generate (Ultra)', durations: [4, 6, 8] },
    { id: 'veo-pro', name: 'Veo 3 Generate (Standard)', durations: [4, 6, 8] },
    { id: 'veo-fast', name: 'Veo 3 Fast', durations: [4, 6, 8] },
    { id: 'veo-lite', name: 'Veo 3 Lite', durations: [4, 6, 8] },
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
    <div className="p-4 md:p-6 min-h-screen text-white font-sans selection:bg-purple-500/30" dir="rtl">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-900/10">
                    <ShieldCheck size={20} className="text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-black tracking-tight">إدارة مكتبة AI</h1>
                    <p className="text-gray-500 text-[10px]">تحكم في الباقات، الأسعار، وأصول الواجهة</p>
                </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={toggleAiHub}
                disabled={loadingToggle}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                  aiHubEnabled
                    ? 'bg-emerald-600/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-600/20'
                    : 'bg-red-600/10 border border-red-500/20 text-red-500 hover:bg-red-600/20'
                } disabled:opacity-50`}
              >
                {loadingToggle ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div> : <Wand2 size={14} />}
                <span>{aiHubEnabled ? 'المكتبة مفعلة' : 'المكتبة مخفية'}</span>
              </button>
            </div>
        </div>

        {/* Dynamic Tabs */}
        <div className="flex items-center gap-1 mb-6 p-1 bg-white/5 rounded-2xl border border-white/10 w-fit">
          {[
            { id: 'plans', label: 'باقات الكريدت', icon: CreditCard },
            { id: 'pricing', label: 'تسعير الموديلات', icon: Wand2 },
            { id: 'backgrounds', label: 'خلفيات الأدوات', icon: ImageIcon }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id ? 'bg-white/10 text-white shadow-lg' : 'text-gray-500 hover:text-white'
              }`}
            >
              <tab.icon size={14} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 animate-fade-in text-xs">
                <AlertCircle size={14} />
                <span className="font-bold">{error}</span>
                <button onClick={() => setError(null)} className="mr-auto"><X size={14} /></button>
            </div>
        )}

        {/* --- PRICING TAB --- */}
        {activeTab === 'pricing' && (
          <div className="mb-8 border border-white/5 rounded-3xl p-6 shadow-xl bg-[#1a1a1a]/40 relative overflow-hidden animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                  <div>
                      <h2 className="text-xl font-black flex items-center gap-2">
                          <Wand2 size={20} className="text-purple-400" />
                          <span>تسعير الموديلات التلقائي</span>
                      </h2>
                      <p className="text-gray-500 text-[10px] mt-1">تحديد التكلفة الأساسية (قبل هامش ربح الباقة)</p>
                  </div>
                  <button 
                      onClick={saveAiModelPrices}
                      disabled={savingPrices}
                      className="px-4 py-2 bg-white text-black rounded-lg text-xs font-black flex items-center gap-2 hover:scale-105 transition-all disabled:opacity-50"
                  >
                      {savingPrices ? <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : <Save size={14} />}
                      <span>حفظ الأسعار</span>
                  </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                          <ImageIcon size={14} /> نماذج الصور
                      </h3>
                      <div className="grid gap-2">
                          {imageModelList.map(m => (
                              <div key={m.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-purple-500/20 transition-all">
                                  <span className="text-xs font-bold text-gray-400">{m.name}</span>
                                  <div className="flex items-center gap-2">
                                      <input 
                                          type="number"
                                          className="w-16 bg-black/40 border border-white/5 rounded-lg py-1 px-2 text-center text-xs font-black text-purple-400 outline-none focus:border-purple-500"
                                          value={aiModelPrices[m.id] || 0}
                                          onChange={e => setAiModelPrices({ ...aiModelPrices, [m.id]: parseInt(e.target.value) || 0 })}
                                      />
                                      <span className="text-[8px] text-gray-700 font-bold uppercase">Points</span>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>

                  <div className="space-y-3">
                      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                          <Video size={14} /> نماذج الفيديو
                      </h3>
                      <div className="grid gap-3">
                          {videoModelList.map(m => (
                              <div key={m.id} className="p-3 bg-white/5 rounded-xl border border-white/5 hover:border-blue-500/20">
                                  <span className="text-xs font-bold text-gray-400 block mb-2">{m.name}</span>
                                  <div className="grid grid-cols-3 gap-2">
                                      {m.durations.map(dur => {
                                          const key = `${m.id}-${dur}`;
                                          return (
                                              <div key={key} className="space-y-1">
                                                  <label className="text-[9px] text-gray-600 font-bold block text-center">{dur}s</label>
                                                  <input 
                                                      type="number"
                                                      className="w-full bg-black/40 border border-white/5 rounded-md py-1 text-center text-xs font-black text-blue-400 outline-none"
                                                      value={aiModelPrices[key] || 0}
                                                      onChange={e => setAiModelPrices({ ...aiModelPrices, [key]: parseInt(e.target.value) || 0 })}
                                                  />
                                              </div>
                                          );
                                      })}
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
        )}

        {/* --- BACKGROUNDS TAB --- */}
        {activeTab === 'backgrounds' && (
          <div className="mb-8 border border-white/5 rounded-3xl p-6 shadow-xl bg-[#1a1a1a]/40 relative overflow-hidden animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                  <div>
                      <h2 className="text-xl font-black flex items-center gap-2">
                          <ImageIcon size={20} className="text-blue-400" />
                          <span>خلفيات الأدوات</span>
                      </h2>
                      <p className="text-gray-500 text-[10px] mt-1">تخصيص صور العرض للأدوات في الصفحة الرئيسية</p>
                  </div>
                  <button 
                      onClick={saveToolAssets}
                      disabled={savingAssets}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-black flex items-center gap-2 hover:scale-105 transition-all disabled:opacity-50"
                  >
                      {savingAssets ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save size={14} />}
                      <span>حفظ التغييرات</span>
                  </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ALL_TOOLS.map(tool => (
                      <div key={tool.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3 group hover:border-blue-500/30 transition-all">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black text-gray-300 truncate max-w-[120px]">{tool.name}</span>
                            <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 text-[8px] font-bold">
                              {tool.id.substring(0, 2).toUpperCase()}
                            </div>
                          </div>
                          
                          <div className="relative aspect-video rounded-xl overflow-hidden bg-black/40 border border-white/10 group-hover:border-blue-500/20 transition-all cursor-pointer" onClick={() => document.getElementById(`asset-${tool.id}`)?.click()}>
                              {toolAssets[tool.id] ? (
                                <img src={apiBase + toolAssets[tool.id]} className="w-full h-full object-cover" />
                              ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-700">
                                   <Upload size={20} />
                                   <span className="text-[8px] mt-1 font-bold">رفع صورة</span>
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Edit size={16} />
                              </div>
                              <input 
                                id={`asset-${tool.id}`}
                                type="file" 
                                className="hidden" 
                                accept="image/*"
                                onChange={(e) => e.target.files?.[0] && handleToolImageUpload(tool.id, e.target.files[0])}
                              />
                          </div>
                      </div>
                  ))}
              </div>
          </div>
        )}

        {/* Create Form Section */}
        {activeTab === 'plans' && (
          <div className="animate-fade-in">
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
            
            {/* Basic Info */}
            <div className="lg:col-span-2 space-y-4">
                <div className="border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden group bg-white/5">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Settings2 size={16} className="text-purple-400" />
                        <span>بيانات الباقة الأساسية</span>
                    </h2>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-gray-500 tracking-wider mr-1">اسم الباقة</label>
                            <input 
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-purple-500/50 outline-none transition-all text-sm font-bold placeholder:text-gray-700"
                                placeholder="اسم الخطة"
                                value={form.plan_name}
                                onChange={e => setForm({...form, plan_name: e.target.value})}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-gray-500 tracking-wider mr-1"> مدة الاشتراك</label>
                            <select 
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-purple-500/50 outline-none transition-all text-sm font-bold appearance-none"
                                value={form.period}
                                onChange={e => setForm({...form, period: e.target.value})}
                            >
                                <option value="day" className="bg-[#141414]">يومي</option>
                                <option value="month" className="bg-[#141414]">شهري</option>
                                <option value="year" className="bg-[#141414]">سنوي</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-gray-500 tracking-wider mr-1">إجمالي النقاط (Credits)</label>
                            <input 
                                type="number"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-purple-500/50 outline-none transition-all text-sm font-bold"
                                value={form.credits_per_period}
                                onChange={e => setForm({...form, credits_per_period: parseInt(e.target.value) || 0})}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-gray-500 tracking-wider mr-1">سعر الباقة ($)</label>
                            <input 
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-purple-500/50 outline-none transition-all text-sm font-bold placeholder:text-gray-700"
                                placeholder="0.00"
                                value={form.amount}
                                onChange={e => setForm({...form, amount: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="mt-6 grid md:grid-cols-3 gap-4">
                         <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 group/p shadow-inner transition-all hover:border-blue-500/10">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-6 h-6 rounded-md bg-blue-500/10 flex items-center justify-center text-blue-400">
                                    <MessageSquare size={12} />
                                </div>
                                <span className="text-[10px] font-black uppercase text-gray-400">ربح الشات</span>
                            </div>
                            <input 
                                type="number" step="0.01"
                                className="w-full bg-transparent text-lg font-black focus:outline-none text-center"
                                value={form.chat_profit}
                                onChange={e => setForm({...form, chat_profit: parseFloat(e.target.value) || 0})}
                            />
                         </div>

                         <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 group/p shadow-inner transition-all hover:border-purple-500/10">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-6 h-6 rounded-md bg-purple-500/10 flex items-center justify-center text-purple-400">
                                    <ImageIcon size={12} />
                                </div>
                                <span className="text-[10px] font-black uppercase text-gray-400">ربح الصور</span>
                            </div>
                            <input 
                                type="number" step="0.1"
                                className="w-full bg-transparent text-lg font-black focus:outline-none text-center"
                                value={form.image_profit}
                                onChange={e => setForm({...form, image_profit: parseFloat(e.target.value) || 0})}
                            />
                         </div>

                         <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 group/p shadow-inner transition-all hover:border-indigo-500/10">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-6 h-6 rounded-md bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                    <Video size={12} />
                                </div>
                                <span className="text-[10px] font-black uppercase text-gray-400">ربح الفيديو</span>
                            </div>
                            <input 
                                type="number" step="0.1"
                                className="w-full bg-transparent text-lg font-black focus:outline-none text-center"
                                value={form.video_profit}
                                onChange={e => setForm({...form, video_profit: parseFloat(e.target.value) || 0})}
                            />
                         </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button 
                            onClick={onSave}
                            disabled={saving}
                            className={`flex-1 p-4 ${editingId ? 'bg-blue-600 hover:bg-purple-700' : 'bg-white text-black'} rounded-2xl font-black text-xs flex items-center justify-center gap-2 hover:scale-[1.01] transition-all disabled:opacity-50`}
                        >
                            {saving ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div> : (editingId ? <Save size={16} /> : <Plus size={16} />)}
                            <span>{editingId ? 'تحديث الباقة' : 'إنشاء الباقة'}</span>
                        </button>
                        
                        {editingId && (
                            <button 
                                onClick={cancelEdit}
                                className="px-6 p-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black text-xs transition-all"
                            >
                                إلغاء
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Allowed Tools Selector */}
            <div className="border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col max-h-[500px] bg-white/5">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Wand2 size={16} className="text-indigo-400" />
                    <span>الأدوات المتاحة</span>
                </h2>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2">
                    {ALL_TOOLS.map(tool => (
                        <div 
                            key={tool.id}
                            onClick={() => setForm({...form, allowed_tools: toggleTool(form.allowed_tools!, tool.id)})}
                            className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${isToolChecked(form.allowed_tools!, tool.id) ? 'bg-blue-500/10 border-blue-500/30' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-1.5 rounded-lg ${tool.category === 'chat' ? 'bg-purple-500/10 text-purple-400' : tool.category === 'video' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                    {tool.category === 'chat' ? <MessageSquare size={12} /> : tool.category === 'video' ? <Video size={12} /> : <ImageIcon size={12} />}
                                </div>
                                <span className={`text-[11px] font-bold ${isToolChecked(form.allowed_tools!, tool.id) ? 'text-white' : 'text-gray-500'}`}>{tool.name}</span>
                            </div>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${isToolChecked(form.allowed_tools!, tool.id) ? 'bg-blue-500 border-blue-500' : 'border-white/10'}`}>
                                {isToolChecked(form.allowed_tools!, tool.id) && <CheckCircle2 size={10} className="text-white" />}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Plans Table */}
        <div className="bg-[#141414] border border-white/5 rounded-3xl p-6 shadow-xl overflow-hidden">
            <h2 className="text-lg font-bold mb-6">الباقات الحالية</h2>
            
            {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-50">
                    <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs font-bold">جاري التحميل...</p>
                </div>
            ) : plans.length === 0 ? (
                <div className="py-12 text-center text-gray-700 font-bold text-xs uppercase tracking-widest">لا يوجد باقات مضافة</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="pb-4 text-[9px] font-black uppercase text-gray-600 tracking-widest">الخطة</th>
                                <th className="pb-4 text-[9px] font-black uppercase text-gray-600 tracking-widest">المدة</th>
                                <th className="pb-4 text-[9px] font-black uppercase text-gray-600 tracking-widest">النقاط</th>
                                <th className="pb-4 text-[9px] font-black uppercase text-gray-600 tracking-widest">السعر</th>
                                <th className="pb-4 text-[9px] font-black uppercase text-gray-600 tracking-widest">هـامش.ربح (صور)</th>
                                <th className="pb-4 text-[9px] font-black uppercase text-gray-600 tracking-widest">هـامش.ربح (فيديو)</th>
                                <th className="pb-4 text-[9px] font-black uppercase text-gray-600 tracking-widest text-center">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {plans.map(p => (
                                <tr key={p.plan_id} className="group hover:bg-white/[0.01] transition-all">
                                    <td className="py-4 pr-2 text-xs font-black">{p.plan_name}</td>
                                    <td className="py-4 text-[10px] text-gray-500 font-bold">{p.period === 'month' ? 'شهري' : p.period === 'year' ? 'سنوي' : 'يومي'}</td>
                                    <td className="py-4 text-[10px] text-purple-400 font-black">{p.credits_per_period}</td>
                                    <td className="py-4 text-xs font-black text-emerald-400">IQD {p.amount}</td>
                                    <td className="py-4 text-[10px] text-orange-400 font-bold">+{p.image_profit} pts</td>
                                    <td className="py-4 text-[10px] text-blue-400 font-bold">+{p.video_profit} pts</td>
                                    <td className="py-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <button 
                                                onClick={() => startEdit(p)}
                                                className="p-2 bg-purple-500/10 text-purple-500 rounded-xl hover:bg-purple-500 hover:text-white transition-all"
                                            >
                                                <Edit size={14} />
                                            </button>
                                            <button 
                                                onClick={() => onDelete(p.plan_id)}
                                                className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                                            >
                                                <Trash2 size={14} />
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
        )}
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

