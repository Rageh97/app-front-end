"use client";

import React, { FunctionComponent, useEffect, useState } from "react";
import Panel from "@/components/Panel";
import { useGetOverview } from "@/utils/overview/getOverVIewData";
import { useGetUsersOnlineStatus } from "@/utils/overview/getOnlineUsersCount";
import { useMyInfo } from "@/utils/user-info/getUserInfo";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
import { ApexOptions } from "apexcharts";

type Props = {
  params: { clientId: string };
};

const OverViewPage: FunctionComponent<Props> = ({ params: { clientId } }) => {
  const router = useRouter();
  const { t } = useTranslation();
  const [toolzStatus, setToolzStatus] = useState<any>([]);

  const { data: userDetails } = useMyInfo();

  const {
    isLoading: isDataLoading,
    isFetching: isDataFetching,
    data,
    refetch,
  } = useGetOverview();

  const {
    isLoading,
    isFetching,
    data: statusData,
    refetch: fetchUsersCounter,
  } = useGetUsersOnlineStatus();

  const chartOptions: ApexOptions = {
    chart: {
      type: "donut",
      fontFamily: "Outfit, sans-serif",
    },
    colors: ["#00c48c", "#ff4d4d"],
    labels: [t('overview.activeSubscribers'), t('overview.expiredSubscribers')],
    legend: {
      position: "bottom",
      labels: {
        colors: "#fff"
      }
    },
    stroke: {
      show: false
    },
    plotOptions: {
      pie: {
        donut: {
          size: "75%",
          labels: {
            show: true,
            total: {
              show: true,
              label: t('overview.totalSubscribers'),
              color: "#fff",
              formatter: () => (data?.totalSubscribers || 0).toString()
            },
            value: {
              color: "#00c48c"
            }
          }
        }
      }
    },
    dataLabels: {
      enabled: false
    }
  };

  const chartSeries = [
    data?.activeSubscribers || 0,
    data?.expiredSubscribers || 0
  ];

  if (statusData) {
    statusData?.status?.sort((a: any, b: any) => {
      const emailA = a.email.toLowerCase();
      const emailB = b.email.toLowerCase();
      if (emailA < emailB) return -1;
      if (emailA > emailB) return 1;
      return 0;
    });
  }

  if (!global.isfetching) {
    setInterval(() => {
      refetch();
      fetchUsersCounter();
    }, 5000);
    global.isfetching = true;
  }

  useEffect(() => {
    document.title = 'Overview';
    refetch();
    fetchUsersCounter();
  }, []);


  useEffect(() => {
    if (statusData?.status && userDetails) {
      if (statusData?.status?.length !== 0) {
        const toolUsers = {};
        statusData?.status?.forEach((item: any) => {
          const toolId = item.activeTool;
          if (item.activeTool !== "none") {
            if (!toolUsers[toolId]) {
              toolUsers[toolId] = [];
            }
            toolUsers[toolId].push({
              userId: item.userId,
              fullName: item.fullName,
              email: item.email
            });
          }
        });

        const result = [];
        for (const toolId in toolUsers) {
          result.push({
            toolId: parseInt(toolId),
            counts: toolUsers[toolId].length,
            users: toolUsers[toolId]
          });
        }
        setToolzStatus(result);
      }
    }
  }, [statusData]);

  return (
    <>
      <Panel
        title={t('overview.globalStatus')}
        sideActions={
          <>
            {(isFetching || isDataFetching) && (
              <div className="inline-block h-[1.1rem] w-[1.1rem] animate-spin rounded-full border-[3px] border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            )}
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
          {/* Total Users Card */}
          <div className="gradient-border-analysis p-6">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors"></div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white text-sm font-medium mb-1">{t('overview.totalUsers')}</p>
                <h3 className="text-3xl font-bold text-orange tracking-tight">
                  {data?.totalUsers || 0}
                </h3>
              </div>
              <div className="p-3  rounded-xl backdrop-blur-md">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#00c48c]"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
            </div>
          </div>

          {/* Total Subscribers Card */}
          <div className="gradient-border-analysis p-6">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors"></div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white text-sm font-medium mb-1">{t('overview.totalSubscribers')}</p>
                <h3 className="text-3xl font-bold text-orange tracking-tight">
                  {data?.expiredSubscribers + data?.activeSubscribers || 0}
                </h3>
              </div>
              <div className="p-3  rounded-xl backdrop-blur-md">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#00c48c]"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
              </div>
            </div>
          </div>

          {/* Total Tools Card */}
          <div className="gradient-border-analysis p-6">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors"></div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white text-sm font-medium mb-1">{t('overview.totalTools')}</p>
                <h3 className="text-3xl font-bold text-orange tracking-tight">
                  {data?.totalTools || 0}
                </h3>
              </div>
              <div className="p-3  rounded-xl backdrop-blur-md">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#00c48c]"><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/></svg>
              </div>
            </div>
          </div>

          {/* Total Orders Card */}
          <div className="gradient-border-analysis p-6">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors"></div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white text-sm font-medium mb-1">{t('overview.totalOrders')}</p>
                <h3 className="text-3xl font-bold text-orange tracking-tight">
                  {data?.totalOrders || 0}
                </h3>
              </div>
              <div className="p-3  rounded-xl backdrop-blur-md">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#00c48c]"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row w-full gap-6 px-6 pb-6 mt-4">
          {/* Detailed Subscriber Analysis */}
          <div className="gradient-border-analysis flex-[0.6] p-6">
             {/* <h4 className="text-white font-semibold mb-6 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#00c48c]"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
                {t('overview.totalSubscribers')} Analysis
             </h4> */}
             <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
                {/* <div className="w-full max-w-[250px]">
                  <Chart options={chartOptions} series={chartSeries} type="donut" width="100%" />
                </div> */}
                <div className="flex-1 space-y-4 w-full">
                   <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center group hover:bg-[#00c48c]/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-[#00c48c]"></div>
                        <span className="text-white text-sm">{t('overview.activeSubscribers')}</span>
                      </div>
                      <span className="text-xl font-bold text-[#00c48c]">{data?.activeSubscribers   || 0}</span>
                   </div>
                   <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center group hover:bg-red-500/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-red"></div>
                        <span className="text-white text-sm">{t('overview.expiredSubscribers')}</span>
                      </div>
                      <span className="text-xl font-bold text-red">{data?.expiredSubscribers || 0}</span>
                   </div>
                  
                </div>
             </div>
          </div>

          <div className="flex-[0.4] flex flex-col gap-4">
            <div className="gradient-border-analysis flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-[#00c48c] animate-pulse"></div>
                <p className="font-medium text-white/80">{t('overview.usersOnline')} :</p>
              </div>
              <p className="text-3xl font-bold py-2 text-[#00c48c] drop-shadow-sm">{`${statusData?.online ? statusData?.online : 0} ${t('overview.user')}`}</p>
            </div>

            <div className="gradient-border-analysis p-6 flex justify-between items-center">
              <div>
                <p className="font-medium text-white/80">{t('overview.totalRevenue')} :</p>
                <p className="text-3xl font-bold py-2 text-[#00c48c] drop-shadow-sm font-mono">{`${data?.totalRevenue && data?.totalRevenue || 0} $`}</p>
              </div>
              <div className="relative">
                <svg className="h-20 w-20 -rotate-90 transform drop-shadow-lg">
                  <circle
                    className="text-white/5"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r="34"
                    cx="40"
                    cy="40"
                  />
                  <circle
                    className="text-[#00c48c]"
                    strokeWidth="8"
                    strokeDasharray={34 * 2 * Math.PI}
                    strokeDashoffset={34 * 2 * Math.PI - (Math.min(1, (data?.totalRevenue && data?.totalRevenue || 0) / 10000)) * 34 * 2 * Math.PI}
                    stroke="currentColor"
                    fill="transparent"
                    strokeLinecap="round"
                    r="34"
                    cx="40"
                    cy="40"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white/50 font-bold uppercase tracking-wider">
                  REV
                </div>
              </div>
            </div>
          </div>
        </div>
      </Panel>
      <Panel title={t('overview.toolzStatus')}>
        <div className="flex flex-wrap w-full gap-4 p-5">
          {toolzStatus.length === 0 && (
            <p className="text-center w-full">{t('overview.noStatus')}</p>
          )}
          {toolzStatus.map((item: any) => (
            <div key={item.toolId} className="p-5 shadow-2xl rounded-lg h-auto min-h-[120px] bg-[#190237] gradient-border-2">
              <p className="text-white">
                {
                  userDetails?.toolsData?.find(
                    (tool: any) => tool.tool_id === item?.toolId
                  )?.tool_name
                }
              </p>
              <p className="text-2xl py-2 text-[#00c48c]">{`${item?.counts} ${t('overview.user')}`}</p>
              <div className="mt-2 text-wrap max-w-50">
                {item?.users?.map((user: any, index: number) => (
                  <p key={user.userId} className="text-sm text-orange break-words">
                    {user.fullName} 
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title={t('overview.usersStatus')}>
        <div className="flex flex-wrap w-full gap-4 p-5">
          {statusData?.status?.length === 0 && (
            <p className="text-center w-full">{t('overview.noStatus')}</p>
          )}
          {statusData?.status.length > 0 && (
            <div className="flex flex-wrap w-full gap-4 p-5">
              {statusData?.status.length > 0 &&
                statusData?.status?.map((item: any) => (
                  <div
                    key={item.userId}
                    onClick={() => {
                      router.push(`/manage/users/${item?.userId}`);
                    }}
                    className="cursor-pointer p-5 shadow-2xl rounded-lg h-[120px] bg-[linear-gradient(135deg,_#4f008c,_#190237,_#190237)] relative"
                  >
                    <span className="absolute w-[11px] h-[11px] bg-[#00ff00b8] rounded-full top-[12px] right-[10px]"></span>
                    <p className="text-orange">{item?.fullName}</p>
                    <p className="text-white">{item?.email}</p>
                    <p className="text-white">
                      {userDetails?.toolsData?.find(
                        (tool: any) => tool.tool_id === item?.activeTool
                      )?.tool_name || t('overview.nothing')}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </div>
      </Panel>
    </>
  );
};

export default OverViewPage;
