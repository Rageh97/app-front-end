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
import MultiAccountModal from "@/components/Modals/MultiAccountModal";
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
  // Using data.toolsData directly to avoid sync issues

  const [openErrorEx, setIsOpenErrorEx] = useState<boolean>(false);

  const [openErrorModal, setIsOpenErrorModal] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>(null);


  const [canLaunch, setCanLaunch] = useState<boolean>(false);

  // Multi-Account States
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [selectedToolGroup, setSelectedToolGroup] = useState<{name: string, accounts: any[]}>({name: "", accounts: []});

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

  const groupTools = (toolsArray: any[]) => {
    const groups = new Map();
    toolsArray.forEach(tool => {
        if (!tool) return;
        const groupName = tool.tool_name.trim().toLowerCase();
        if (!groups.has(groupName)) {
            groups.set(groupName, { ...tool, accounts: [tool] });
        } else {
            groups.get(groupName).accounts.push(tool);
        }
    });

    return Array.from(groups.values()).map((group: any) => {
        if (group.accounts.length > 1) {
            return { ...group, isGroup: true };
        }
        return { ...group.accounts[0], isGroup: false };
    });
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

  const renderToolCard = (item: any, forceToolId?: number) => {
    return (
      <LaunchCard
        buttonId={item.buttonId || getButtonId(item.tool_name)}
        content={item.tool_content}
        onClick={() => {
            // Check if this item is actually a group from our new logic
            if (item.isGroup) {
                setSelectedToolGroup({ name: item.tool_name, accounts: item.accounts });
                setIsAccountModalOpen(true);
            } else {
                launchApp(forceToolId || item.tool_id);
            }
        }}
        activeApp={activeApp}
        isLoaded={isLoaded}
        key={forceToolId || item.tool_id}
        toolData={item}
        endedAt={item.endedAt}
      />
    );
  };

  useEffect(() => {
    document.title = 'Subscriptions';
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

      {/* Unified Tools Section */}
      {(() => {
        if (!data?.toolsData) return null;

        // 1. Identify all Tool Names the user has access to
        const userPlanLevels = data?.userPlansData?.map((p: any) => p.plan_name) || [];
        const individualToolIds = data?.userToolsData?.map((ut: any) => ut.tool_id) || [];
        
        const accessibleNames = new Set<string>();
        
        data.toolsData.forEach((t: any) => {
            let hasAccess = individualToolIds.includes(t.tool_id);
            if (!hasAccess) {
                if (userPlanLevels.includes("vip")) hasAccess = true;
                else if (userPlanLevels.includes("premium")) hasAccess = (t.tool_plan === "standard" || t.tool_plan === "premium");
                else if (userPlanLevels.includes("standard")) hasAccess = (t.tool_plan === "standard");
            }

            if (hasAccess) {
                accessibleNames.add(t.tool_name.trim().toLowerCase());
            }
        });

        // 2. For each accessible name, find ALL matching tools in the system
        const finalGroupedTools: any[] = [];
        accessibleNames.forEach(name => {
            const allMatchingTools = data.toolsData.filter((t: any) => t.tool_name.trim().toLowerCase() === name);
            
            if (allMatchingTools.length > 1) {
                // It's a Multi-Account Tool
                finalGroupedTools.push({
                    ...allMatchingTools[0],
                    isGroup: true,
                    accounts: allMatchingTools
                });
            } else if (allMatchingTools.length === 1) {
                // Single Account
                finalGroupedTools.push({
                    ...allMatchingTools[0],
                    isGroup: false
                });
            }
        });

        // Sort by name
        finalGroupedTools.sort((a, b) => a.tool_name.localeCompare(b.tool_name));

        if (finalGroupedTools.length === 0 && data?.userPacksData?.length === 0 && data?.userCreditsData?.length === 0) {
            return (
                <p className="text-md text-center w-full mt-10 dark:text-white">
                    {t('subscriptions.noActiveTools')}
                </p>
            );
        }

        return finalGroupedTools.length > 0 && (
            <div className="mt-10">
                <Panel 
                   title={t("subscriptions.pageTitle")}
                   containerClassName="py-9"
                >
                    <div className="grid w-full px-10 gap-8 justify-center" style={{ gridTemplateColumns: "repeat(auto-fit, 330px)" }}>
                        {finalGroupedTools.map((tool: any) => renderToolCard(tool))}
                    </div>
                </Panel>
            </div>
        );
      })()}

      {/* Packs Section remains separate as they are distinct entities */}
      {data?.userPacksData?.map((a: any, index: number) => {
          const pack = data?.packsData.find((f: any) => f.pack_id === a.pack_id);
          if (!pack) return null;
          return (
            <div key={`pack-${index}`} className="mt-10">
              <Panel
                title={pack.pack_name}
                sideActions={
                  <>
                    <span className="text-white text-xs md:text-lg">{t('subscriptions.packExpiredAt')}</span>{" "}
                    <span className="text-[#ff7720] text-xs md:text-lg">{fullDateTimeFormat(a.endedAt)}</span>
                  </>
                }
                containerClassName="py-9 inner-shadow rounded-xl"
              >
                <div className="grid w-full px-10 gap-8 justify-center" style={{ gridTemplateColumns: "repeat(auto-fit, 330px)" }}>
                  {(() => {
                      const packToolIds = JSON.parse(pack.pack_tools || '[]') as number[];
                      const pTools = packToolIds.map(tid => data?.toolsData.find((td: any) => td.tool_id === tid)).filter(Boolean);
                      return groupTools(pTools).map((tool: any) => renderToolCard(tool));
                  })()}
                </div>
              </Panel>
            </div>
          );
      })}

      <ToolErrorModal
        message={errorMessage}
        modalOpen={openErrorModal}
        setModalOpen={setIsOpenErrorModal}
      />

      <MultiAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        toolName={selectedToolGroup.name}
        accounts={selectedToolGroup.accounts}
        onSelect={(toolId) => launchApp(toolId)}
      />
    </>
  );
};

export default Dashboard;
