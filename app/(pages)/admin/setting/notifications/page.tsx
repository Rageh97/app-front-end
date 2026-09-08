'use client';

import React, { useState, useEffect, FormEvent, ChangeEvent, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import SettingSubNav from '@/components/Admin/SettingSubNav';
import {
  Bell,
  Send,
  UploadCloud,
  X,
  Trash2,
  Users,
  Mail,
  Search,
  Calendar,
  Eye,
  RefreshCw,
  Info
} from 'lucide-react';

interface NotificationItem {
  id: number;
  message_en: string;
  message_ar: string;
  image_url: string | null;
  created_at: string;
  user_id: number | null;
  is_read?: boolean;
  targetUser?: {
    user_id: number;
    email: string;
    first_name?: string;
    last_name?: string;
  } | null;
}

const AdminNotificationsSettingPage = () => {
  const { t } = useTranslation();
  const pathname = usePathname();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [formData, setFormData] = useState({
    message_en: '',
    message_ar: '',
    target_type: 'broadcast', // 'broadcast' | 'specific'
    user_email: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  // List states
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'broadcast' | 'specific'>('all');

  // Modals
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

  const getHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('a') : null;
    const clientId = typeof window !== 'undefined' ? localStorage.getItem('clientId1328') : '';
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (clientId) headers['user-client'] = clientId;
    return headers;
  };

  const fetchNotifications = async () => {
    try {
      setIsLoadingList(true);
      const response = await fetch(`${API_URL}/api/notifications/admin/all`, {
        headers: getHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(Array.isArray(data) ? data : []);
      } else {
        toast.error('فشل في جلب قائمة الإشعارات');
      }
    } catch (err) {
      console.error('Error fetching admin notifications:', err);
      toast.error('حدث خطأ أثناء تحميل الإشعارات');
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error('حجم الصورة يجب ألا يتجاوز 5 ميجابايت');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveSelectedFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.message_ar.trim() || !formData.message_en.trim()) {
      toast.error('يرجى كتابة نص الإشعار باللغتين العربية والإنجليزية');
      return;
    }

    if (formData.target_type === 'specific' && !formData.user_email.trim()) {
      toast.error('يرجى إدخال البريد الإلكتروني للمستخدم المستهدف');
      return;
    }

    setIsSending(true);

    try {
      const bodyData = new FormData();
      bodyData.append('message_ar', formData.message_ar.trim());
      bodyData.append('message_en', formData.message_en.trim());

      if (formData.target_type === 'specific' && formData.user_email.trim()) {
        bodyData.append('email', formData.user_email.trim().toLowerCase());
      }

      if (selectedFile) {
        bodyData.append('notificationImage', selectedFile);
      }

      const response = await fetch(`${API_URL}/api/notifications`, {
        method: 'POST',
        headers: getHeaders(),
        body: bodyData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'فشل إرسال الإشعار');
      }

      toast.success(
        formData.target_type === 'specific'
          ? `تم إرسال الإشعار بنجاح إلى: ${formData.user_email}`
          : 'تم إرسال الإشعار العام لجميع المستخدمين بنجاح'
      );

      // Reset form
      setFormData({
        message_en: '',
        message_ar: '',
        target_type: 'broadcast',
        user_email: '',
      });
      handleRemoveSelectedFile();

      // Refresh list
      fetchNotifications();
    } catch (err: any) {
      console.error('Send error:', err);
      toast.error(err.message || 'حدث خطأ أثناء إرسال الإشعار');
    } finally {
      setIsSending(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`${API_URL}/api/notifications/${deletingId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== deletingId));
        toast.success('تم حذف الإشعار بنجاح');
      } else {
        const errData = await response.json();
        throw new Error(errData.message || 'فشل حذف الإشعار');
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(err.message || 'حدث خطأ أثناء حذف الإشعار');
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('ar-EG', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // Stats
  const totalCount = notifications.length;
  const broadcastCount = notifications.filter((n) => !n.user_id).length;
  const specificCount = notifications.filter((n) => Boolean(n.user_id)).length;

  // Filtered list
  const filteredList = notifications.filter((n) => {
    if (filterType === 'broadcast' && n.user_id !== null) return false;
    if (filterType === 'specific' && n.user_id === null) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchAr = (n.message_ar || '').toLowerCase().includes(q);
      const matchEn = (n.message_en || '').toLowerCase().includes(q);
      const matchEmail = n.targetUser?.email?.toLowerCase().includes(q) || false;
      const matchId = String(n.id).includes(q) || (n.user_id && String(n.user_id).includes(q));
      return matchAr || matchEn || matchEmail || matchId;
    }
    return true;
  });

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6" dir="rtl">
      {/* Top Admin Settings Navigation Bar */}
      <SettingSubNav />

      {/* Professional Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-lg border border-zinc-800 bg-[#0d1017] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[#00c48c]">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-zinc-400">إجمالي الإشعارات</p>
              <h3 className="text-lg font-bold text-white">{totalCount}</h3>
            </div>
          </div>
          <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
            السجل
          </span>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-[#0d1017] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-zinc-400">إشعارات عامة (للكل)</p>
              <h3 className="text-lg font-bold text-white">{broadcastCount}</h3>
            </div>
          </div>
          <span className="text-[11px] font-medium text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20">
            عامة
          </span>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-[#0d1017] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-zinc-400">إشعارات موجهة بالإيميل</p>
              <h3 className="text-lg font-bold text-white">{specificCount}</h3>
            </div>
          </div>
          <span className="text-[11px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
            مخصصة
          </span>
        </div>
      </div>

      {/* Main Creation Form Card */}
      <div className="rounded-lg border border-zinc-800 bg-[#0d1017] p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-md bg-[#00c48c]/10 text-[#00c48c] border border-[#00c48c]/20">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">إرسال إشعار جديد</h2>
              <p className="text-xs text-zinc-400">
                بث إشعار لجميع المستخدمين أو توجيه تنبيه مباشر لبريد إلكتروني محدد
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Target Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-zinc-300">الوجهة المستهدفة:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                  formData.target_type === 'broadcast'
                    ? 'bg-[#00c48c]/10 border-[#00c48c]/60 text-white'
                    : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <input
                  type="radio"
                  name="target_type"
                  value="broadcast"
                  checked={formData.target_type === 'broadcast'}
                  onChange={() => setFormData((p) => ({ ...p, target_type: 'broadcast', user_email: '' }))}
                  className="hidden"
                />
                <div
                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                    formData.target_type === 'broadcast' ? 'border-[#00c48c]' : 'border-zinc-600'
                  }`}
                >
                  {formData.target_type === 'broadcast' && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00c48c]" />
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold block text-white">إشعار عام لجميع المستخدمين</span>
                  <span className="text-[11px] text-zinc-400">يظهر فوراً لكافة حسابات المستخدمين النشطين</span>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                  formData.target_type === 'specific'
                    ? 'bg-[#00c48c]/10 border-[#00c48c]/60 text-white'
                    : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <input
                  type="radio"
                  name="target_type"
                  value="specific"
                  checked={formData.target_type === 'specific'}
                  onChange={() => setFormData((p) => ({ ...p, target_type: 'specific' }))}
                  className="hidden"
                />
                <div
                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                    formData.target_type === 'specific' ? 'border-[#00c48c]' : 'border-zinc-600'
                  }`}
                >
                  {formData.target_type === 'specific' && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00c48c]" />
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold block text-white">إشعار موجه لبريد إلكتروني محدد</span>
                  <span className="text-[11px] text-zinc-400">يصل فقط للمستخدم صاحب البريد المدخل</span>
                </div>
              </label>
            </div>
          </div>

          {/* User Email field (Only if specific target) */}
          {formData.target_type === 'specific' && (
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                <span>البريد الإلكتروني للمستخدم المستهدف:</span>
              </label>
              <input
                type="email"
                name="user_email"
                value={formData.user_email}
                onChange={handleInputChange}
                required
                placeholder="user@example.com"
                className="w-full sm:w-96 rounded-md border border-zinc-800 bg-[#121620] px-3.5 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#00c48c] transition text-left"
                dir="ltr"
              />
            </div>
          )}

          {/* Dual Language Message Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Arabic Message */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-200">
                  نص الإشعار (العربية):
                </label>
                <span className="text-[11px] text-zinc-500">{formData.message_ar.length} حرف</span>
              </div>
              <textarea
                name="message_ar"
                rows={3}
                value={formData.message_ar}
                onChange={handleInputChange}
                required
                placeholder="اكتب الإشعار باللغة العربية..."
                className="w-full rounded-md border border-zinc-800 bg-[#121620] p-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#00c48c] transition resize-none leading-relaxed"
              />
            </div>

            {/* English Message */}
            <div className="space-y-1.5" dir="ltr">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-200">
                  Notification Message (English):
                </label>
                <span className="text-[11px] text-zinc-500">{formData.message_en.length} chars</span>
              </div>
              <textarea
                name="message_en"
                rows={3}
                value={formData.message_en}
                onChange={handleInputChange}
                required
                placeholder="Type notification in English..."
                className="w-full rounded-md border border-zinc-800 bg-[#121620] p-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#00c48c] transition resize-none leading-relaxed text-left"
              />
            </div>
          </div>

          {/* Image Upload Zone */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-300">
              صورة توضيحية (اختياري):
            </label>

            {!previewUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-zinc-700 hover:border-[#00c48c]/60 rounded-lg p-4 text-center cursor-pointer transition bg-[#121620]/50 hover:bg-[#121620] group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="p-2 rounded-md bg-zinc-800 w-8 h-8 mx-auto mb-1.5 flex items-center justify-center text-zinc-400 group-hover:text-[#00c48c] transition">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <p className="text-xs font-medium text-zinc-300 group-hover:text-white transition">
                  انقر لاختيار صورة من جهازك
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">PNG, JPG, WEBP (الحد الأقصى 5MB)</p>
              </div>
            ) : (
              <div className="relative inline-block rounded-md border border-zinc-700 bg-zinc-900 p-2">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-40 h-24 object-cover rounded"
                />
                <button
                  type="button"
                  onClick={handleRemoveSelectedFile}
                  className="absolute top-3 left-3 p-1 rounded-full bg-red-600/90 text-white hover:bg-red-700 transition"
                  title="حذف الصورة"
                >
                  <X className="w-3 h-3" />
                </button>
                <p className="text-[11px] text-zinc-400 mt-1 truncate max-w-[160px] text-center">
                  {selectedFile?.name}
                </p>
              </div>
            )}
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end pt-3 border-t border-zinc-800">
            <button
              type="submit"
              disabled={isSending || !formData.message_ar.trim() || !formData.message_en.trim()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-md bg-[#00c48c] hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSending ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>جاري الإرسال...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>إرسال الإشعار</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Notifications History Section */}
      <div className="rounded-lg border border-zinc-800 bg-[#0d1017] p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#00c48c]" />
              <span>سجل الإشعارات المرسلة ({filteredList.length})</span>
            </h2>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3 h-3 text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث في الرسائل أو الإيميل..."
                className="rounded-md border border-zinc-800 bg-[#121620] pr-7 pl-2.5 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#00c48c] transition w-44 sm:w-56"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-1 bg-[#121620] p-1 rounded-md border border-zinc-800">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-2 py-0.5 text-xs rounded transition ${
                  filterType === 'all'
                    ? 'bg-[#00c48c] text-zinc-950 font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                الكل
              </button>
              <button
                type="button"
                onClick={() => setFilterType('broadcast')}
                className={`px-2 py-0.5 text-xs rounded transition ${
                  filterType === 'broadcast'
                    ? 'bg-[#00c48c] text-zinc-950 font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                عامة
              </button>
              <button
                type="button"
                onClick={() => setFilterType('specific')}
                className={`px-2 py-0.5 text-xs rounded transition ${
                  filterType === 'specific'
                    ? 'bg-[#00c48c] text-zinc-950 font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                مخصصة
              </button>
            </div>

            <button
              type="button"
              onClick={fetchNotifications}
              className="p-1.5 rounded-md border border-zinc-800 bg-[#121620] text-zinc-400 hover:text-white transition"
              title="تحديث"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingList ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* List Content */}
        {isLoadingList ? (
          <div className="p-8 text-center text-zinc-400 flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 border-2 border-[#00c48c]/20 border-t-[#00c48c] rounded-full animate-spin" />
            <span className="text-xs">جاري التحميل...</span>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 rounded-md border border-zinc-800/60 bg-[#121620]/30">
            <Info className="w-6 h-6 mx-auto mb-1 text-zinc-500" />
            <p className="text-xs font-medium text-zinc-400">لا توجد إشعارات تطابق البحث</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/80">
            {filteredList.map((notif) => {
              const isBroadcast = !notif.user_id;
              const targetEmail = notif.targetUser?.email || (notif.user_id ? `User #${notif.user_id}` : null);
              const targetName = notif.targetUser?.first_name ? `${notif.targetUser.first_name} ${notif.targetUser.last_name || ''}`.trim() : null;

              return (
                <div
                  key={notif.id}
                  className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-zinc-900/30 px-2 rounded-md transition"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Thumbnail */}
                    {notif.image_url ? (
                      <div
                        onClick={() => setPreviewImageModal(`${API_URL}${notif.image_url}`)}
                        className="relative w-12 h-12 rounded-md overflow-hidden bg-zinc-900 border border-zinc-800 flex-shrink-0 cursor-pointer hover:opacity-80 transition"
                      >
                        <img
                          src={`${API_URL}${notif.image_url}`}
                          alt="Notification"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div
                        className={`w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 border ${
                          isBroadcast
                            ? 'bg-sky-500/10 border-sky-500/20 text-sky-400'
                            : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                        }`}
                      >
                        {isBroadcast ? <Users className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                      </div>
                    )}

                    {/* Details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isBroadcast ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-500/10 border border-sky-500/20 text-sky-300">
                            <Users className="w-2.5 h-2.5" />
                            <span>عام لكافة المستخدمين</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-300">
                            <Mail className="w-2.5 h-2.5" />
                            <span>مخصص: {targetEmail} {targetName ? `(${targetName})` : ''}</span>
                          </span>
                        )}

                        <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(notif.created_at)}</span>
                        </span>
                      </div>

                      {/* Text preview */}
                      <p className="text-xs font-medium text-white leading-relaxed">
                        {notif.message_ar}
                      </p>
                      <p className="text-[11px] text-zinc-400 text-left leading-normal" dir="ltr">
                        {notif.message_en}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center flex-shrink-0">
                    {notif.image_url && (
                      <button
                        type="button"
                        onClick={() => setPreviewImageModal(`${API_URL}${notif.image_url}`)}
                        className="p-1.5 rounded-md border border-zinc-800 bg-[#121620] text-zinc-300 hover:text-white transition"
                        title="معاينة الصورة"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setDeletingId(notif.id)}
                      className="p-1.5 rounded-md border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-lg bg-[#0d1017] border border-zinc-800 p-5 space-y-3.5 shadow-xl">
            <h3 className="text-sm font-bold text-white">تأكيد حذف الإشعار</h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              هل أنت متأكد من حذف الإشعار رقم #{deletingId}؟ سيتم حذفه وسجلات القراءة المرتبطة به نهائياً.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                disabled={isDeleting}
                className="px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>جاري الحذف...</span>
                  </>
                ) : (
                  <span>تأكيد الحذف</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImageModal && (
        <div
          onClick={() => setPreviewImageModal(null)}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl max-h-[80vh] rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950 p-1.5 shadow-2xl"
          >
            <button
              onClick={() => setPreviewImageModal(null)}
              className="absolute top-3 left-3 p-1.5 rounded-full bg-black/70 text-white hover:bg-black transition z-10"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <img
              src={previewImageModal}
              alt="Preview"
              className="w-full h-auto max-h-[75vh] object-contain rounded"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotificationsSettingPage;
