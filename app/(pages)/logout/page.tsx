"use client";
import { useRouter } from "next/navigation";

const logout = () => {
  const router = useRouter();
  localStorage.clear();
  sessionStorage.clear(); 
  document.cookie = "username=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
  router.push("/");
};

export default logout;
