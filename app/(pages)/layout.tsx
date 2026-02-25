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
      <div>
        <PrivateRoutes>

        {/* <div className=""> */}
          <div className="flex h-screen overflow-hidden ">
            {/* <!-- ===== Sidebar Start ===== --> */}
            {/* <!-- ===== Sidebar End ===== --> */}

            {/* <!-- ===== Content Area Start ===== --> */}
            <div className=" relative flex flex-1 flex-col  overflow-x-hidden">
              {/* <!-- ===== Header Start ===== --> */}
              <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
              {/* <!-- ===== Header End ===== --> */}

              {/* <!-- ===== Main Content Start ===== --> */}
              {/* <div className="lg:ml-60 ml-20"> */}
                <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
              <main>
                <div className="mx-auto px-0 sm:px-5 md:px-10 lg:px-15 sm:ml-5 md:ml-10 lg:ml-15 ml-0 "> 

                  {children}
                <MostQuestions/>
                <ClientReviews/>
                </div>
              </main>
                  <Footer/>
              {/* </div> */}
              {/* <!-- ===== Main Content End ===== --> */}
            {/* </div> */}
            {/* <!-- ===== Content Area End ===== --> */}
            <ChatWidget />
          </div>
        </div>
      </PrivateRoutes>
    </div>
    </I18nextProvider>
  );
}
