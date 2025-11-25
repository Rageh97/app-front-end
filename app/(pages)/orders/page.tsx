"use client";

import React, { FunctionComponent, useEffect, useMemo } from "react";
import Panel from "@/components/Panel";
import Table from "@/components/Table";
import LinkButton from "@/components/buttons/LinkButton";
import { useMyInfo } from "@/utils/user-info/getUserInfo";
import { fullDateTimeFormat, fullDateFormat} from "@/utils/timeFormatting";
import LoadingButton from "@/components/LoadingButton";
import { useTranslation } from "react-i18next";

type Props = {
  params: { clientId: string };
};

const OrdersPage: FunctionComponent<Props> = ({ params: { clientId } }) => {
  const { data, isLoading, isFetching, isError, refetch } = useMyInfo();

  useEffect(() => {
    document.title = 'Orders';
  }, [])

  const { t } = useTranslation();

  const columnDef = useMemo(() => {
    return [
      // {
      //   accessorKey: "order_id",
      //   header: () => t("orders.orderId"),
      //   cell: (info) => info.getValue() || "none",
      // },
      {
        accessorKey: "product_name",
        header: () => t("orders.productName"),
        cell: (info) =>
          (
            <>
              {"1 " +
                info?.row?.original?.period +
                " of " +
                info?.row?.original?.product_name +
                (info?.row?.original?.product_type == "plan" ? " plan" : "")}
            </>
          ) || "none",
      },
      {
        accessorKey: "payment_method",
        header: () => t("orders.paymentMethod"),
        cell: (info) => {
          const paymentMethod = info.getValue();
          if (paymentMethod === "Zain") {
            return <img className="bg-[#35214f] rounded-xl p-2 inner-shadow" src="https://www2.0zz0.com/2025/07/02/21/357173052.png" alt="Zain" style={{width:"60px"}} />;
          } else if (paymentMethod === "FastPay") {
            return <img className="bg-[#35214f] rounded-xl p-2 inner-shadow" src="https://stock-pik.com/tools/unnamed%20(3).png" alt="FastPay" style={{width:"60px"}} />;
          } else if (paymentMethod === "AsiaSel") {
            return <img className="bg-[#35214f] rounded-xl p-2 inner-shadow" src="https://www2.0zz0.com/2025/07/02/22/684653137.png" alt="AsiaSel" style={{width:"60px"}} />;
          }
          else if (paymentMethod === "Alrafedeen") {
            return <img className="bg-[#35214f] rounded-xl p-2 inner-shadow" src="https://stock-pik.com/tools/unnamed%20(2).webp" alt="AsiaSel" style={{width:"60px"}} />;
          }else if (paymentMethod === "IraqBank") {
            return <img className="bg-[#35214f] rounded-xl p-2 inner-shadow" src="https://www2.0zz0.com/2025/07/02/22/627573215.jpg" alt="IraqBank" style={{width:"60px"}} />;
          }else if (paymentMethod === "AsiaPay") {
            return <img className="bg-[#35214f] rounded-xl p-2 inner-shadow" src="https://www2.0zz0.com/2025/07/02/21/255630149.png" alt="AsiaPay" style={{width:"60px"}} />;
          }
           else {
            return <span className="text-gray-500">None</span>;
          }
        },
      },
      {
        accessorKey: "payment_proof_url",
        header: () => t("orders.paymentProof"),
        cell: (info) => {
          const imageUrl = info.getValue();
          
          // Check if it's a PDF file
          if (imageUrl && typeof imageUrl === 'string' && imageUrl.toLowerCase().endsWith('.pdf')) {
            return (
              <div 
                className="bg-[#35214f] rounded-xl p-2 inner-shadow cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center"
                style={{ width: "40px", height: "40px" }}
                onClick={() => {
                  window.open(`${process.env.NEXT_PUBLIC_API_URL}${imageUrl}`, '_blank');
                }}
                title="Click to view PDF"
              >
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
              </div>
            );
          }
          
          // Display small icon for images
          if (imageUrl && typeof imageUrl === 'string' && imageUrl.length > 0) {
            return (
              <div 
                className="bg-[#35214f] rounded-xl p-2 inner-shadow cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center"
                style={{ width: "40px", height: "40px" }}
                onClick={() => {
                  // Open image in new tab for full view
                  // Check if it's already a full URL (Cloudinary) or needs API URL prepending
                  const fullUrl = imageUrl.startsWith('http') ? imageUrl : `${process.env.NEXT_PUBLIC_API_URL}${imageUrl}`;
                  window.open(fullUrl, '_blank');
                }}
                title="Click to view image"
              >
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              </div>
            );
          }
          
          // No proof available
          return <span className="text-gray-500 text-xs">No proof</span>;
        },
      },
      {
        accessorKey: "amount",
        header: () => t("orders.amount"),
        cell: (info) => "$" + info.getValue() || "none",
      },
      {
        accessorKey: "createdAt",
        header: () => t("orders.orderedAt"),
        cell: (info) => fullDateFormat(info.getValue()) || "none",
      },
      {
        accessorKey: "status",
        header: () => t("orders.status"),
        cell: (info) =>
          (
            <>
            <div className="flex items-center gap-1">
            <div
             
              className=" w-min inner-shadow bg-[#2e5164] whitespace-pre px-1 py-2 rounded-lg text-white text-xs lg:text-md text-center"
            >
              {(() => {
                const status = info.getValue();
                // Map the status to match our translation keys
                const statusMap = {
                  'On Hold': 'onHold',
                  'on hold': 'onHold',
                  'accepted': 'accepted',
                  'denied': 'denied',
                  'completed': 'completed'
                };
                const translationKey = `orders.${statusMap[status] || status.toLowerCase()}`;
                return t(translationKey);
              })()}
            </div>
            <div 
            className="w-3 h-3  rounded-full"
            style={{
              backgroundColor:
                info.getValue() === "accepted" || info.getValue() === "completed"
                  ? "green"
                  : info.getValue() === "denied"
                    ? "red"
                    : "orange",
            }}
            >

            </div>
            </div>
            </>
          ) || "none",
      },
    ];
  }, []);

  return (
    <Panel
  
      title={t("orders.ordersList")}
      sideActions={
        <>
        </>
      }
    >
      {isLoading && <div className="p-4 sm:p-6 xl:p-7.5">Loading...</div>}
      {data?.userOrdersData?.length === 0 && (
        <div className="p-4 text-center sm:p-6 xl:p-7.5">
          {t("orders.noOrders")}
        </div>
      )}
      {data && data?.userOrdersData?.length !== 0 && (
        <Table
        
          onRowClick={() => { }}
          data={data?.userOrdersData}
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

export default OrdersPage;
