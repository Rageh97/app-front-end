"use client";

import React, { FunctionComponent, useEffect, useState, useCallback } from "react";
import PageTabs from "@/components/PageTabs";
import AdminNotifications from "@/components/AdminNotifications";
import { useMyInfo } from "@/utils/user-info/getUserInfo";
import { useTranslation } from "react-i18next";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import axios from "@/utils/api";

const AdminTabs: FunctionComponent = () => {
  const { data } = useMyInfo();
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await axios.get("api/chat/admin/unread-count");
      if (typeof res.data?.unread_count === "number") {
        setUnreadCount(res.data.unread_count);
      } else {
        const users = Array.isArray(res.data) ? res.data : (res.data?.users || []);
        const totalUnread = typeof res.data?.totalUnread === "number"
          ? res.data.totalUnread
          : users.reduce((sum: number, user: any) => sum + (Number(user.unread_user_messages) || 0), 0);
        setUnreadCount(totalUnread);
      }
    } catch (e) {
      // noop
    }
  }, []);

  const userRole = data?.userRole || data?.userData?.userRole || (global as any)?.userRole || (global as any)?.userData?.userRole || "admin";
  const isSuperAdmin = data?.userData?.email === "nouamanlamkadmxd@gmail.com";

  const getTabsByRole = () => {
    // Super admin or regular admin gets all tabs
    if (isSuperAdmin || userRole === "admin" || !userRole) {
      return [
        {
          label: t('admin.overview'),
          href: `/admin/overview`,
        },
        {
          label: t('chat.Chat'),
          href: `/admin/chat`,
          badge: unreadCount,
        },
        {
          label: t('admin.users'),
          href: `/admin/users`,
        },
        {
          label: t('admin.directActivation'),
          href: `/admin/direct-activation`,
        },
        {
          label: t('admin.tools'),
          href: `/admin/tools`,
        },
        {
          label: t('admin.packs'),
          href: `/admin/packs`,
        },
        {
          label: t('admin.orders'),
          href: `/admin/orders`,
        },
        {
          label: t('admin.settings'),
          href: `/admin/setting`,
        },
        {
          label: t('admin.questions'),
          href: `/admin/questions`,
        },
        {
          label: t('admin.reviews'),
          href: `/admin/reviews`,
        },
        {
          label: t('credits.creditTab'),
          href: `/admin/credits`,
        },
        {
          label: t('admin.addVideo'),
          href: `/admin/videos`,
        },
        {
          label: t('admin.ManageUsers'),
          href: `/admin/manage-users`,
        },
        {
          label: t('admin.Media'),
          href: `/admin/media`,
        },
        {
          label: t('fonts.adminTab'),
          href: `/admin/fonts`,
        },
        {
          label: 'الكوبونات',
          href: `/admin/coupons`,
        },
        ...(isSuperAdmin ? [{ label: t('admin.releases'), href: `/admin/releases` }] : []),
      ];
    }
    
    // Manager gets access to users, tools, packs, orders, issues, and can add supervisors and employees
    if (userRole === "manager") {
      return [
        {
          label: t('admin.overview'),
          href: `/admin/overview`,
        },
        {
          label: 'Chat',
          href: `/admin/chat`,
          badge: unreadCount,
        },
        {
          label: t('admin.users'),
          href: `/admin/users`,
        },
        {
          label: t('admin.directActivation'),
          href: `/admin/direct-activation`,
        },
        {
          label: t('admin.tools'),
          href: `/admin/tools`,
        },
        {
          label: t('admin.packs'),
          href: `/admin/packs`,
        },
        {
          label: t('admin.orders'),
          href: `/admin/orders`,
        },
        {
          label: t('admin.settings'),
          href: `/admin/setting`,
        },
        {
          label: t('admin.questions'),
          href: `/admin/questions`,
        },
        {
          label: t('admin.reviews'),
          href: `/admin/reviews`,
        },
        {
          label: t('admin.addVideo'),
          href: `/admin/videos`,
        },
        {
          label: t('admin.Media'),
          href: `/admin/media`,
        },
        {
          label: 'الكوبونات',
          href: `/admin/coupons`,
        },
      ];
    }
    
    // Supervisor gets access to tools, packs, orders, overview, and questions
    if (userRole === "supervisor") {
      return [
        {
          label: t('admin.overview'),
          href: `/admin/overview`,
        },
        {
          label: 'Chat',
          href: `/admin/chat`,
          badge: unreadCount,
        },
        {
          label: t('admin.tools'),
          href: `/admin/tools`,
        },
        {
          label: t('admin.packs'),
          href: `/admin/packs`,
        },
        {
          label: t('admin.orders'),
          href: `/admin/orders`,
        },
      ];
    }
    
    // Employee gets access to overview, users, orders, and questions
    if (userRole === "employee") {
      return [
        {
          label: t('admin.overview'),
          href: `/admin/overview`,
        },
        {
          label: 'Chat',
          href: `/admin/chat`,
          badge: unreadCount,
        },
        {
          label: t('admin.users'),
          href: `/admin/users`,
        },
        {
          label: t('admin.orders'),
          href: `/admin/orders`,
        },
      ];
    }
    
    return [
      {
        label: t('admin.overview'),
        href: `/admin/overview`,
      },
    ];
  };

  // Fetch unread count for admin users
  useEffect(() => {
    const hasAdminAccess = ['admin', 'manager', 'supervisor', 'employee'].includes(userRole || '');
    
    if (hasAdminAccess || isSuperAdmin) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 8000); // Poll every 8 seconds
      return () => clearInterval(interval);
    }
  }, [userRole, isSuperAdmin, fetchUnreadCount]);
  
  const adminTabs = getTabsByRole();
  
  // Safety check: ensure overview is always included for admin users
  if (adminTabs.length > 0 && !adminTabs.some(tab => tab.href === '/admin/overview')) {
    adminTabs.unshift({
      label: t('admin.overview'),
      href: `/admin/overview`,
    });
  }

  return (
    <div className="flex  items-center ">
      <PageTabs
        backHref={`/dashboard`}
        tabs={adminTabs}
        title={t('admin.backToDashboard')}
      />
      {/* Only show notifications for admin and super admin */}
      <div>
        {data?.userRole === 'admin' && <AdminNotifications />}
      </div>
    </div>
  );
};

export default AdminTabs;
