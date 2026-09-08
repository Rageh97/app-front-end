'use client';

import React, { useState, useEffect, ChangeEvent, FormEvent, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  Tv,
  Plus,
  Trash2,
  ExternalLink,
  UploadCloud,
  X,
  RefreshCw,
  Eye,
  Calendar,
  Info
} from 'lucide-react';
import SettingSubNav from '@/components/Admin/SettingSubNav';

interface Banner {
  id: number;
  image_url: string;
  link_url?: string | null;
  title?: string | null;
  display_order: number;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

const BannersPage = () => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [banners, setBanners] = useState<Banner[]>([]);
  const [newBanner, setNewBanner] = useState({
    title: '',
    link_url: '',
    display_order: 0,
    is_active: true,
  });
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

  const getHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('a') : null;
    const clientId = typeof window !== 'undefined' ? localStorage.getItem('clientId1328') : '';
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (clientId) headers['user-client'] = clientId;
    return headers;
  };

  const fetchBanners = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/banners`, {
        headers: getHeaders(),
      });

      if (response.ok) {
        const data: Banner[] = await response.json();
        setBanners(Array.isArray(data) ? data : []);
      } else {
        toast.error('فشل في تحميل البنرات');
      }
    } catch (err: any) {
      console.error('Fetch banners error:', err);
      toast.error('حدث خطأ أثناء تحميل البنرات');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setNewBanner((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : name === 'display_order' ? parseInt(value, 10) || 0 : value,
    }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error('حجم الصورة يجب ألا يتجاوز 5 ميجابايت');
        return;
      }
      setBannerImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAddBanner = async (e: FormEvent) => {
    e.preventDefault();
    if (!bannerImageFile) {
      toast.error('يرجى اختيار صورة البنر');
      return;
    }

    setIsAdding(true);
    const formData = new FormData();
    formData.append('bannerImage', bannerImageFile);
    formData.append('title', newBanner.title.trim());
    formData.append('link_url', newBanner.link_url.trim());
    formData.append('display_order', String(newBanner.display_order));
    formData.append('is_active', String(newBanner.is_active));

    try {
      const response = await fetch(`${API_URL}/api/admin/banners`, {
        method: 'POST',
        headers: getHeaders(),
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'فشل إضافة البنر');
      }

      toast.success('تمت إضافة البنر الإعلاني بنجاح');
      setNewBanner({
        title: '',
        link_url: '',
        display_order: 0,
        is_active: true,
      });
      setBannerImageFile(null);
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchBanners();
    } catch (err: any) {
      console.error('Add banner error:', err);
      toast.error(err.message || 'حدث خطأ أثناء إضافة البنر');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteBanner = async (id: number) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا البنر؟')) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/banners/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      if (response.ok) {
        toast.success('تم حذف البنر بنجاح');
        setBanners((prev) => prev.filter((b) => b.id !== id));
      } else {
        toast.error('فشل في حذف البنر');
      }
    } catch (err: any) {
      console.error('Delete banner error:', err);
      toast.error('حدث خطأ أثناء الحذف');
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6" dir="rtl">
      {/* Top SubNav */}
      <SettingSubNav />

      {/* Header Info */}
      <div className="rounded-lg border border-zinc-800 bg-[#0d1017] p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-[#00c48c]/10 text-[#00c48c] border border-[#00c48c]/20">
            <Tv className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">إدارة البنرات الإعلانية (Banners)</h2>
            <p className="text-xs text-zinc-400">
              إضافة البنرات التي تظهر في شريط الأخبار والإعلانات الرئيسي للمستخدمين
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchBanners}
          disabled={isLoading}
          className="p-1.5 rounded-md border border-zinc-800 bg-[#121620] text-zinc-400 hover:text-white transition"
          title="تحديث"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Add Banner Form */}
      <div className="rounded-lg border border-zinc-800 bg-[#0d1017] p-5 space-y-4">
        <h3 className="text-sm font-bold text-white border-b border-zinc-800 pb-3 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#00c48c]" />
          <span>إضافة بنر إعلاني جديد</span>
        </h3>

        <form onSubmit={handleAddBanner} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-zinc-300">عنوان البنر (اختياري):</label>
              <input
                type="text"
                name="title"
                value={newBanner.title}
                onChange={handleInputChange}
                placeholder="عنوان أو وصف مختصر للبنر..."
                className="w-full rounded-md border border-zinc-800 bg-[#121620] px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#00c48c] transition"
              />
            </div>

            <div className="space-y-1" dir="ltr">
              <label className="block text-xs font-semibold text-zinc-300 text-right">رابط التوجيه (Link URL - اختياري):</label>
              <input
                type="url"
                name="link_url"
                value={newBanner.link_url}
                onChange={handleInputChange}
                placeholder="https://example.com/promo"
                className="w-full rounded-md border border-zinc-800 bg-[#121620] px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#00c48c] transition text-left"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-end">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-zinc-300">ترتيب الظهور (Display Order):</label>
              <input
                type="number"
                name="display_order"
                value={newBanner.display_order}
                onChange={handleInputChange}
                className="w-full rounded-md border border-zinc-800 bg-[#121620] px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#00c48c] transition"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-zinc-300">صورة البنر:</label>
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
                  <span className="text-xs text-zinc-400">اختر صورة البنر</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-1.5 rounded-md border border-zinc-700 bg-zinc-900">
                  <img src={imagePreview} alt="Banner preview" className="w-10 h-6 object-cover rounded" />
                  <span className="text-xs text-zinc-400 flex-1 truncate">{bannerImageFile?.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setBannerImageFile(null);
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
                  checked={newBanner.is_active}
                  onChange={handleInputChange}
                  className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-[#00c48c] focus:ring-0"
                />
                <span>تفعيل ونشر البنر فوراً</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end pt-2 border-t border-zinc-800">
            <button
              type="submit"
              disabled={isAdding || !bannerImageFile}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#00c48c] hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition disabled:opacity-50"
            >
              {isAdding ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>جاري الإضافة...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة البنر</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Banners List */}
      <div className="rounded-lg border border-zinc-800 bg-[#0d1017] p-5 space-y-4">
        <h3 className="text-sm font-bold text-white border-b border-zinc-800 pb-3">
          البنرات المضافة ({banners.length})
        </h3>

        {isLoading ? (
          <div className="p-8 text-center text-zinc-400 flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 border-2 border-[#00c48c]/20 border-t-[#00c48c] rounded-full animate-spin" />
            <span className="text-xs">جاري التحميل...</span>
          </div>
        ) : banners.length === 0 ? (
          <div className="p-6 text-center text-zinc-500 rounded-md border border-zinc-800/60">
            <Info className="w-6 h-6 mx-auto mb-1 text-zinc-500" />
            <p className="text-xs">لا توجد بنرات إعلانية مضافة حالياً</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {banners.map((banner) => (
              <div
                key={banner.id}
                className="rounded-md border border-zinc-800 bg-[#121620]/60 p-3 flex flex-col justify-between space-y-3 hover:border-zinc-700 transition"
              >
                <div className="space-y-2">
                  <div
                    onClick={() => setPreviewModalUrl(`${API_URL}${banner.image_url}`)}
                    className="relative w-full h-28 rounded overflow-hidden bg-black/50 border border-zinc-800 cursor-pointer group"
                  >
                    <img
                      src={`${API_URL}${banner.image_url}`}
                      alt={banner.title || 'Banner'}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                      <Eye className="w-5 h-5 text-white" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-white truncate">
                        {banner.title || 'بنر بدون عنوان'}
                      </h4>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded border ${
                          banner.is_active
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                        }`}
                      >
                        {banner.is_active ? 'نشط' : 'معطل'}
                      </span>
                    </div>

                    {banner.link_url && (
                      <a
                        href={banner.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-zinc-400 hover:text-emerald-400 flex items-center gap-1 mt-1 truncate"
                        dir="ltr"
                      >
                        <span className="truncate">{banner.link_url}</span>
                        <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                  <span className="text-[10px] text-zinc-500">الترتيب: {banner.display_order}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteBanner(banner.id)}
                    className="p-1 rounded-md border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs flex items-center gap-1 transition"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>حذف</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {previewModalUrl && (
        <div
          onClick={() => setPreviewModalUrl(null)}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl max-h-[80vh] rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950 p-1.5 shadow-2xl"
          >
            <button
              onClick={() => setPreviewModalUrl(null)}
              className="absolute top-3 left-3 p-1.5 rounded-full bg-black/70 text-white hover:bg-black transition z-10"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <img
              src={previewModalUrl}
              alt="Banner preview"
              className="w-full h-auto max-h-[75vh] object-contain rounded"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default BannersPage;