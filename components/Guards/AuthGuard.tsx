"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMyInfo } from "@/utils/user-info/getUserInfo";
import LoadingPage from "@/components/LoadingPage";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children, requireAdmin = false }) => {
  const router = useRouter();
  const { data, isLoading } = useMyInfo(false);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!data) {
        router.push("/signin");
        return;
      }

      // Check for admin role if required
      if (requireAdmin && data.userRole !== "admin") {
        router.push("/dashboard");
        return;
      }
      
      setIsAllowed(true);
    }
  }, [data, isLoading, requireAdmin, router]);

  if (isLoading || !isAllowed) {
    return <LoadingPage />;
  }

  return <>{children}</>;
};

export default AuthGuard;
