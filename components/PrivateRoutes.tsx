"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useMyInfo } from "@/utils/user-info/getUserInfo";

const PrivateRoutes: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const pathName = usePathname();
  const router = useRouter();
  const [isAllowed, setIsAllowed] = useState(false);
  const [isErrorState, setIsErrorState] = useState(false);

  const { refetch, data, isError, isLoading, isFetched, isSuccess } =
    useMyInfo(false);

  const forceLogout = () => {
    localStorage.removeItem("a");
    setIsAllowed(false);
    setIsErrorState(true);
    if (pathName !== "/signin") {
      window.location.replace("/signin");
    }
  };

  const verify = async () => {
    // Safety timeout: if API doesn't respond in 5s, force logout
    const timeout = setTimeout(() => {
      if (!isAllowed) forceLogout();
    }, 5000);

    try {
      const result: any = await refetch();
      clearTimeout(timeout);
      
      if (result.data && !result.isError) {
        const userData = result.data?.userData;
        global.userData = userData;
        
        if (pathName.startsWith("/admin") || pathName.startsWith("/manage")) {
          if (result.data?.userRole === "admin" || result.data?.userRole === "manager" || result.data?.userRole === "supervisor" || result.data?.userRole === "employee") {
            setIsAllowed(true);
          } else {
            router.push("/dashboard");
            setIsAllowed(false);
          }
        } else {
          setIsAllowed(true);
        }
      } else {
        forceLogout();
      }
    } catch (e) {
      clearTimeout(timeout);
      forceLogout();
    }
  };

  useEffect(() => {
    if (typeof localStorage !== "undefined") {
      const token = localStorage.getItem("a");
      if (token) {
        verify();
      } else {
        if (pathName !== "/signin") {
          window.location.replace("/signin");
        }
      }
    }
  }, [pathName]);

  if (isAllowed) return <>{children}</>;

  return (
    <div className="w-full h-screen bg-[#000000] flex flex-col items-center justify-center text-white space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      <p className="text-lg font-medium">
        {isErrorState ? "Redirecting to login..." : "Verifying session..."}
      </p>
    </div>
  );
};

export default PrivateRoutes;
