"use client";

import React, { FunctionComponent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useOrdersList } from "@/utils/order/getOrdersList";
import { useDenyOrder } from "@/utils/order/denyOrder";
import Panel from "@/components/Panel";
import Table from "@/components/Table";
import LinkButton from "@/components/buttons/LinkButton";
import IconButton from "@/components/buttons/IconButton";
import CheckIcon from "@/components/icons/CheckIcon";
import TrashIcon from "@/components/icons/TrashIcon";
import { useModal } from "@/components/providers/ModalProvider";
import { getDangerActionConfirmationModal } from "@/components/Modals/DangerActionConfirmation";
import PencilSquare from "@/components/icons/PencilSquare";
import { fullDateTimeFormat } from "@/utils/timeFormatting";
import XMarkIcon from "@/components/icons/XMarkIcon";
import DotsIcon from "@/components/icons/DotsIcon";
import { useIssuesList } from "@/utils/issue/getIssuesList";
import DataNavigateItem from "@/components/DataNavigateItem";
import { useUpdateIssue } from "@/utils/issue/updateIssue";
type Props = {
  params: { clientId: string };
}; 

const IssuesPage: FunctionComponent<Props> = ({ params: { clientId } }) => {
  const [page, setPage] = useState<number>(1);
  const [filter, setFilter] = useState<"orange" | "red" | "black">(null);

  const {
    isLoading,
    isError,
    data,
    refetch,
    isFetching: isListFetching,
  } = useIssuesList(page, filter);

  const {
    mutate: markIssue,
    isLoading: isMarking,
    isSuccess: isMarked,
  } = useUpdateIssue();

  const { open: openSolved } = useModal(
    getDangerActionConfirmationModal({
      msg: "Are you sure you want to mark this issue as solved ?",
      title: "Mark As Solved",
    })
  );

  const { open: openUnsolved } = useModal(
    getDangerActionConfirmationModal({
      msg: "Are you sure you want to mark this issue as unsolved ?",
      title: "Mark As Unsolved",
    })
  );

  useEffect(() => {
    refetch();
  }, [page, filter, isMarked]);

  const columnDef = useMemo(() => {
    return [
      {
        accessorKey: "createdAt",
        header: () => "When",
        cell: (info: any) => fullDateTimeFormat(info.getValue()) || "none",
      },
      {
        accessorKey: "issue_title",
        header: () => "Title",
        cell: (info: any) =>
          (
            <div className="flex gap-3">
              <div
                style={{
                  backgroundColor: info.getValue(),
                }}
                className="px-3 py-1 w-min whitespace-nowrap rounded-lg text-white text-sm text-center"
              >
                Issue Level
              </div>
              {info.row.original.isSeen && (
                <div className="px-3 py-1 bg-[#00FF00] w-min whitespace-nowrap rounded-lg text-black font-bold text-sm text-center">
                  Solved
                </div>
              )}
            </div>
          ) || "none",
      },
      {
        accessorKey: "issue_target",
        header: () => "Target",
        cell: (info: any) => info.getValue() || "none",
      },
      {
        accessorKey: "issue_description",
        header: () => "Description",
        cell: (info: any) => info.getValue() || "none",
      },
    ];
  }, []);

  return (
    <Panel
      title={"Issues List"}
      sideActions={
        <div className="flex gap-8 justify-center items-center">
          <DataNavigateItem
            setPage={setPage}
            data={data}
            isFetching={isListFetching}
            page={page}
          />
          <div
            onClick={() => {
              setPage(1);
              setFilter(null);
            }}
            className="w-6 h-6 bg-white border flex justify-center items-center rounded-md cursor-pointer"
          >
            X
          </div>
          <div
            onClick={() => {
              setPage(1);
              setFilter("orange");
            }}
            className="w-6 h-6 bg-[#FFA500] rounded-md cursor-pointer"
          ></div>
          <div
            onClick={() => {
              setPage(1);
              setFilter("red");
            }}
            className="w-6 h-6 bg-[#FF0000] rounded-md cursor-pointer"
          ></div>
          <div
            onClick={() => {
              setPage(1);
              setFilter("black");
            }}
            className="w-6 h-6 bg-[#000000] rounded-md cursor-pointer"
          ></div>
          {data && "Total Issues : " + data.dataCount}
        </div>
      }
    >
      {isLoading && <div className="p-4 sm:p-6 xl:p-7.5">Loading...</div>}
      {data?.issues?.length === 0 && (
        <div className="p-4 text-center sm:p-6 xl:p-7.5">
          No results to display.
        </div>
      )}
      {data && data?.issues?.length !== 0 && (
        <Table
          className=""
          onRowClick={(Row) => {

            if (Row.isSeen) {
              openUnsolved({
                onConfirm: () => {
                  let rowData = Row;
                  rowData.isSeen = false;
                  markIssue(rowData);
                },
              });
            } else {
              openSolved({
                onConfirm: () => {
                  let rowData = Row;
                  rowData.isSeen = true;
                  markIssue(rowData);
                },
              });
            }
          }}
          data={data.issues}
          columns={columnDef}
        />
      )}
      {isError && (
        <p role="alert" className="text-red text-sm p-5 font-bold">
          Cannot get data for some reason :(
        </p>
      )}
    </Panel>
  );
};

export default IssuesPage;
