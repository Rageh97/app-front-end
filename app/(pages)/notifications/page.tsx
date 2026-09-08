'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Bell, 
  CheckCheck, 
  Check, 
  Clock, 
  X, 
  Inbox, 
  Eye, 
  Calendar
} from 'lucide-react';

interface NotificationItem {
  id: number;
  message?: string;
  message_ar?: string;
  message_en?: string;
  image_url: string | null;
  is_read: boolean;
  created_at: string;
  user_id: number | null;
  read_at?: string | null;
}

const NotificationsPage = () => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      setError('');
      const token = localStorage.getItem('a');
      if (!token) {
        throw new Error(isAr ? 'يجب تسجيل الدخول أولاً' : 'User not authenticated');
      }

      const response = await fetch(`${API_URL}/api/notifications/user`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(isAr ? 'فشل في جلب الإشعارات' : 'Failed to fetch notifications');
      }

      const data = await response.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || (isAr ? 'حدث خطأ أثناء تحميل الإشعارات' : 'Error fetching notifications'));
      console.error('Error fetching notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      const token = localStorage.getItem('a');
      if (!token) return;

      const response = await fetch(`${API_URL}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Update local state without removing from list
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === notificationId ? { ...notif, is_read: true } : notif
          )
        );

        // Update selected modal item if open
        setSelectedNotification((prev) =>
          prev && prev.id === notificationId ? { ...prev, is_read: true } : prev
        );

        // Dispatch window event so Header unread badge updates immediately
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('notificationUpdated'));
        }
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      setIsMarkingAll(true);
      const token = localStorage.getItem('a');
      if (!token) return;

      const response = await fetch(`${API_URL}/api/notifications/mark-all-read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setNotifications((prev) => prev.map((notif) => ({ ...notif, is_read: true })));

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('notificationUpdated'));
        }
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleOpenNotification = (notif: NotificationItem) => {
    setSelectedNotification(notif);
    if (!notif.is_read) {
      markAsRead(notif.id);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.is_read;
    return true;
  });

  const getLocalizedMessage = (notif: NotificationItem) => {
    if (isAr) {
      return notif.message_ar || notif.message || notif.message_en || '';
    }
    return notif.message_en || notif.message || notif.message_ar || '';
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString(isAr ? 'ar-EG' : 'en-US', {
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

  return (
    <div className="min-h-[85vh] py-6 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full space-y-4">
      {/* Top Header Card */}
      <div className="rounded-lg bg-[#0d1017] border border-zinc-800 p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative p-2.5 rounded-md bg-[#00c48c]/10 text-[#00c48c] border border-[#00c48c]/20">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 text-[9px] font-bold text-white items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                </span>
              )}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                {isAr ? 'مركز الإشعارات' : 'Notifications Center'}
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                {isAr
                  ? 'سجل التحديثات والتنبيهات الموجهة لحسابك'
                  : 'Updates, alerts, and announcements for your account'}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              disabled={isMarkingAll}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-semibold text-xs transition disabled:opacity-50"
            >
              <CheckCheck className="w-3.5 h-3.5 text-[#00c48c]" />
              <span>{isAr ? 'تحديد الكل كمقروء' : 'Mark all as read'}</span>
            </button>
          )}
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 pt-3 border-t border-zinc-800">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-[#00c48c] text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-white bg-zinc-900/60 border border-zinc-800'
            }`}
          >
            <span>{isAr ? 'جميع الإشعارات' : 'All Notifications'}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded ${
              activeTab === 'all' ? 'bg-zinc-950/20 text-zinc-950' : 'bg-zinc-800 text-zinc-300'
            }`}>
              {notifications.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('unread')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'unread'
                ? 'bg-amber-400 text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-white bg-zinc-900/60 border border-zinc-800'
            }`}
          >
            <span>{isAr ? 'غير المقروءة' : 'Unread'}</span>
            {unreadCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                activeTab === 'unread' ? 'bg-zinc-950/20 text-zinc-950' : 'bg-red-500 text-white'
              }`}>
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-lg bg-[#0d1017] border border-zinc-800">
          <div className="w-7 h-7 border-2 border-[#00c48c]/20 border-t-[#00c48c] rounded-full animate-spin mb-2.5" />
          <p className="text-zinc-400 text-xs font-medium">
            {isAr ? 'جاري تحميل الإشعارات...' : 'Loading notifications...'}
          </p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-lg bg-red-950/20 border border-red-500/20 text-center">
          <p className="text-red-400 text-xs font-semibold mb-2">{error}</p>
          <button
            onClick={fetchNotifications}
            className="px-3 py-1.5 rounded-md bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-bold transition"
          >
            {isAr ? 'إعادة المحاولة' : 'Try Again'}
          </button>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-lg bg-[#0d1017] border border-zinc-800 text-center">
          <div className="p-3 rounded-md bg-zinc-800/80 text-zinc-400 mb-3">
            <Inbox className="w-8 h-8 stroke-[1.5]" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">
            {activeTab === 'unread'
              ? (isAr ? 'لا توجد إشعارات غير مقروءة' : 'No unread notifications')
              : (isAr ? 'لا توجد إشعارات حالياً' : 'No notifications yet')}
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm">
            {activeTab === 'unread'
              ? (isAr ? 'لقد قمت بقراءة جميع الإشعارات. يمكنك مراجعة الأرشيف بالضغط على "جميع الإشعارات".' : 'You have opened and read all incoming notifications.')
              : (isAr ? 'سنقوم بإعلامك فور صدور أي تنبيهات أو تحديثات جديدة.' : 'We will notify you whenever there are important updates or alerts.')}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((notif) => {
            const isUnread = !notif.is_read;
            return (
              <div
                key={notif.id}
                onClick={() => handleOpenNotification(notif)}
                className={`group rounded-lg p-3.5 sm:p-4 transition cursor-pointer border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isUnread
                    ? 'bg-[#121622] border-[#00c48c]/40 hover:border-[#00c48c]/80'
                    : 'bg-[#0d1017] hover:bg-[#11151f] border-zinc-800/80 opacity-85 hover:opacity-100'
                }`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Thumbnail / Icon */}
                  {notif.image_url ? (
                    <div className="relative w-12 h-12 rounded-md overflow-hidden bg-zinc-900 border border-zinc-800 flex-shrink-0">
                      <img
                        src={`${API_URL}${notif.image_url}`}
                        alt="Thumbnail"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      className={`w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 border ${
                        isUnread
                          ? 'bg-[#00c48c]/10 border-[#00c48c]/30 text-[#00c48c]'
                          : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400'
                      }`}
                    >
                      <Bell className="w-4 h-4" />
                    </div>
                  )}

                  {/* Text Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isUnread && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-[#00c48c] text-zinc-950 uppercase">
                          {isAr ? 'جديد' : 'NEW'}
                        </span>
                      )}
                      <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        {formatDate(notif.created_at)}
                      </span>
                    </div>

                    <p className={`text-xs sm:text-sm leading-relaxed ${
                      isUnread ? 'text-white font-semibold' : 'text-zinc-300 font-normal'
                    }`}>
                      {getLocalizedMessage(notif)}
                    </p>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-1.5 self-end sm:self-center flex-shrink-0">
                  {isUnread ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notif.id);
                      }}
                      className="px-2.5 py-1 rounded-md bg-[#00c48c]/10 hover:bg-[#00c48c]/20 text-[#00c48c] border border-[#00c48c]/30 text-xs font-semibold transition flex items-center gap-1"
                      title={isAr ? 'تحديد كمقروء' : 'Mark as read'}
                    >
                      <Check className="w-3 h-3" />
                      <span>{isAr ? 'تحديد كمقروء' : 'Mark Read'}</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-zinc-500 font-medium px-2 py-0.5 rounded bg-zinc-800/40 border border-zinc-800 flex items-center gap-1">
                      <CheckCheck className="w-3 h-3 text-zinc-400" />
                      {isAr ? 'مقروء' : 'Read'}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenNotification(notif);
                    }}
                    className="p-1.5 rounded-md bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 hover:text-white transition"
                    title={isAr ? 'عرض التفاصيل' : 'View details'}
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div 
            className="relative w-full max-w-lg rounded-lg bg-[#0d1017] border border-zinc-800 overflow-hidden p-5 sm:p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-[#00c48c]/10 text-[#00c48c] border border-[#00c48c]/20">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {isAr ? 'تفاصيل الإشعار' : 'Notification Details'}
                  </h3>
                  <p className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3 text-[#00c48c]" />
                    {formatDate(selectedNotification.created_at)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedNotification(null)}
                className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Image */}
            {selectedNotification.image_url && (
              <div className="rounded-md overflow-hidden bg-zinc-900 border border-zinc-800 max-h-64 flex items-center justify-center">
                <img
                  src={`${API_URL}${selectedNotification.image_url}`}
                  alt="Notification preview"
                  className="w-full h-auto object-contain max-h-64 rounded"
                />
              </div>
            )}

            {/* Modal Message */}
            <div className="p-3 rounded-md bg-zinc-900/60 border border-zinc-800">
              <p className="text-white text-xs sm:text-sm leading-relaxed whitespace-pre-line font-medium">
                {getLocalizedMessage(selectedNotification)}
              </p>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-zinc-400 flex items-center gap-1">
                <CheckCheck className="w-3.5 h-3.5 text-[#00c48c]" />
                {isAr ? 'تم تعليم الإشعار كمقروء' : 'Marked as read'}
              </span>

              <button
                onClick={() => setSelectedNotification(null)}
                className="px-4 py-1.5 rounded-md bg-[#00c48c] hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
