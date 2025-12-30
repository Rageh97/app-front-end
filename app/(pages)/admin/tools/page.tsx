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
import { useUpdateTool } from "@/utils/tool/updateTool";
import { toast } from "react-hot-toast";

import { Search } from "lucide-react";
type Props = {
  params: { clientId: string };
};

const ToolsPage: FunctionComponent<Props> = ({ params: { clientId } }) => {
  const { isLoading, isError, data, refetch } = useToolsList();
  const [seachedTool, setSearchedTool] = useState<string>(null);
  const { t } = useTranslation();

  const { mutate: updateTool } = useUpdateTool();

  const handleToggleActive = (tool: any) => {
    const updatedTool = {
      ...tool,
      isActive: !tool.isActive,
    };

    updateTool(updatedTool, {
      onSuccess: () => {
        toast.success(`${t("toolsForm.updateTool")}: ${updatedTool.isActive ? t("toolsTable.isActive") : t("toolsTable.isInactive")} 👍`);
        refetch();
      },
      onError: () => {
        toast.error(t("admin.failedToUpdateRole"));
      }
    });
  };

  const handleToggleStable = (tool: any) => {
    const updatedTool = {
      ...tool,
      isStable: !tool.isStable,
    };

    updateTool(updatedTool, {
      onSuccess: () => {
        toast.success(`${t("toolsForm.updateTool")}: ${updatedTool.isStable ? t("toolsTable.isStable") : t("toolsTable.isInStable")} 👍`);
        refetch();
      },
      onError: () => {
        toast.error(t("admin.failedToUpdateRole"));
      }
    });
  };

  const handleToggleFree = (tool: any) => {
    const updatedTool = {
      ...tool,
      isFree: !tool.isFree,
    };

    updateTool(updatedTool, {
      onSuccess: () => {
        toast.success(`${t("toolsForm.updateTool")}: ${updatedTool.isFree ? t("toolsTable.freeTool") : t("toolsTable.proTool")} 👍`);
        refetch();
      },
      onError: () => {
        toast.error(t("admin.failedToUpdateRole"));
      }
    });
  };

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
              className="rounded-lg w-12 h-12 object-cover"
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
      // {
      //   accessorKey: "tool_none_price_month",
      //   header: () => t("toolsTable.mNonePrice"),
      //   cell: (info) => (info.getValue() && "$" + info.getValue()) || "none",
      // },
      {
        accessorKey: "tool_month_price",
        header: () => t("toolsTable.mPrice"),
        cell: (info) => (info.getValue() && "$" + info.getValue()) || "none",
      },
      // {
      //   accessorKey: "tool_none_price_year",
      //   header: () => t("toolsTable.yNonePrice"),
      //   cell: (info) => (info.getValue() && "$" + info.getValue()) || "none",
      // },
      {
        accessorKey: "tool_year_price",
        header: () => t("toolsTable.yPrice"),
        cell: (info) => (info.getValue() && "$" + info.getValue()) || "none",
      },
      {
        accessorKey: "isActive",
        header: () => t("toolsTable.isActive"),
        cell: (info) => {
          const tool = info.row.original;
          const isActive = info.getValue() as boolean;
          return (
            <div className="flex items-center justify-center">
              <label 
                className="relative inline-flex items-center cursor-pointer group"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={isActive}
                  onChange={() => handleToggleActive(tool)}
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00c48c] hover:ring-4 hover:ring-white/10 transition-shadow"></div>
                <span className="ms-3 text-xs font-medium text-white/70 select-none hidden md:inline-block">
                  {isActive ? t("toolsTable.isActive") : t("toolsTable.isInactive")}
                </span>
              </label>
            </div>
          );
        },
      },
      {
        accessorKey: "isStable",
        header: () => t("toolsTable.isStable"),
        cell: (info) => {
          const tool = info.row.original;
          const isStable = info.getValue() as boolean;
          return (
            <div className="flex items-center justify-center">
              <label 
                className="relative inline-flex items-center cursor-pointer group"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={isStable}
                  onChange={() => handleToggleStable(tool)}
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00c48c] hover:ring-4 hover:ring-white/10 transition-shadow"></div>
                <span className="ms-3 text-xs font-medium text-white/70 select-none hidden md:inline-block">
                  {isStable ? t("toolsTable.isStable") : t("toolsTable.isInStable")}
                </span>
              </label>
            </div>
          );
        },
      },
      {
        accessorKey: "isFree",
        header: () => t("toolsTable.accessType"),
        cell: (info) => {
          const tool = info.row.original;
          const isFree = info.getValue() as boolean;
          return (
            <div className="flex items-center justify-center">
              <label 
                className="relative inline-flex items-center cursor-pointer group"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={isFree}
                  onChange={() => handleToggleFree(tool)}
                />
                <div className="w-11 h-6 bg-[#ff7702] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00c48c] hover:ring-4 hover:ring-white/10 transition-shadow"></div>
                <span className="ms-3 text-xs font-medium text-white/70 select-none hidden md:inline-block">
                  {isFree ? t("toolsTable.freeTool") : t("toolsTable.proTool")}
                </span>
              </label>
            </div>
          );
        },
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
  }, [data]);

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
