'use client';

import React, { useState, useEffect, FormEvent, ChangeEvent, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  Share2,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  UploadCloud,
  X,
  Save,
  RefreshCw,
  CheckCircle2,
  Info
} from 'lucide-react';
import SettingSubNav from '@/components/Admin/SettingSubNav';

interface SocialLink {
  id: number;
  name: string;
  url: string;
  icon_type: 'image' | 'react_icon';
  icon_value: string;
  display_order: number;
  is_active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const SocialLinksPage = () => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [isEditing, setIsEditing] = useState<SocialLink | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    url: string;
    display_order: number;
    is_active: boolean;
  }>({
    name: '',
    url: '',
    display_order: 0,
    is_active: true,
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

  const getHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('a') : null;
    const clientId = typeof window !== 'undefined' ? localStorage.getItem('clientId1328') : '';
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (clientId) headers['user-client'] = clientId;
    return headers;
  };

  const fetchSocialLinks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/social-links/social-links`, {
        headers: getHeaders(),
      });

      if (response.ok) {
        const data: SocialLink[] = await response.json();
        setSocialLinks(Array.isArray(data) ? data : []);
      } else {
        toast.error('فشل في تحميل روابط التواصل');
      }
    } catch (err: any) {
      console.error('Fetch social links error:', err);
      toast.error('حدث خطأ أثناء تحميل الروابط');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSocialLinks();
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : name === 'display_order' ? parseInt(value, 10) || 0 : value,
    }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const resetForm = () => {
    setIsEditing(null);
    setFormData({
      name: '',
      url: '',
      display_order: 0,
      is_active: true,
    });
    setSelectedFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEditClick = (link: SocialLink) => {
    setIsEditing(link);
    setFormData({
      name: link.name,
      url: link.url,
      display_order: link.display_order,
      is_active: link.is_active,
    });
    setImagePreview(link.icon_value ? `${API_URL}${link.icon_value}` : null);
    setSelectedFile(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.url.trim()) {
      toast.error('يرجى ملء اسم الرابط وعنوان URL');
      return;
    }

    if (!isEditing && !selectedFile) {
      toast.error('يرجى اختيار أيقونة / صورة الرابط');
      return;
    }

    setIsSaving(true);
    const dataToSend = new FormData();
    dataToSend.append('name', formData.name.trim());
    dataToSend.append('url', formData.url.trim());
    dataToSend.append('icon_type', 'image');
    dataToSend.append('display_order', String(formData.display_order));
    dataToSend.append('is_active', String(formData.is_active));

    if (selectedFile) {
      dataToSend.append('iconImage', selectedFile);
    }

    try {
      const url = isEditing
        ? `${API_URL}/api/social-links/social-links/${isEditing.id}`
        : `${API_URL}/api/social-links/social-links`;
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: getHeaders(),
        body: dataToSend,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'فشل حفظ الرابط');
      }

      toast.success(isEditing ? 'تم تحديث الرابط بنجاح' : 'تم إضافة الرابط بنجاح');
      resetForm();
      fetchSocialLinks();
    } catch (err: any) {
      console.error('Submit error:', err);
      toast.error(err.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا الرابط؟')) return;

    try {
      const response = await fetch(`${API_URL}/api/social-links/social-links/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      if (response.ok) {
        toast.success('تم حذف الرابط بنجاح');
        setSocialLinks((prev) => prev.filter((l) => l.id !== id));
      } else {
        toast.error('فشل في حذف الرابط');
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error('حدث خطأ أثناء الحذف');
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6" dir="rtl">
      {/* Top Admin SubNav */}
      <SettingSubNav />

      {/* Header Info */}
      <div className="rounded-lg border border-zinc-800 bg-[#0d1017] p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-[#00c48c]/10 text-[#00c48c] border border-[#00c48c]/20">
            <Share2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">روابط وحسابات التواصل الاجتماعي</h2>
            <p className="text-xs text-zinc-400">
              إدارة الروابط التي تظهر في تذييل الموقع (Footer) وصفحات الهبوط
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchSocialLinks}
          disabled={isLoading}
          className="p-1.5 rounded-md border border-zinc-800 bg-[#121620] text-zinc-400 hover:text-white transition"
          title="تحديث"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Form Card */}
      <div className="rounded-lg border border-zinc-800 bg-[#0d1017] p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00c48c]" />
            <span>{isEditing ? `تعديل الرابط: ${isEditing.name}` : 'إضافة رابط تواصل جديد'}</span>
          </h3>
          {isEditing && (
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-zinc-300">اسم المنصة / الرابط:</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Telegram, WhatsApp, YouTube..."
                className="w-full rounded-md border border-zinc-800 bg-[#121620] px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#00c48c] transition"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-300">رابط الصفحة (URL):</label>
              <input
                type="url"
                name="url"
                value={formData.url}
                onChange={handleInputChange}
                required
                placeholder="https://t.me/your_channel"
                className="w-full rounded-md border border-zinc-800 bg-[#121620] px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#00c48c] transition text-left"
                dir="ltr"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-end">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-zinc-300">ترتيب الظهور (Display Order):</label>
              <input
                type="number"
                name="display_order"
                value={formData.display_order}
                onChange={handleInputChange}
                className="w-full rounded-md border border-zinc-800 bg-[#121620] px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#00c48c] transition"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-zinc-300">أيقونة الرابط:</label>
              {!imagePreview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-dashed border-zinc-700 hover:border-[#00c48c]/60 rounded-md p-2 text-center cursor-pointer transition bg-[#121620]/40 flex items-center justify-center gap-2"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <UploadCloud className="w-4 h-4 text-zinc-400" />
                  <span className="text-xs text-zinc-400">اختر صورة الأيقونة</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-1.5 rounded-md border border-zinc-700 bg-zinc-900">
                  <img src={imagePreview} alt="Icon preview" className="w-6 h-6 object-contain" />
                  <span className="text-xs text-zinc-400 flex-1 truncate">
                    {selectedFile ? selectedFile.name : 'الأيقونة الحالية'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setImagePreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="p-1 text-zinc-400 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pb-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-[#00c48c] focus:ring-0"
                />
                <span>مفعل ونشط في الموقع</span>
              </label>
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
                  {isEditing ? <Save className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{isEditing ? 'تحديث الرابط' : 'إضافة الرابط'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Links List */}
      <div className="rounded-lg border border-zinc-800 bg-[#0d1017] p-5 space-y-4">
        <h3 className="text-sm font-bold text-white border-b border-zinc-800 pb-3">
          الروابط الحالية ({socialLinks.length})
        </h3>

        {isLoading ? (
          <div className="p-8 text-center text-zinc-400 flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 border-2 border-[#00c48c]/20 border-t-[#00c48c] rounded-full animate-spin" />
            <span className="text-xs">جاري التحميل...</span>
          </div>
        ) : socialLinks.length === 0 ? (
          <div className="p-6 text-center text-zinc-500 rounded-md border border-zinc-800/60">
            <Info className="w-6 h-6 mx-auto mb-1 text-zinc-500" />
            <p className="text-xs">لا توجد روابط مضافة حالياً</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {socialLinks.map((link) => (
              <div
                key={link.id}
                className="py-3 flex items-center justify-between gap-3 hover:bg-zinc-900/30 px-2 rounded-md transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {link.icon_value ? (
                    <img
                      src={`${API_URL}${link.icon_value}`}
                      alt={link.name}
                      className="w-8 h-8 rounded-md p-1 bg-zinc-900 border border-zinc-800 object-contain"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-md bg-zinc-800 flex items-center justify-center text-zinc-400">
                      <Share2 className="w-4 h-4" />
                    </div>
                  )}

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{link.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded border ${
                          link.is_active
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                        }`}
                      >
                        {link.is_active ? 'نشط' : 'معطل'}
                      </span>
                      <span className="text-[10px] text-zinc-500">الترتيب: {link.display_order}</span>
                    </div>

                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-zinc-400 hover:text-emerald-400 flex items-center gap-1 truncate max-w-xs sm:max-w-md text-left"
                      dir="ltr"
                    >
                      <span>{link.url}</span>
                      <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleEditClick(link)}
                    className="p-1.5 rounded-md border border-zinc-800 bg-[#121620] text-zinc-300 hover:text-white transition"
                    title="تعديل"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(link.id)}
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

export default SocialLinksPage;
