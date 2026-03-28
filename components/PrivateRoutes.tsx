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

  const { refetch, data, isError, isLoading, isFetched, isSuccess } =
    useMyInfo(false);

  const verify = async () => {
    try {
      await refetch();
      
      if (data && isFetched && !isError && !isLoading && isSuccess) {
        global.userData = data?.userData;
        if (pathName.startsWith("/admin") || pathName.startsWith("/manage")) {
          if (data?.userRole === "admin" || data?.userRole === "manager" || data?.userRole === "supervisor" || data?.userRole === "employee") {
            setIsAllowed(true);
          } else {
            router.push("/dashboard");
            setIsAllowed(false);
          }
        } else {
          setIsAllowed(true);
        }
      } else {
        setIsAllowed(false);
        if (isError) {
          // If there's an error verifying info (e.g. 401 or invalid token), redirect to signin
          localStorage.removeItem("a");
          router.push("/signin");
        }
      }
    } catch (e) {
      setIsAllowed(false);
      localStorage.removeItem("a");
      router.push("/signin");
    }
  };

  useEffect(() => {
    if (typeof localStorage !== "undefined") {
      if (localStorage.getItem("a")) {
        verify();
      } else {
        router.push("/signin");
      }
    }
  }, [pathName, data]);

  return isAllowed ? children : <div className="w-full h-screen bg-[#000000]"></div>;
};

export default PrivateRoutes;
