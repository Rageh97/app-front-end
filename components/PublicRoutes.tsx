"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const PrivateRoutes: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const pathName = usePathname();
  const router = useRouter();
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    if (typeof localStorage !== "undefined") {
      if (!localStorage.getItem("a")) {
        setIsAllowed(true);
      } else {
        router.push("/dashboard");
      }
    }
  }, [pathName]);

  return isAllowed ? children : <div className="w-full h-[100vh] bg-[#000000]"></div>;;
};

export default PrivateRoutes;
