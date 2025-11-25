"use client";
import { useRouter } from "next/navigation";

const logout = () => {
  const router = useRouter();
  localStorage.clear();
  sessionStorage.clear(); // Clear sessionStorage as well
  
  router.push("/");
};

export default logout;
