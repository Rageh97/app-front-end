import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import { useTranslation } from "react-i18next";
import { ShieldCheck, Zap, CheckCircle2, X } from "lucide-react";
import PayTabsPayment from "../Payments/PayTabsPayment";
import { BorderBeam } from "../ui/border-beam";
import Image from "next/image";
import { useMyInfo } from "@/utils/user-info/getUserInfo";
import axios from "axios";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import i18n from "@/i18n";

type Period = "month" | "year" | "day";

interface PaymentModalProps {
  productId: number;
  productData: any;
  productType: "tool" | "pack" | "device" | "credits";
  modalOpen: boolean;
  period: Period;
  setModalOpen: (open: boolean) => void;
  onBuySuccess: (method: string) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  modalOpen,
  setModalOpen,
  period,
  productId,
  productData,
  productType,
  onBuySuccess,
}) => {
  const { t } = useTranslation();
  const { data: userInfo } = useMyInfo();
  const isAdmin = userInfo?.userRole === "admin" || userInfo?.userRole === "manager";
  const [isActivating, setIsActivating] = useState(false);

  const handleAdminActivation = async () => {
    try {
      setIsActivating(true);
      const token = localStorage.getItem("a");
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/direct-activate-subscription`,
        {
          period,
          productType,
          productId,
        },
        {
          headers: {
            Authorization: token,
            "User-Client": (global as any).clientId1328 || "",
          },
        }
      );
      setModalOpen(false);
      toast.success("تم تفعيل الاشتراك بنجاح!", {
        duration: 3000,
        position: "top-center",
        style: {
          background: "#12141F",
          color: "#fff",
          border: "1px solid rgba(0, 196, 140, 0.3)",
        },
      });
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Failed to activate", error);
      toast.error("فشل التفعيل، يرجى المحاولة مرة أخرى.");
    } finally {
      setIsActivating(false);
    }
  };

  const periodLabel = period === 'year' ? 'سنوي' : period === 'month' ? 'شهري' : 'يومي';
  const productName = productData?.tool_name || productData?.pack_name || productData?.plan_name || 'باقة متميزة';

  return (
    <Transition.Root show={modalOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[999999]" onClose={() => setModalOpen(false)}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/85 backdrop-blur-xl transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-3 sm:p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95 translate-y-4"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-4"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-3xl bg-white dark:bg-[#0E1017] dark:border dark:border-zinc-800/90 shadow-2xl text-start transition-all w-full max-w-4xl">
                
                {/* Close Button */}
                <button
                  onClick={() => setModalOpen(false)}
                  className={`absolute top-4 ${i18n.language === 'ar' ? 'left-4 sm:top-6 sm:left-6' : 'right-4 sm:top-6 sm:right-6'} z-30 p-2 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white transition-all`}
                  title="Close"
                >
                  <X size={18} />
                </button>

                <div className="flex flex-col lg:flex-row">
                  {/* Left Side: Product Info & Benefits */}
                  <div className="relative lg:w-[42%] bg-slate-50 dark:bg-gradient-to-b dark:from-[#141724] dark:to-[#0A0C14] border-b lg:border-b-0 lg:border-e border-slate-200 dark:border-zinc-800/80 p-6 sm:p-9 flex flex-col justify-between overflow-hidden">
                    {/* Ambient Glow */}
                    <div className="hidden dark:block absolute -top-20 -left-20 w-60 h-60 bg-[#00c48c]/15 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10">
                      {/* Logo / Brand */}
                      <div className="flex items-center gap-3 mb-6">
                        <div className="relative w-fit rounded-full overflow-hidden">
                          <Image
                            src="/images/icon.png.png"
                            alt="Logo"
                            width={42}
                            height={42}
                            className="rounded-full"
                          />
                          <BorderBeam size={42} duration={2} className="rounded-full" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-zinc-300">Nexus Toolz</span>
                      </div>

                      {/* Product Tag & Title */}
                      <div className="mt-2">
                        <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 text-[#00c48c] text-[11px] font-bold tracking-wide mb-3 border border-emerald-500/20">
                          اشتراك {periodLabel}
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-2 leading-tight">
                          {productName}
                        </h2>
                        <p className="text-slate-500 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed mb-6">
                          احصل على وصول فوري ومباشر مع كامل الصلاحيات والميزات المتقدمة.
                        </p>
                      </div>
                    </div>

                    {/* Features List */}
                    <div className="relative z-10 space-y-3 pt-6 border-t border-slate-200 dark:border-zinc-800/80 mt-auto">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 size={16} className="text-[#00c48c] shrink-0" />
                        <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">تفعيل فوري وتلقائي للاشتراك</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 size={16} className="text-[#00c48c] shrink-0" />
                        <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">دعم فني واستجابة سريعة 24/7</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 size={16} className="text-[#00c48c] shrink-0" />
                        <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">تحديثات مستمرة وضمان تشغيل 100%</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Checkout Form */}
                  <div className="lg:w-[58%] p-6 sm:p-9 flex flex-col justify-center bg-white dark:bg-[#0E1017]">
                    <div className="max-w-md mx-auto w-full">
                      <div className="mb-6">
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-1">
                          الدفع الإلكتروني الآمن
                        </h3>
                        <p className="text-slate-500 dark:text-zinc-400 text-xs sm:text-sm">
                          أدخل بياناتك لإتمام عملية الدفع بأمان وتشفير عالي
                        </p>
                      </div>

                      {/* PayTabs Component Container */}
                      <div className="bg-slate-50 dark:bg-[#141724]/80 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-3 sm:p-4 shadow-sm">
                        <PayTabsPayment
                          period={period}
                          productType={productType as "tool" | "pack" | "credits"}
                          productData={productData}
                          productId={productId}
                        />
                      </div>

                      {/* Security Badge */}
                      <div className="mt-6 flex items-center justify-center gap-2.5 py-3 px-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-[#00c48c]">
                        <ShieldCheck size={18} className="shrink-0" />
                        <p className="text-[11px] font-bold uppercase tracking-wider leading-none">
                          Secured & Encrypted 256-bit Transaction
                        </p>
                      </div>

                      {/* Admin Quick Activation */}
                      {isAdmin && (productType === "tool" || productType === "pack" || productType === "credits") && (
                        <div className="mt-4 flex flex-col items-center">
                          <button
                            onClick={handleAdminActivation}
                            disabled={isActivating}
                            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 ${
                              isActivating
                                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                                : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20 active:scale-95"
                            }`}
                          >
                            {isActivating ? (
                              <>
                                <Loader2 size={16} className="animate-spin" />
                                <span>جاري التفعيل...</span>
                              </>
                            ) : (
                              <>
                                <Zap size={16} className="shrink-0" />
                                <span>تسجيل اشتراك فوري (للمدير)</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default PaymentModal;
