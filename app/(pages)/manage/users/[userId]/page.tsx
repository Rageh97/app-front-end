"use client";
import React, { FunctionComponent, useEffect, useState } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Panel from "@/components/Panel";
import ClientInformation from "@/components/userDetails/UserInformation";
import { fullDateTimeFormat } from "@/utils/timeFormatting";
import IconButton from "@/components/buttons/IconButton";
import { useModal } from "@/components/providers/ModalProvider";
import { getDangerActionConfirmationModal } from "@/components/Modals/DangerActionConfirmation";
import { useRouter } from "next/navigation";
import DetailCell from "@/components/DetailCell";
import DataNavigateItem from "@/components/DataNavigateItem";
import { useGetUsersPurchasedToolsList } from "@/utils/users/getUsersPurchasedTools";
import { useGetUsersPurchasedPlansList } from "@/utils/users/getUsersPurchasedPlans";
import { useGetUsersPurchasedPacksList } from "@/utils/users/getUsersPurchasedPacks";
import { useDisableUser } from "@/utils/users/disableUser";
import { useEnableUser } from "@/utils/users/enableUser";
import { useGetUser } from "@/utils/users/getUser";
import XMarkIcon from "@/components/icons/XMarkIcon";
import { useDisableUserTool } from "@/utils/user-tool/disableUserTool";
import { useEnableUserTool } from "@/utils/user-tool/enableUserTool";
import { useDisableUserPlan } from "@/utils/user-plan/disableUserPlan";
import { useEnableUserPlan } from "@/utils/user-plan/enableUserPlan";
import { useDisableUserPack } from "@/utils/user-pack/disableUserPack";
import { useEnableUserPack } from "@/utils/user-pack/enableUserPack";
import { useTranslation } from 'react-i18next';

type Props = {
  params: { userId: string };
};

