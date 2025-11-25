"use client";
import { useEffect, useState } from "react";
import { usePathname, redirect, useRouter } from "next/navigation";
import api from "@/utils/api";
import { useQuery } from "react-query";
import { useMyInfo } from "@/utils/user-info/getUserInfo";
// import { useIsActive } from "@/components/SecureWrapper";
import * as consts from "@/consts";
import LoadingPage from "./LoadingPage";

// const getPermissionByPathname = (pathname: string): Permission => {
//   if (pathname === "" || pathname === "/") {
//     return consts.DASHBOARD_VIEW;
//   }
//   if (pathname.startsWith("/dashboard")) {
//     return consts.DASHBOARD_VIEW;
//   }
//   if (pathname.startsWith("/clients")) {
//     return consts.CLIENT_VIEW;
//   }
//   if (pathname.startsWith("/employees")) {
//     return consts.EMPLOYEE_VIEW;
//   }
//   if (pathname.startsWith("/finances")) {
//     return consts.FINANCE_VIEW;
//   }
//   if (pathname.startsWith("/contacts")) {
//     return consts.CONTACTS_VIEW;
//   }
//   if (pathname.startsWith("/contracts")) {
//     return consts.CONTRACTS_VIEW;
//   }
//   if (pathname.startsWith("/tasks")) {
//     return consts.TASKS_VIEW;
//   }
//   if (pathname.startsWith("/conversations")) {
//     return consts.CONVERSATION_VIEW;
//   }
//   if (pathname.startsWith("/locations")) {
//     return consts.LOCATION_VIEW;
//   }
// };

const PrivateRoutes: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const pathName = usePathname();
  const router = useRouter();
  const [isAllowed, setIsAllowed] = useState(false);

  const { refetch, data, isError, isLoading, isFetched, isSuccess } =
    useMyInfo(false);

  const verify = async () => {
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
    }
  };

  useEffect(() => {
    if (typeof localStorage !== "undefined") {
      if (localStorage.getItem("a")) {
        verify();
      } else {
        redirect("/signin");
      }
    }
  }, [pathName, data]);

  return isAllowed ? children : <></>;
};

export default PrivateRoutes;
