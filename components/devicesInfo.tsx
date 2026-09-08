import { usePacksList } from "@/utils/pack/getPacksList";
import React from "react";
import { Info, CheckCircle2, ShieldCheck } from "lucide-react";

const DeviceInfo = () => {
  const { isLoading, isError, data } = usePacksList();

  const aiPlan = data?.find((p: any) => p.pack_name.trim() === "AI Plan");
  const designersPlan = data?.find((p: any) => p.pack_name.trim() === "Designers plan");
  const allInOnePlan = data?.find((p: any) => p.pack_name.trim() === "All in One Plan");

  return (
    <div className="w-full max-w-6xl mx-auto my-12">
      {/* ==================== DARK MODE LUXURY INFO CARD ==================== */}
      <div className="hidden dark:flex flex-col md:flex-row items-center gap-8 p-6 sm:p-10 rounded-3xl bg-[#12141F] border border-zinc-800/80 shadow-2xl relative overflow-hidden">
        {/* Subtle Top Glow */}
        <div className="absolute top-0 inset-x-1/4 h-[1px] bg-gradient-to-r from-transparent via-[#00c48c]/50 to-transparent pointer-events-none" />

        {/* Illustration */}
        <div className="hidden lg:flex shrink-0 w-72 justify-center items-center">
          <img 
            className="w-full h-auto object-contain filter drop-shadow-[0_10px_20px_rgba(0,196,140,0.15)]" 
            src="/images/ppp-removebg-preview.png" 
            alt="Device Management" 
          />
        </div>

        {/* Info Content */}
        <div className="flex-1 text-right" dir="rtl">
          <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-zinc-800/60">
            <ShieldCheck size={22} className="text-[#00c48c]" />
            <h3 className="text-lg sm:text-xl font-extrabold text-white">
              معلومات وقواعد إدارة الأجهزة الإضافية
            </h3>
          </div>

          <div className="space-y-4 text-xs sm:text-sm text-zinc-300">
            {/* AI Plan */}
            <div className="p-3.5 rounded-xl bg-[#181B29] border border-zinc-800/60">
              <div className="flex items-center justify-between gap-2 mb-1.5 font-bold text-white">
                <span className="text-[#00c48c]">باقة الذكاء الاصطناعي (AI Plan)</span>
                <span className="text-zinc-400 font-mono text-xs">{aiPlan?.monthly_price || '—'} IQD / شهرياً</span>
              </div>
              <p className="text-zinc-400 leading-relaxed">
                • مناسبة للمستخدمين الذين يحتاجون أدوات أساسية مع إمكانية إضافة جهاز إضافي مقابل <span className="text-[#00c48c] font-bold">{aiPlan?.additional_device_price || '—'} IQD</span>.
              </p>
            </div>

            {/* Designers Plan */}
            {designersPlan && (
              <div className="p-3.5 rounded-xl bg-[#181B29] border border-zinc-800/60">
                <div className="flex items-center justify-between gap-2 mb-1.5 font-bold text-white">
                  <span className="text-[#00c48c]">باقة المصممين (Designers Plan)</span>
                  <span className="text-zinc-400 font-mono text-xs">{designersPlan.monthly_price} IQD / شهرياً</span>
                </div>
                <p className="text-zinc-400 leading-relaxed">
                  • مخصصة للمصممين المحترفين مع دعم إضافة جهاز إضافي بقيمة <span className="text-[#00c48c] font-bold">{designersPlan.additional_device_price} IQD</span> للعمل من أكثر من بيئة عمل.
                </p>
              </div>
            )}

            {/* All In One Plan */}
            {allInOnePlan && (
              <div className="p-3.5 rounded-xl bg-[#181B29] border border-zinc-800/60">
                <div className="flex items-center justify-between gap-2 mb-1.5 font-bold text-white">
                  <span className="text-[#00c48c]">الباقة الشاملة (All in One Plan)</span>
                  <span className="text-zinc-400 font-mono text-xs">{allInOnePlan.monthly_price} IQD / شهرياً</span>
                </div>
                <p className="text-zinc-400 leading-relaxed">
                  • أعلى أداء وتحكم للفرق والشركات، مع إضافة جهاز إضافي بقيمة <span className="text-[#00c48c] font-bold">{allInOnePlan.additional_device_price} IQD</span> لكل جهاز.
                </p>
              </div>
            )}

            {/* General Rules */}
            <div className="flex items-center gap-2 pt-2 text-[11px] text-zinc-400 font-medium">
              <CheckCircle2 size={14} className="text-[#00c48c] shrink-0" />
              <span>كل باقة تدعم ربط حتى 5 أجهزة كحد أقصى على نفس الحساب لمرونة وسرعة الاستخدام.</span>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== LIGHT MODE ORIGINAL CARD ==================== */}
      <div className="dark:hidden max-w-6xl rounded-[60px] border-2 border-orange p-8 flex items-center mt-20">
        <div className="hidden md:flex">
          <img className="w-100 shadow-xl" src="/images/ppp-removebg-preview.png" alt="" />
        </div>
        <div>
          <ul dir="rtl" className="text-white flex flex-col gap-2 list-disc text-xl">
            <li className="text-orange">
              باقة <span className="text-[#00c48c] font-bold">{aiPlan?.monthly_price} AI Plan </span> IDQ شهريًا
            </li>
            <li>مناسبة للمستخدمين العاديين اللي يحتاجون أدوات تحليل أساسية</li>
            <li>
              تقدر تضيف جهاز إضافي على نفس الاشتراك مقابل <span className="text-[#00c48c] font-bold">{aiPlan?.additional_device_price}</span> IDQ
            </li>
            <li>مثالي لو تبغى تستخدم الباقة على جوال ولابتوب بنفس الوقت</li>
            {designersPlan && (
              <>
                <li className="text-orange">
                  باقة <span className="text-[#00c48c] font-bold">{designersPlan.monthly_price} Designers Plan</span> IDQ شهريًا
                </li>
                <li>مصممة للمحللين النشطين واللي يحتاجون أدوات وميزات متقدمة</li>
                <li>
                  تقدر تضيف جهاز إضافي بقيمة <span className="text-[#00c48c] font-bold">{designersPlan.additional_device_price}</span> IDQ
                </li>
                <li>مناسبة للي يشتغل من أكثر من بيئة عمل ويحتاج مرونة أكبر</li>
              </>
            )}
            {allInOnePlan && (
              <>
                <li className="text-orange">
                  باقة <span className="text-[#00c48c] font-bold">{allInOnePlan.monthly_price} All in One Plan</span> IDQ شهريًا
                </li>
                <li>مخصصة للشركات والمحترفين اللي يحتاجون أعلى أداء وتحكم</li>
                <li>
                  إضافة كل جهاز إضافي بقيمة <span className="text-[#00c48c] font-bold">{allInOnePlan.additional_device_price}</span> IDQ
                </li>
                <li>مثالية للفرق أو المكاتب اللي يستخدم فيها أكثر من شخص نفس الاشتراك</li>
                <li>كل باقة تدعم إضافة حتى 5 أجهزة كحد أقصى على نفس الحساب</li>
                <li>اختر الباقة اللي تناسب احتياجك، ووسع اشتراكك بسهولة حسب عدد أجهزتك أو فريقك</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DeviceInfo;