import React, { useState, useEffect, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import api from "@/utils/api";
import { toast } from "react-hot-toast";
import { Loader2, Shield, Layers, Activity, Calendar, X } from "lucide-react";
import { ModalProps } from "@/types/modal-props";

type ProductType = "credits" | "tool" | "pack";
type Period = "day" | "month" | "year";

interface ToolOption {
  tool_id: number;
  tool_name: string;
}

interface PackOption {
  pack_id: number;
  pack_name: string;
}

interface PlanOption {
  plan_id: number;
  plan_name: string;
}

type Props = ModalProps & {
  email?: string;
  onSuccess?: () => void;
};

export const getDirectActivationModal = (props: Omit<Props, "open" | "onClose"> = {}) => {
  return (modalProps: ModalProps) => (
    <DirectActivationModal {...props} {...modalProps} />
  );
};

const DirectActivationModal: React.FC<Props> = ({
  open,
  onClose,
  email,
  onSuccess,
  additionalProps,
}) => {
  const targetEmail = additionalProps?.email || email;
  const targetOnSuccess = additionalProps?.onSuccess || onSuccess;

  const [productType, setProductType] = useState<ProductType>("credits");
  const [productId, setProductId] = useState<string>("");
  const [period, setPeriod] = useState<Period>("month");

  const [tools, setTools] = useState<ToolOption[]>([]);
  const [packs, setPacks] = useState<PackOption[]>([]);
  const [plans, setPlans] = useState<PlanOption[]>([]);

  const [loadingItems, setLoadingItems] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load items based on productType
  useEffect(() => {
    if (!open) return;

    const fetchItems = async () => {
      setLoadingItems(true);
      setProductId("");
      try {
        if (productType === "tool") {
          const response = await api.get("api/admin/get-tools");
          setTools(response.data || []);
        } else if (productType === "pack") {
          const response = await api.get("api/admin/get-packs");
          setPacks(response.data || []);
        } else if (productType === "credits") {
          const response = await api.get("api/credits/plans");
          setPlans(response.data || []);
        }
      } catch (error) {
        console.error(`Failed to fetch ${productType} items`, error);
        toast.error("فشل تحميل البيانات، تأكد من الاتصال بالخادم.");
      } finally {
        setLoadingItems(false);
      }
    };

    fetchItems();
  }, [productType, open]);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmail) {
      toast.error("البريد الإلكتروني للمستخدم مفقود.");
      return;
    }
    if (!productId) {
      toast.error("يرجى اختيار البند المراد تفعيله.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("api/admin/direct-activate-subscription", {
        email: targetEmail,
        productType,
        productId: parseInt(productId),
        period,
      });

      toast.success("تم تفعيل الاشتراك بنجاح للمستخدم! 🎉");
      if (targetOnSuccess) {
        targetOnSuccess();
      }
      onClose();
    } catch (error: any) {
      console.error("Failed to activate subscription", error);
      const errorMsg = error?.response?.data || "فشل تفعيل الاشتراك، حاول مرة أخرى.";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-99999" onClose={onClose}>
        {/* Overlay */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-[#0a0118]/80 backdrop-blur-md transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-xl bg-[#1a1129] border border-white/10 p-6 text-left shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] transition-all w-full max-w-lg scrollbar-hide text-white">
                
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-5">
                  <Dialog.Title as="h3" className="text-lg font-bold text-white">
                    تفعيل اشتراك يدوي
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-1 rounded-md bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleActivate} className="flex flex-col gap-4">
                  {/* Read-Only User Info */}
                  <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-md">
                    <p className="text-[10px] text-purple-400 font-bold mb-0.5">تفعيل الاشتراك للمستخدم:</p>
                    <p className="text-xs font-semibold text-white/90">{targetEmail}</p>
                  </div>

                  {/* Product Type Selector */}
                  <div>
                    <label className="block mb-1.5 text-xs font-bold text-slate-400">
                      نوع الاشتراك المطلوب تفعيله
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: "credits", label: "خطة (Ai)", icon: Activity },
                        { value: "tool", label: "أداة ", icon: Shield },
                        { value: "pack", label: "باقة كاملة", icon: Layers },
                      ].map((item) => {
                        const Icon = item.icon;
                        const isSelected = productType === item.value;
                        return (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => setProductType(item.value as ProductType)}
                            className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-md border-2 transition-all gap-1 ${
                              isSelected
                                ? "border-purple-500 bg-purple-500/10 text-white"
                                : "border-white/5 bg-white/5 text-slate-400 hover:border-white/10"
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="text-[9px] font-bold">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Item Selection Dropdown */}
                  <div>
                    <label className="block mb-1.5 text-xs font-bold text-slate-400">
                      {productType === "credits" ? "اختر الخطة (الرصيد)" : productType === "tool" ? "اختر الأداة" : "اختر الباقة"}
                    </label>
                    
                    <div className="relative">
                      {loadingItems ? (
                        <div className="flex items-center gap-2.5 py-2.5 px-4 rounded-md border border-white/10 bg-white/5">
                          <Loader2 className="animate-spin text-purple-400 w-4 h-4" />
                          <span className="text-xs text-slate-400">جاري تحميل العناصر...</span>
                        </div>
                      ) : (
                        <select
                          value={productId}
                          onChange={(e) => setProductId(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-md border border-white/10 bg-[#160b20] text-white focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all cursor-pointer text-xs"
                          required
                        >
                          <option value="">-- اختر من القائمة --</option>
                          {productType === "tool" &&
                            tools.map((t) => (
                              <option key={t.tool_id} value={t.tool_id}>
                                {t.tool_name}
                              </option>
                            ))}
                          {productType === "pack" &&
                            packs.map((p) => (
                              <option key={p.pack_id} value={p.pack_id}>
                                {p.pack_name}
                              </option>
                            ))}
                          {productType === "credits" &&
                            plans.map((pl) => (
                              <option key={pl.plan_id} value={pl.plan_id}>
                                {pl.plan_name}
                              </option>
                            ))}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Period Selector */}
                  <div>
                    <label className="block mb-1.5 text-xs font-bold text-slate-400">
                      فترة صلاحية التفعيل
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: "day", label: "يوم واحد" },
                        { value: "month", label: "شهر واحد" },
                        { value: "year", label: "سنة كاملة" },
                      ].map((item) => {
                        const isSelected = period === item.value;
                        return (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => setPeriod(item.value as Period)}
                            className={`flex items-center justify-center py-2 rounded-md border transition-all text-xs font-bold ${
                              isSelected
                                ? "border-purple-500 bg-purple-500/10 text-white"
                                : "border-white/5 bg-white/5 text-slate-400 hover:border-white/10"
                            }`}
                          >
                            <Calendar className="w-3.5 h-3.5 mr-1" />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Submit & Cancel Buttons */}
                  <div className="flex gap-2.5 mt-4 pt-3 border-t border-white/5">
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-1/3 py-2.5 rounded-md font-bold bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-all text-center text-xs"
                    >
                      إلغاء
                    </button>
                    
                    <button
                      type="submit"
                      disabled={isSubmitting || !productId}
                      className={`w-2/3 py-2.5 rounded-md font-black text-white shadow-xl transition-all flex items-center justify-center gap-1.5 text-xs ${
                        isSubmitting || !productId
                          ? "bg-purple-600/40 cursor-not-allowed text-white/50"
                          : "bg-purple-600 hover:bg-purple-700 hover:scale-[1.01]"
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="animate-spin w-3.5 h-3.5" />
                          <span>جاري التفعيل...</span>
                        </>
                      ) : (
                        <span>تفعيل الاشتراك</span>
                      )}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default DirectActivationModal;
