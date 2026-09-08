"use client";

import React, { FunctionComponent, PropsWithChildren, useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";
import ModalProvider from "@/components/providers/ModalProvider";
import MaintenanceGuard from "@/components/Maintenance/MaintenanceGuard";
import { useTranslation } from 'react-i18next';
import useColorMode from "@/hooks/useColorMode";

const Providers: FunctionComponent<PropsWithChildren> = ({ children }) => {
  useColorMode();

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // With SSR, we usually want to set some default staleTime
            // above 0 to avoid re-fetching immediately on the client
            staleTime: 60 * 1000,
          },
        },
      })
  );

  const { i18n } = useTranslation();
  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  return (
    <QueryClientProvider client={queryClient}>
      <ModalProvider>
        <MaintenanceGuard>
          {children}
        </MaintenanceGuard>
      </ModalProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};

export default Providers;
