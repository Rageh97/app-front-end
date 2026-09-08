"use client";

import React from "react";
import PrivateRoutes from "@/components/PrivateRoutes";

export default function AILayout({ children }: { children: React.ReactNode }) {
  return (
    <PrivateRoutes>
      {children}
    </PrivateRoutes>
  );
}
