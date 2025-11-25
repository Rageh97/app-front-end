"use client";

import React, { FunctionComponent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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
import { useGetUsersList } from "@/utils/users/getUsersList";
import InputField from "@/components/FormFields/InputField";
import { useSearchUserByEmail } from "@/utils/users/getUserByEmail";
import DataNavigateItem from "@/components/DataNavigateItem";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
type Props = {
  params: { clientId: string };
};

const UsersPage: FunctionComponent<Props> = ({ params: { clientId } }) => {
  const router = useRouter();
  const { t } = useTranslation();

  const [seachedEmail, setSearchedEmail] = useState<string>(null);
  const [page, setPage] = useState<number>(1);

  const {
    isLoading: isListLoading,
    isFetching: isListFetching,
    data,
    isError,
    refetch,
  } = useGetUsersList(page);

  const { isLoading: isSearching, data: searchedData } =
    useSearchUserByEmail(seachedEmail);

  useEffect(() => {
    refetch();
  }, [page]);

  const columnDef = useMemo(() => {
    return [
      {
        accessorKey: "first_name",
        header: () => "First Name",
        cell: (info) => info.getValue() || "none",
      },
      {
        accessorKey: "last_name",
        header: () => "Last Name",
        cell: (info) => info.getValue() || "none",
      },
      {
        accessorKey: "email",
        header: () => "Email Address",
        cell: (info) => info.getValue() || "none",
      },
      {
        accessorKey: "isActive",
        header: () => "Is Account Active",
        cell: (info) =>
          (
            <div
              style={{
                backgroundColor:
                  info.getValue() === true
                    ? "green"
                    : info.getValue() === false && "#A020F0",
              }}
              className="px-2 py-1 w-min rounded-lg text-white text-xs text-center"
            >
              {info.getValue() === true ? "Active" : "Inactive"}
            </div>
          ) || "none",
      },
      {
        accessorKey: "role",
        header: () => "Role",
        cell: (info) => {
          const role = info.getValue();
          let bgColor = "#0000ff"; // Default blue for client
          
          if (role === "admin") bgColor = "orange";
          else if (role === "manager") bgColor = "#008000"; // Green
          else if (role === "supervisor") bgColor = "#800080"; // Purple
          else if (role === "employee") bgColor = "#FF4500"; // Orange-red
          
          return (
            <div
              style={{ backgroundColor: bgColor }}
              className="px-2 py-1 w-min rounded-lg text-white text-xs text-center"
            >
              {role === "admin" ? "Admin" : 
               role === "manager" ? "Manager" : 
               role === "supervisor" ? "Supervisor" : 
               role === "employee" ? "Employee" : "Client"}
            </div>
          ) || "none";
        },
      },
      {
        accessorKey: "createdAt",
        header: () => "Joined At",
        cell: (info) => fullDateTimeFormat(info.getValue()) || "none",
      },
    ];
  }, []);

  const SideActions = () => {
    return (
      <div className="flex gap-4">
        <div className="flex  gap-4 justify-center items-center">
          {isListFetching && (
            <div className="inline-block h-[1.1rem] w-[1.1rem] animate-spin rounded-full border-[3px] border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          )}
          <button
          className="text-white"
            disabled={page === 1 || isListFetching}
            onClick={() => {
              setPage(page - 1);
            }}
          >
            Previous
          </button>
          {data?.currentPage}/{data?.totalPages}
          <button
          className="text-white"
            disabled={page === data?.totalPages || isListFetching}
            onClick={() => {
              setPage(page + 1);
            }}
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  return (
    <Panel
      title={t('admin.userList')}
      className="text-xs md:text-lg"
      sideActions={
        <div className="flex flex-col md:flex-row gap-3 md:gap-8  justify-center items-center">
           <div className="flex flex-col md:flex-row items-center gap-2 md:gap-5">
          <DataNavigateItem
         
            setPage={setPage}
            data={data}
            isFetching={isListFetching}
            page={page}
          />
          <p className="flex items-center text-xs md:text-sm text-white">{t('admin.userList')} {data?.dataCount}</p>
          </div>
         
           <div className="relative flex items-center">
           <Search className="absolute w-5 h-5 top-2.5 left-2.5  text-white" />

          <input
            placeholder={t('admin.Searchuserbyemail')}
            value={seachedEmail}
            onChange={(event) => {
              setSearchedEmail(event.target.value);
            }}
            className={
                 "sm:w-[350px] w-full bg-transparent placeholder:text-slate-400 text-slate-700 text-sm border border-white rounded-full pl-10 pr-3 py-2 transition duration-300 ease focus:outline-none focus:border-slate-400 hover:border-slate-300 shadow-sm focus:shadow"
              }
            />
           </div>
         
        </div>
      }
    >
      {isListLoading && <div className="p-4 sm:p-6 xl:p-7.5">Loading...</div>}
      {data && !seachedEmail && (
        <Table
          onRowClick={(Row) => {
            router.push(`/manage/users/${Row.user_id}`);
          }}
          data={data?.users}
          columns={columnDef}
        />
      )}

      {isSearching && <div className="p-4 sm:p-6 xl:p-7.5">Searching ...</div>}
      {searchedData && searchedData.length == 0 && (
        <div className="p-4 sm:p-6 xl:p-7.5">
          No data associated with the given email.
        </div>
      )}

      {searchedData && searchedData.length != 0 && (
        <Table
          onRowClick={(Row) => {
            router.push(`/manage/users/${Row.user_id}`);
          }}
          data={searchedData}
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

export default UsersPage;
