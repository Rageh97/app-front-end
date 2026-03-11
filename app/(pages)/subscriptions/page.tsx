"use client";
import { FunctionComponent, useEffect, useState } from "react";
import { useMyInfo } from "@/utils/user-info/getUserInfo";
import LaunchCard from "@/components/LaunchCard";
import CloudLaunchCard from "@/components/CloudLaunchCard";
import axios from "axios";
import ToolErrorModal from "@/components/Modals/ToolErrorModal";
import ToolErrorExtention from "@/components/Modals/ToolErrorExtention";
import Panel from "@/components/Panel";
import { fullDateTimeFormat } from "@/utils/timeFormatting";
import { useModal } from "@/components/providers/ModalProvider";
import { getDangerActionConfirmationModal } from "@/components/Modals/DangerActionConfirmation";
import DataStatsThree from "@/components/DataStats/DataStatsThree";
import { Clock, ShipWheel, UserRound, AlertTriangle, Download, RefreshCw } from "lucide-react";
import { useTranslation } from 'react-i18next';

const Dashboard: FunctionComponent = () => {
  const { t } = useTranslation();
  const { data } = useMyInfo();

  const [activeApp, setActiveApp] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean | null>(null);
  const [toolsData, setToolsData] = useState<any[]>([]);

  const [openErrorEx, setIsOpenErrorEx] = useState<boolean>(false);

  const [openErrorModal, setIsOpenErrorModal] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>(null);


  const [canLaunch, setCanLaunch] = useState<boolean>(false);

  useEffect(() => {
    const handleExtMessage = (event: MessageEvent) => {
      let msg = event.data;
      if (typeof msg === 'string') { try { msg = JSON.parse(msg); } catch (e) {} }
      
      if (
        (msg && msg.type === 'EXTENSION_CHECK') ||
        (msg?.type === 'FROM_EXTENSION' && msg?.data?.m === "Hello from the extension!") ||
        (msg?.type === 'NT_NEW_EXT_DETECTED')
      ) {
        (globalThis as any).NT_EXT_DETECTED = true;
        setCanLaunch(true);
        setIsOpenErrorEx(false);
      }
    };
    
    window.addEventListener('message', handleExtMessage);
    if ((globalThis as any).NT_EXT_DETECTED) setCanLaunch(true);

    const interval = setInterval(() => {
        if (!(globalThis as any).NT_EXT_DETECTED) {
            window.postMessage({ type: 'CHECK_FOR_NT_EXTENSION' }, "*");
        }
    }, 2000);

    return () => {
      window.removeEventListener('message', handleExtMessage);
      clearInterval(interval);
    };
  }, []);

  // Removed passive listeners to prevent unexpected modal triggers.
  // We will check for extension directly in the launch flow.

  const getButtonId = (toolName: string) => {
    if (!toolName) return undefined;
    return toolName.replace(/[^a-zA-Z0-9]/g, '') + 'Cookies';
  };

  const launchApp = async (toolId: number) => {
    if (isLoading) return;
    
    setActiveApp(toolId);
    setIsLoaded(null);
    setIsOpenErrorEx(false);
    setIsOpenErrorModal(false);
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const token = localStorage.getItem("a");
      if (!token) {
        window.location.href = "/signin";
        return;
      }

      // Check for extension detection
      if (!(globalThis as any).NT_EXT_DETECTED && !canLaunch) {
          window.postMessage({ type: 'CHECK_FOR_NT_EXTENSION' }, "*");
          // Wait up to 1.5s for detection
          for (let i = 0; i < 15; i++) {
              if ((globalThis as any).NT_EXT_DETECTED || canLaunch) break;
              await new Promise(r => setTimeout(r, 100));
          }
      }

      // Final check: if still not detected, just stop. Banner at top will explain why.
      if (!(globalThis as any).NT_EXT_DETECTED && !canLaunch) {
        return;
      }

      // API call to get session
      const res = await axios.post("https://api.nexustoolz.com/api/user/get-session", {
        appId: "wuXQpO8EsheI13FKKNn5p25DY92s6VtL",
        token: token,
        toolId: toolId,
      }, {
        headers: {
          "Content-Type": "application/json",
          "User-Client": (globalThis as any).clientId1328 || "",
        },
      });

      if (res?.status === 200) {
        window.postMessage({ type: 'FROM_NT_APP', text: JSON.stringify(res.data) }, "*");
        setIsLoaded(true);
        setIsOpenErrorEx(false);
        
        // Reset state after 3 seconds to clear icons and allow re-click
        setTimeout(() => {
            setIsLoaded(null);
            setActiveApp(null);
        }, 3000);
      }
    } catch (err) {
      console.error("Launch Error:", err);
      setErrorMessage("Something went wrong, Please try again later.");
      setIsOpenErrorModal(true);
      setIsLoaded(false);

      // Also reset after error
      setTimeout(() => {
          setIsLoaded(null);
          setActiveApp(null);
      }, 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const renderToolCard = (item: any) => {
    return (
      <LaunchCard
        buttonId={item.buttonId}
        content={item.tool_content}
        onClick={() => launchApp(item.tool_id)}
        activeApp={activeApp}
        isLoaded={isLoaded}
        key={item.tool_id}
        toolData={item}
        endedAt={item.endedAt}
      />
    );
  };

  useEffect(() => {
    document.title = 'Subscriptions';
    if (!toolsData) {
      let dataTools = [...data.toolsData];
      setToolsData(
        dataTools.sort((a, b) => {
          return a.tool_name.localeCompare(b.tool_name);
        })
      );
    }
  }, []);

  const { open: openNewUpdate } = useModal(
    getDangerActionConfirmationModal({
      msg: t('subscriptions.newUpdateMessage'),
      title: t('subscriptions.newUpdate'),
    })
  );

  const { open: openNewVersion } = useModal(
    getDangerActionConfirmationModal({
      msg: t('subscriptions.newVersionMessage'),
      title: t('subscriptions.newVersionAvailable'),
    })
  );

  return (
    <>
       <h2 className="w-full mt-10 px-20 font-bold md:px-40 py-3 md:py-4 text-xl md:text-4xl text-white bg-[linear-gradient(135deg,#4f008c,#190237,#190237)] gradient-border-3 rounded-xl text-center">
       {t("subscriptions.pageTitle")}
      </h2>

      {/* Extension Not Detected Banner */}
      {(!canLaunch && !(globalThis as any).NT_EXT_DETECTED) && (
        <div className="w-full mt-8 px-4 md:px-10 animate-in fade-in slide-in-from-top duration-700">
            <div className="relative overflow-hidden p-[2px] rounded-2xl bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 shadow-[0_0_20px_rgba(217,119,6,0.2)]">
                <div className="relative bg-[#0f0221] p-6 rounded-[14px] flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
                    {/* Background Glow */}
                    <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 blur-[100px] rounded-full pointer-events-none"></div>
                    
                    <div className="flex items-center gap-5 text-center md:text-start z-10">
                        <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/30 shadow-[0_0_15px_rgba(217,119,6,0.1)]">
                            <AlertTriangle className="text-amber-500" size={32} />
                        </div>
                        <div>
                            <h3 className="text-xl md:text-2xl font-black text-amber-500 tracking-tight">
                                إذا لم تكن قمت بتنزيل الإضافة، يرجى تنزيلها وتثبيتها أولاً
                            </h3>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 z-10">
                        <a 
                            href="/Nexustoolz.com.zip" 
                            download 
                            className="group flex items-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl transition-all duration-300 shadow-[0_5px_15px_rgba(217,119,6,0.3)] hover:scale-[1.05] active:scale-95"
                        >
                            <Download size={20} className="group-hover:animate-bounce" />
                            DOWNLOAD EXTENSION
                        </a>
                        <button 
                            onClick={() => window.location.reload()}
                            className="p-4 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/10 shadow-xl"
                            title="Refresh Page"
                        >
                            <RefreshCw size={20} className="active:rotate-180 transition-all duration-500" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      <script dangerouslySetInnerHTML={{ __html: `
        (function() {
            const requiredExtensions = new Set(['Nexus Toolz Extension 1', 'Nexus Toolz Extension 2']);
            window.addEventListener('message', (event) => {
                let msg = event.data;
                if (typeof msg === 'string') { try { msg = JSON.parse(msg); } catch (e) {} }
                if (msg && msg.type === 'EXTENSION_CHECK' && requiredExtensions.has(msg.extensionName)) {
                    window.NT_EXT_DETECTED = true;
                }
                if (msg && (msg.type === 'NT_NEW_EXT_DETECTED' || (msg.type === 'FROM_EXTENSION' && msg.data && msg.data.m === "Hello from the extension!"))) {
                    window.NT_EXT_DETECTED = true;
                }
            });
        })();
      ` }} />
      <script type="text/am-vars" dangerouslySetInnerHTML={{ __html: `{"script-replaced-_menu-narrow":"1","script-replaced-_menu":"1"}` }} />

  
    
   
      {/* <div className="flex items-center justify-center w-50 mb-3 bg-[linear-gradient(135deg,_#4f008c,_#190237,_#190237)] skew-x-[-50deg] rounded-[15px] gradient-border-packet text-white">
         <button className="skew-x-[50deg] px-3 py-2">
            Buy Device
         </button>
    </div> */}

      {/* <DataStatsThree /> */}

      {/* Individual Tools Section - Deduplicated */}
      {(() => {
        const uniqueTools = new Map();
        data?.userToolsData?.forEach((tool: any) => {
          const existing = uniqueTools.get(tool.tool_id);
          if (!existing || new Date(tool.endedAt) > new Date(existing.endedAt)) {
            uniqueTools.set(tool.tool_id, tool);
          }
        });
        const deduplicatedTools = Array.from(uniqueTools.values());

        return deduplicatedTools.length !== 0 && (
          <div className="grid w-full mb-9 px-10 gap-8 justify-center " style={{ gridTemplateColumns: "repeat(auto-fit, 330px)" }}>
        {deduplicatedTools.map((userTool: any) => {
          const tool = data?.toolsData?.find((t: any) => t.tool_id == userTool.tool_id);
          if (!tool) return null;
          return (
            <LaunchCard
              buttonId={getButtonId(tool.tool_name)}
              onClick={() => launchApp(tool.tool_id)}
              activeApp={activeApp}
              isLoaded={isLoaded}
              key={userTool?.users_tools_id}
              toolData={tool}
              endedAt={userTool.endedAt}
            />
          );
        })}
          </div>
        );
      })()}


      {/* Packs Section - Deduplicated */}
      {(() => {
        const uniquePacks = new Map();
        data?.userPacksData?.forEach((pack: any) => {
          const existing = uniquePacks.get(pack.pack_id);
          if (!existing || new Date(pack.endedAt) > new Date(existing.endedAt)) {
            uniquePacks.set(pack.pack_id, pack);
          }
        });
        const deduplicatedPacks = Array.from(uniquePacks.values());

        return deduplicatedPacks.map((a: any, index: number) =>
          data?.packsData.find((f: any) => f.pack_id === a.pack_id) &&
          <div key={index} className="mb-[36px]">
            <Panel
              title={data?.packsData.find((f: any) => f.pack_id === a.pack_id).pack_name}
              sideActions={
                <>
                <span className="text-white text-xs md:text-lg">{t('subscriptions.packExpiredAt')}</span>{" "}
                <span className="text-[#ff7720] text-xs md:text-lg">{fullDateTimeFormat(a.endedAt)}</span>
                </>
              }
              containerClassName="py-9 inner-shadow rounded-xl"
            >
              <div className="grid w-full px-10 gap-8 justify-center" style={{ gridTemplateColumns: "repeat(auto-fit, 330px)" }}>
                {JSON.parse(data?.packsData?.find((b: any) => b.pack_id === a.pack_id)?.pack_tools || '[]').map((toolId: number) => {
                  const tool = data?.toolsData.find((d: any) => d.tool_id === toolId);
                  if (!tool) return null;
                  return (
                    <LaunchCard
                      buttonId={getButtonId(tool.tool_name)}
                      content={tool.tool_content}
                      onClick={() => launchApp(tool.tool_id)}
                      activeApp={activeApp}
                      isLoaded={isLoaded}
                      key={tool.tool_id}
                      toolData={tool}
                      endedAt={tool.endedAt}
                    />
                  );
                })}
              </div>
            </Panel>
          </div>
        );
      })()}

      {/* AI Credit Plans Section */}
      {data?.userCreditsData?.filter((c: any) => c.remaining_credits > 0).map((credit: any, index: number) => {
          return (
            <div key={`ai-plan-${index}`} className="mb-6">
              <Panel
                title={`${credit.plan_name} (AI Credits)`}
                sideActions={
                  <>
                  <span className="text-white text-xs md:text-lg">{t('subscriptions.planExpiredAt')}</span>{" "}
                  <span className="text-[#00c48c] text-xs md:text-lg">{fullDateTimeFormat(credit.endedAt)}</span>
                  </>
                }
                containerClassName="py-4 inner-shadow rounded-xl bg-[linear-gradient(135deg,#1e1b4b,#312e81)]"
              >
                <div className="flex flex-col items-center justify-center py-4 text-center text-white">
                    <h3 className="text-2xl md:text-3xl font-black text-[#00c48c] mb-1">{credit.remaining_credits}</h3>
                    <p className="text-xs opacity-70 uppercase tracking-widest">{t('subscriptions.remainingCredits')}</p>
                    <div className="w-full max-w-xs h-1.5 bg-white/10 rounded-full mt-3 overflow-hidden">
                        <div 
                          className="h-full bg-[#00c48c] transition-all duration-300" 
                          style={{ width: `${Math.min((credit.remaining_credits / credit.total_credits) * 100, 100)}%` }}
                        ></div>
                    </div>
                </div>
              </Panel>
            </div>
          );
      })}


      {data?.userPlansData?.filter((item: any) => item.plan_name === "vip")
        .length !== 0 ? (
        <Panel
          title={t('subscriptions.goldPlan')}
          sideActions={
            <>
              {t('subscriptions.planExpiredAt')}{" "}
              {fullDateTimeFormat(
                data?.userPlansData?.filter(
                  (item: any) => item.plan_name === "vip"
                )[0]?.endedAt
              )}
            </>
          }
          containerClassName="py-9"
        >
          <div className="grid w-full px-10 gap-8 justify-center" style={{ gridTemplateColumns: "repeat(auto-fit, 330px)" }}>
            {toolsData
              ?.filter((item: any) => item.tool_plan === "standard")
              .map((item: any) => renderToolCard({ ...item, buttonId: getButtonId(item.tool_name) }))}
            {toolsData
              ?.filter((item: any) => item.tool_plan === "premium")
              .map((item: any) => renderToolCard({ ...item, buttonId: getButtonId(item.tool_name) }))}
            {toolsData
              ?.filter((item: any) => item.tool_plan === "vip")
              .map((item: any) => renderToolCard({ ...item, buttonId: getButtonId(item.tool_name) }))}
          </div>
        </Panel>
      ) : data?.userPlansData?.filter(
        (item: any) => item.plan_name === "premium"
      ).length !== 0 ? (
        <Panel
          title={t('subscriptions.premiumPlan')}
          sideActions={
            <>
              {t('subscriptions.planExpiredAt')}{" "}
              {fullDateTimeFormat(
                data?.userPlansData?.filter(
                  (item: any) => item.plan_name === "premium"
                )[0]?.endedAt
              )}
            </>
          }
          containerClassName="py-9"
        >
          <div className="grid w-full px-10 gap-8 justify-center" style={{ gridTemplateColumns: "repeat(auto-fit, 330px)" }}>
            {toolsData
              ?.filter((item: any) => item.tool_plan === "standard")
              .map((item: any) => renderToolCard({ ...item, buttonId: getButtonId(item.tool_name) }))}
            {toolsData
              ?.filter((item: any) => item.tool_plan === "premium")
              .map((item: any) => renderToolCard({ ...item, buttonId: getButtonId(item.tool_name) }))}
          </div>
        </Panel>
      ) : data?.userPlansData?.filter(
        (item: any) => item.plan_name === "standard"
      ).length !== 0 ? (
        <Panel
          title={t('subscriptions.standardPlan')}
          sideActions={
            <>
              {t('subscriptions.planExpiredAt')}{" "}
              {fullDateTimeFormat(
                data?.userPlansData?.filter(
                  (item: any) => item.plan_name === "standard"
                )[0]?.endedAt
              )}
            </>
          }
          containerClassName="py-9"
        >
          <div className="grid w-full px-10 gap-8 justify-center" style={{ gridTemplateColumns: "repeat(auto-fit, 330px)" }}>
            {toolsData
              ?.filter((item: any) => item.tool_plan === "standard")
              .map((item: any) => renderToolCard({ ...item, buttonId: getButtonId(item.tool_name) }))}
          </div>
        </Panel>
      ) : (
        data?.userToolsData?.length === 0 && data?.userPlansData?.length === 0 && data?.userPacksData?.length === 0 && (
          <p className="text-md text-center w-full  dark:text-white">
            {t('subscriptions.noActiveTools')}
          </p>
        )
      )}

      <ToolErrorModal
        message={errorMessage}
        modalOpen={openErrorModal}
        setModalOpen={setIsOpenErrorModal}
      />
    </>
  );
};

export default Dashboard;
