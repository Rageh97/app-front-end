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

              if (dataToSend) {
                ws.send(dataToSend);
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
  }, []);
// ,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
const [lang, setLang] = useState("en");
const [dir, setDir] = useState<"rtl" | "ltr">("ltr");

useEffect(() => {
  const storedLang = localStorage.getItem("i18nextLng") || "en";
  const isRTL = storedLang.startsWith("ar");

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
            <main className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar md:ms-40 xl:ms-44">
              <div className="px-2 sm:px-4 md:px-6 lg:px-8"> 
                {children}
                <MostQuestions/>
                <ClientReviews/>
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
