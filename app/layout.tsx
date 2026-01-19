"use client";
import "./globals.css";
import "./data-tables-css.css";
import Providers from "@/components/Providers";
import { ReactNode, useEffect, useState } from "react";
import Head from "next/head";
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';

export default function RootLayout({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  
  // Set mounted to true once component is mounted (client-side only)
  useEffect(() => {
    setMounted(true);
    
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.shiftKey && e.key === 'J') ||
        (e.ctrlKey && e.key === 'U') ||
        (e.ctrlKey && e.key === 'u')
      ) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Use default language until component is mounted
  const language = mounted ? i18n.language : 'en';
  const direction = mounted ? (i18n.language === 'ar' ? 'rtl' : 'ltr') : 'ltr';

  return (
    <html lang={language} dir={direction}>
      <Head>
        <title>Nexus Toolz</title>
      </Head>
      <body>
        <I18nextProvider i18n={i18n}>
          <Providers>{children}</Providers>
        </I18nextProvider>
      </body>
    </html>
  );
}
