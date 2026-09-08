"use client";

import React, { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import axios from "axios";
import { useMyInfo } from "@/utils/user-info/getUserInfo";
import MaintenancePage from "./MaintenancePage";
import { AlertTriangle, Power, X } from "lucide-react";
import toast from "react-hot-toast";

interface MaintenanceGuardProps {
  children: React.ReactNode;
}

export default function MaintenanceGuard({ children }: MaintenanceGuardProps) {
  const pathname = usePathname();
  const [token, setToken] = useState<string | null>(null);
  const [storedRole, setStoredRole] = useState<string | null>(null);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState<boolean>(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [isDismissedBanner, setIsDismissedBanner] = useState<boolean>(false);
  const [turningOff, setTurningOff] = useState<boolean>(false);

  // Sync token and storedRole from localStorage on client mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const currentToken = localStorage.getItem("a");
      const currentRole = localStorage.getItem("userRole");
      setToken(currentToken);
      setStoredRole(currentRole);
    }
  }, []);

  // Enable useMyInfo whenever token is present
  const { data: userInfo, isLoading: isLoadingUser } = useMyInfo(!!token);

  // Extract fetched role and cache it
  const fetchedRole =
    userInfo?.userRole ||
    userInfo?.role ||
    userInfo?.userData?.role ||
    userInfo?.userData?.userRole;

  useEffect(() => {
    if (fetchedRole && typeof window !== "undefined") {
      localStorage.setItem("userRole", fetchedRole);
      setStoredRole(fetchedRole);
      (global as any).userRole = fetchedRole;
    }
  }, [fetchedRole]);

  // Determine if user is Admin / Manager
  const effectiveRole =
    storedRole ||
    fetchedRole ||
    (global as any)?.userRole ||
    (global as any)?.userData?.userRole;

  const isAdmin =
    effectiveRole === "admin" ||
    effectiveRole === "manager" ||
    effectiveRole === "supervisor";

  const checkMaintenanceStatus = useCallback(async () => {
    setIsChecking(true);
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/settings/public/maintenance`,
        { timeout: 5000 }
      );
      if (res.data) {
        setIsMaintenanceMode(Boolean(res.data.maintenance_mode));
        setMaintenanceMessage(res.data.message || null);
      }
    } catch (err) {
      // If error, fallback to false
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    checkMaintenanceStatus();

    // Periodic check every 25 seconds
    const interval = setInterval(checkMaintenanceStatus, 25000);

    // Real-time event listener when admin toggles setting in dashboard
    const handleSettingsChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        if (customEvent.detail.key === "maintenance_mode") {
          setIsMaintenanceMode(
            customEvent.detail.value === true ||
            customEvent.detail.value === "true"
          );
        }
        if (customEvent.detail.key === "maintenance_message") {
          setMaintenanceMessage(customEvent.detail.value || null);
        }
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("settingsChanged", handleSettingsChange);
    }

    return () => {
      clearInterval(interval);
      if (typeof window !== "undefined") {
        window.removeEventListener("settingsChanged", handleSettingsChange);
      }
    };
  }, [checkMaintenanceStatus]);

  // Handler for admin to turn off maintenance directly from the alert banner
  const handleDisableMaintenance = async () => {
    setTurningOff(true);
    try {
      const currentToken = localStorage.getItem("a");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (currentToken) headers.Authorization = currentToken;
      const userClient =
        (global as any)?.clientId1328 ||
        (typeof window !== "undefined" ? localStorage.getItem("clientId1328") : "");
      if (userClient) headers["User-Client"] = userClient;

      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/settings/maintenance_mode`,
        { value: "false" },
        { headers }
      );

      setIsMaintenanceMode(false);
      toast.success("تم إيقاف وضع الصيانة بنجاح. المنصة متاحة الآن للجميع.");

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("settingsChanged", {
            detail: { key: "maintenance_mode", value: false },
          })
        );
      }
    } catch (error: any) {
      toast.error("فشل إيقاف وضع الصيانة. يرجى مراجعة الصلاحيات.");
    } finally {
      setTurningOff(false);
    }
  };

  // If maintenance is active:
  if (isMaintenanceMode) {
    // 1. NEVER block the official /signin page so Admin can always log in
    if (pathname === "/signin" || pathname?.startsWith("/signin")) {
      return <>{children}</>;
    }

    // 2. If token exists and we are verifying role on initial load, show brief neutral check without kicking out
    if (token && !isAdmin && !effectiveRole && isLoadingUser) {
      return (
        <div className="min-h-screen w-full bg-[#080b12] flex items-center justify-center text-white" dir="rtl">
          <div className="flex items-center gap-2.5 text-xs text-slate-400">
            <span className="h-3.5 w-3.5 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
            <span>جاري التحقق من صلاحيات الدخول...</span>
          </div>
        </div>
      );
    }

    // 3. If Admin: allow full access to all pages and show top indicator banner
    if (isAdmin) {
      return (
        <>
          {/* Admin Sticky Notice */}
          {!isDismissedBanner && (
            <div className="sticky top-0 z-[99999] flex items-center justify-between border-b border-amber-500/30 bg-[#161208] px-4 py-2 text-xs text-amber-300" dir="rtl">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span className="font-semibold">
                  وضع الصيانة مفعّل حالياً للمستخدمين (الموقع متاح للإدارة فقط)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDisableMaintenance}
                  disabled={turningOff}
                  className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500 px-2.5 py-1 text-xs font-bold text-black hover:bg-emerald-400 transition disabled:opacity-50"
                >
                  <Power className="h-3 w-3" />
                  <span>{turningOff ? "جاري الإيقاف..." : "تعطيل الصيانة"}</span>
                </button>
                <button
                  onClick={() => setIsDismissedBanner(true)}
                  className="p-1 text-amber-400/70 hover:text-amber-200 transition"
                  title="إخفاء الشريط"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
          {children}
        </>
      );
    }

    // 4. Regular user or guest: show Maintenance Page
    return (
      <MaintenancePage
        customMessage={maintenanceMessage}
        onRefreshCheck={checkMaintenanceStatus}
        isChecking={isChecking}
      />
    );
  }

  // Normal rendering
  return <>{children}</>;
}
