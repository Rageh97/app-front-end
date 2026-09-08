'use client';

import React, { useState, useEffect, ChangeEvent, FormEvent, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  Image as ImageIcon,
  UploadCloud,
  X,
  Save,
  RefreshCw,
  CheckCircle2,
  Info
} from 'lucide-react';
import SettingSubNav from '@/components/Admin/SettingSubNav';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
const MAIN_LOGO_KEY = 'site_logo';
const SUB_LOGO_KEY = 'site_sub_logo';

const LogoPage = () => {
  const { t } = useTranslation();
  const [currentMainLogoUrl, setCurrentMainLogoUrl] = useState<string | null>(null);
  const [currentSubLogoUrl, setCurrentSubLogoUrl] = useState<string | null>(null);
  const [selectedMainFile, setSelectedMainFile] = useState<File | null>(null);
  const [selectedSubFile, setSelectedSubFile] = useState<File | null>(null);
  const [previewMainUrl, setPreviewMainUrl] = useState<string | null>(null);
  const [previewSubUrl, setPreviewSubUrl] = useState<string | null>(null);
  const [isLoadingMain, setIsLoadingMain] = useState<boolean>(false);
  const [isLoadingSub, setIsLoadingSub] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState<boolean>(true);

  const mainInputRef = useRef<HTMLInputElement>(null);
  const subInputRef = useRef<HTMLInputElement>(null);

  const getHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('a') : null;
    const clientId = typeof window !== 'undefined' ? localStorage.getItem('clientId1328') : '';
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (clientId) headers['user-client'] = clientId;
    return headers;
  };

  const fetchCurrentLogos = async () => {
    setIsFetching(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/settings/logos`, {
        method: 'GET',
        headers: getHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.mainLogo) {
          setCurrentMainLogoUrl(`${API_URL}${data.mainLogo}`);
        }
        if (data.subLogo) {
          setCurrentSubLogoUrl(`${API_URL}${data.subLogo}`);
        }
      }
    } catch (err: any) {
      console.error('Fetch logos error:', err);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchCurrentLogos();
  }, []);

  const handleMainFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error('حجم الملف يجب ألا يتجاوز 5 ميجابايت');
        return;
      }
      setSelectedMainFile(file);
      setPreviewMainUrl(URL.createObjectURL(file));
    }
  };

  const handleSubFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error('حجم الملف يجب ألا يتجاوز 5 ميجابايت');
        return;
      }
      setSelectedSubFile(file);
      setPreviewSubUrl(URL.createObjectURL(file));
    }
  };

  const handleMainLogoSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedMainFile) {
      toast.error('يرجى اختيار صورة الشعار أولاً');
      return;
    }

    setIsLoadingMain(true);
    const formData = new FormData();
    formData.append('logoImage', selectedMainFile);
    formData.append('logoType', 'main');

    try {
      const response = await fetch(`${API_URL}/api/admin/settings/${MAIN_LOGO_KEY}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'فشل تحديث الشعار الرئيسي');
      }

      const updatedSetting = await response.json();
      toast.success('تم تحديث الشعار الرئيسي بنجاح');
      if (updatedSetting.value) {
        setCurrentMainLogoUrl(`${API_URL}${updatedSetting.value}?t=${new Date().getTime()}`);
      }
      setSelectedMainFile(null);
      setPreviewMainUrl(null);
      if (mainInputRef.current) mainInputRef.current.value = '';
    } catch (err: any) {
      console.error('Upload main logo error:', err);
      toast.error(err.message || 'حدث خطأ أثناء رفع الشعار');
    } finally {
      setIsLoadingMain(false);
    }
  };

  const handleSubLogoSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedSubFile) {
      toast.error('يرجى اختيار صورة الشعار الفرعي أولاً');
      return;
    }

    setIsLoadingSub(true);
    const formData = new FormData();
    formData.append('logoImage', selectedSubFile);
    formData.append('logoType', 'sub');

    try {
      const response = await fetch(`${API_URL}/api/admin/settings/${SUB_LOGO_KEY}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'فشل تحديث الشعار الفرعي');
      }

      const updatedSetting = await response.json();
      toast.success('تم تحديث الشعار الفرعي بنجاح');
      if (updatedSetting.value) {
        setCurrentSubLogoUrl(`${API_URL}${updatedSetting.value}?t=${new Date().getTime()}`);
      }
      setSelectedSubFile(null);
      setPreviewSubUrl(null);
      if (subInputRef.current) subInputRef.current.value = '';
    } catch (err: any) {
      console.error('Upload sub logo error:', err);
      toast.error(err.message || 'حدث خطأ أثناء رفع الشعار');
    } finally {
      setIsLoadingSub(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6" dir="rtl">
      {/* Top Admin SubNav */}
      <SettingSubNav />

      {/* Overview Info Header */}
      <div className="rounded-lg border border-zinc-800 bg-[#0d1017] p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-[#00c48c]/10 text-[#00c48c] border border-[#00c48c]/20">
            <ImageIcon className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">إدارة شعارات الموقع والمنصة</h2>
            <p className="text-xs text-zinc-400">
              تغيير الشعار الرئيسي الذي يظهر في الترويسة والشعار المصغر المستخدم في القوائم
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchCurrentLogos}
          disabled={isFetching}
          className="p-1.5 rounded-md border border-zinc-800 bg-[#121620] text-zinc-400 hover:text-white transition"
          title="تحديث"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Two-Column Grid for Logos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Main Logo Card */}
        <div className="rounded-lg border border-zinc-800 bg-[#0d1017] p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#00c48c]" />
                  <span>الشعار الرئيسي للمنصة (Main Logo)</span>
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">يظهر في أعلى شريط التنقل الرئيسي وفي صفحات الهبوط</p>
              </div>
            </div>

            {/* Current Preview */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-zinc-300">الشعار الحالي:</span>
              <div className="rounded-md border border-zinc-800 bg-[#121620] p-4 flex items-center justify-center min-h-[90px]">
                {currentMainLogoUrl ? (
                  <img
                    src={currentMainLogoUrl}
                    alt="Main Logo"
                    className="max-h-12 w-auto object-contain"
                  />
                ) : (
                  <span className="text-xs text-zinc-500">لا يوجد شعار رئيسي محدد</span>
                )}
              </div>
            </div>

            {/* Upload Zone */}
            <form onSubmit={handleMainLogoSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-zinc-300">رفع شعار جديد:</span>
                {!previewMainUrl ? (
                  <div
                    onClick={() => mainInputRef.current?.click()}
                    className="border border-dashed border-zinc-700 hover:border-[#00c48c]/60 rounded-lg p-3 text-center cursor-pointer transition bg-[#121620]/40 hover:bg-[#121620] group"
                  >
                    <input
                      ref={mainInputRef}
                      type="file"
                      accept=".png,.jpg,.jpeg,.svg,.webp"
                      onChange={handleMainFileChange}
                      className="hidden"
                    />
                    <UploadCloud className="w-5 h-5 mx-auto text-zinc-400 group-hover:text-[#00c48c] transition mb-1" />
                    <p className="text-xs font-medium text-zinc-300 group-hover:text-white transition">
                      اختر ملف الشعار (PNG, SVG, WEBP)
                    </p>
                  </div>
                ) : (
                  <div className="relative rounded-md border border-zinc-700 bg-zinc-900 p-2 flex items-center justify-between">
                    <img
                      src={previewMainUrl}
                      alt="New preview"
                      className="max-h-10 w-auto object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMainFile(null);
                        setPreviewMainUrl(null);
                        if (mainInputRef.current) mainInputRef.current.value = '';
                      }}
                      className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-white"
                      title="إلغاء"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoadingMain || !selectedMainFile}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md bg-[#00c48c] hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition disabled:opacity-50"
              >
                {isLoadingMain ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>جاري الرفع...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>حفظ الشعار الرئيسي</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Sub Logo Card */}
        <div className="rounded-lg border border-zinc-800 bg-[#0d1017] p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>الشعار الفرعي / الأيقونة (Sub Logo)</span>
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">يستخدم كرمز مصغر أو أيقونة في القوائم الجانبية</p>
              </div>
            </div>

            {/* Current Preview */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-zinc-300">الشعار الحالي:</span>
              <div className="rounded-md border border-zinc-800 bg-[#121620] p-4 flex items-center justify-center min-h-[90px]">
                {currentSubLogoUrl ? (
                  <img
                    src={currentSubLogoUrl}
                    alt="Sub Logo"
                    className="max-h-12 w-auto object-contain"
                  />
                ) : (
                  <span className="text-xs text-zinc-500">لا يوجد شعار فرعي محدد</span>
                )}
              </div>
            </div>

            {/* Upload Zone */}
            <form onSubmit={handleSubLogoSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-zinc-300">رفع شعار فرعي جديد:</span>
                {!previewSubUrl ? (
                  <div
                    onClick={() => subInputRef.current?.click()}
                    className="border border-dashed border-zinc-700 hover:border-[#00c48c]/60 rounded-lg p-3 text-center cursor-pointer transition bg-[#121620]/40 hover:bg-[#121620] group"
                  >
                    <input
                      ref={subInputRef}
                      type="file"
                      accept=".png,.jpg,.jpeg,.svg,.webp"
                      onChange={handleSubFileChange}
                      className="hidden"
                    />
                    <UploadCloud className="w-5 h-5 mx-auto text-zinc-400 group-hover:text-[#00c48c] transition mb-1" />
                    <p className="text-xs font-medium text-zinc-300 group-hover:text-white transition">
                      اختر ملف الشعار (PNG, SVG, WEBP)
                    </p>
                  </div>
                ) : (
                  <div className="relative rounded-md border border-zinc-700 bg-zinc-900 p-2 flex items-center justify-between">
                    <img
                      src={previewSubUrl}
                      alt="New preview"
                      className="max-h-10 w-auto object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSubFile(null);
                        setPreviewSubUrl(null);
                        if (subInputRef.current) subInputRef.current.value = '';
                      }}
                      className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-white"
                      title="إلغاء"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoadingSub || !selectedSubFile}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md bg-[#00c48c] hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition disabled:opacity-50"
              >
                {isLoadingSub ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>جاري الرفع...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>حفظ الشعار الفرعي</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoPage;