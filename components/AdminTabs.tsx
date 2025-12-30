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
      const res = await axios.get("api/chat/admin/chat-users");
      const users = res.data || [];
      const totalUnread = users.reduce((sum: number, user: any) => sum + (user.unread_user_messages || ""), 0);
      setUnreadCount(totalUnread);
    } catch (e) {
      // noop
    }
  }, []);

  const getTabsByRole = () => {
    // Super admin (specific email) gets all tabs including releases
    if (data?.userData.email === "nouamanlamkadmxd@gmail.com") {
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
          label: t('admin.tools'),
          href: `/admin/tools`,
        },
        {
          label: t('admin.packs'),
          href: `/admin/packs`,
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
          label: t('admin.orders'),
          href: `/admin/orders`,
        },
        {
          label: t('admin.settings'),
          href: `/admin/setting`,
        },
        {
          label: t('admin.issues'),
          href: `/admin/issues`,
        },
        {
          label: t('admin.releases'),
          href: `/admin/releases`,
        },
        {
          label: t('admin.Media'),
          href: `/admin/media`,
        },
      ];
    }
    
    // Regular admin gets all tabs except releases
    if (data?.userRole === "admin") {
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
        // {
        //   label: t('admin.issues'),
        //   href: `/admin/issues`,
        // },
      ];
    }
    
    // Manager gets access to users, tools, packs, orders, issues, and can add supervisors and employees
    if (data?.userRole === "manager") {
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
        // {
        //   label: t('admin.issues'),
        //   href: `/admin/issues`,
        // },
      ];
    }
    
    // Supervisor gets access to tools, packs, orders, overview, and questions
    if (data?.userRole === "supervisor") {
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
        // {
        //   label: t('admin.questions'),
        //   href: `/admin/questions`,
        // },
      ];
    }
    
    // Employee gets access to overview, users, orders, and questions
    if (data?.userRole === "employee") {
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
        // {
        //   label: t('admin.questions'),
        //   href: `/admin/questions`,
        // },
      ];
    }
    
    // Default tabs (fallback) - should not normally be reached
    // Always include overview for any admin user
    return [
      {
        label: t('admin.overview'),
        href: `/admin/overview`,
      },
    ];
  };

  useEffect(() => {
    if (data) {
      // Check if user has any admin role access
      const hasAdminAccess = ['admin', 'manager', 'supervisor', 'employee'].includes(data?.userRole || '');
      const isSuperAdmin = data?.userData.email === "nouamanlamkadmxd@gmail.com";
      
      // If user doesn't have admin access and tries to access admin routes, redirect to dashboard
      if (!hasAdminAccess && !isSuperAdmin && pathname.startsWith('/admin')) {
        router.push('/dashboard');
        return;
      }
      
      // Always allow access to overview page for admin users
      if (pathname === '/admin/overview' && (hasAdminAccess || isSuperAdmin)) {
        return; // Allow access to overview
      }
      
      // If user has admin access, check if the specific path is allowed for their role
      if (hasAdminAccess || isSuperAdmin) {
        const allowedTabs = getTabsByRole();
        const isPathAllowed = allowedTabs.some(tab => pathname.startsWith(tab.href));

        if (!isPathAllowed && pathname.startsWith('/admin')) {
          router.push('/dashboard');
        }
      }
    }
  }, [data, pathname, router]);

  // Fetch unread count for admin users
  useEffect(() => {
    if (data) {
      const hasAdminAccess = ['admin', 'manager', 'supervisor', 'employee'].includes(data?.userRole || '');
      const isSuperAdmin = data?.userData.email === "nouamanlamkadmxd@gmail.com";
      
      if (hasAdminAccess || isSuperAdmin) {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 8000); // Poll every 8 seconds
        return () => clearInterval(interval);
      }
    }
  }, [data, fetchUnreadCount]);
  
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
