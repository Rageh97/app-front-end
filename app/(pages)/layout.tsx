"use client";
import { ReactNode, useEffect, useState } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import PrivateRoutes from "@/components/PrivateRoutes";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import Footer from "@/components/Footer"
import ClientReviews from "@/components/ClientReviews"
import MostQuestions from "@/components/MostQuestions"
import { Link } from "lucide-react";
import ChatWidget from "@/components/ChatWidget";
import { Toaster } from "react-hot-toast";
import { useTranslation } from 'react-i18next';
import { I18nextProvider } from 'react-i18next';

export default function RootLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { i18n } = useTranslation();

  let ws: any = null;
  const connectWebDocket = async () => {
    async function connectWebSocket() {
      ws = new WebSocket("wss://api.nexustoolz.com");
      // ws = new WebSocket("ws://localhost:4560");

      await FingerprintJS.load()
        .then((fp) => fp.get())
        .then((result) => {
          global.clientId1328 = result.visitorId;
          localStorage.setItem("clientId1328", result.visitorId);
        });

      ws.onopen = function () {
        if (ws) {
          let interval = setInterval(() => {
            if (global?.userData) {
              let dataToSend: any = null;

              try {
                dataToSend = JSON.stringify([
                  {
                    userData: {
                      fullName:
                        global?.userData?.firstName +
                        " " +
                        global?.userData?.lastName,
                      email: global?.userData?.email,
                      userId: global?.userData?.userId,
                      activeTool: global?.activeTool
                        ? global?.activeTool
                        : "none",
                    },
                  },
                ]);

                // clearInterval(interval);
              } catch (error) {
                dataToSend = null;
                // clearInterval(interval);
              }

              if (dataToSend && ws && ws.readyState === WebSocket.OPEN) {
                try {
                  ws.send(dataToSend);
                } catch (sendError) {
                  // Ignore send error when connection drops
                }
              }
            }
          }, 5000);
        }
      };
    }

    if (!global.isInterval) {
      setInterval(() => {
        if (!ws || ws.readyState === WebSocket.CLOSED) {
          connectWebSocket();
        }
      }, 2000);
      global.isInterval = true;
    }

    connectWebSocket();
  };

  useEffect(() => {
    if (!global.checkOnline) {
      connectWebDocket();
      global.checkOnline = true;
    }

    const handleExtMessage = (event: MessageEvent) => {
      let msg = event.data;
      if (typeof msg === 'string') { try { msg = JSON.parse(msg); } catch (e) {} }
      if (
        (msg && msg.type === 'EXTENSION_CHECK') ||
        (msg?.type === 'FROM_EXTENSION' && msg?.data?.m === "Hello from the extension!") ||
        (msg?.type === 'NT_NEW_EXT_DETECTED')
      ) {
        (globalThis as any).NT_EXT_DETECTED = true;
        try { localStorage.setItem('NT_EXT_DETECTED', 'true'); } catch (e) {}
      }
    };
    window.addEventListener('message', handleExtMessage);
    return () => window.removeEventListener('message', handleExtMessage);
  }, []);
// ,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
const [lang, setLang] = useState("ar");
const [dir, setDir] = useState<"rtl" | "ltr">("rtl");

useEffect(() => {
  const storedLang = localStorage.getItem("i18nextLng") || "ar";
  const isRTL = !storedLang.startsWith("en");

  document.documentElement.lang = storedLang;
  document.documentElement.dir = isRTL ? "rtl" : "ltr";

  setLang(storedLang);
  setDir(isRTL ? "rtl" : "ltr");
}, []);
  return (
    <I18nextProvider i18n={i18n}>
      <Toaster 
        position="top-right" 
        reverseOrder={false} 
        containerStyle={{
          zIndex: 999999,
        }}
      />
      <PrivateRoutes>
        <div className="flex flex-col h-screen overflow-hidden">
          {/* <!-- ===== Header Start ===== --> */}
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          {/* <!-- ===== Header End ===== --> */}

          <div className="flex flex-1 overflow-hidden relative">
            {/* <!-- ===== Sidebar Start ===== --> */}
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            {/* <!-- ===== Sidebar End ===== --> */}

            {/* <!-- ===== Content Area Start ===== --> */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar md:ms-40 xl:ms-44 dark:ms-0 transition-all duration-300">
              <div className="px-2 sm:px-4 md:px-6 lg:px-8"> 
                {children}
                <div className="-mx-2 sm:-mx-4 md:-mx-6 lg:-mx-8">
                  <div className="mx-auto max-w-[1460px] px-4 sm:px-6 lg:px-8">
                    <ClientReviews/>
                    <MostQuestions/>
                  </div>
                </div>
              </div>
              <Footer/>
            </main>
            {/* <!-- ===== Content Area End ===== --> */}
            <ChatWidget />
          </div>
        </div>
      </PrivateRoutes>
    </I18nextProvider>
  );
}
