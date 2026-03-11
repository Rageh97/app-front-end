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
import { Clock, ShipWheel, UserRound } from "lucide-react";
import { useTranslation } from 'react-i18next';

const Dashboard: FunctionComponent = () => {
  const { t } = useTranslation();
  const { data } = useMyInfo();

  const [toolsData, setToolsData] = useState(global.globalAppsToolsData);
  const [activeApp, setActiveApp] = useState<number>(global.activeTool);
  const [isLoaded, setIsLoaded] = useState<boolean>(global.isLoaded);

  const [openErrorEx, setIsOpenErrorEx] = useState<boolean>(false);

  const [openErrorModal, setIsOpenErrorModal] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>(null);

  const [canLaunch, setCanLaunch] = useState<boolean>(false);

  useEffect(() => {
    const handleExtMessage = (event: MessageEvent) => {
      let msg = event.data;
      if (typeof msg === 'string') {
          try { msg = JSON.parse(msg); } catch (e) {}
      }

      // Check for detection from any of the valid sources
      const isDetected = 
        (msg?.type === 'FROM_EXTENSION' && msg?.data?.m === "Hello from the extension!") ||
        (msg?.type === 'NT_NEW_EXT_DETECTED') ||
        (msg?.type === 'EXTENSION_CHECK' && msg?.extensionName);

      if (isDetected) {
        setCanLaunch(true);
      }
    };
    
    // Initial ping to catch already loaded extensions
    window.postMessage({ type: 'CHECK_FOR_NT_EXTENSION' }, "*");
    
    window.addEventListener('message', handleExtMessage);
    return () => window.removeEventListener('message', handleExtMessage);
  }, []);

  const getButtonId = (toolName: string) => {
    if (!toolName) return undefined;
    return toolName.replace(/[^a-zA-Z0-9]/g, '') + 'Cookies';
  };

  const launchApp = async (tool_id: number) => {
    setActiveApp(tool_id);
    global.activeTool = tool_id;
    setIsLoaded(null);
    global.isLoaded = null;
    setIsOpenErrorModal(false);
    setErrorMessage(null);
    global.isLoading = true;

    const token = localStorage.getItem("a");

    if (!token) {
      window.location.href = "/signin";
      return;
    }

    if (!canLaunch) {
      setIsOpenErrorEx(true);
      setIsLoaded(false);
      global.isLoaded = false;
      global.isLoading = false;
      return
    }

    let data = {
      appId: "wuXQpO8EsheI13FKKNn5p25DY92s6VtL",
      token: token,
      toolId: tool_id,
    };

    await axios
      .post("https://api.nexustoolz.com/api/user/get-session", data, {

        // .post("http://localhost:4560/api/user/get-session", data, {
        headers: {
          "Content-Type": "application/json",
          "User-Client": global.clientId1328, // Custom header for visitorId
        },
      })
      .then((res) => {
        if (res?.status === 200) {
          setIsLoaded(true);
          global.isLoaded = true;
          global.isLoading = false;

          // setTimeout(() => {

          // window.open("/newsession", "_blank")

          // Set a custom ID for the new window
          window.postMessage({ type: 'FROM_NT_APP', text: JSON.stringify(res.data) }, "*");


          // }, 500);
        }
      })
      .catch((error) => {
        setTimeout(() => {
          setErrorMessage("Something went wrong, Please try again later.");
          setIsOpenErrorModal(true);
          setIsLoaded(false);
          global.isLoaded = false;
          global.isLoading = false;
        }, 1000);
      });
  };

  // Helper function to render the appropriate card component
  const renderToolCard = (item: any) => {
    if (item.tool_mode === "cloud") {
      return (
        <CloudLaunchCard
          key={item.tool_id}
          toolData={item}
          endedAt={item.endedAt}
          content={item.tool_content}
        />
      );
    } else {
      return (
        <LaunchCard
          buttonId={item.buttonId}
          content={item.tool_content}
          onClick={() => {
            if (!global.isLoading) {
              launchApp(item.tool_id);
            } else {
              setErrorMessage(t('subscriptions.waitForLoading'));
              setIsOpenErrorModal(true);
            }
          }}
          activeApp={activeApp}
          isLoaded={isLoaded}
          key={item.tool_id}
          toolData={item}
          endedAt={item.endedAt}
        />
      );
    }
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

      <script dangerouslySetInnerHTML={{ __html: `
        (function() {
            const requiredExtensions = ['Nexus Toolz Extension 1', 'Nexus Toolz Extension 2'];
            function check() {
                let msg = event.data;
                if (typeof msg === 'string') {
                    try { msg = JSON.parse(msg); } catch (e) {}
                }
                if (msg && msg.type === 'EXTENSION_CHECK' && requiredExtensions.includes(msg.extensionName)) {
                    window.postMessage({ type: 'NT_NEW_EXT_DETECTED' }, "*");
                }
            }
            window.addEventListener('message', function(event) {
                let msg = event.data;
                if (typeof msg === 'string') {
                    try { msg = JSON.parse(msg); } catch (e) {}
                }
                if (msg && msg.type === 'EXTENSION_CHECK' && requiredExtensions.includes(msg.extensionName)) {
                    window.postMessage({ type: 'NT_NEW_EXT_DETECTED' }, "*");
                }
            });
            // Immediate check and interval
            window.postMessage({ type: 'CHECK_FOR_NT_EXTENSION' }, "*");
            setInterval(() => {
                window.postMessage({ type: 'CHECK_FOR_NT_EXTENSION' }, "*");
            }, 1000);
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
            {deduplicatedTools.map(
              (index: any) =>
                data?.toolsData?.find(
                  (item: any) => item.tool_id == index.tool_id
                ) && (
                  <LaunchCard
                    buttonId={getButtonId(data?.toolsData?.find((item: any) => item.tool_id == index.tool_id)?.tool_name)}
                    onClick={() => {
                      if (!global.isLoading) {
                        launchApp(
                          data?.toolsData?.find(
                            (item: any) => item.tool_id == index.tool_id
                          )?.tool_id
                        );
                      } else {
                        setErrorMessage(t('subscriptions.waitForLoading'));
                        setIsOpenErrorModal(true);
                      }
                    }}
                    activeApp={activeApp}
                    isLoaded={isLoaded}
                    key={index?.users_tools_id}
                    toolData={data?.toolsData?.find(
                      (item: any) => item.tool_id == index.tool_id
                    )}
                    endedAt={index.endedAt}
                  />
                )
            )}
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
                {JSON.parse(data?.packsData?.find((b: any) => b.pack_id === a.pack_id)?.pack_tools || '[]').map((c) =>
                  data?.toolsData.find((d: any) => d.tool_id === c) &&
                  <LaunchCard
                    buttonId={getButtonId(data?.toolsData.find((d: any) => d.tool_id === c)?.tool_name)}
                    content={data?.toolsData.find((d: any) => d.tool_id === c).tool_content}
                    onClick={() => {
                      if (!global.isLoading) {
                        launchApp(data?.toolsData.find((d: any) => d.tool_id === c).tool_id);
                      } else {
                        setErrorMessage(t('subscriptions.waitForLoading'));
                        setIsOpenErrorModal(true);
                      }
                    }}
                    activeApp={activeApp}
                    isLoaded={isLoaded}
                    key={data?.toolsData.find((d: any) => d.tool_id === c).tool_id}
                    toolData={data?.toolsData.find((d: any) => d.tool_id === c)}
                    endedAt={data?.toolsData.find((d: any) => d.tool_id === c).endedAt}
                  />
                )}
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

      <ToolErrorExtention
        title={t('subscriptions.extensionNotDetected')}
        message={""}
        modalOpen={openErrorEx}
        setModalOpen={setIsOpenErrorEx}
      />
    </>
  );
};

export default Dashboard;
