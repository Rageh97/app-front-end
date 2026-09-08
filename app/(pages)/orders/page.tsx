"use client";

import React, { FunctionComponent, useMemo } from "react";
import Table from "@/components/Table";
import { useMyInfo } from "@/utils/user-info/getUserInfo";
import { fullDateFormat } from "@/utils/timeFormatting";
import { useTranslation } from "react-i18next";
import { Package, Calendar, CreditCard, CheckCircle2 } from "lucide-react";

type Props = {
  params: { clientId: string };
};

const methodLogos: Record<string, string> = {
  'Zain': "https://www2.0zz0.com/2025/07/02/21/357173052.png",
  'FastPay': "https://stock-pik.com/tools/unnamed%20(3).png",
  'AsiaSel': "https://www2.0zz0.com/2025/07/02/22/684653137.png",
  'Alrafedeen': "https://stock-pik.com/tools/unnamed%20(2).webp",
  'IraqBank': "https://www2.0zz0.com/2025/07/02/22/627573215.jpg",
  'AsiaPay': "https://www2.0zz0.com/2025/07/02/21/255630149.png",
  'paytabs': "/images/visa-master.png"
};

// Helper to translate and format subscription periods clearly in Arabic
const formatSubscriptionPeriod = (period?: string): string => {
  if (!period) return "اشتراك";
  const p = period.toLowerCase().trim();
  
  if (p.includes("month") || p === "1_month" || p === "30" || p === "monthly") {
    return "اشتراك شهري (30 يوم)";
  }
  if (p.includes("year") || p === "1_year" || p === "365" || p === "yearly" || p === "annual") {
    return "اشتراك سنوي (365 يوم)";
  }
  if (p.includes("day") || p === "1_day" || p === "daily" || p === "1" || p.includes("trial")) {
    return "تجربة يومية (1 يوم)";
  }
  if (p.includes("3_month") || p === "90") {
    return "اشتراك 3 أشهر";
  }
  if (p.includes("6_month") || p === "180") {
    return "اشتراك 6 أشهر";
  }
  if (p === "vip" || p === "gold") {
    return "باقة VIP الذهبية";
  }
  if (p === "premium") {
    return "باقة بريميوم";
  }
  if (p === "standard") {
    return "باقة ستاندرد";
  }
  return `اشتراك ${period}`;
};

