"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowRight, 
  Home, 
  ShieldCheck, 
  Copy,
  RefreshCcw,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";

type PaymentStatus = "success" | "failed" | "pending" | "loading";

function PaymentResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<PaymentStatus>("loading");
  const [tranRef, setTranRef] = useState<string>("");

  useEffect(() => {
    // PayTabs Response Codes
    // A = Success, H = Held/Review, P = Pending, D = Declined, E = Error, V = Voided, C = Cancelled
    const responseStatus = (searchParams.get("respStatus") || searchParams.get("resp_status") || "").toUpperCase();
    const ref = searchParams.get("tranRef") || searchParams.get("tran_ref") || "";
    setTranRef(ref);

    // 1. Quick initial guess from URL for better UX
    if (responseStatus === "A") {
      setStatus("success");
    } else if (["V", "E", "D", "C"].includes(responseStatus)) {
      setStatus("failed");
    } else if (["P", "H"].includes(responseStatus)) {
      setStatus("pending");
    }

    // 2. Perform absolute verification with backend (Security 1,000,000%)
    const verifyWithBackend = async () => {
      if (!ref) {
        setStatus("failed");
        return;
      }
      
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payment/paytabs-verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tranRef: ref }),
        });

        const data = await response.json();
        
        if (data.status === "success") {
          setStatus("success");
          toast.success("تم تأكيد العملية وآمان حسابك بنسبة 100%");
        } else if (data.status === "failed") {
          setStatus("failed");
        } else if (data.status === "pending") {
          setStatus("pending");
        }
      } catch (error) {
        console.error("Verification error:", error);
        // If API fails, we stick to the last known status or fallback to failed if it was success (security first)
        if (status === 'success') {
          // If it as success but we can't verify, it's safer to show pending/loading
          setStatus("pending");
        }
      }
    };

    if (ref) {
      verifyWithBackend();
    } else {
      setStatus("failed");
    }
  }, [searchParams]);

  const copyRef = () => {
    if (tranRef) {
      navigator.clipboard.writeText(tranRef);
      toast.success("تم نسخ رقم المرجع");
    }
  };

  const config = {
    success: {
      icon: <CheckCircle2 size={80} className="text-[#00c48c]" />,
      title: "عملية ناجحة",
      subtitle: "تم تفعيل اشتراكك بنجاح! شكرًا لثقتك بـ NEXUS.",
      description: "بإمكانك الآن البدء في استخدام كافة خدماتنا ومميزات خطتك المختارة.",
      color: "#00c48c",
      bgClass: "bg-[#00c48c]/5",
      borderClass: "border-[#00c48c]/20"
    },
    failed: {
      icon: <XCircle size={80} className="text-red-500" />,
      title: "فشل الدفع",
      subtitle: "عذرًا، لم يتم إتمام عملية الدفع.",
      description: "قد يكون السبب إلغاء العملية، أو خطأ في بيانات البطاقة، أو رصيد غير كافٍ. يرجى المحاولة مرة أخرى.",
      color: "#ef4444",
      bgClass: "bg-red-500/5",
      borderClass: "border-red-500/20"
    },
    pending: {
      icon: <Clock size={80} className="text-yellow-400" />,
      title: "قيد المراجعة",
      subtitle: "نحن في انتظار تأكيد العملية من البنك الخاص بك.",
      description: "ستظهر حالة اشتراكك في لوحة التحكم بمجرد استلام التأكيد البنكي أوتوماتيكيًا.",
      color: "#facc15",
      bgClass: "bg-yellow-400/5",
      borderClass: "border-yellow-400/20"
    },
    loading: {
      icon: <RefreshCcw size={60} className="text-white/20 animate-spin" />,
      title: "جاري التحقق...",
      subtitle: "يرجى عدم إغلاق الصفحة",
      description: "",
      color: "#ffffff",
      bgClass: "",
      borderClass: ""
    }
  };

  const current = config[status];

  return (
    <div className="min-h-screen bg-[#0d011d] flex items-center justify-center p-4 font-cairo">
      {/* Decorative subtle background */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-[#4f008c]/5 blur-[200px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-1/2 h-full bg-[#00c48c]/5 blur-[200px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-lg"
      >
        <div className="bg-[#150a24] border border-white/5 rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.5)] overflow-hidden">
          
          {/* Status Header */}
          <div className={`p-10 flex flex-col items-center text-center ${current.bgClass} border-b ${current.borderClass}`}>
             <motion.div
               initial={{ y: 10, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ delay: 0.2 }}
               className="mb-6 p-4 rounded-full bg-black/20"
             >
                {current.icon}
             </motion.div>
             <h1 className="text-3xl font-black text-white mb-2 tracking-tight">
               {current.title}
             </h1>
             <p className="text-white/80 font-bold mb-4">
               {current.subtitle}
             </p>
             <p className="text-white/40 text-sm leading-relaxed max-w-xs">
               {current.description}
             </p>
          </div>

          {/* Details Body */}
          <div className="p-8 space-y-6">
            <div className="space-y-4">
              
              <div className="flex items-center justify-between py-3 border-b border-white/5 text-sm">
                 <span className="text-white/40">توقيت المعاملة</span>
                 <span className="text-white opacity-80">{new Date().toLocaleTimeString('ar-EG')}</span>
              </div>
            </div>

            {/* <div className="flex items-start gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
               <AlertCircle size={16} className="text-white/20 mt-0.5 shrink-0" />
               <p className="text-white/40 text-[10px] leading-relaxed">
                 عند حدوث أي مشكلة أو استقطاع مبلغ دون تفعيل الاشتراك، يرجى تزويد الدعم الفني برقم المرجع الموضح أعلاه لضمان حقك.
               </p>
            </div> */}

            {/* Actions */}
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => router.push(status === "success" ? "/subscriptions" : "/dashboard")}
                className={`py-4.5 rounded-xl font-black text-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                  status === "success" 
                    ? "bg-[#00c48c] text-white shadow-[0_10px_20px_rgba(0,196,140,0.2)]" 
                    : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
                }`}
              >
                {status === "success" ? "  الذهاب لصفحة الاشتراك" : "عودة للرئيسية "}
                <ArrowRight size={20} />
              </button>

              
            </div>
          </div>
        </div>

        {/* Support Footer */}
        <div className="mt-8 flex flex-col items-center opacity-30">
           <div className="flex items-center gap-2 mb-2">
              <ShieldCheck size={14} className="text-white" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white">NEXUS Secure Transaction</span>
           </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0d011d]">
          <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-[#00c48c] animate-spin" />
        </div>
      }
    >
      <PaymentResultContent />
    </Suspense>
  );
}
