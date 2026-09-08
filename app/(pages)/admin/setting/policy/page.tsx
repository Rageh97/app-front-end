'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  Save,
  RefreshCw,
  Info
} from 'lucide-react';
import SettingSubNav from '@/components/Admin/SettingSubNav';

interface Policy {
  policy_Id: number;
  policyTitle: {
    en: string;
    ar: string;
  };
  policyContent: {
    en: string;
    ar: string;
  };
  isActive: boolean;
}

const PolicyPage = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    policyTitle_en: '',
    policyTitle_ar: '',
    policyContent_en: '',
    policyContent_ar: '',
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

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/policy`);
      setPolicies(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching policies:', error);
      toast.error('فشل تحميل بنود السياسة');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      policyTitle_en: '',
      policyTitle_ar: '',
      policyContent_en: '',
      policyContent_ar: '',
    });
  };

  const handleEdit = (policy: Policy) => {
    setEditingId(policy.policy_Id);
    setFormData({
      policyTitle_en: policy.policyTitle.en,
      policyTitle_ar: policy.policyTitle.ar,
      policyContent_en: policy.policyContent.en,
      policyContent_ar: policy.policyContent.ar,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.policyTitle_ar.trim() || !formData.policyContent_ar.trim()) {
      toast.error('يرجى كتابة عنوان ومحتوى السياسة بالعربية');
      return;
    }

    setIsSaving(true);
    const policyData = {
      policyTitle: {
        en: formData.policyTitle_en.trim() || formData.policyTitle_ar.trim(),
        ar: formData.policyTitle_ar.trim(),
      },
      policyContent: {
        en: formData.policyContent_en.trim() || formData.policyContent_ar.trim(),
        ar: formData.policyContent_ar.trim(),
      },
    };

    try {
      if (editingId) {
        await axios.put(`${API_URL}/api/policy/${editingId}`, policyData, {
          headers: getHeaders(),
        });
        toast.success('تم تحديث بند السياسة بنجاح');
      } else {
        await axios.post(`${API_URL}/api/policy`, policyData, {
          headers: getHeaders(),
        });
        toast.success('تمت إضافة بند السياسة بنجاح');
      }
      resetForm();
      fetchPolicies();
    } catch (error: any) {
      console.error('Error saving policy:', error);
      toast.error('حدث خطأ أثناء حفظ السياسة');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا البند من السياسة؟')) return;

    try {
      await axios.delete(`${API_URL}/api/policy/${id}`, {
        headers: getHeaders(),
      });
      toast.success('تم حذف بند السياسة بنجاح');
      setPolicies((prev) => prev.filter((p) => p.policy_Id !== id));
    } catch (error) {
      console.error('Error deleting policy:', error);
      toast.error('فشل في حذف السياسة');
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      const response = await axios.put(`${API_URL}/api/policy/toggle-active/${id}`, {}, {
        headers: getHeaders(),
      });
      setPolicies((prev) =>
        prev.map((p) => (p.policy_Id === id ? { ...p, isActive: response.data.isActive } : p))
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
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">سياسة الاسترجاع والضمان</h2>
            <p className="text-xs text-zinc-400">
              إدارة بنود سياسة الاسترجاع التي تظهر للمستخدمين في صفحة السياسات
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchPolicies}
          disabled={loading}
          className="p-1.5 rounded-md border border-zinc-800 bg-[#121620] text-zinc-400 hover:text-white transition"
          title="تحديث"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Policy Form */}
      <div className="rounded-lg border border-zinc-800 bg-[#0d1017] p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00c48c]" />
            <span>{editingId ? 'تعديل بند السياسة' : 'إضافة بند جديد لسياسة الاسترجاع'}</span>
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
                name="policyTitle_ar"
                value={formData.policyTitle_ar}
                onChange={handleChange}
                required
                placeholder="مثال: استرجاع الأموال خلال 24 ساعة"
                className="w-full rounded-md border border-zinc-800 bg-[#121620] px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#00c48c] transition"
              />
            </div>

            <div className="space-y-1" dir="ltr">
              <label className="block text-xs font-semibold text-zinc-300 text-right">Title (English):</label>
              <input
                type="text"
                name="policyTitle_en"
                value={formData.policyTitle_en}
                onChange={handleChange}
                placeholder="e.g. 24-hour Refund Policy"
                className="w-full rounded-md border border-zinc-800 bg-[#121620] px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#00c48c] transition text-left"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-zinc-300">نص وتفاصيل البند (العربية):</label>
              <textarea
                name="policyContent_ar"
                rows={4}
                value={formData.policyContent_ar}
                onChange={handleChange}
                required
                placeholder="اكتب تفاصيل وشروط هذا البند بالتفصيل..."
                className="w-full rounded-md border border-zinc-800 bg-[#121620] p-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#00c48c] transition resize-none leading-relaxed"
              />
            </div>

            <div className="space-y-1" dir="ltr">
              <label className="block text-xs font-semibold text-zinc-300 text-right">Content (English):</label>
              <textarea
                name="policyContent_en"
                rows={4}
                value={formData.policyContent_en}
                onChange={handleChange}
                placeholder="Type policy details in English..."
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

      {/* Policies List */}
      <div className="rounded-lg border border-zinc-800 bg-[#0d1017] p-5 space-y-4">
        <h3 className="text-sm font-bold text-white border-b border-zinc-800 pb-3">
          بنود السياسة الحالية ({policies.length})
        </h3>

        {loading ? (
          <div className="p-8 text-center text-zinc-400 flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 border-2 border-[#00c48c]/20 border-t-[#00c48c] rounded-full animate-spin" />
            <span className="text-xs">جاري التحميل...</span>
          </div>
        ) : policies.length === 0 ? (
          <div className="p-6 text-center text-zinc-500 rounded-md border border-zinc-800/60">
            <Info className="w-6 h-6 mx-auto mb-1 text-zinc-500" />
            <p className="text-xs">لم يتم تسجيل أي بنود سياسة استرجاع حتى الآن</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {policies.map((policy) => (
              <div
                key={policy.policy_Id}
                className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-zinc-900/30 px-2 rounded-md transition"
              >
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-white">{policy.policyTitle.ar}</h4>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(policy.policy_Id)}
                      className={`text-[10px] px-1.5 py-0.2 rounded border transition ${
                        policy.isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                          : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:bg-zinc-700'
                      }`}
                      title="تبديل حالة التفعيل"
                    >
                      {policy.isActive ? 'مفعل ومتاح' : 'معطل ومخفي'}
                    </button>
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {policy.policyContent.ar}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleEdit(policy)}
                    className="p-1.5 rounded-md border border-zinc-800 bg-[#121620] text-zinc-300 hover:text-white transition"
                    title="تعديل"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(policy.policy_Id)}
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

export default PolicyPage;