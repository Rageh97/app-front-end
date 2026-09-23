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
import { useUpdateUserToolExpiry } from "@/utils/user-tool/updateUserToolExpiry";
import { useUpdateUserPlanExpiry } from "@/utils/user-plan/updateUserPlanExpiry";
import { useUpdateUserPackExpiry } from "@/utils/user-pack/updateUserPackExpiry";
import { getEditExpiryModal } from "@/components/Modals/EditExpiryModal";
import PencilSquare from "@/components/icons/PencilSquare";
import TrashIcon from "@/components/icons/TrashIcon";
import { useImpersonateUser } from "@/utils/users/impersonateUser";
import { toast } from "react-hot-toast";
import { getDirectActivationModal } from "@/components/Modals/DirectActivationModal";
import { useGetUsersPurchasedCreditsList } from "@/utils/user-credit/getUsersPurchasedCredits";
import { useDisableUserCredit } from "@/utils/user-credit/disableUserCredit";
import { useEnableUserCredit } from "@/utils/user-credit/enableUserCredit";
import { useUpdateUserCreditExpiry } from "@/utils/user-credit/updateUserCreditExpiry";
import { useDeleteUserCredit } from "@/utils/user-credit/deleteUserCredit";
import { useDeleteUserTool } from "@/utils/user-tool/deleteUserTool";
import { useDeleteUserPack } from "@/utils/user-pack/deleteUserPack";
import { useDeleteUserPlan } from "@/utils/user-plan/deleteUserPlan";

type Props = {
  params: { userId: string };
};

