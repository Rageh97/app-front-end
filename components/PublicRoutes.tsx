"use client";
import { useEffect, useState } from "react";
import { usePathname, redirect } from "next/navigation";

const PrivateRoutes: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const pathName = usePathname();
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    if (typeof localStorage !== "undefined") {
      if (!localStorage.getItem("a")) {
        setIsAllowed(true);
      } else {
        redirect("/dashboard");
      }
    }
  }, [pathName]);

  return isAllowed ? children : <div className="w-full h-[100vh] bg-[#000000]"></div>;;
};

export default PrivateRoutes;
