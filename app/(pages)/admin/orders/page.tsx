"use client";

import React, { FunctionComponent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useOrdersList } from "@/utils/order/getOrdersList";
import { useAcceptToolOrder } from "@/utils/order/acceptToolOrder";
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
import { useAcceptPlanOrder } from "@/utils/order/acceptPlanOrder";
import DataNavigateItem from "@/components/DataNavigateItem";
import { useAcceptDeviceOrder } from "@/utils/order/acceptDeviceOrder";
import { useAcceptCreditsOrder } from "@/utils/order/acceptCreditsOrder";
import { useTranslation } from "react-i18next";
import { Check, X } from "lucide-react";
import ImagePreviewModal from "@/components/Modals/ImagePreviewModal";

type Props = {
  params: { clientId: string };
};

const OrdersPage: FunctionComponent<Props> = ({ params: { clientId } }) => {
  const [page, setPage] = useState<number>(1);
  const [filter, setFilter] = useState<"On Hold" | "accepted" | "denied">(null);
  const { t } = useTranslation();

  const {
    isLoading,
    isFetching: isListFetching,
    isError,
    data,
    refetch,
  } = useOrdersList(page, filter);

  const {
    mutate: acceptToolOrder,
    isLoading: isAcceptingTool,
    isSuccess: isAcceptedTool,
  } = useAcceptToolOrder();

  const {
    mutate: acceptPlanOrder,
    isLoading: isAcceptingPlan,
    isSuccess: isAcceptedPlan,
  } = useAcceptPlanOrder();
const {
  mutate: acceptDeviceOrder,
  isLoading: isAcceptingDevice,
  isSuccess: isAcceptedDevice,
} = useAcceptDeviceOrder();
const {
  mutate: acceptCreditsOrder,
  isLoading: isAcceptingCredits,
  isSuccess: isAcceptedCredits,
} = useAcceptCreditsOrder();
  const {
    mutate: denyOrder,
    isLoading: isDenaying,
    isSuccess: isDenayed,
  } = useDenyOrder();

  const { open: openAcceptModal } = useModal(
    getDangerActionConfirmationModal({
      msg: t("orders.acceptOrderMsg"),
      title: t("orders.acceptOrder"),
    })
  );

  const { open: openDenyModal } = useModal(
    getDangerActionConfirmationModal({
      msg: t("orders.denyOrderMsg"),
      title: t("orders.denyOrder"),
    })
  );

  const { open: openImagePreview } = useModal(ImagePreviewModal);

  useEffect(() => {
    refetch();
  }, [isAcceptedTool, isAcceptedPlan, isAcceptedDevice, isAcceptedCredits, isDenayed, page, filter]);

  const columnDef = useMemo(() => {
    return [
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
        accessorKey: "product_name",
        header: () => t("orders.productName"),
        cell: (info) => info.getValue() || "none",
      },
      {
        accessorKey: "buyer_name",
        header: () => t("orders.buyer"),
        cell: (info) => info.getValue() || "none",
      },
      {
        accessorKey: "buyer_email",
        header: () => t("orders.buyerEmail"),
        cell: (info) => info.getValue() || "none",
      },
      {
        accessorKey: "period",
        header: () => t("orders.period"),
        cell: (info) => info.getValue() || "none",
      },
      {
        accessorKey: "amount",
        header: () => t("orders.amount"),
        cell: (info) => "$" + info.getValue() || "none",
      },
      {
        accessorKey: "createdAt",
        header: () => t("orders.orderedAt"),
        cell: (info) => fullDateTimeFormat(info.getValue()) || "none",
      },
      {
        accessorKey: "status",
        header: () => t("orders.status"),
        cell: (info) => (
          <div
            style={{
              backgroundColor:
                info.getValue() === "accepted" || info.getValue() === "completed"
                  ? "green"
                  : info.getValue() === "denied"
                    ? "red"
                    : "orange",
            }}
            className=" p-2 rounded-lg text-white text-sm text-center"
          >
            {(() => {
              const status = info.getValue();
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
        ),
      },
      {
        accessorKey: "payment_proof_url",
        header: () => t("orders.paymentProof"),
        cell: (info) => {
          const rawUrl = info.getValue();
          const isPdf = !!rawUrl && typeof rawUrl === 'string' && rawUrl.toLowerCase().endsWith('.pdf');
          const fullUrl = rawUrl
            ? (rawUrl.startsWith('http') ? rawUrl : `${process.env.NEXT_PUBLIC_API_URL}${rawUrl}`)
            : '';

          if (!rawUrl) return <span className="text-gray-500 text-xs">No proof</span>;

          return (
            <div 
              className="bg-[#35214f] rounded-xl p-2 inner-shadow cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center"
              style={{ width: "40px", height: "40px" }}
              onClick={() => {
                openImagePreview({ url: fullUrl, isPdf });
              }}
              title={isPdf ? "Click to view PDF" : "Click to view image"}
            >
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                {isPdf ? (
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                )}
              </svg>
            </div>
          );
        },
      },
      {
        accessorKey: "order_id",
        header: () => t("orders.action"),
        cell: (info) =>
          info?.row?.original?.status === "On Hold" &&
          info?.row?.original?.payment_method !== "paypal" && (
            <div className="flex justify-center gap-4">
              <IconButton
                buttonType="DarkBlue"
                className="gradient-border-Qs"
                onClick={() => {
                  openAcceptModal({
                    onConfirm: () => {
                      if (info.row.original.product_type === "tool") {
                        acceptToolOrder(info.getValue());
                      }
                      if (info.row.original.product_type === "pack") {
                        acceptPlanOrder(info.getValue());
                      }
                      if (info.row.original.product_type === "device") {
                        acceptDeviceOrder(info.getValue());
                      }
                      if (info.row.original.product_type === "credits") {
                        acceptCreditsOrder(info.getValue());
                      }
                    },
                  });
                }}
                disabled={isAcceptingTool || isAcceptingPlan || isAcceptingDevice || isAcceptingCredits}
                isLoading={isAcceptingTool || isAcceptingPlan || isAcceptingDevice || isAcceptingCredits}
              >
                <Check strokeWidth={4} className="w-5  h-5 text-[#00c48c] " />
              </IconButton>
              <IconButton
              className="gradient-border-Qs"
                buttonType="DarkBlue"
                onClick={() => {
                  openDenyModal({
                    onConfirm: () => {
                      denyOrder(info.getValue());
                    },
                  });
                }}
                disabled={isDenaying}
                isLoading={isDenaying}
              >
                <X strokeWidth={4} className="w-5 h-5 text-red" />
              </IconButton>
            </div>
          ),
      },
    ];
  }, []);

  return (
    <Panel
      title={t('admin.SubmittedOrdersList')}
      sideActions={
        <div className="flex flex-col md:flex-row gap-3 md:gap-8 justify-center items-center">
          <DataNavigateItem
            setPage={setPage}
            data={data}
            isFetching={isListFetching}
            page={page}
          />
          <div className="flex items-center gap-2">
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
              setFilter("On Hold");
            }}
            className="w-6 h-6 bg-[#FFA500] rounded-md cursor-pointer"
          ></div>
          <div
            onClick={() => {
              setPage(1);
              setFilter("accepted");
            }}
            className="w-6 h-6 bg-[#008000] rounded-md cursor-pointer"
          ></div>
          <div
            onClick={() => {
              setPage(1);
              setFilter("denied");
            }}
            className="w-6 h-6 bg-[#FF0000]  rounded-md cursor-pointer"
          ></div>
          </div>
          {data && <p className="text-white">{t('admin.TotalOrders')}  {data.dataCount}</p> }
        </div>
      }
    >
      {isLoading && <div className="p-4 sm:p-6 xl:p-7.5">Loading...</div>}
      {data?.orders?.length === 0 && (
        <div className="p-4 text-center sm:p-6 xl:p-7.5">
          No results to display.
        </div>
      )}
      {data && data?.orders?.length !== 0 && (
        <Table
          // onRowClick={(row) => {
          //   window.alert("Product Type : " + row.product_type);
          // }}
          data={data.orders}
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
