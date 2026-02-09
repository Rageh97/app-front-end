"use client";

import React, { FunctionComponent, useMemo, useState } from "react";
import Link from "next/link";
import { usePacksList } from "@/utils/pack/getPacksList";
import { useDeletePack } from "@/utils/pack/deletePack";
import Panel from "@/components/Panel";
import Table from "@/components/Table";
import IconButton from "@/components/buttons/IconButton";
import CheckIcon from "@/components/icons/CheckIcon";
import TrashIcon from "@/components/icons/TrashIcon";
import { useModal } from "@/components/providers/ModalProvider";
import { getDangerActionConfirmationModal } from "@/components/Modals/DangerActionConfirmation";
import PencilSquare from "@/components/icons/PencilSquare";
import { checkIfImageUrl } from "@/utils/imageValidator";
import LinkButton from "@/components/buttons/LinkButton";
import { useTranslation } from "react-i18next";

type Props = {
  params: { clientId: string };
};

const ToolsPage: FunctionComponent<Props> = ({ params: { clientId } }) => {
  const { isLoading, isError, data } = usePacksList();

  const {
    mutate: deletePack,
    isLoading: isDeleting,
    isSuccess: isDeleted,
  } = useDeletePack();
const { t } = useTranslation();
  const { open } = useModal(
    getDangerActionConfirmationModal({
      msg: t("packs.deletePackMsg"),
      title: t("packs.deletePackTitle"),
    })
  );


  const columnDef = useMemo(() => {
    return [
      {
        accessorKey: "pack_name",
        header: () => t("packs.name"),
        cell: (info) => info.getValue() || "none",
      },
      {
        accessorKey: "pack_tools",
        header: () => t("packs.toolsIncluded"),
        cell: (info) => JSON.parse(info.getValue()).length + " tools" || "none",
      },
      {
        accessorKey: "monthly_price",
        header: () => t("packs.mPrice"),
        cell: (info) => "IQD" + info.getValue() || "none",
      },
      {
        accessorKey: "yearly_price",
        header: () => t("packs.yPrice"),
        cell: (info) => "IQD" + info.getValue() || "none",
      },
      {
        accessorKey: "discount_percentage",
        header: () => t("packs.discount") || "Discount",
        cell: (info) => {
          const discount = info.getValue() as number;
          return discount > 0 ? (
            <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-sm font-semibold">
              {discount}%
            </span>
          ) : (
            <span className="text-gray-500">-</span>
          );
        },
      },
      {
        accessorKey: "creditPlans",
        header: () => t("packs.creditPlans"),
        cell: (info) => {
          const monthlyCreditPlan = info.row.original.monthlyCreditPlan;
          const yearlyCreditPlan = info.row.original.yearlyCreditPlan;
          const generalCreditPlan = info.row.original.creditPlan;
          
          return (
            <div className="space-y-1">
              {monthlyCreditPlan && (
                <div className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                  Monthly: {monthlyCreditPlan.plan_name} ({monthlyCreditPlan.credits_per_period} {t('credits.credits')})
                </div>
              )}
              {yearlyCreditPlan && (
                <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                  Yearly: {yearlyCreditPlan.plan_name} ({yearlyCreditPlan.credits_per_period} {t('credits.credits')})
                </div>
              )}
              {!monthlyCreditPlan && !yearlyCreditPlan && generalCreditPlan && (
                <div className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                  General: {generalCreditPlan.plan_name} ({generalCreditPlan.credits_per_period} {t('credits.credits')})
                </div>
              )}
              {!monthlyCreditPlan && !yearlyCreditPlan && !generalCreditPlan && (
                <span className="text-gray-500 text-xs">{t('packs.noCreditPlan')}</span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "isActive",
        header: () => t("packs.isActive"),
        cell: (info) =>
          (
            <div
              style={{
                backgroundColor:
                  info.getValue() === true
                    ? "green"
                    : info.getValue() === false && "#A020F0",
              }}
              className="px-3 py-1 w-min rounded-lg text-white text-sm text-center"
            >
              {info.getValue() === true ? t("packs.isActive") : t("packs.isInactive")}
            </div>
          ) || "none",
      },
      {
        accessorKey: "pack_id",
        header: () => t("packs.actions"),
        cell: (info) => (
          <div className="flex justify-center gap-4">
            <IconButton
              buttonType="DarkBlue"
              className="gradient-border-Qs"
              onClick={() => {
                open({
                  onConfirm: () => {
                    deletePack(info.getValue());
                  },
                });
              }}
              disabled={isDeleted}
              isLoading={isDeleting}
            >
              {isDeleted ? (
                <CheckIcon className="w-5 h-5 text-red" />
              ) : (
                <TrashIcon className="w-5 h-5 text-red" />
              )}
            </IconButton>
            <Link href={`/manage/packs/${info.getValue() as number}/edit`}>
              <IconButton className="gradient-border-Qs" buttonType="DarkBlue">
                <PencilSquare className="w-5 h-5 text-[#00c48c]" />
              </IconButton>
            </Link>
          </div>
        ),
      },
    ];
  }, []);

  return (
    <Panel
      title={t('admin.PacksList')}
      sideActions={
        <div className="flex gap-6 justify-center items-center">
            <div className="flex items-center justify-center w-full mb-3 px-1 md:px-4 bg-[linear-gradient(135deg,_#4f008c,_#4f008c,_#190237)] skew-x-[-50deg] rounded-[15px] gradient-border-packet text-white">
         
            <LinkButton  text={t('admin.AddNewPack')} href={`/manage/packs/new`} />
           </div>
      </div>
      }
    >
      {isLoading && <div className="p-4 sm:p-6 xl:p-7.5">Loading...</div>}
      {data?.length === 0 && (
        <div className="p-4 text-center sm:p-6 xl:p-7.5">
          No results to display.
        </div>
      )}
      {data && data?.length !== 0 && (
        <Table
          onRowClick={() => { }}
          data={data.sort(
            (a: any, b: any) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )}
          columns={columnDef}
        />
      )}
    </Panel>
  );
};

export default ToolsPage;