const UserDetailsPage: FunctionComponent<Props> = ({ params: { userId } }) => {
  const { t } = useTranslation();
  const router = useRouter();

  const [purchasedToolPage, setPurchasedToolPage] = useState<number>(1);
  const [purchasedPlanPage, setPurchasedPlanPage] = useState<number>(1);
  const [purchasedPackPage, setPurchasedPackPage] = useState<number>(1);

  const {
    data: user,
    refetch: refetchUser,
    isLoading,
    isError,
  } = useGetUser(parseInt(userId));

  const {
    data: purchasedToolsData,
    isFetching: isPurchasedToolsDataFetching,
    isLoading: isPurchasedToolsDataLoading,
    isError: isPurchasedToolsDataError,
    refetch: refetchPurchasedToolsData,
  } = useGetUsersPurchasedToolsList(purchasedToolPage, parseInt(userId));

  const {
    data: purchasedPlansData,
    isFetching: isPurchasedPlansDataFetching,
    isLoading: isPurchasedPlansDataLoading,
    isError: isPurchasedPlansDataError,
    refetch: refetchPurchasedPlansData,
  } = useGetUsersPurchasedPlansList(purchasedPlanPage, parseInt(userId));

  const {
    data: purchasedPacksData,
    isFetching: isPurchasedPacksDataFetching,
    isLoading: isPurchasedPacksDataLoading,
    isError: isPurchasedPacksDataError,
    refetch: refetchPurchasedPacksData,
  } = useGetUsersPurchasedPacksList(purchasedPackPage, parseInt(userId));

  const {
    mutate: disableUser,
    isLoading: isDisabling,
    isSuccess: isDisabled,
  } = useDisableUser(parseInt(userId));

  const {
    mutate: enableUser,
    isLoading: isEnabling,
    isSuccess: isEnabled,
  } = useEnableUser(parseInt(userId));

  const {
    mutate: disableUserTool,
    isLoading: isDisablingUserTool,
    isSuccess: isDisabledUserTool,
  } = useDisableUserTool(parseInt(userId));

  const {
    mutate: enableUserTool,
    isLoading: isEnablingUserTool,
    isSuccess: isEnabledUserTool,
  } = useEnableUserTool(parseInt(userId));

  const {
    mutate: disableUserPlan,
    isLoading: isDisablingUserPlan,
    isSuccess: isDisabledUserPlan,
  } = useDisableUserPlan(parseInt(userId));

  const {
    mutate: enableUserPlan,
    isLoading: isEnablingUserPlan,
    isSuccess: isEnabledUserPlan,
  } = useEnableUserPlan(parseInt(userId));

  const {
    mutate: disableUserPack,
    isLoading: isDisablingUserPack,
    isSuccess: isDisabledUserPack,
  } = useDisableUserPack(parseInt(userId));

  const {
    mutate: enableUserPack,
    isLoading: isEnablingUserPack,
    isSuccess: isEnabledUserPack,
  } = useEnableUserPack(parseInt(userId));

  useEffect(() => {
    refetchUser();
  }, [isEnabled, isDisabled]);

  useEffect(() => {
    setTimeout(() => {
      refetchPurchasedToolsData();
    }, 1000);
  }, [purchasedToolPage, isDisabledUserTool, isEnabledUserTool]);

  useEffect(() => {
    setTimeout(() => {
      refetchPurchasedPlansData();
    }, 1000);
  }, [purchasedPlanPage, isDisabledUserPlan, isEnabledUserPlan]);

  useEffect(() => {
    setTimeout(() => {
      refetchPurchasedPacksData();
    }, 1000);
  }, [purchasedPackPage, isDisabledUserPack, isEnabledUserPack]);

  const { open: disableModal } = useModal(
    getDangerActionConfirmationModal({
      msg: t('userDetails.confirmDisableUser'),
      title: t('userDetails.disableUser'),
    })
  );

  const { open: enableModal } = useModal(
    getDangerActionConfirmationModal({
      msg: t('userDetails.confirmEnableUser'),
      title: t('userDetails.enableUser'),
    })
  );

  const { open: disableUserToolModal } = useModal(
    getDangerActionConfirmationModal({
      msg: t('userDetails.confirmDisableTool'),
      title: t('userDetails.disableUserTool'),
    })
  );

  const { open: enableUserToolModal } = useModal(
    getDangerActionConfirmationModal({
      msg: t('userDetails.confirmEnableTool'),
      title: t('userDetails.enableUserTool'),
    })
  );

  const { open: disableUserPlanModal } = useModal(
    getDangerActionConfirmationModal({
      msg: t('userDetails.confirmDisablePlan'),
      title: t('userDetails.disableUserPlan'),
    })
  );

  const { open: enableUserPlanModal } = useModal(
    getDangerActionConfirmationModal({
      msg: t('userDetails.confirmEnablePlan'),
      title: t('userDetails.enableUserPlan'),
    })
  );

  const { open: disableUserPackModal } = useModal(
    getDangerActionConfirmationModal({
      msg: t('userDetails.confirmDisablePack'),
      title: t('userDetails.disableUserPack'),
    })
  );

  const { open: enableUserPackModal } = useModal(
    getDangerActionConfirmationModal({
      msg: t('userDetails.confirmEnablePack'),
      title: t('userDetails.enableUserPack'),
    })
  );

  return (
    <>
      <Breadcrumb pageName={t('userDetails.pageName')} />
      <div className="grid grid-cols-1 gap-9 sm:grid-cols-2">
        <div className="flex flex-col gap-9">
          <Panel
            title={t('userDetails.informations')}
            containerClassName="px-7 shadow-xl py-4 bg-[linear-gradient(270deg,_#4f008c,_#190237,_#190237)]"
            sideActions={
              <div className="flex gap-4">
                {/* <Link href={`/clients/${userId}/edit`}>
                  <IconButton>
                    <PencilSquare className="w-5 h-5" />
                  </IconButton>
                </Link> */}
                {user?.isActive === false && (
                  <IconButton
                    buttonType="Success"
                    onClick={() => {
                      enableModal({
                        onConfirm: () => {
                          enableUser(parseInt(userId));
                        },
                      });
                    }}
                    disabled={isEnabling}
                    isLoading={isEnabling}
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </IconButton>
                )}
                {user?.isActive && (
                  <IconButton
                    buttonType="Danger"
                    onClick={() => {
                      disableModal({
                        onConfirm: () => {
                          disableUser(parseInt(userId));
                        },
                      });
                    }}
                    disabled={isEnabling}
                    isLoading={isDisabling}
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </IconButton>
                )}
              </div>
            }
          >
            <ClientInformation
              data={user}
              isError={isError}
              isLoading={isLoading}
            />
          </Panel>
          <Panel
            title={t('userDetails.purchasedPacks')}
            sideActions={
              <DataNavigateItem
                setPage={setPurchasedPackPage}
                data={purchasedPacksData}
                isFetching={isPurchasedPacksDataFetching}
                page={purchasedPackPage}
              />
            }
            containerClassName="px-7 py-4 bg-[linear-gradient(270deg,_#4f008c,_#190237,_#190237)]"
          >
            <div className="grid gap-4">
              {purchasedPacksData?.userPackData.length === 0 && (
                <p className="text-center">{t('userDetails.noData')}</p>
              )}
              {purchasedPacksData?.userPackData?.map((item: any) => (
                <div className="border rounded-md grid grid-cols-2 p-4 gap-3">
                  <DetailCell
                    ignoreIfEmpty={true}
                    label={t('userDetails.purchasedAt')}
                    value={fullDateTimeFormat(item.createdAt) || "none"}
                  />
                  <DetailCell
                    ignoreIfEmpty={true}
                    label={t('userDetails.endedAt')}
                    value={fullDateTimeFormat(item.endedAt) || "none"}
                  />
                  <DetailCell
                    ignoreIfEmpty={true}
                    label={t('userDetails.packName')}
                    value={item.pack_name || "none"}
                  />
                  <DetailCell
                    ignoreIfEmpty={true}
                    label={t('userDetails.isActive')}
                    value={
                      (
                        <div
                          style={{
                            backgroundColor:
                              item.isActive === true
                                ? "green"
                                : item.isActive === false && "#A020F0",
                          }}
                          className="px-2 py-1 w-min rounded-lg text-white text-xs text-center"
                        >
                          {item.isActive === true ? t('userDetails.active') : t('userDetails.inactive')}
                        </div>
                      )
                    }
                  />
                  <DetailCell
                    ignoreIfEmpty={true}
                    label={t('userDetails.expired')}
                    value={
                      (new Date() > new Date(item.endedAt) ? (
                        <div
                          style={{
                            backgroundColor: "red",
                          }}
                          className="px-2 py-1 w-min rounded-lg text-white text-xs text-center"
                        >
                          {t('userDetails.yes')}
                        </div>
                      ) : (
                        <div
                          style={{
                            backgroundColor: "green",
                          }}
                          className="px-2 py-1 w-min rounded-lg text-white text-xs text-center"
                        >
                          {t('userDetails.no')}
                        </div>
                      ))
                    }
                  />
                  <DetailCell
                    ignoreIfEmpty={true}
                    label={t('userDetails.action')}
                    value={
                      <>
                        {item?.isActive === false && (
                          <button
                            style={{
                              backgroundColor: "green",
                            }}
                            className="px-2 py-1 w-min rounded-lg text-white text-xs text-center"
                            onClick={() => {
                              enableUserPackModal({
                                onConfirm: () => {
                                  enableUserPack(
                                    parseInt(item?.users_packs_id)
                                  );
                                },
                              });
                            }}
                            disabled={isDisablingUserPack || isEnablingUserPack}
                          >
                            {t('userDetails.enable')}
                          </button>
                        )}
                        {item?.isActive && (
                          <button
                            style={{
                              backgroundColor: "red",
                            }}
                            className="px-2 py-1 w-min rounded-lg text-white text-xs text-center"
                            onClick={() => {
                              disableUserPackModal({
                                onConfirm: () => {
                                  disableUserPack(
                                    parseInt(item?.users_packs_id)
                                  );
                                },
                              });
                            }}
                            disabled={isDisablingUserPack || isEnablingUserPack}
                          >
                            {t('userDetails.disable')}
                          </button>
                        )}
                      </>
                    }
                  />
                </div>
              ))}
            </div>
          </Panel>
          <Panel
            title={t('userDetails.purchasedPlans')}
            sideActions={
              <DataNavigateItem
                setPage={setPurchasedPlanPage}
                data={purchasedPlansData}
                isFetching={isPurchasedPlansDataFetching}
                page={purchasedPlanPage}
              />
            }
            containerClassName="px-7 py-4 bg-[linear-gradient(270deg,_#4f008c,_#190237,_#190237)]"
          >
            <div className="grid gap-4">
              {purchasedPlansData?.userPlanData.length === 0 && (
                <p className="text-center">{t('userDetails.noData')}</p>
              )}
              {purchasedPlansData?.userPlanData?.map((item: any) => (
                <div className="border rounded-md grid grid-cols-2 p-4 gap-3">
                  <DetailCell
                    ignoreIfEmpty={true}
                    label={t('userDetails.purchasedAt')}
                    value={fullDateTimeFormat(item.createdAt) || "none"}
                  />
                  <DetailCell
                    ignoreIfEmpty={true}
                    label={t('userDetails.endedAt')}
                    value={fullDateTimeFormat(item.endedAt) || "none"}
                  />
                  <DetailCell
                    ignoreIfEmpty={true}
                    label={t('userDetails.planName')}
                    value={item.plan_name || "none"}
                  />
                  <DetailCell
                    ignoreIfEmpty={true}
                    label={t('userDetails.isActive')}
                    value={
                      (
                        <div
                          style={{
                            backgroundColor:
                              item.isActive === true
                                ? "green"
                                : item.isActive === false && "#A020F0",
                          }}
                          className="px-2 py-1 w-min rounded-lg text-white text-xs text-center"
                        >
                          {item.isActive === true ? t('userDetails.active') : t('userDetails.inactive')}
                        </div>
                      )
                    }
                  />
                  <DetailCell
                    ignoreIfEmpty={true}
                    label={t('userDetails.expired')}
                    value={
                      (new Date() > new Date(item.endedAt) ? (
                        <div
                          style={{
                            backgroundColor: "red",
                          }}
                          className="px-2 py-1 w-min rounded-lg text-white text-xs text-center"
                        >
                          {t('userDetails.yes')}
                        </div>
                      ) : (
                        <div
                          style={{
                            backgroundColor: "green",
                          }}
                          className="px-2 py-1 w-min rounded-lg text-white text-xs text-center"
                        >
                          {t('userDetails.no')}
                        </div>
                      ))
                    }
                  />
                  <DetailCell
                    ignoreIfEmpty={true}
                    label={t('userDetails.action')}
                    value={
                      <>
                        {item?.isActive === false && (
                          <button
                            style={{
                              backgroundColor: "green",
                            }}
                            className="px-2 py-1 w-min rounded-lg text-white text-xs text-center"
                            onClick={() => {
                              enableUserPlanModal({
                                onConfirm: () => {
                                  enableUserPlan(
                                    parseInt(item?.users_plans_id)
                                  );
                                },
                              });
                            }}
                            disabled={isDisablingUserPlan || isEnablingUserPlan}
                          >
                            {t('userDetails.enable')}
                          </button>
                        )}
                        {item?.isActive && (
                          <button
                            style={{
                              backgroundColor: "red",
                            }}
                            className="px-2 py-1 w-min rounded-lg text-white text-xs text-center"
                            onClick={() => {
                              disableUserPlanModal({
                                onConfirm: () => {
                                  disableUserPlan(
                                    parseInt(item?.users_plans_id)
                                  );
                                },
                              });
                            }}
                            disabled={isDisablingUserPlan || isEnablingUserPlan}
                          >
                            {t('userDetails.disable')}
                          </button>
                        )}
                      </>
                    }
                  />
                </div>
              ))}
            </div>
          </Panel>
        </div>
        <div className="flex flex-col gap-9">
          <Panel
            title={t('userDetails.purchasedTools')}
            sideActions={
              <DataNavigateItem
                setPage={setPurchasedToolPage}
                data={purchasedToolsData}
                isFetching={isPurchasedToolsDataFetching}
                page={purchasedToolPage}
              />
            }
            containerClassName="px-7 py-4 bg-[linear-gradient(270deg,_#4f008c,_#190237,_#190237)]"
          >
            <div className="grid gap-4">
              {purchasedToolsData?.userToolData.length === 0 && (
                <p className="text-center">{t('userDetails.noData')}</p>
              )}
              {purchasedToolsData?.userToolData?.map((item: any) => (
                <div className="border rounded-md grid grid-cols-2 p-4 gap-3">
                  <DetailCell
                    ignoreIfEmpty={true}
                    label={t('userDetails.purchasedAt')}
                    value={fullDateTimeFormat(item.createdAt) || "none"}
                  />
                  <DetailCell
                    ignoreIfEmpty={true}
                    label={t('userDetails.endedAt')}
                    value={fullDateTimeFormat(item.endedAt) || "none"}
                  />
                  <DetailCell
                    ignoreIfEmpty={true}
                    label={t('userDetails.toolName')}
                    value={item.tool_name || "none"}
                  />
                  <DetailCell
                    ignoreIfEmpty={true}
                    label={t('userDetails.isActive')}
                    value={
                      (
                        <div
                          style={{
                            backgroundColor:
                              item.isActive === true
                                ? "green"
                                : item.isActive === false && "#A020F0",
                          }}
                          className="px-2 py-1 w-min rounded-lg text-white text-xs text-center"
                        >
                          {item.isActive === true ? t('userDetails.active') : t('userDetails.inactive')}
                        </div>
                      )
                    }
                  />
                  <DetailCell
                    ignoreIfEmpty={true}
                    label={t('userDetails.expired')}
                    value={
                      (new Date() > new Date(item.endedAt) ? (
                        <div
                          style={{
                            backgroundColor: "red",
                          }}
                          className="px-2 py-1 w-min rounded-lg text-white text-xs text-center"
                        >
                          {t('userDetails.yes')}
                        </div>
                      ) : (
                        <div
                          style={{
                            backgroundColor: "green",
                          }}
                          className="px-2 py-1 w-min rounded-lg text-white text-xs text-center"
                        >
                          {t('userDetails.no')}
                        </div>
                      ))
                    }
                  />
                  <DetailCell
                    ignoreIfEmpty={true}
                    label={t('userDetails.action')}
                    value={
                      <>
                        {item?.isActive === false && (
                          <button
                            style={{
                              backgroundColor: "green",
                            }}
                            className="px-2 py-1 w-min rounded-lg text-white text-xs text-center"
                            onClick={() => {
                              enableUserToolModal({
                                onConfirm: () => {
                                  enableUserTool(
                                    parseInt(item?.users_tools_id)
                                  );
                                },
                              });
                            }}
                            disabled={isDisablingUserTool || isEnablingUserTool}
                          >
                            {t('userDetails.enable')}
                          </button>
                        )}
                        {item?.isActive && (
                          <button
                            style={{
                              backgroundColor: "red",
                            }}
                            className="px-2 py-1 w-min rounded-lg text-white text-xs text-center"
                            onClick={() => {
                              disableUserToolModal({
                                onConfirm: () => {
                                  disableUserTool(
                                    parseInt(item?.users_tools_id)
                                  );
                                },
                              });
                            }}
                            disabled={isDisablingUserTool || isEnablingUserTool}
                          >
                            {t('userDetails.disable')}
                          </button>
                        )}
                      </>
                    }
                  />
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="flex flex-col gap-9">
          {/* <Panel title={"Identiteitsgegevens"} containerClassName="px-7 py-4">
            <IdentityDetails userId={parseInt(userId)} />
          </Panel>
          <Panel title={"Adresgegevens"} containerClassName="px-7 py-4">
            <AddressDetails userId={parseInt(userId)} />
          </Panel>
          <Panel
            title={"Medisch Dossier"}
            containerClassName="px-7 py-4"
            sideActions={
              <LinkButton
                text={"Volledig Medisch Dossier"}
                href={`${userId}/medical-record`}
              />
            }
          >
            <MedicalRecordSummary userId={parseInt(userId)} />
          </Panel>
          <Panel
            title={"Rapporten"}
            containerClassName="px-7 py-4"
            sideActions={
              <LinkButton
                text={"Volledige Rapporten"}
                href={`${userId}/reports-record/reports`}
              />
            }
          >
            <ReportsSummary userId={parseInt(userId)} />
          </Panel>
          <Panel
            title={"Documenten"}
            containerClassName="px-7 py-4"
            sideActions={
              <LinkButton
                text={"Volledige Documenten"}
                href={`${userId}/document`}
              />
            }
          >
            <DocumentsSummary userId={parseInt(userId)} />
          </Panel> */}
        </div>
      </div>
    </>
  );
};

export default UserDetailsPage;
