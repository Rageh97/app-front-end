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
  const { t } = useTranslation();

  // Filter successful orders only
  const successfulOrders = useMemo(() => {
    return data?.userOrdersData?.filter((order: any) => 
      order.status === "accepted" || order.status === "completed"
    ) || [];
  }, [data?.userOrdersData]);

  const columnDef = useMemo(() => {
    return [
      {
        accessorKey: "product_name",
        header: () => t("orders.productName"),
        cell: (info) =>
          (
            <div className="font-bold">
              {info?.row?.original?.product_name}
              <span className="text-[10px] block opacity-50 font-normal">
                {info?.row?.original?.period} subscription
              </span>
            </div>
          ),
      },
      {
        accessorKey: "payment_method",
        header: () => t("orders.paymentMethod"),
        cell: (info) => {
          const paymentMethod = info.getValue();
          const methodLogos: Record<string, string> = {
            'Zain': "https://www2.0zz0.com/2025/07/02/21/357173052.png",
            'FastPay': "https://stock-pik.com/tools/unnamed%20(3).png",
            'AsiaSel': "https://www2.0zz0.com/2025/07/02/22/684653137.png",
            'Alrafedeen': "https://stock-pik.com/tools/unnamed%20(2).webp",
            'IraqBank': "https://www2.0zz0.com/2025/07/02/22/627573215.jpg",
            'AsiaPay': "https://www2.0zz0.com/2025/07/02/21/255630149.png",
            'paytabs': "/images/visa-master.png"
          };
          
          if (methodLogos[paymentMethod]) {
            return <img className="bg-white/5 rounded-lg p-1 border border-white/5" src={methodLogos[paymentMethod]} alt={paymentMethod} style={{width:"45px"}} />;
          }
          return <span className="text-gray-500 font-mono text-xs uppercase">{paymentMethod || 'Online'}</span>;
        },
      },
      {
        accessorKey: "amount",
        header: () => t("orders.amount"),
        cell: (info) => (
          <span className="font-mono text-[#00c48c] font-bold">
            {info.getValue()} IQD
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: () => t("orders.orderedAt"),
        cell: (info) => (
          <div className="text-xs opacity-60">
            {fullDateFormat(info.getValue())}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: () => t("orders.status"),
        cell: (info) => (
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 rounded-full bg-[#00c48c]/10 border border-[#00c48c]/20 text-[#00c48c] text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(0,196,140,0.1)]">
              نشط
            </div>
            <div className="w-2 h-2 rounded-full bg-[#00c48c] animate-pulse shadow-[0_0_10px_#00c48c]" />
          </div>
        ),
      },
    ];
  }, [t]);

  return (
    <Panel
      title={t("orders.ordersList")}
      sideActions={<></>}
    >
      {isLoading && <div className="p-8 text-center text-white/40 italic">جاري تحميل طلباتك...</div>}
      
      {!isLoading && successfulOrders.length === 0 && (
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
            <svg className="w-8 h-8 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <p className="text-white/40 font-medium">لا توجد اشتراكات نشطة حالياً</p>
        </div>
      )}

      {!isLoading && successfulOrders.length !== 0 && (
        <Table
          onRowClick={() => { }}
          data={successfulOrders}
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
