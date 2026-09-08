'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import {
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  Save,
  RefreshCw,
  Info
} from 'lucide-react';
import SettingSubNav from '@/components/Admin/SettingSubNav';

interface Condition {
  condition_Id: number;
  conditionTitle: {
    en: string;
    ar: string;
  };
  conditionContent: {
    en: string;
    ar: string;
  };
  isActive: boolean;
}

const ConditionPage = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    conditionTitle_en: '',
    conditionTitle_ar: '',
    conditionContent_en: '',
    conditionContent_ar: '',
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

  const getHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('a') : null;
    const clientId = typeof window !== 'undefined' ? localStorage.getItem('clientId1328') : '';
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (clientId) headers['user-client'] = clientId;
    return headers;
  };

  const fetchConditions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/condition`);
      setConditions(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching conditions:', error);
      toast.error('فشل تحميل بنود الشروط والأحكام');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConditions();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      conditionTitle_en: '',
      conditionTitle_ar: '',
      conditionContent_en: '',
      conditionContent_ar: '',
    });
  };

  const handleEdit = (condition: Condition) => {
    setEditingId(condition.condition_Id);
    setFormData({
      conditionTitle_en: condition.conditionTitle.en,
      conditionTitle_ar: condition.conditionTitle.ar,
      conditionContent_en: condition.conditionContent.en,
      conditionContent_ar: condition.conditionContent.ar,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.conditionTitle_ar.trim() || !formData.conditionContent_ar.trim()) {
      toast.error('يرجى كتابة عنوان ومحتوى الشرط بالعربية');
      return;
    }

    setIsSaving(true);
    const conditionData = {
      conditionTitle: {
        en: formData.conditionTitle_en.trim() || formData.conditionTitle_ar.trim(),
        ar: formData.conditionTitle_ar.trim(),
      },
      conditionContent: {
        en: formData.conditionContent_en.trim() || formData.conditionContent_ar.trim(),
        ar: formData.conditionContent_ar.trim(),
      },
    };

    try {
      if (editingId) {
        await axios.put(`${API_URL}/api/condition/${editingId}`, conditionData, {
          headers: getHeaders(),
        });
        toast.success('تم تحديث بند الشروط بنجاح');
      } else {
        await axios.post(`${API_URL}/api/condition`, conditionData, {
          headers: getHeaders(),
        });
        toast.success('تمت إضافة بند الشروط بنجاح');
      }
      resetForm();
      fetchConditions();
    } catch (error: any) {
      console.error('Error saving condition:', error);
      toast.error('حدث خطأ أثناء حفظ الشروط');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا البند؟')) return;

    try {
      await axios.delete(`${API_URL}/api/condition/${id}`, {
        headers: getHeaders(),
      });
      toast.success('تم حذف البند بنجاح');
      setConditions((prev) => prev.filter((c) => c.condition_Id !== id));
    } catch (error) {
      console.error('Error deleting condition:', error);
      toast.error('فشل في حذف البند');
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      const response = await axios.put(`${API_URL}/api/condition/toggle-active/${id}`, {}, {
        headers: getHeaders(),
      });
      setConditions((prev) =>
        prev.map((c) => (c.condition_Id === id ? { ...c, isActive: response.data.isActive } : c))
      );
      toast.success('تم تحديث حالة الظهور');
    } catch (error) {
      console.error('Error toggling active:', error);
      toast.error('فشل تغيير حالة البند');
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6" dir="rtl">
      <Toaster position="top-center" />
      {/* Top SubNav */}
      <SettingSubNav />

      {/* Header Info */}
      <div className="rounded-lg border border-zinc-800 bg-[#0d1017] p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-[#00c48c]/10 text-[#00c48c] border border-[#00c48c]/20">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">شروط الاسترجاع والاستخدام</h2>
            <p className="text-xs text-zinc-400">
              إدارة بنود الشروط والأحكام الخاصة باسترجاع الاشتراكات والخدمات
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchConditions}
          disabled={loading}
          className="p-1.5 rounded-md border border-zinc-800 bg-[#121620] text-zinc-400 hover:text-white transition"
          title="تحديث"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Condition Form */}
      <div className="rounded-lg border border-zinc-800 bg-[#0d1017] p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00c48c]" />
            <span>{editingId ? 'تعديل بند الشروط' : 'إضافة بند شروط جديد'}</span>
          </h3>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs text-zinc-400 hover:text-white px-2 py-1 rounded bg-zinc-800"
            >
              إلغاء التعديل
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-zinc-300">عنوان البند (العربية):</label>
              <input
                type="text"
                name="conditionTitle_ar"
                value={formData.conditionTitle_ar}
                onChange={handleChange}
                required
                placeholder="مثال: شروط عدم استهلاك الرصيد"
                className="w-full rounded-md border border-zinc-800 bg-[#121620] px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#00c48c] transition"
              />
            </div>

            <div className="space-y-1" dir="ltr">
              <label className="block text-xs font-semibold text-zinc-300 text-right">Title (English):</label>
              <input
                type="text"
                name="conditionTitle_en"
                value={formData.conditionTitle_en}
                onChange={handleChange}
                placeholder="e.g. Credit Non-Usage Conditions"
                className="w-full rounded-md border border-zinc-800 bg-[#121620] px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#00c48c] transition text-left"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-zinc-300">نص وتفاصيل الشرط (العربية):</label>
              <textarea
                name="conditionContent_ar"
                rows={4}
                value={formData.conditionContent_ar}
                onChange={handleChange}
                required
                placeholder="اكتب تفاصيل الشرط والضوابط المتبعة..."
                className="w-full rounded-md border border-zinc-800 bg-[#121620] p-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#00c48c] transition resize-none leading-relaxed"
              />
            </div>

            <div className="space-y-1" dir="ltr">
              <label className="block text-xs font-semibold text-zinc-300 text-right">Content (English):</label>
              <textarea
                name="conditionContent_en"
                rows={4}
                value={formData.conditionContent_en}
                onChange={handleChange}
                placeholder="Type condition details in English..."
                className="w-full rounded-md border border-zinc-800 bg-[#121620] p-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#00c48c] transition resize-none leading-relaxed text-left"
              />
            </div>
          </div>

          <div className="flex items-center justify-end pt-2 border-t border-zinc-800">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#00c48c] hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <>
                  {editingId ? <Save className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{editingId ? 'حفظ التعديل' : 'إضافة البند'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Conditions List */}
      <div className="rounded-lg border border-zinc-800 bg-[#0d1017] p-5 space-y-4">
        <h3 className="text-sm font-bold text-white border-b border-zinc-800 pb-3">
          بنود الشروط الحالية ({conditions.length})
        </h3>

        {loading ? (
          <div className="p-8 text-center text-zinc-400 flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 border-2 border-[#00c48c]/20 border-t-[#00c48c] rounded-full animate-spin" />
            <span className="text-xs">جاري التحميل...</span>
          </div>
        ) : conditions.length === 0 ? (
          <div className="p-6 text-center text-zinc-500 rounded-md border border-zinc-800/60">
            <Info className="w-6 h-6 mx-auto mb-1 text-zinc-500" />
            <p className="text-xs">لم يتم تسجيل أي بنود شروط حتى الآن</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {conditions.map((condition) => (
              <div
                key={condition.condition_Id}
                className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-zinc-900/30 px-2 rounded-md transition"
              >
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-white">{condition.conditionTitle.ar}</h4>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(condition.condition_Id)}
                      className={`text-[10px] px-1.5 py-0.2 rounded border transition ${
                        condition.isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                          : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:bg-zinc-700'
                      }`}
                      title="تبديل حالة التفعيل"
                    >
                      {condition.isActive ? 'مفعل ومتاح' : 'معطل ومخفي'}
                    </button>
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {condition.conditionContent.ar}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleEdit(condition)}
                    className="p-1.5 rounded-md border border-zinc-800 bg-[#121620] text-zinc-300 hover:text-white transition"
                    title="تعديل"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(condition.condition_Id)}
                    className="p-1.5 rounded-md border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConditionPage;