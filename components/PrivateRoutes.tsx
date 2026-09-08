"use client";
import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useMyInfo } from "@/utils/user-info/getUserInfo";

// Global cache to remember that session has already been verified in this browser lifecycle
let isSessionVerifiedGlobally = false;

const PrivateRoutes: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const pathName = usePathname();
  const router = useRouter();
  
  // Optimistically allow if already verified or token exists in localStorage
  const [isAllowed, setIsAllowed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("a");
      return !!token && isSessionVerifiedGlobally;
    }
    return false;
  });
  const [isErrorState, setIsErrorState] = useState(false);
  const verifyingRef = useRef(false);

  const { refetch } = useMyInfo(false);

  const forceLogout = () => {
    localStorage.removeItem("a");
    isSessionVerifiedGlobally = false;
    setIsAllowed(false);
    setIsErrorState(true);
    if (pathName !== "/signin" && typeof window !== "undefined") {
      window.location.replace("/signin");
    }
  };

  const checkRoleAndAccess = (userData: any, role?: string) => {
    const effectiveRole = role || userData?.userRole || userData?.role || (global as any)?.userRole || (global as any)?.userData?.userRole;
    if (pathName.startsWith("/admin") || pathName.startsWith("/manage")) {
      const allowedRoles = ["admin", "manager", "supervisor", "employee"];
      if (allowedRoles.includes(effectiveRole)) {
        setIsAllowed(true);
      } else if (effectiveRole) {
        router.push("/dashboard");
        setIsAllowed(false);
      } else {
        setIsAllowed(true);
      }
    } else {
      setIsAllowed(true);
    }
  };

  const verify = async () => {
    if (verifyingRef.current) return;
    verifyingRef.current = true;

    try {
      // If we already have user role globally and session was verified, check role immediately
      if ((global as any).userRole && isSessionVerifiedGlobally) {
        checkRoleAndAccess(global.userData, (global as any).userRole);
      }

      const result: any = await refetch();
      
      if (result.data && !result.isError) {
        const userData = result.data?.userData || result.data;
        const userRole = result.data?.userRole || userData?.userRole || result.data?.role || userData?.role;
        global.userData = userData;
        (global as any).userRole = userRole;
        isSessionVerifiedGlobally = true;
        
        checkRoleAndAccess(userData, userRole);
      } else if (result.error?.response?.status === 401 || result.error?.response?.status === 403) {
        // Only force logout on explicit 401 / 403 unauthorized responses
        forceLogout();
      } else {
        // In case of network glitch or timeout, if token exists, do NOT kick user out
        if (typeof window !== "undefined" && localStorage.getItem("a")) {
          setIsAllowed(true);
        } else {
          forceLogout();
        }
      }
    } catch (e: any) {
      if (e?.response?.status === 401 || e?.response?.status === 403) {
        forceLogout();
      } else if (typeof window !== "undefined" && localStorage.getItem("a")) {
        // Keep user logged in during network glitches
        setIsAllowed(true);
      } else {
        forceLogout();
      }
    } finally {
      verifyingRef.current = false;
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("a");
    if (!token) {
      if (pathName !== "/signin") {
        window.location.replace("/signin");
      }
      return;
    }

    // If session was already verified and token exists, immediately allow UI rendering
    if (isSessionVerifiedGlobally) {
      setIsAllowed(true);
      // If navigating to admin/manage routes, verify role
      if (pathName.startsWith("/admin") || pathName.startsWith("/manage")) {
        verify();
      }
    } else {
      // First time cold load: verify session with backend
      verify();
    }
  }, [pathName]);

  if (isAllowed) return <>{children}</>;

  return (
    <div className="w-full h-screen bg-[#000000] flex flex-col items-center justify-center text-white space-y-4">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent"></div>
      <p className="text-sm font-medium text-gray-400">
        {isErrorState ? "جاري التحويل لتسجيل الدخول..." : "جاري التحقق من الجلسة..."}
      </p>
    </div>
  );
};

export default PrivateRoutes;
