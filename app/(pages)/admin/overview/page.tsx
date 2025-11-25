"use client";

import React, { FunctionComponent, useEffect, useState } from "react";
import Panel from "@/components/Panel";
import { useGetOverview } from "@/utils/overview/getOverVIewData";
import { useGetUsersOnlineStatus } from "@/utils/overview/getOnlineUsersCount";
import { useMyInfo } from "@/utils/user-info/getUserInfo";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

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
        <div className="flex flex-col md:flex-row justify-between w-full gap-4 p-5">
          <div className="p-5 shadow-2xl rounded-lg h-[120px] w-full bg-gradient-to-l from-[#4f008c] to-[#190237] text-white">
            <p className="">{t('overview.usersOnline')} :</p>
            <p className="text-2xl py-2 text-[#00c48c]">{`${statusData?.online ? statusData?.online : 0} ${t('overview.user')}`}</p>
          </div>
          <div className="flex justify-between items-center p-5 shadow-2xl rounded-lg h-[120px] w-full bg-gradient-to-r from-[#4f008c] to-[#190237] text-white">
            <div>
              <p className="">{t('overview.totalRevenue')} :</p>
              <p className="text-2xl py-2 text-[#00c48c]">{`${data?.totalRevenue && data?.totalRevenue || 0} $`}</p>
            </div>
            <div>
              <svg className="h-17.5 w-17.5 -rotate-90 transform">
                <circle
                  className="text-stroke dark:text-strokedark"
                  strokeWidth="10"
                  stroke="currentColor"
                  fill="transparent"
                  r="30"
                  cx="35"
                  cy="35"
                />
                <circle
                  className="text-primary"
                  strokeWidth="10"
                  strokeDasharray={30 * 2 * Math.PI}
                  strokeDashoffset={30 * 2 * Math.PI - ((data?.totalRevenue && data?.totalRevenue || 0) / 1000) * 30 * 2 * Math.PI}
                  stroke="currentColor"
                  fill="transparent"
                  r="30"
                  cx="35"
                  cy="35"
                />
              </svg>
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
            <div className="p-5 shadow-2xl rounded-lg h-auto min-h-[120px] bg-[#190237] gradient-border-2">
              <p className="text-white">
                {
                  userDetails?.toolsData?.find(
                    (tool: any) => tool.tool_id === item?.toolId
                  )?.tool_name
                }
              </p>
              <p className="text-2xl py-2 text-[#00c48c]">{`${item?.counts} ${t('overview.user')}`}</p>
              <div className="mt-2">
                {item?.users?.map((user: any, index: number) => (
                  <p key={user.userId} className="text-sm text-orange">
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
