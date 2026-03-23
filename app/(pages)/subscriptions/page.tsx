"use client";
import { FunctionComponent, useEffect, useState } from "react";
import { useMyInfo } from "@/utils/user-info/getUserInfo";
import LaunchCard from "@/components/LaunchCard";
import CloudLaunchCard from "@/components/CloudLaunchCard";
import axios from "axios";
import ToolErrorModal from "@/components/Modals/ToolErrorModal";
import ToolErrorExtention from "@/components/Modals/ToolErrorExtention";
import AccountSelectModal from "@/components/Modals/AccountSelectModal";
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

  // Multi-account modal state
  const [accountModalOpen, setAccountModalOpen] = useState<boolean>(false);
  const [accountModalToolName, setAccountModalToolName] = useState<string>("");
  const [accountModalToolImage, setAccountModalToolImage] = useState<string>("");
  const [accountModalAccounts, setAccountModalAccounts] = useState<any[]>([]);

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

  const launchApp = async (toolId: number, accountId?: number) => {
    if (isLoading) return;
    
    setActiveApp(accountId || toolId);
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
      const getSessionUrl = process.env.NODE_ENV === "development" 
        ? "http://localhost:4560/api/user/get-session" 
        : "https://api.nexustoolz.com/api/user/get-session"; // Fallback to local for testing if needed, though previously hardcoded

      const res = await axios.post("https://api.nexustoolz.com/api/user/get-session", {
        appId: "wuXQpO8EsheI13FKKNn5p25DY92s6VtL",
        token: token,
        toolId: toolId,
        accountId: accountId, // sending the specific external ID
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

  // Helper: group tools by tool_name, render one card per name.
  const renderToolsGrouped = (baseTools: any[], endedAtOverride?: string) => {
    if (!baseTools || baseTools.length === 0) return null;

    // Remove duplicates from base tools (we only need 1 card per tool)
    const uniqueTools = Array.from(new Map(baseTools.map(t => [t.tool_id, t])).values());

    return uniqueTools.map((tool: any) => {
      const endedAt = endedAtOverride || tool.endedAt;
      
      // Parse Blocked Element 1 for comma separated external account IDs
      let externalIds: number[] = [];
      try {
        const blockedArr = JSON.parse(tool.tool_blocked_elements);
        if (Array.isArray(blockedArr) && blockedArr[0]) {
          const blockedStr = String(blockedArr[0]);
          if (/^(\d+,\s*)*\d+$/.test(blockedStr.trim())) {
            externalIds = blockedStr.split(',').map((id: string) => parseInt(id.trim())).filter((id: number) => !isNaN(id));
          }
        }
      } catch (e) {
        // Not a JSON string or couldn't parse
      }

      const handleClick = () => {
        if (externalIds.length > 1) {
          // Multiple accounts — show modal using parsed external IDs
          setAccountModalToolName(tool.tool_name);
          setAccountModalToolImage(tool.tool_image || "");
          setAccountModalAccounts(
            externalIds.map((extId: number) => ({
              tool_id: extId,
              tool_name: tool.tool_name,
              endedAt: endedAt,
              users_tools_id: `account-${extId}`,
              parent_tool_id: tool.tool_id // The main DB tool_id
            }))
          );
          setAccountModalOpen(true);
        } else {
          // Single account — launch directly
          launchApp(tool.tool_id, externalIds[0]); // Send first ID if available, otherwise undefined
        }
      };

      return (
        <LaunchCard
          buttonId={getButtonId(tool.tool_name)}
          content={tool.tool_content}
          onClick={handleClick}
          activeApp={activeApp}
          isLoaded={isLoaded}
          key={`grouped-${tool.tool_id}`}
          toolData={tool}
          endedAt={endedAt}
        />
      );
    });
  };

  useEffect(() => {
    document.title = 'Subscriptions';
    if (!toolsData || toolsData.length === 0) {
      let dataTools = [...(data?.toolsData || [])];
      setToolsData(
        dataTools.sort((a, b) => {
          return a.tool_name.localeCompare(b.tool_name);
        })
      );
    }
  }, [data?.toolsData]);

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

      {/* Individual Tools Section - Grouped by tool_name for multi-account support */}
      {(() => {
        // Find which tool_names the user is subscribed to
        const subscribedToolNames = new Set<string>();
        const subscriptionEndDates = new Map<string, string>();
        
        data?.userToolsData?.forEach((userTool: any) => {
          const tool = data?.toolsData?.find((t: any) => t.tool_id == userTool.tool_id);
          if (!tool) return;
          subscribedToolNames.add(tool.tool_name);
          const existing = subscriptionEndDates.get(tool.tool_name);
          if (!existing || new Date(userTool.endedAt) > new Date(existing)) {
            subscriptionEndDates.set(tool.tool_name, userTool.endedAt);
          }
        });

        // For each subscribed tool_name, find ALL tools from toolsData with that name
        const toolsToRender: any[] = [];
        const addedNames = new Set<string>();
        data?.toolsData?.forEach((tool: any) => {
          if (subscribedToolNames.has(tool.tool_name) && !addedNames.has(tool.tool_name)) {
            // Get ALL tools with this name
            const allWithName = data?.toolsData?.filter((t: any) => t.tool_name === tool.tool_name) || [];
            allWithName.forEach((t: any) => toolsToRender.push({ ...t, endedAt: subscriptionEndDates.get(t.tool_name) }));
            addedNames.add(tool.tool_name);
          }
        });

        return toolsToRender.length !== 0 && (
          <div className="grid w-full mb-9 px-10 gap-8 justify-center " style={{ gridTemplateColumns: "repeat(auto-fit, 330px)" }}>
            {renderToolsGrouped(toolsToRender)}
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
                {(() => {
                  const packToolIds: number[] = JSON.parse(data?.packsData?.find((b: any) => b.pack_id === a.pack_id)?.pack_tools || '[]');
                  const packTools = packToolIds
                    .map((toolId: number) => data?.toolsData.find((d: any) => d.tool_id === toolId))
                    .filter(Boolean);
                  return renderToolsGrouped(packTools, a.endedAt);
                })()}
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
            {renderToolsGrouped([
              ...(toolsData?.filter((item: any) => item.tool_plan === "standard") || []),
              ...(toolsData?.filter((item: any) => item.tool_plan === "premium") || []),
              ...(toolsData?.filter((item: any) => item.tool_plan === "vip") || []),
            ])}
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
            {renderToolsGrouped([
              ...(toolsData?.filter((item: any) => item.tool_plan === "standard") || []),
              ...(toolsData?.filter((item: any) => item.tool_plan === "premium") || []),
            ])}
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
            {renderToolsGrouped(
              toolsData?.filter((item: any) => item.tool_plan === "standard") || []
            )}
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

      {/* Multi-Account Selection Modal */}
      <AccountSelectModal
        open={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
        toolName={accountModalToolName}
        toolImage={accountModalToolImage}
        accounts={accountModalAccounts}
        onSelectAccount={(toolId, accountId) => {
          setAccountModalOpen(false);
          launchApp(toolId, accountId);
        }}
        activeApp={activeApp}
        isLoaded={isLoaded}
      />
    </>
  );
};

export default Dashboard;
