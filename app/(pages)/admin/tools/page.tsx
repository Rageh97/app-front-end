"use client";

import React, { FunctionComponent, useMemo, useState } from "react";
import Link from "next/link";
import { useToolsList } from "@/utils/tool/getToolsList";
import { useDeleteTool } from "@/utils/tool/deleteTool";
import Panel from "@/components/Panel";
import Table from "@/components/Table";
import LinkButton from "@/components/buttons/LinkButton";
import IconButton from "@/components/buttons/IconButton";
import CheckIcon from "@/components/icons/CheckIcon";
import TrashIcon from "@/components/icons/TrashIcon";
import { useModal } from "@/components/providers/ModalProvider";
import { getDangerActionConfirmationModal } from "@/components/Modals/DangerActionConfirmation";
import PencilSquare from "@/components/icons/PencilSquare";
import { checkIfImageUrl } from "@/utils/imageValidator";
import { useSearchToolByName } from "@/utils/tool/getToolByName";
import { useTranslation } from "react-i18next";

import { Search } from "lucide-react";
type Props = {
  params: { clientId: string };
};

const ToolsPage: FunctionComponent<Props> = ({ params: { clientId } }) => {
  const { isLoading, isError, data } = useToolsList();
  const [seachedTool, setSearchedTool] = useState<string>(null);
  const { t } = useTranslation();

  const {
    mutate: deleteTool,
    isLoading: isDeleting,
    isSuccess: isDeleted,
  } = useDeleteTool();

  const { open } = useModal(
    getDangerActionConfirmationModal({
      msg: t("toolsTable.deleteToolMsg"),
      title: t("toolsTable.deleteToolTitle"),
    })
  );

  const {
    isLoading: isSearching,
    isError: isSearchError,
    data: searchedData,
  } = useSearchToolByName(seachedTool);

  const columnDef = useMemo(() => {
    return [
      {
        accessorKey: "tool_image",
        header: () => t("toolsTable.picture"),
        cell: (info) => (
          <div>
            <img
              className="rounded-lg"
              src={
                checkIfImageUrl(info.getValue())
                  ? info.getValue()
                  : "/images/default_image.png"
              }
              alt="pic"
            />
          </div>
        ),
      },
      {
        accessorKey: "tool_name",
        header: () => t("toolsTable.name"),
        cell: (info) => info.getValue() || "none",
      },
      // {
      //   accessorKey: "tool_plan",
      //   header: () => t("toolsTable.plan"),
      //   cell: (info) => info.getValue() || "none",
      // },
      {
        accessorKey: "tool_day_price",
        header: () => t("toolsTable.dPrice"),
        cell: (info) => (info.getValue() && "$" + info.getValue()) || "none",
      },
      {
        accessorKey: "tool_none_price_month",
        header: () => t("toolsTable.mNonePrice"),
        cell: (info) => (info.getValue() && "$" + info.getValue()) || "none",
      },
      {
        accessorKey: "tool_month_price",
        header: () => t("toolsTable.mPrice"),
        cell: (info) => (info.getValue() && "$" + info.getValue()) || "none",
      },
      {
        accessorKey: "tool_none_price_year",
        header: () => t("toolsTable.yNonePrice"),
        cell: (info) => (info.getValue() && "$" + info.getValue()) || "none",
      },
      {
        accessorKey: "tool_year_price",
        header: () => t("toolsTable.yPrice"),
        cell: (info) => (info.getValue() && "$" + info.getValue()) || "none",
      },
      {
        accessorKey: "isActive",
        header: () => t("toolsTable.isActive"),
        cell: (info) =>
          (
            <div
              style={{
                backgroundColor:
                  info.getValue() === true
                    ? "green"
                    : info.getValue() === false && "#A020F0",
              }}
              className="px-3 py-1 rounded-lg text-white text-sm text-center"
            >
              {info.getValue() === true ? t("toolsTable.isActive") : t("toolsTable.isInactive")}
            </div>
          ) || "none",
      },
      {
        accessorKey: "isStable",
        header: () => t("toolsTable.isStable"),
        cell: (info) =>
          (
            <div
              style={{
                backgroundColor:
                  info.getValue() === true
                    ? "green"
                    : info.getValue() === false && "#A020F0",
              }}
              className="px-3 py-1 rounded-lg text-white text-sm text-center"
            >
              {info.getValue() === true ? t("toolsTable.isStable") : t("toolsTable.isInStable")}
            </div>
          ) || "none",
      },
      {
        accessorKey: "isFree",
        header: () => t("toolsTable.accessType"),
        cell: (info) => (
          <div
            className="px-3 py-1 rounded-lg text-white text-sm text-center"
            style={{
              backgroundColor: info.getValue() === true ? "#00c48c" : "#ff7702",
            }}
          >
            {info.getValue() === true ? t("toolsTable.freeTool") : t("toolsTable.proTool")}
          </div>
        ),
      },
      {
        accessorKey: "tool_id",
        header: () => t("toolsTable.actions"),
        cell: (info) => (
          <div className="flex justify-center gap-4">
            <IconButton
              buttonType="DarkBlue"
              className="gradient-border-Qs"
              onClick={() => {
                open({
                  onConfirm: () => {
                    deleteTool(info.getValue());
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
            <Link  href={`/manage/tools/${info.getValue() as number}/edit`}>
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
      title={t('admin.ToolsList')}
      sideActions={
        <div className="flex gap-8 flex-col md:flex-row justify-center items-center">
          <div className="relative flex items-center">
           <Search className="absolute w-5 h-5 top-2.5 left-2.5  text-white" />

          <input
            placeholder={t('admin.Searchtoolbyname')}
            value={seachedTool}
            onChange={(event) => {
              setSearchedTool(event.target.value);
            }}
            className={
                 "sm:w-[350px] w-full bg-transparent placeholder:text-slate-400 text-slate-700 text-sm border border-white rounded-full pl-10 pr-3 py-2 transition duration-300 ease focus:outline-none focus:border-slate-400 hover:border-slate-300 shadow-sm focus:shadow"
              }
            />
           </div>
           <div className="flex items-center justify-center w-[80%] mb-3 px-1 md:px-4 bg-[linear-gradient(135deg,_#4f008c,_#4f008c,_#190237)] skew-x-[-50deg] rounded-[15px] gradient-border-packet text-white">
         
          <LinkButton  text={t('admin.AddNewTool')} href={`/manage/tools/new`} />
        </div>
        </div>
      }
    >
      {isLoading && <div className="p-4 sm:p-6 xl:p-7.5">Loading...</div>}
      {data?.length === 0 && !seachedTool && (
        <div className="p-4 text-center sm:p-6 xl:p-7.5">
          No results to display.
        </div>
      )}
      {data && data?.length !== 0 && !seachedTool && (
        <Table
          onRowClick={() => {}}
          data={data.sort(
            (a: any, b: any) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )}
          columns={columnDef}
        />
      )}
      {isError ||
        (isSearchError && (
          <p role="alert" className="text-red text-sm p-5 font-bold">
            Cannot get data for some reason :(
          </p>
        ))}

      {isSearching && <div className="p-4 sm:p-6 xl:p-7.5">Searching ...</div>}
      {searchedData && searchedData.length == 0 && (
        <div className="p-4 sm:p-6 xl:p-7.5">
          No data associated with the given name.
        </div>
      )}

      {searchedData && searchedData.length != 0 && (
        <Table data={searchedData} columns={columnDef} />
      )}
    </Panel>
  );
};

export default ToolsPage;
