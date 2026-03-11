import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import { useTranslation } from "react-i18next";
import { CreditCard, ShieldCheck, Zap, CheckCircle2, X, Phone, ArrowLeft } from "lucide-react";
import PayTabsPayment from "../Payments/PayTabsPayment";
import { BorderBeam } from "../ui/border-beam";
import Image from "next/image";
import { useMyInfo } from "@/utils/user-info/getUserInfo";
import axios from "axios";
import { Loader2 } from "lucide-react";

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
      window.location.reload();
    } catch (error) {
      console.error("Failed to activate", error);
      alert("Activation failed, please try again.");
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <Transition.Root show={modalOpen} as={Fragment}>
      <Dialog as="div" className="relative z-99999" onClose={() => setModalOpen(false)}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-[#0a0118]/90 backdrop-blur-xl transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-500"
              enterFrom="opacity-0 translate-y-20 scale-95"
              enterTo="opacity-100 translate-y-0 scale-100"
              leave="ease-in duration-300"
              leaveFrom="opacity-100 translate-y-0 scale-100"
              leaveTo="opacity-0 translate-y-20 scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-3xl bg-[#1a1129] border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] text-left transition-all w-full max-w-4xl scrollbar-hide">
                
                {/* Close Button */}
                <button
                  onClick={() => setModalOpen(false)}
                  className="absolute right-6 top-6 z-20 p-2 rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all duration-300"
                >
                  <X size={20} />
                </button>

                <div className="flex flex-col lg:flex-row h-full">
                  {/* Left Side: Product Info & Benefits */}
                  <div className="relative lg:w-[40%] bg-gradient-to-br from-[#4f008c] to-[#190237] p-8 md:p-12 text-white overflow-hidden">
                    {/* Animated Glow Background */}
                    <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#00c48c] rounded-full blur-[100px] opacity-20 animate-pulse" />
                    <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-[#ff7702] rounded-full blur-[100px] opacity-10" />

                    <div className="relative z-10 flex flex-col h-full">
                      <div className="flex items-center gap-3 mb-8">
                          <div className="relative w-fit rounded-full overflow-hidden">
                                       <Image
                                        src="/images/icon.png.png"
                                        alt="Logo"
                                        width={50}
                                        height={50}
                                        className="rounded-full"
                                      />
                                      <BorderBeam size={50} duration={1} className="rounded-full" />
                                     </div>
                        <span className="text-sm font-black uppercase tracking-[0.3em] text-white/50">Nexus Toolz</span>
                      </div>

                      <div className="mt-4">
                        <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-[#00c48c] text-[10px] font-black uppercase tracking-widest mb-4 border border-[#00c48c]/20">
                          اشتراك {period === 'year' ? 'سنوي' : period === 'month' ? 'شهري' : 'يومي'}
                        </span>
                        <h2 className="text-3xl font-black mb-4 leading-tight">
                          {productData?.tool_name || productData?.pack_name || productData?.plan_name || 'باقة متميزة'}
                        </h2>
                        <p className="text-white/60 text-sm leading-relaxed mb-8">
                          انضم الآن وتحكم في أدواتك بذكاء. أنت على بعد خطوة واحدة من تفعيل كامل الصلاحيات.
                        </p>
                      </div>

                      <div className="space-y-4 mt-auto pt-8 border-t border-white/10">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 size={18} className="text-[#00c48c]" />
                          <span className="text-xs font-medium text-white/80">تفعيل فوري للاشتراك</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle2 size={18} className="text-[#00c48c]" />
                          <span className="text-xs font-medium text-white/80">دعم فني مخصص 24/7</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle2 size={18} className="text-[#00c48c]" />
                          <span className="text-xs font-medium text-white/80">تحديثات دورية مجانية</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Checkout Form */}
                  <div className="lg:w-[60%] p-8 md:p-12 flex flex-col justify-center">
                    <div className="max-w-md mx-auto w-full">
                      <div className="mb-8">
                        <h3 className="text-2xl font-black text-white mb-2">الدفع الإلكتروني الآمن</h3>
                        <p className="text-white/40 text-sm">أدخل بياناتك لإتمام عملية الدفع</p>
                      </div>

                      {/* PayTabs Component */}
                      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-2">
                        <PayTabsPayment
                          period={period}
                          productType={productType as "tool" | "pack" | "credits"}
                          productData={productData}
                          productId={productId}
                        />
                      </div>

                      <div className="mt-8 flex items-center justify-center gap-4 py-4 px-6 bg-[#00c48c]/5 rounded-xl border border-[#00c48c]/10">
                        <ShieldCheck size={20} className="text-[#00c48c]" />
                        <p className="text-[11px] text-[#00c48c] font-black uppercase tracking-widest leading-none">
                          Secured & Encrypted Transaction
                        </p>
                      </div>

                      {isAdmin && (productType === "tool" || productType === "pack") && (
                        <div className="mt-4 flex flex-col items-center">
                          <button
                            onClick={handleAdminActivation}
                            disabled={isActivating}
                            className={`w-full group relative flex items-center justify-center gap-3 py-4.5 rounded-xl font-black text-white text-lg overflow-hidden transition-all duration-500 ${
                              isActivating
                                ? "bg-purple-600/40 cursor-not-allowed"
                                : "bg-purple-600 hover:bg-purple-700"
                            }`}
                          >
                            {isActivating ? (
                              <>
                                <Loader2 size={20} className="animate-spin" />
                                <span>جاري التفعيل...</span>
                              </>
                            ) : (
                              <>
                                <Zap size={22} className="group-hover:scale-110 transition-transform" />
                                تسجيل اشتراك مجاني (للمدير)
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
