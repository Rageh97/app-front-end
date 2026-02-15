"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Bell, Check, CheckCheck, Eye, Filter, RefreshCw } from "lucide-react";

interface AdminNotification {
  id: number;
  action_type: string;
  performed_by_name: string;
  performed_by_role: string;
  target_name?: string;
  affected_user_name?: string;
  message_en: string;
  message_ar: string;
  is_read: boolean;
  created_at: string;
  additional_details?: any;
}

interface AdminNotificationsResponse {
  notifications: AdminNotification[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

const AdminNotifications: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Debug logging
  
  

  const fetchNotifications = async (page = 1, unreadOnly = false) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("a");
      
      if (!token) return;

      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const url = `${backendUrl}/api/admin/admin-notifications?page=${page}&limit=20&unreadOnly=${unreadOnly}`;
      
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: token,
          "user-client": global.clientId1328,
        },
      });

      
            if (response.ok) {
        const data: AdminNotificationsResponse = await response.json();
        
        setNotifications(data.notifications || []);
        setCurrentPage(data.currentPage);
        setTotalPages(data.totalPages);
      } else {
        const errorText = await response.text();
        console.error("Error response:", errorText);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem("a");
      if (!token) return;

      const backendUrl = process.env.NEXT_PUBLIC_API_URL ;
      const response = await fetch(`${backendUrl}/api/admin/unread-notifications-count`, {
        method: "GET",
        headers: {
          Authorization: token,
          "user-client": global.clientId1328,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const markAsRead = async (notificationIds: number[]) => {
    try {
      const token = localStorage.getItem("a");
      if (!token) return;

      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/admin/mark-notifications-read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
          "user-client": global.clientId1328,
        },
        body: JSON.stringify({ notificationIds }),
      });

      if (response.ok) {
        // Update local state
        setNotifications((prev) =>
          prev.map((notif) =>
            notificationIds.includes(notif.id)
              ? { ...notif, is_read: true }
              : notif
          )
        );
        fetchUnreadCount();
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications
      .filter((notif) => !notif.is_read)
      .map((notif) => notif.id);
    
    if (unreadIds.length > 0) {
      await markAsRead(unreadIds);
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'order_accepted':
      case 'device_order_accepted':
        return <CheckCheck className="h-4 w-4 text-[#00c48c]" />;
      case 'order_denied':
        return <span className="h-4 w-4 text-red">✕</span>;
      case 'tool_created':
      case 'pack_created':
        return <span className="h-4 w-4 text-[#00c48c]">+</span>;
      case 'tool_updated':
      case 'pack_updated':
        return <span className="h-4 w-4 text-[#0496c7]">↻</span>;
      case 'tool_deleted':
      case 'pack_deleted':
        return <span className="h-4 w-4 text-red">🗑</span>;
      case 'user_role_changed':
        return <span className="h-4 w-4 text-orange">👤</span>;
      case 'issue_updated':
        return <span className="h-4 w-4 text-red">⚠</span>;
      default:
        return <Bell className="h-4 w-4 text-white" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(i18n.language === 'ar' ? 'ar-EG' : 'en-US');
  };

  useEffect(() => {
    fetchNotifications(1, showUnreadOnly);
    fetchUnreadCount();
  }, [showUnreadOnly]);

  useEffect(() => {
    // Refresh notifications every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount();
      if (isOpen) {
        fetchNotifications(currentPage, showUnreadOnly);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [currentPage, showUnreadOnly, isOpen]);

  return (
    <div className="relative">
      {/* Debug info */}
      <div className="text-xs text-red-500 hidden">AdminNotifications Component Loaded</div>
      
      {/* Notification Bell */}
      <button
        onClick={() => {
         
          setIsOpen(!isOpen);
          if (!isOpen) {
            fetchNotifications(1, showUnreadOnly);
          }
        }}
        className={`relative p-2 ${i18n.language === 'ar' ? 'mt-10' : 'mt-0'}`}
      >
        <Bell size={32} className="text-[#ff7702]" fill="#00c48" />
        {unreadCount > 0 && (
          <span className="absolute -top-0 -right-1 bg-red text-white p-3 text-xs rounded-full h-5 w-5 text-center flex items-center justify-center">
            {unreadCount > 10 ? '10+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className={`absolute ${i18n.language === 'ar' ? 'left-0 mt-3' : 'right-0 mt-3'}  w-80 lg:w-96 bg-[#190237] border-1 border-orange  rounded-lg shadow-lg z-50`}>
          {/* Header */}
          <div className="p-4 border-b border-[#00c48c] ">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#00c48c]">
                {t('admin.notifications')}
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                  className={`p-1 rounded ${
                    showUnreadOnly
                      ? ' text-[#00c48c] '
                      : ' text-orange'
                  }`}
                  title={t('admin.showUnreadOnly')}
                >
                  <Filter className="h-4 w-4" />
                </button>
                <button
                  onClick={markAllAsRead}
                  className="p-1 text-[#00c48c] "
                  title={t('admin.markAllRead')}
                >
                  <CheckCheck className="h-4 w-4" />
                </button>
                {/* <button
                  onClick={() => fetchNotifications(currentPage, showUnreadOnly)}
                  className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  title={t('admin.refresh')}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </button> */}
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 ">
                {t('common.loading')}...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-red ">
                {showUnreadOnly ? t('admin.noUnreadNotifications') : t('admin.noNotifications')}
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-[#00c48c]   cursor-pointer ${
                    !notification.is_read ? ' ' : ''
                  }`}
                  onClick={() => !notification.is_read && markAsRead([notification.id])}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mx-2">
                      {getActionIcon(notification.action_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/80">
                        {i18n.language === 'ar' ? notification.message_ar : notification.message_en}
                      </p>
                      <p className="text-xs text-orange mt-1">
                        {formatDate(notification.created_at)}
                      </p>
                      {notification.additional_details && (
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {notification.additional_details.orderType && (
                            <span className="text-[#00c48c]">Type: <span className="text-red">{notification.additional_details.orderType}</span> • </span>
                          )}
                          {notification.additional_details.amount && (
                            <span className="text-[#00c48c]">Amount: <span className="text-red">${notification.additional_details.amount}</span></span>
                          )}
                        </div>
                      )}
                    </div>
                    {!notification.is_read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    if (currentPage > 1) {
                      fetchNotifications(currentPage - 1, showUnreadOnly);
                    }
                  }}
                  disabled={currentPage <= 1}
                  className="px-3 py-1 text-sm text-orange rounded disabled:opacity-50"
                >
                  {t('common.previous')}
                </button>
                <span className="text-sm text-[#00c48c]">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => {
                    if (currentPage < totalPages) {
                      fetchNotifications(currentPage + 1, showUnreadOnly);
                    }
                  }}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-1 text-sm text-orange rounded disabled:opacity-50"
                >
                  {t('common.next')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;
