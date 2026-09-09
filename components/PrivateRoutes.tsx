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
    if (typeof window !== "undefined") {
      localStorage.removeItem("a");
      localStorage.removeItem("token");
      localStorage.removeItem("userRole");
      if ((global as any).userData) {
        delete (global as any).userData;
      }
      if ((global as any).userRole) {
        delete (global as any).userRole;
      }
    }
    isSessionVerifiedGlobally = false;
    setIsAllowed(false);
    setIsErrorState(true);
    if (typeof window !== "undefined" && window.location.pathname !== "/signin") {
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
      const token = typeof window !== "undefined" ? localStorage.getItem("a") : null;
      if (!token) {
        forceLogout();
        return;
      }

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
      } else {
        const status = result.error?.response?.status;
        const errorData = typeof result.error?.response?.data === 'string'
          ? result.error.response.data
          : JSON.stringify(result.error?.response?.data || '');

        const isAuthError =
          status === 401 ||
          status === 403 ||
          (status === 400 && (errorData.includes("token") || errorData.includes("unauthorized") || errorData.includes("bad request: token required")));

        if (isAuthError) {
          // Explicit unauthorized response -> force logout immediately
          forceLogout();
        } else if (typeof window !== "undefined" && localStorage.getItem("a") && !result.error?.response) {
          // ONLY treat as temporary offline if there was NO server response (network down)
          setIsAllowed(true);
        } else {
          // Any other explicit failure -> log out cleanly
          forceLogout();
        }
      }
    } catch (e: any) {
      const status = e?.response?.status;
      const errorData = typeof e?.response?.data === 'string' ? e.response.data : '';
      if (status === 401 || status === 403 || (status === 400 && errorData.includes("token"))) {
        forceLogout();
      } else if (typeof window !== "undefined" && localStorage.getItem("a") && !e?.response) {
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
      forceLogout();
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

  // Safety fallback: if verification takes too long, re-evaluate token
  useEffect(() => {
    if (isAllowed) return;
    const timeout = setTimeout(() => {
      if (!isSessionVerifiedGlobally && !isAllowed) {
        const token = typeof window !== "undefined" ? localStorage.getItem("a") : null;
        if (!token) {
          forceLogout();
        }
      }
    }, 4000);
    return () => clearTimeout(timeout);
  }, [isAllowed]);

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