const UserDetailsPage: FunctionComponent<Props> = ({ params: { userId } }) => {
  const { t } = useTranslation();
  const router = useRouter();

  const [purchasedToolPage, setPurchasedToolPage] = useState<number>(1);
  const [purchasedPlanPage, setPurchasedPlanPage] = useState<number>(1);
  const [purchasedPackPage, setPurchasedPackPage] = useState<number>(1);
  const [purchasedCreditPage, setPurchasedCreditPage] = useState<number>(1);

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
    data: purchasedCreditsData,
    isFetching: isPurchasedCreditsDataFetching,
    isLoading: isPurchasedCreditsDataLoading,
    isError: isPurchasedCreditsDataError,
    refetch: refetchPurchasedCreditsData,
  } = useGetUsersPurchasedCreditsList(purchasedCreditPage, parseInt(userId));

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

  const {
    mutate: disableUserCredit,
    isLoading: isDisablingUserCredit,
    isSuccess: isDisabledUserCredit,
  } = useDisableUserCredit(parseInt(userId));

  const {
    mutate: enableUserCredit,
    isLoading: isEnablingUserCredit,
    isSuccess: isEnabledUserCredit,
  } = useEnableUserCredit(parseInt(userId));

  const {
    mutate: deleteUserCredit,
    isLoading: isDeletingUserCredit,
    isSuccess: isDeletedUserCredit,
  } = useDeleteUserCredit(parseInt(userId));

  const { mutate: updateUserCreditExpiry, isLoading: isUpdatingUserCreditExpiry } = useUpdateUserCreditExpiry();

  const {
    mutate: deleteUserTool,
    isLoading: isDeletingUserTool,
    isSuccess: isDeletedUserTool,
  } = useDeleteUserTool(parseInt(userId));

  const {
    mutate: deleteUserPack,
    isLoading: isDeletingUserPack,
    isSuccess: isDeletedUserPack,
  } = useDeleteUserPack(parseInt(userId));

  const {
    mutate: deleteUserPlan,
    isLoading: isDeletingUserPlan,
    isSuccess: isDeletedUserPlan,
  } = useDeleteUserPlan(parseInt(userId));

  const { mutate: updateUserToolExpiry, isLoading: isUpdatingUserToolExpiry } = useUpdateUserToolExpiry();
  const { mutate: updateUserPlanExpiry, isLoading: isUpdatingUserPlanExpiry } = useUpdateUserPlanExpiry();
  const { mutate: updateUserPackExpiry, isLoading: isUpdatingUserPackExpiry } = useUpdateUserPackExpiry();

  const { mutate: impersonate, isLoading: isImpersonating } = useImpersonateUser();

  useEffect(() => {
    refetchUser();
  }, [isEnabled, isDisabled]);

  useEffect(() => {
    setTimeout(() => {
      refetchPurchasedToolsData();
    }, 1000);
  }, [purchasedToolPage, isDisabledUserTool, isEnabledUserTool, isDeletedUserTool]);

  useEffect(() => {
    setTimeout(() => {
      refetchPurchasedPlansData();
    }, 1000);
  }, [purchasedPlanPage, isDisabledUserPlan, isEnabledUserPlan, isDeletedUserPlan]);

  useEffect(() => {
    setTimeout(() => {
      refetchPurchasedPacksData();
    }, 1000);
  }, [purchasedPackPage, isDisabledUserPack, isEnabledUserPack, isDeletedUserPack]);

  useEffect(() => {
    setTimeout(() => {
      refetchPurchasedCreditsData();
    }, 1000);
  }, [purchasedCreditPage, isDisabledUserCredit, isEnabledUserCredit, isDeletedUserCredit]);

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

  const { open: deleteUserToolModal } = useModal(
    getDangerActionConfirmationModal({
      msg: t('userDetails.confirmDeleteTool'),
      title: t('userDetails.deleteUserTool'),
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

  const { open: deleteUserPlanModal } = useModal(
    getDangerActionConfirmationModal({
      msg: t('userDetails.confirmDeletePlan'),
      title: t('userDetails.deleteUserPlan'),
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

  const { open: deleteUserPackModal } = useModal(
    getDangerActionConfirmationModal({
      msg: t('userDetails.confirmDeletePack'),
      title: t('userDetails.deleteUserPack'),
    })
  );

  const { open: disableUserCreditModal } = useModal(
    getDangerActionConfirmationModal({
      msg: t('userDetails.confirmDisableCredit'),
      title: t('userDetails.disableUserCredit'),
    })
  );

  const { open: enableUserCreditModal } = useModal(
    getDangerActionConfirmationModal({
      msg: t('userDetails.confirmEnableCredit'),
      title: t('userDetails.enableUserCredit'),
    })
  );

  const { open: deleteUserCreditModal } = useModal(
    getDangerActionConfirmationModal({
      msg: t('userDetails.confirmDeleteCredit'),
      title: t('userDetails.deleteUserCredit'),
    })
  );

  const { open: openEditExpiryModal } = useModal(getEditExpiryModal());

  const { open: openDirectActivationModal } = useModal(
    getDirectActivationModal({
      email: user?.email || user?.userData?.email,
      onSuccess: () => {
        refetchPurchasedToolsData();
        refetchPurchasedPlansData();
        refetchPurchasedPacksData();
        refetchPurchasedCreditsData();
      }
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
                <IconButton
                  buttonType="Primary"
                  onClick={() => {
                    impersonate(parseInt(userId), {
                      onSuccess: (data) => {
                        localStorage.setItem("a", data.token);
                        localStorage.setItem("clientId1328", data.userClient);
                        toast.success("Logging in as " + data.user.first_name);
                        setTimeout(() => {
                           window.location.href = "/";
                        }, 500);
                      },
                      onError: () => {
                        toast.error("Failed to impersonate user");
                      }
                    });
                  }}
                  disabled={isImpersonating}
                  isLoading={isImpersonating}
                  title="Login as User"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                </IconButton>
                <IconButton
                  buttonType="Success"
                  onClick={() => {
                    openDirectActivationModal({});
                  }}
                  title="تفعيل اشتراك يدوي"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                </IconButton>
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
              {(() => {
                const uniquePacks = new Map();
                purchasedPacksData?.userPackData?.forEach((item: any) => {
                  const existing = uniquePacks.get(item.pack_id);
                  if (!existing || new Date(item.endedAt) > new Date(existing.endedAt)) {
                    uniquePacks.set(item.pack_id, item);
                  }
                });
                const deduplicatedPacks = Array.from(uniquePacks.values());

                if (deduplicatedPacks.length === 0) {
                  return <p className="text-center">{t('userDetails.noData')}</p>;
                }

                return deduplicatedPacks.map((item: any) => (
                  <div key={item.users_packs_id} className="border rounded-md grid grid-cols-2 p-4 gap-3">
                    <DetailCell
                      ignoreIfEmpty={true}
                      label={t('userDetails.purchasedAt')}
                      value={fullDateTimeFormat(item.createdAt) || "none"}
                    />
                    <DetailCell
                      ignoreIfEmpty={true}
                      label={t('userDetails.endedAt')}
                      value={
                        <div className="flex items-center gap-2">
                          <span>{fullDateTimeFormat(item.endedAt) || "none"}</span>
                          <button
                            onClick={() => {
                              openEditExpiryModal({
                                title: "تعديل المدة",
                                currentDate: item.endedAt,
                                onConfirm: (newDate: string) => {
                                  updateUserPackExpiry({
                                    userPackId: item.users_packs_id,
                                    endedAt: newDate
                                  });
                                },
                                isLoading: isUpdatingUserPackExpiry
                              });
                            }}
                            className="text-primary hover:text-primary/80 cursor-pointer"
                          >
                            <PencilSquare className="w-6 h-6" />
                          </button>
                        </div>
                      }
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
                        <div className="flex items-center gap-2">
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
                                backgroundColor: "#A020F0",
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
                          <button
                            style={{
                              backgroundColor: "#dc2626",
                            }}
                            className="px-2 py-1 w-min rounded-lg text-white text-xs text-center flex items-center gap-1 hover:bg-red-700 transition"
                            onClick={() => {
                              deleteUserPackModal({
                                onConfirm: () => {
                                  deleteUserPack(parseInt(item?.users_packs_id), {
                                    onSuccess: () => {
                                      toast.success("تم حذف اشتراك الباقة بنجاح");
                                      refetchPurchasedPacksData();
                                    },
                                    onError: () => {
                                      toast.error("فشل حذف اشتراك الباقة");
                                    }
                                  });
                                },
                              });
                            }}
                            disabled={isDeletingUserPack}
                            title="حذف اشتراك الباقة"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                            <span>{t('userDetails.delete')}</span>
                          </button>
                        </div>
                      }
                    />
                  </div>
                ));
              })()}
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
              {(() => {
                const uniquePlans = new Map();
                purchasedPlansData?.userPlanData?.forEach((item: any) => {
                  const existing = uniquePlans.get(item.plan_id || item.plan_name);
                  if (!existing || new Date(item.endedAt) > new Date(existing.endedAt)) {
                    uniquePlans.set(item.plan_id || item.plan_name, item);
                  }
                });
                const deduplicatedPlans = Array.from(uniquePlans.values());

                if (deduplicatedPlans.length === 0) {
                  return <p className="text-center">{t('userDetails.noData')}</p>;
                }

                return deduplicatedPlans.map((item: any) => (
                  <div key={item.users_plans_id} className="border rounded-md grid grid-cols-2 p-4 gap-3">
                    <DetailCell
                      ignoreIfEmpty={true}
                      label={t('userDetails.purchasedAt')}
                      value={fullDateTimeFormat(item.createdAt) || "none"}
                    />
                    <DetailCell
                      ignoreIfEmpty={true}
                      label={t('userDetails.endedAt')}
                      value={
                        <div className="flex items-center gap-2">
                          <span>{fullDateTimeFormat(item.endedAt) || "none"}</span>
                          <button
                            onClick={() => {
                              openEditExpiryModal({
                                title: "تعديل المدة",
                                currentDate: item.endedAt,
                                onConfirm: (newDate: string) => {
                                  updateUserPlanExpiry({
                                    userPlanId: item.users_plans_id,
                                    endedAt: newDate
                                  });
                                },
                                isLoading: isUpdatingUserPlanExpiry
                              });
                            }}
                            className="text-primary hover:text-primary/80 cursor-pointer"
                          >
                            <PencilSquare className="w-6 h-6" />
                          </button>
                        </div>
                      }
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
                        <div className="flex items-center gap-2">
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
                                backgroundColor: "#A020F0",
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
                          <button
                            style={{
                              backgroundColor: "#dc2626",
                            }}
                            className="px-2 py-1 w-min rounded-lg text-white text-xs text-center flex items-center gap-1 hover:bg-red-700 transition"
                            onClick={() => {
                              deleteUserPlanModal({
                                onConfirm: () => {
                                  deleteUserPlan(parseInt(item?.users_plans_id), {
                                    onSuccess: () => {
                                      toast.success("تم حذف اشتراك الخطة بنجاح");
                                      refetchPurchasedPlansData();
                                    },
                                    onError: () => {
                                      toast.error("فشل حذف اشتراك الخطة");
                                    }
                                  });
                                },
                              });
                            }}
                            disabled={isDeletingUserPlan}
                            title="حذف اشتراك الخطة"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                            <span>{t('userDetails.delete')}</span>
                          </button>
                        </div>
                      }
                    />
                  </div>
                ));
              })()}
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
              {(() => {
                const uniqueTools = new Map();
                purchasedToolsData?.userToolData?.forEach((item: any) => {
                  const existing = uniqueTools.get(item.tool_id);
                  if (!existing || new Date(item.endedAt) > new Date(existing.endedAt)) {
                    uniqueTools.set(item.tool_id, item);
                  }
                });
                const deduplicatedTools = Array.from(uniqueTools.values());

                if (deduplicatedTools.length === 0) {
                  return <p className="text-center">{t('userDetails.noData')}</p>;
                }

                return deduplicatedTools.map((item: any) => (
                  <div key={item.users_tools_id} className="border rounded-md grid grid-cols-2 p-4 gap-3">
                    <DetailCell
                      ignoreIfEmpty={true}
                      label={t('userDetails.purchasedAt')}
                      value={fullDateTimeFormat(item.createdAt) || "none"}
                    />
                    <DetailCell
                      ignoreIfEmpty={true}
                      label={t('userDetails.endedAt')}
                      value={
                        <div className="flex items-center gap-2">
                          <span>{fullDateTimeFormat(item.endedAt) || "none"}</span>
                          <button
                            onClick={() => {
                              openEditExpiryModal({
                                title: "تعديل المدة",
                                currentDate: item.endedAt,
                                onConfirm: (newDate: string) => {
                                  updateUserToolExpiry({
                                    userToolId: item.users_tools_id,
                                    endedAt: newDate
                                  });
                                },
                                isLoading: isUpdatingUserToolExpiry
                              });
                            }}
                            className="text-primary hover:text-primary/80 cursor-pointer"
                          >
                            <PencilSquare className="w-6 h-6" />
                          </button>
                        </div>
                      }
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
                        <div className="flex items-center gap-2">
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
                                backgroundColor: "#A020F0",
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
                          <button
                            style={{
                              backgroundColor: "#dc2626",
                            }}
                            className="px-2 py-1 w-min rounded-lg text-white text-xs text-center flex items-center gap-1 hover:bg-red-700 transition"
                            onClick={() => {
                              deleteUserToolModal({
                                onConfirm: () => {
                                  deleteUserTool(parseInt(item?.users_tools_id), {
                                    onSuccess: () => {
                                      toast.success("تم حذف اشتراك الأداة بنجاح");
                                      refetchPurchasedToolsData();
                                    },
                                    onError: () => {
                                      toast.error("فشل حذف اشتراك الأداة");
                                    }
                                  });
                                },
                              });
                            }}
                            disabled={isDeletingUserTool}
                            title="حذف اشتراك الأداة"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                            <span>{t('userDetails.delete')}</span>
                          </button>
                        </div>
                      }
                    />
                  </div>
                ));
              })()}
            </div>
          </Panel>
          <Panel
            title={t('userDetails.purchasedCredits')}
            sideActions={
              <DataNavigateItem
                setPage={setPurchasedCreditPage}
                data={purchasedCreditsData}
                isFetching={isPurchasedCreditsDataFetching}
                page={purchasedCreditPage}
              />
            }
            containerClassName="px-7 py-4 bg-[linear-gradient(270deg,_#4f008c,_#190237,_#190237)]"
          >
            <div className="grid gap-4">
              {(() => {
                const uniqueCredits = new Map();
                purchasedCreditsData?.userCreditData?.forEach((item: any) => {
                  const key = item.plan_id || item.plan_name;
                  const existing = uniqueCredits.get(key);
                  if (!existing || new Date(item.endedAt) > new Date(existing.endedAt)) {
                    uniqueCredits.set(key, item);
                  }
                });
                const deduplicatedCredits = Array.from(uniqueCredits.values());

                if (deduplicatedCredits.length === 0) {
                  return <p className="text-center">{t('userDetails.noData')}</p>;
                }

                return deduplicatedCredits.map((item: any) => (
                  <div key={item.users_credits_id} className="border rounded-md grid grid-cols-2 p-4 gap-3">
                    <DetailCell
                      ignoreIfEmpty={true}
                      label={t('userDetails.purchasedAt')}
                      value={fullDateTimeFormat(item.createdAt) || "none"}
                    />
                    <DetailCell
                      ignoreIfEmpty={true}
                      label={t('userDetails.endedAt')}
                      value={
                        <div className="flex items-center gap-2">
                          <span>{fullDateTimeFormat(item.endedAt) || "none"}</span>
                          <button
                            onClick={() => {
                              openEditExpiryModal({
                                title: "تعديل المدة",
                                currentDate: item.endedAt,
                                onConfirm: (newDate: string) => {
                                  updateUserCreditExpiry({
                                    userCreditId: item.users_credits_id,
                                    endedAt: newDate
                                  }, {
                                    onSuccess: () => {
                                      toast.success("تم تحديث تاريخ الانتهاء بنجاح");
                                      refetchPurchasedCreditsData();
                                    },
                                    onError: () => {
                                      toast.error("فشل تحديث تاريخ الانتهاء");
                                    }
                                  });
                                },
                                isLoading: isUpdatingUserCreditExpiry
                              });
                            }}
                            className="text-primary hover:text-primary/80 cursor-pointer"
                          >
                            <PencilSquare className="w-6 h-6" />
                          </button>
                        </div>
                      }
                    />
                    <DetailCell
                      ignoreIfEmpty={true}
                      label={t('userDetails.planName')}
                      value={item.plan_name || "AI Plan"}
                    />
                    <DetailCell
                      ignoreIfEmpty={true}
                      label={t('userDetails.remainingCredits')}
                      value={
                        <span className="font-semibold text-primary">
                          {Number(item.remaining_credits || 0).toLocaleString()} / {Number(item.total_credits || 0).toLocaleString()}
                        </span>
                      }
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
                        <div className="flex items-center gap-2">
                          {item?.isActive === false && (
                            <button
                              style={{
                                backgroundColor: "green",
                              }}
                              className="px-2 py-1 w-min rounded-lg text-white text-xs text-center"
                              onClick={() => {
                                enableUserCreditModal({
                                  onConfirm: () => {
                                    enableUserCredit(
                                      parseInt(item?.users_credits_id),
                                      {
                                        onSuccess: () => {
                                          toast.success("تم تفعيل باقة الـ AI بنجاح");
                                          refetchPurchasedCreditsData();
                                        },
                                        onError: () => {
                                          toast.error("فشل تفعيل باقة الـ AI");
                                        }
                                      }
                                    );
                                  },
                                });
                              }}
                              disabled={isDisablingUserCredit || isEnablingUserCredit}
                            >
                              {t('userDetails.enable')}
                            </button>
                          )}
                          {item?.isActive && (
                            <button
                              style={{
                                backgroundColor: "#A020F0",
                              }}
                              className="px-2 py-1 w-min rounded-lg text-white text-xs text-center"
                              onClick={() => {
                                disableUserCreditModal({
                                  onConfirm: () => {
                                    disableUserCredit(
                                      parseInt(item?.users_credits_id),
                                      {
                                        onSuccess: () => {
                                          toast.success("تم إيقاف باقة الـ AI مؤقتاً");
                                          refetchPurchasedCreditsData();
                                        },
                                        onError: () => {
                                          toast.error("فشل إيقاف باقة الـ AI");
                                        }
                                      }
                                    );
                                  },
                                });
                              }}
                              disabled={isDisablingUserCredit || isEnablingUserCredit}
                            >
                              {t('userDetails.disable')}
                            </button>
                          )}
                          <button
                            style={{
                              backgroundColor: "#dc2626",
                            }}
                            className="px-2 py-1 w-min rounded-lg text-white text-xs text-center flex items-center gap-1 hover:bg-red-700 transition"
                            onClick={() => {
                              deleteUserCreditModal({
                                onConfirm: () => {
                                  deleteUserCredit(parseInt(item?.users_credits_id), {
                                    onSuccess: () => {
                                      toast.success("تم حذف باقة الـ AI بنجاح");
                                      refetchPurchasedCreditsData();
                                    },
                                    onError: () => {
                                      toast.error("فشل حذف باقة الـ AI");
                                    }
                                  });
                                },
                              });
                            }}
                            disabled={isDeletingUserCredit}
                            title="حذف باقة الـ AI"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                            <span>{t('userDetails.delete')}</span>
                          </button>
                        </div>
                      }
                    />
                  </div>
                ));
              })()}
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
