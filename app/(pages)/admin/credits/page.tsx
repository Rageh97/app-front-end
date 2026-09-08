'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { NEXUS_AI_TOOLS } from '@/lib/nexus-ai-catalog';
import {
  DEFAULT_AI_PRICING,
  PRICING_IMAGE_MODELS,
  PRICING_OPERATIONS,
  PRICING_VIDEO_MODELS,
  linkedOperationPrice,
  modelDurationPriceKey,
  modelPriceKey,
} from '@/lib/ai-pricing-catalog';

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

const ALL_TOOLS = NEXUS_AI_TOOLS
  .filter((tool) => tool.id !== 'spaces')
  .map((tool) => ({ id: tool.id, name: tool.title, category: tool.category }));

const EMPTY_PLAN: Partial<CreditPlan> = {
  plan_name: '',
  period: 'month',
  credits_per_period: 100,
  amount: '0',
  isActive: true,
  allowed_tools: '["*"]',
  chat_profit: 0,
  image_profit: 0,
  video_profit: 0,
};

export default function AdminCreditsPage() {
  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL, []);
  const [plans, setPlans] = useState<CreditPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiHubEnabled, setAiHubEnabled] = useState(true);
  const [loadingToggle, setLoadingToggle] = useState(false);

  // Form State
  const [form, setForm] = useState<Partial<CreditPlan>>({ ...EMPTY_PLAN });

  // Editing State
  const [editingId, setEditingId] = useState<number | null>(null);

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

  const [aiModelPrices, setAiModelPrices] = useState<Record<string, number>>({ ...DEFAULT_AI_PRICING });
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
            setAiModelPrices({ ...DEFAULT_AI_PRICING, ...JSON.parse(data.value) });
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
      // Linked tools always inherit their generation model price. Remove old
      // operation overrides so a stale hidden value can never win server-side.
      const pricesToSave = { ...aiModelPrices };
      PRICING_OPERATIONS.forEach((operation) => {
        if (operation.derivedFrom) delete pricesToSave[operation.key];
      });
      const res = await fetch(`${apiBase}/api/admin/settings/ai_pricing_config`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ value: JSON.stringify(pricesToSave) }),
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

  const imageModelList = PRICING_IMAGE_MODELS;
  const videoModelList = PRICING_VIDEO_MODELS;
  const linkedOperations = PRICING_OPERATIONS.filter((operation) => operation.derivedFrom);
  const fixedOperations = PRICING_OPERATIONS.filter((operation) => !operation.derivedFrom);

  const startEdit = (plan: CreditPlan) => {
    setEditingId(plan.plan_id);
    setForm({
      plan_name: plan.plan_name,
      period: plan.period,
      credits_per_period: plan.credits_per_period,
      amount: plan.amount,
      isActive: plan.isActive,
      allowed_tools: '["*"]',
      chat_profit: 0,
      image_profit: 0,
      video_profit: 0
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ ...EMPTY_PLAN });
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
        body: JSON.stringify({ ...form, allowed_tools: '["*"]', chat_profit: 0, image_profit: 0, video_profit: 0 }),
      });
      if (res.status === 200) {
        setForm({ ...EMPTY_PLAN });
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
        body: JSON.stringify({ ...data, allowed_tools: '["*"]', chat_profit: 0, image_profit: 0, video_profit: 0 }),
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

  return (
    <div className="p-4 md:p-6 min-h-screen text-slate-200 font-sans" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between pb-4 border-b border-white/[0.08] gap-4">
          <div>
            <h1 className="text-xl font-black tracking-tight text-emerald-400">
              إدارة الكريديت ومكتبة AI
            </h1>
            <p className="text-slate-400 text-xs mt-1">التحكم في الباقات، الأسعار المركزية، وخلفيات الأدوات</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={toggleAiHub}
              disabled={loadingToggle}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors border ${
                aiHubEnabled
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
              } disabled:opacity-50`}
            >
              {loadingToggle ? 'جاري التحديث...' : aiHubEnabled ? 'المكتبة مفعلة' : 'المكتبة معطلة'}
            </button>
          </div>
        </div>

        {/* Dynamic Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#0E121E] rounded-md border border-white/[0.08] w-fit">
          {[
            { id: 'plans', label: 'باقات الكريديت' },
            { id: 'pricing', label: 'تسعير الموديلات' },
            { id: 'backgrounds', label: 'خلفيات الأدوات' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-md flex items-center justify-between text-rose-400 text-xs font-semibold">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="hover:text-white">إغلاق</button>
          </div>
        )}

        {/* --- PRICING TAB --- */}
        {activeTab === 'pricing' && (
          <div className="border border-white/[0.08] rounded-lg p-5 bg-[#0B0E17] space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div>
                <h2 className="text-base font-bold text-emerald-400">تسعير الموديلات التلقائي</h2>
                <p className="text-slate-400 text-xs mt-0.5">سعر موحد يخصم من رصيد المستخدمين بصرف النظر عن الباقة المشتركين بها</p>
              </div>
              <button 
                onClick={saveAiModelPrices}
                disabled={savingPrices}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-bold transition-colors disabled:opacity-50"
              >
                {savingPrices ? 'جاري الحفظ...' : 'حفظ الأسعار'}
              </button>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Image Models */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-emerald-400 tracking-wide">نماذج توليد الصور</h3>
                <div className="grid gap-2">
                  {imageModelList.map(m => {
                    const key = modelPriceKey(m.id);
                    return (
                      <div key={m.id} className="flex items-center justify-between gap-3 p-2.5 bg-[#0F1322] rounded-md border border-white/[0.06]">
                        <div className="min-w-0">
                          <span className="block truncate text-xs font-semibold text-slate-200">{m.name}</span>
                          <span className="block text-[10px] text-slate-500 font-mono" dir="ltr">{m.id.replace(/^models\//, '')}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <input 
                            type="number"
                            min="0"
                            className="w-16 bg-[#07090F] border border-white/10 rounded-md py-1 px-2 text-center text-xs font-bold text-emerald-400 outline-none focus:border-emerald-500"
                            value={aiModelPrices[key] ?? m.baseCostCredits}
                            onChange={e => setAiModelPrices({ ...aiModelPrices, [key]: Math.max(0, Number(e.target.value) || 0) })}
                          />
                          <span className="text-[10px] text-slate-400">نقطة</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Video Models */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-emerald-400 tracking-wide">نماذج توليد الفيديو</h3>
                <div className="grid gap-2.5">
                  {videoModelList.map(m => (
                    <div key={m.id} className="p-3 bg-[#0F1322] rounded-md border border-white/[0.06] space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <span className="block truncate text-xs font-semibold text-slate-200">{m.name}</span>
                          <span className="block text-[10px] text-slate-500 font-mono" dir="ltr">{m.id.replace(/^models\//, '')}</span>
                        </div>
                        <label className="flex shrink-0 items-center gap-1.5 text-xs text-slate-400" title="يُستخدم فقط إذا لم يوجد سعر للمدة المطلوبة">
                          <span>احتياطي</span>
                          <input
                            type="number"
                            min="0"
                            className="w-16 bg-[#07090F] border border-white/10 rounded-md py-1 text-center text-xs font-bold text-emerald-400 outline-none focus:border-emerald-500"
                            value={aiModelPrices[modelPriceKey(m.id)] ?? m.baseCostCredits}
                            onChange={e => setAiModelPrices({ ...aiModelPrices, [modelPriceKey(m.id)]: Math.max(0, Number(e.target.value) || 0) })}
                          />
                        </label>
                      </div>
                      <p className="text-[10px] leading-4 text-slate-500">
                        أسعار المدد نهائية وليست مضافة إلى السعر الاحتياطي.
                        {m.id.includes('veo-3.1-generate') && ' دقة 4K تُحسب ×1.5.'}
                        {m.id.includes('fast') && ' دقة 1080p تُحسب ×1.2 و4K ×3.'}
                        {m.id.includes('lite') && ' دقة 1080p تُحسب ×1.6.'}
                      </p>
                      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/[0.04]">
                        {(m.supportedDurations || Object.keys(m.creditsByDuration).map(Number)).map(dur => {
                          const key = modelDurationPriceKey(m.id, dur);
                          return (
                            <div key={key} className="space-y-1">
                              <label className="text-[10px] text-slate-400 block text-center">{dur} ثواني</label>
                              <input 
                                type="number"
                                min="0"
                                className="w-full bg-[#07090F] border border-white/10 rounded-md py-1 text-center text-xs font-bold text-emerald-400 outline-none focus:border-emerald-500"
                                value={aiModelPrices[key] ?? m.creditsByDuration[dur] ?? m.baseCostCredits}
                                onChange={e => setAiModelPrices({ ...aiModelPrices, [key]: Math.max(0, Number(e.target.value) || 0) })}
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

            {/* General Operations Pricing */}
            <div className="pt-4 border-t border-white/[0.06] space-y-3">
              <div>
                <h3 className="text-xs font-bold text-emerald-400 tracking-wide">الأدوات المرتبطة بالموديلات</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">تتغير تلقائيًا عند تعديل سعر الموديل المرتبط، ولا تُضاف عليها تكلفة أداة منفصلة.</p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {linkedOperations.map((op) => {
                  const source = op.derivedFrom!;
                  const model = [...imageModelList, ...videoModelList].find((item) => item.id === source.modelId);
                  return (
                    <div key={op.key} className="flex items-center justify-between gap-3 rounded-md border border-white/[0.06] bg-[#0F1322] p-2.5">
                      <div className="min-w-0">
                        <span className="block truncate text-xs font-semibold text-slate-200">{op.label}</span>
                        <span className="block truncate text-[10px] text-slate-500">
                          يتبع {model?.name || source.modelId}{source.duration ? ` — ${source.duration} ثوانٍ` : ''}
                        </span>
                      </div>
                      <span className="shrink-0 text-xs font-bold text-emerald-400">
                        {linkedOperationPrice(op, aiModelPrices)} نقطة
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.06] space-y-3">
              <div>
                <h3 className="text-xs font-bold text-emerald-400 tracking-wide">العمليات المستقلة</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">تسعير منفصل فقط للمعالجة التي لا تعتمد على موديل الصور أو الفيديو أعلاه.</p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {fixedOperations.map((op) => (
                  <label key={op.key} className="flex items-center justify-between gap-3 rounded-md border border-white/[0.06] bg-[#0F1322] p-2.5">
                    <div className="min-w-0">
                      <span className="block truncate text-xs font-semibold text-slate-200">{op.label}</span>
                      <span className="block text-[10px] text-slate-500">{op.category === 'image' ? 'صور' : op.category === 'video' ? 'فيديو' : 'صوت'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="number"
                        min="0"
                        className="w-16 rounded-md border border-white/10 bg-[#07090F] px-2 py-1 text-center text-xs font-bold text-emerald-400 outline-none focus:border-emerald-500"
                        value={aiModelPrices[op.key] ?? op.defaultCredits}
                        onChange={(e) => setAiModelPrices({
                          ...aiModelPrices,
                          [op.key]: Math.max(0, Number(e.target.value) || 0),
                        })}
                      />
                      <span className="text-[10px] text-slate-400">نقطة</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- BACKGROUNDS TAB --- */}
        {activeTab === 'backgrounds' && (
          <div className="border border-white/[0.08] rounded-lg p-5 bg-[#0B0E17] space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div>
                <h2 className="text-base font-bold text-emerald-400">خلفيات وصور الأدوات</h2>
                <p className="text-slate-400 text-xs mt-0.5">تخصيص صور كروت الأدوات المعروضة للمستخدمين</p>
              </div>
              <button 
                onClick={saveToolAssets}
                disabled={savingAssets}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-bold transition-colors disabled:opacity-50"
              >
                {savingAssets ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {ALL_TOOLS.map(tool => (
                <div key={tool.id} className="p-3 bg-[#0F1322] rounded-md border border-white/[0.06] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 truncate">{tool.name}</span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">{tool.id}</span>
                  </div>
                  
                  <div 
                    className="relative aspect-video rounded-md overflow-hidden bg-black/50 border border-white/[0.08] cursor-pointer hover:border-emerald-500/40 transition-colors"
                    onClick={() => document.getElementById(`asset-${tool.id}`)?.click()}
                  >
                    {toolAssets[tool.id] ? (
                      <img src={apiBase + toolAssets[tool.id]} alt={tool.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-xs font-semibold">
                        انقر لرفع صورة
                      </div>
                    )}
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

        {/* --- PLANS TAB --- */}
        {activeTab === 'plans' && (
          <div className="space-y-6">
            {/* Plan Creation / Editing Form */}
            <div className="border border-white/[0.08] rounded-lg p-5 bg-[#0B0E17]">
              <h2 className="text-base font-bold text-emerald-400 mb-4 pb-2 border-b border-white/[0.06]">
                {editingId ? 'تعديل بيانات الباقة' : 'إنشاء باقة كريديت جديدة'}
              </h2>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 block">اسم الباقة</label>
                  <input 
                    className="w-full bg-[#07090F] border border-white/10 rounded-md px-3 py-2 text-xs font-bold text-white outline-none focus:border-emerald-500"
                    placeholder="مثال: الباقة الشهرية الأساسية"
                    value={form.plan_name}
                    onChange={e => setForm({...form, plan_name: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 block">مدة الاشتراك</label>
                  <select 
                    className="w-full bg-[#07090F] border border-white/10 rounded-md px-3 py-2 text-xs font-bold text-white outline-none focus:border-emerald-500"
                    value={form.period}
                    onChange={e => setForm({...form, period: e.target.value})}
                  >
                    <option value="day">يومي</option>
                    <option value="month">شهري</option>
                    <option value="year">سنوي</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 block">إجمالي النقاط (Credits)</label>
                  <input 
                    type="number"
                    min="0"
                    className="w-full bg-[#07090F] border border-white/10 rounded-md px-3 py-2 text-xs font-bold text-white outline-none focus:border-emerald-500"
                    value={form.credits_per_period}
                    onChange={e => setForm({...form, credits_per_period: parseInt(e.target.value, 10) || 0})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 block">السعر (IQD أو $)</label>
                  <input 
                    className="w-full bg-[#07090F] border border-white/10 rounded-md px-3 py-2 text-xs font-bold text-white outline-none focus:border-emerald-500"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={e => setForm({...form, amount: e.target.value})}
                  />
                </div>
              </div>

              <div className="mt-4 p-3 rounded-md bg-[#0F1322] border border-white/[0.06] text-xs text-slate-400">
                <span className="font-bold text-emerald-400">ملاحظة: </span>
                جميع أدوات الذكاء الاصطناعي مفعلة تلقائياً في هذه الباقة. تحديد الاستهلاك يتم وفق التسعير المركزي لكل موديل.
              </div>

              <div className="flex gap-2.5 mt-5">
                <button 
                  onClick={onSave}
                  disabled={saving}
                  className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md font-bold text-xs transition-colors disabled:opacity-50"
                >
                  {saving ? 'جاري الحفظ...' : editingId ? 'حفظ تعديلات الباقة' : 'إنشاء الباقة'}
                </button>
                
                {editingId && (
                  <button 
                    onClick={cancelEdit}
                    className="py-2 px-4 bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 rounded-md font-bold text-xs transition-colors"
                  >
                    إلغاء التعديل
                  </button>
                )}
              </div>
            </div>

            {/* Current Plans Table */}
            <div className="border border-white/[0.08] rounded-lg p-5 bg-[#0B0E17]">
              <h2 className="text-base font-bold text-emerald-400 mb-4 pb-2 border-b border-white/[0.06]">
                الباقات الحالية المسجلة
              </h2>
              
              {loading ? (
                <div className="py-10 text-center text-slate-400 text-xs font-semibold">
                  جاري تحميل الباقات...
                </div>
              ) : plans.length === 0 ? (
                <div className="py-10 text-center text-slate-500 text-xs font-semibold">
                  لا توجد باقات كريديت مسجلة حالياً
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.08] text-slate-400 text-[11px] font-bold">
                        <th className="pb-3 pr-2">اسم الباقة</th>
                        <th className="pb-3">المدة</th>
                        <th className="pb-3">النقاط</th>
                        <th className="pb-3">السعر</th>
                        <th className="pb-3">الأدوات</th>
                        <th className="pb-3 text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.05]">
                      {plans.map(p => (
                        <tr key={p.plan_id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 pr-2 font-bold text-white">{p.plan_name}</td>
                          <td className="py-3 text-slate-400">{p.period === 'month' ? 'شهري' : p.period === 'year' ? 'سنوي' : 'يومي'}</td>
                          <td className="py-3 font-bold text-emerald-400">{p.credits_per_period}</td>
                          <td className="py-3 font-bold text-slate-200">IQD {p.amount}</td>
                          <td className="py-3 text-slate-400">كامل الأدوات</td>
                          <td className="py-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <button 
                                onClick={() => startEdit(p)}
                                className="px-2.5 py-1 bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 rounded text-xs font-medium transition-colors"
                              >
                                تعديل
                              </button>
                              <button 
                                onClick={() => onDelete(p.plan_id)}
                                className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded text-xs font-medium transition-colors"
                              >
                                حذف
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
    </div>
  );
}