const OrdersPage: FunctionComponent<Props> = () => {
  const { data, isLoading, isError } = useMyInfo();
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
        cell: (info: any) => {
          const order = info?.row?.original;
          const periodLabel = formatSubscriptionPeriod(order?.period);
          return (
            <div className="flex flex-col items-center md:items-start text-center md:text-right py-1">
              <span className="font-bold text-white text-sm">
                {order?.product_name || "منتج"}
              </span>
              <span className="text-[11px] text-[#00c48c] font-semibold mt-0.5">
                {periodLabel}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "payment_method",
        header: () => t("orders.paymentMethod"),
        cell: (info: any) => {
          const paymentMethod = info.getValue();
          if (methodLogos[paymentMethod]) {
            return (
              <div className="flex justify-center items-center">
                <img 
                  className="bg-white/5 rounded-md p-1 border border-zinc-800 object-contain h-7 w-auto" 
                  src={methodLogos[paymentMethod]} 
                  alt={paymentMethod} 
                />
              </div>
            );
          }
          return <span className="text-zinc-400 font-mono text-xs uppercase">{paymentMethod || 'Online'}</span>;
        },
      },
      {
        accessorKey: "amount",
        header: () => t("orders.amount"),
        cell: (info: any) => (
          <span className="font-mono text-[#00c48c] font-bold text-sm">
            {Number(info.getValue() || 0).toLocaleString()} IQD
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: () => t("orders.orderedAt"),
        cell: (info: any) => (
          <div className="text-xs text-zinc-400">
            {fullDateFormat(info.getValue())}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: () => t("orders.status"),
        cell: () => (
          <div className="flex justify-center items-center">
            {/* Clean Professional Status Badge without excessive glow */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>نشط</span>
            </span>
          </div>
        ),
      },
    ];
  }, [t]);

  return (
    <div className="w-full min-h-screen pb-16">
      {/* Dark Mode Header */}
      <div className="hidden dark:flex items-center gap-3 border-s-4 border-[#00c48c] ps-3 mb-8 mt-6">
        <h1 className="text-xl md:text-2xl font-extrabold animate-emerald-shimmer">
          {t("orders.ordersList")}
        </h1>
      </div>

      {/* Light Mode Header */}
      <div className="dark:hidden w-full mt-10 mb-6">
        <h2 className="w-full px-20 font-bold md:px-40 py-3 md:py-4 text-xl md:text-4xl text-white bg-[linear-gradient(135deg,#4f008c,#190237,#190237)] gradient-border-3 rounded-xl text-center">
          {t("orders.ordersList")}
        </h2>
      </div>

      {/* Orders Content Container */}
      <div className="w-full">
        {isLoading && (
          <div className="p-12 text-center text-zinc-400 text-sm">
            جاري تحميل سجل طلباتك...
          </div>
        )}
        
        {!isLoading && successfulOrders.length === 0 && (
          <div className="p-12 text-center flex flex-col items-center justify-center rounded-2xl bg-[#12141F] border border-zinc-800/80 my-4">
            <div className="w-16 h-16 bg-[#181B29] border border-zinc-800 rounded-2xl flex items-center justify-center mb-4 text-zinc-500">
              <Package size={28} />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              لا توجد طلبات سابقة
            </h3>
            <p className="text-xs text-zinc-400">
              عندما تقوم بالاشتراك في أي أداة أو باقة، ستظهر تفاصيل طلبك هنا.
            </p>
          </div>
        )}

        {!isLoading && successfulOrders.length !== 0 && (
          <>
            {/* ==================== DESKTOP TABLE VIEW (MD & UP) ==================== */}
            <div className="hidden md:block">
              <Table
                onRowClick={() => { }}
                data={successfulOrders}
                columns={columnDef}
              />
            </div>

            {/* ==================== MOBILE CARDS VIEW (SMALL SCREENS) ==================== */}
            <div className="md:hidden space-y-3.5">
              {successfulOrders.map((order: any, idx: number) => {
                const paymentMethod = order.payment_method;
                const periodLabel = formatSubscriptionPeriod(order.period);
                
                return (
                  <div 
                    key={order.order_id || idx}
                    className="p-4 rounded-2xl bg-[#12141F] border border-zinc-800/80 shadow-md flex flex-col gap-3"
                  >
                    {/* Top Row: Product Title & Status Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col">
                        <h4 className="font-bold text-white text-sm">
                          {order.product_name || "طلب اشتراك"}
                        </h4>
                        <span className="text-[11px] font-semibold text-[#00c48c] mt-0.5">
                          {periodLabel}
                        </span>
                      </div>
                      
                      {/* Clean Non-Glowing Status Pill */}
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>نشط</span>
                      </span>
                    </div>

                    {/* Middle Row: Payment Method & Amount */}
                    <div className="flex items-center justify-between pt-2.5 border-t border-zinc-800/60 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-400">وسيلة الدفع:</span>
                        {methodLogos[paymentMethod] ? (
                          <img 
                            className="h-5 w-auto rounded bg-white/5 p-0.5 border border-zinc-800 object-contain" 
                            src={methodLogos[paymentMethod]} 
                            alt={paymentMethod} 
                          />
                        ) : (
                          <span className="font-mono text-zinc-300 font-semibold uppercase">{paymentMethod || 'Online'}</span>
                        )}
                      </div>

                      <div className="font-mono font-bold text-[#00c48c] text-sm">
                        {Number(order.amount || 0).toLocaleString()} IQD
                      </div>
                    </div>

                    {/* Bottom Row: Ordered Date */}
                    <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} className="text-zinc-500" />
                        <span>تاريخ الطلب:</span>
                      </div>
                      <span>{fullDateFormat(order.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {isError && (
          <p role="alert" className="text-rose-400 text-xs p-5 font-bold text-center">
            حدث خطأ أثناء جلب بيانات الطلبات
          </p>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
