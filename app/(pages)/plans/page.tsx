"use client";

import React, { FunctionComponent, useEffect, useMemo, useState } from "react";
import { useMyInfo } from "@/utils/user-info/getUserInfo";
import PackCard from "@/components/PackCard";
import ModalPayment from "@/components/Modals/PaymentModal";
import { CircleCheckBig, CircleX, Crown, Check, CreditCard, ArrowLeft } from "lucide-react";
import { BorderBeam } from "@/components/ui/border-beam";
import CihBankOrderDetailsInfoModalPlans from "@/components/Modals/CihBankOrderDetailsInfoModalForPlans";
import TijariOrderDetailsInfoModalPlans from "@/components/Modals/TijariBankOrderDetailsInfoModalForPlans";
import { useTranslation } from 'react-i18next';
import Link from "next/link";

const parseNumericValue = (val: any): number => {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const cleaned = String(val).replace(/,/g, '').replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

const formatPrice = (plan: any): string => {
  const raw = plan?.amount ?? plan?.monthly_price ?? plan?.price ?? 0;
  return parseNumericValue(raw).toLocaleString('en-US');
};

const formatCredits = (plan: any): string => {
  const raw = plan?.credits_per_period ?? plan?.monthly_credits ?? plan?.credits ?? 0;
  return parseNumericValue(raw).toLocaleString('en-US');
};

const getPlanColor = (plan: any): string => {
  const credits = parseNumericValue(plan?.credits_per_period);
  if (credits <= 100) return "from-[#804A00] via-[#B87333] to-[#4D2D00]";
  if (credits <= 500) return "from-[#71706E] via-[#E5E4E2] to-[#3B3C36]";
  if (credits <= 1000) return "from-[#BF953F] via-[#FCF6BA] to-[#AA771C]";
  return "from-[#30CFD0] via-[#330867] to-[#30CFD0]";
};

const getPlanTierData = (plan: any, index: number, total: number) => {
  const credits = parseNumericValue(plan?.credits_per_period);
  
  if (index === 0) {
    return {
      tierName: "باقة البداية",
      description: "مثالية للمبتدئين وتجربة أدوات الذكاء الاصطناعي وتوليد الصور والمهام البسيطة.",
      features: [
        "جميع موديلات الذكاء الاصطناعي متاحة بالكامل",
        "توليد وتعديل الصور والرسومات الذكية",
        "سرعة معالجة قياسية في السيرفرات",
        "دعم فني مستمر",
      ]
    };
  } else if (total === 3 ? index === 1 : (credits <= 600 || index === 1)) {
    return {
      tierName: "باقة المحترفين",
      description: "لصناع المحتوى والمحترفين لإنتاج مستمر وتوليد الفيديوهات والصور بجودة عالية.",
      features: [
        "جميع موديلات الذكاء الاصطناعي متاحة بالكامل",
        "توليد الفيديو السينمائي، تحريك الصور، واستنساخ الصوت",
        "جودة فائقة مع أولوية متقدمة في طابور المعالجة",
        "دعم فني مباشر وسريع",
      ]
    };
  } else if (total === 4 && index === 2) {
    return {
      tierName: "باقة الأعمال",
      description: "للمبدعين والفرق التي تحتاج رصيداً وفيراً وسرعة معالجة مضاعفة للمشاريع الكبيرة.",
      features: [
        "جميع موديلات الذكاء الاصطناعي متاحة بالكامل",
        "توليد غير مقيد بجودة 4K وأولوية معالجة سريعة (Priority Queue)",
        "توليد الفيديوهات الطويلة والمهام المعقدة بدون انتظار",
        "دعم فني مخصص ذو أولوية عالية",
      ]
    };
  } else {
    return {
      tierName: "باقة النخبة",
      description: "طاقة توليد قصوى ومفتوحة مخصصة للاستوديوهات والشركات ذات الاستهلاك اليومي المكثف.",
      features: [
        "جميع موديلات الذكاء الاصطناعي متاحة بالكامل",
        "توليد غير مقيد لكافة أدوات الفيديو والصور والصوت",
        "أعلى أولوية معالجة فورية بالسيرفرات (VIP Priority)",
        "دعم فني VIP مخصص على مدار 24 ساعة",
      ]
    };
  }
};

type Props = {
  params: { clientId: string };
};

const PlansPage: FunctionComponent<Props> = ({ params: { clientId } }) => {
  const { data, isLoading, isFetching, isError, refetch } = useMyInfo();
  const [openCihDetailsModal, setOpenCihDetailsModal] = useState<boolean>(false);
  const [openTijariDetailsModal, setOpenTijariDetailsModal] = useState<boolean>(false);
  const [openPaymentModal, setOpenPaymentModal] = useState<boolean>(false);
  const [packDetails, setPackDetails] = useState<any>();
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'year'>('month');
  const [activeTab, setActiveTab] = useState<'website' | 'ai'>('website');
  const [aiPlans, setAiPlans] = useState<any[]>([]);
  const [productType, setProductType] = useState<"pack" | "credits">("pack");
  const { t } = useTranslation();

  useEffect(() => {
    const fetchAiPlans = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/credits/plans`);
        if (res.ok) {
          const data = await res.json();
          setAiPlans(data);
        }
      } catch (e) {}
    };
    fetchAiPlans();
  }, []);

  useEffect(() => {
    document.title = t('plans.pageTitle');
  }, [t]);

  return (
    <>
      <h2 className="text-title-sm2 text-center mt-10 px-3 pb-4 font-bold text-white dark:text-white">
        {t('plans.pageTitle')}
      </h2>

      {/* Tabs for Website vs AI Plans */}
      <div className="flex justify-center mb-8">
        <div className="flex bg-[#190237] p-1.5 rounded-xl border border-[#ff7702]/30 shadow-xl">
          <button 
            onClick={() => setActiveTab('website')}
            className={`px-6 py-2.5 rounded-lg font-bold transition-all text-sm md:text-base ${activeTab === 'website' ? 'bg-[#ff7702] text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            باقات المواقع
          </button>
          <button 
            onClick={() => setActiveTab('ai')}
            className={`px-6 py-2.5 rounded-lg font-bold transition-all text-sm md:text-base ${activeTab === 'ai' ? 'bg-[#ff7702] text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            باقات الذكاء الاصطناعي
          </button>
        </div>
      </div>

      {activeTab === 'website' && (
        <div className="flex justify-center mb-6">
          <div className="flex items-center border-1 border-[#ff7702] bg-[#190237] rounded-xl cursor-pointer w-fit overflow-hidden">
            {(['month', 'year'] as const).map((period) => (
              <div
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 lg:px-6 py-2 lg:py-3 text-sm sm:text-2xl lg:text-2xl cursor-pointer transition-colors ${
                  selectedPeriod === period
                    ? 'bg-[#ff7702] text-white font-bold'
                    : 'text-white hover:bg-[#2a0854]'
                }`}
              >
                {period === 'month' ? t('packs.monthly') : t('packs.annual')}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="w-full h-full flex justify-center gap-20 flex-wrap pt-3">
        {activeTab === 'website' ? (
          data && data?.packsData?.map((item: any, index: number) => (
            <PackCard
              key={index}
              packTitle={t('plans.toolsIncluded')}
              title={item.pack_name}
              packPrice={selectedPeriod === 'month' ? item.monthly_price : item.yearly_price}
              period={selectedPeriod}
              packData={item}
              toolsData={data?.toolsData}
              onClick={() => {
                setProductType("pack");
                setPackDetails(item);
                setOpenPaymentModal(true);
              }}
            />
          ))
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto w-full px-4 mb-16">
            {[...aiPlans]
              .sort((a: any, b: any) => parseNumericValue(a.credits_per_period) - parseNumericValue(b.credits_per_period))
              .map((plan: any, index: number, arr: any[]) => {
                const color = getPlanColor(plan);
                const periodText = plan.period === 'year' ? 'سنوياً' : 'شهرياً';
                const tier = getPlanTierData(plan, index, arr.length);

                return (
                  <div 
                    key={plan.plan_id} 
                    className="group relative flex flex-col p-8 rounded-[2.5rem] bg-[#12141C] border border-white/10 hover:border-white/20 backdrop-blur-sm transition-all duration-300"
                  >
                    {/* Crown & Title */}
                    <div className="mb-6 text-center relative">
                      <div className="relative mx-auto mb-4 w-fit">
                        <div className={`absolute inset-0 bg-gradient-to-br ${color} blur-[30px] opacity-30 rounded-full scale-150`}></div>
                        <Crown 
                          size={46} 
                          className="text-amber-400 drop-shadow-lg mx-auto relative z-10"
                          strokeWidth={1.5}
                        />
                      </div>
                      
                      <h3 className="text-xl font-black mb-1 text-white">{plan.plan_name}</h3>
                      <p className="text-gray-400 text-xs font-medium leading-relaxed px-2">{tier.description}</p>
                    </div>

                    {/* Price Section */}
                    <div className="mb-6 flex flex-col items-center">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl sm:text-4xl font-black text-white">
                          <span className="bg-gradient-to-r from-[#FF0000] via-[#FFFFFF] to-[#000000] bg-clip-text text-transparent font-bold">IQD </span>
                          {formatPrice(plan)}
                        </span>
                        <span className="text-gray-400 text-xs font-bold">/ {plan.period === 'year' ? 'سنة' : 'شهر'}</span>
                      </div>
                    </div>

                    {/* Credits Box */}
                    <div className="mb-6 flex flex-col justify-center">
                      <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-center space-y-1.5">
                        <div className="text-emerald-400 font-extrabold text-base sm:text-lg">
                          {formatCredits(plan)} نقطة / {periodText}
                        </div>
                        <p className="text-gray-300 text-[11px] sm:text-xs font-medium leading-relaxed">
                          صالحة لجميع أدوات واستوديو الذكاء الاصطناعي
                        </p>
                      </div>
                    </div>

                    {/* Tier Specific Features */}
                    <div className="flex-1 mb-8 space-y-2.5">
                      {tier.features.map((feat: string, fIdx: number) => (
                        <div key={fIdx} className="flex items-center gap-2 text-xs text-gray-300 font-medium">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${fIdx === 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-emerald-400'}`}>
                            <Check size={10} strokeWidth={3} />
                          </div>
                          <span className={fIdx === 0 ? 'text-emerald-400 font-bold' : ''}>{feat}</span>
                        </div>
                      ))}
                    </div>

                    {/* Signature NEXUS Generate-Style Button */}
                    <div className="w-full px-1.5 py-0.5 flex justify-center mt-auto">
                      <button 
                        type="button"
                        onClick={() => {
                          setProductType("credits");
                          setPackDetails({
                            ...plan,
                            monthly_price: String(parseNumericValue(plan.amount) || plan.amount),
                            yearly_price: String(parseNumericValue(plan.amount) || plan.amount),
                            tool_day_price: String(parseNumericValue(plan.amount) || plan.amount),
                            amount: String(parseNumericValue(plan.amount) || plan.amount)
                          });
                          setOpenPaymentModal(true);
                        }}
                        className="relative group w-full py-3.5 px-5 transition-all duration-300 font-bold text-sm select-none skew-x-[-22deg] rounded-[15px] overflow-hidden bg-[linear-gradient(135deg,_#4f008c_0%,_#3d006e_50%,_#190237_100%)] hover:bg-[linear-gradient(135deg,_#6100ad_0%,_#4c008a_50%,_#21034a_100%)] text-white border border-[#ff7702]/60 hover:border-[#ff7702] gradient-border-packet shadow-[0_4px_20px_rgba(79,0,140,0.4)] hover:shadow-[0_6px_25px_rgba(255,119,2,0.35),0_0_20px_rgba(79,0,140,0.5)] active:scale-[0.98]"
                      >
                        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.14] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none rounded-[15px]" />
                        <div className="skew-x-[22deg] flex items-center justify-center w-full gap-2 text-white">
                          <CreditCard size={16} className="text-[#ff9933] group-hover:scale-110 transition-transform duration-200 shrink-0" />
                          <span className="font-extrabold text-sm tracking-wide text-white">اختيار الباقة</span>
                          <ArrowLeft size={14} className="text-white/80 shrink-0" />
                        </div>
                      </button>
                    </div>

                    <BorderBeam 
                      size={300}
                      duration={8}
                      colorFrom="#9c40ff"
                      colorTo="#40ffaa"
                      borderWidth={1.5}
                    />
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Comparison Table */}
      <div className={`w-full overflow-x-auto px-4 mt-30 mb-8 flex flex-col items-center ${activeTab === 'ai' ? 'hidden' : ''}`}>
        <h2 className="px-10 mb-10 lg:px-10 text-center w-80 lg:w-[45%] py-3 text-xl lg:text-4xl text-white bg-[linear-gradient(135deg,_#4f008c,_#35214f,_#35214f)] inner-shadow rounded-2xl">
          {t('plans.moreInfo')}
        </h2>
        <div className="w-full max-w-6xl mx-auto rounded-lg ">
          <table className="w-full text-white table-auto overflow-x-auto">
            <thead>
              <tr className="bg-[linear-gradient(135deg,rgba(79,0,140,0.54),rgba(25,2,55,0.5),rgba(25,2,55,0.3))]">
                <th className="py-4 px-6 font-bold text-orange text-center border-2 border-[#ff7702] text-xl xl:text-2xl">{t('plans.tools')}</th>
                {data?.packsData?.map((pack: any, index: number) => (
                  <th key={index} className="py-4 px-6 font-bold text-center border-[#ff7702] border-2 text-xl xl:text-2xl">
                    {pack.pack_name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(() => {
                const toolsByName = new Map<string, any[]>();
                data?.toolsData?.forEach((tool: any) => {
                  const name = tool.tool_name.trim();
                  if (!toolsByName.has(name)) toolsByName.set(name, []);
                  toolsByName.get(name)!.push(tool);
                });

                return Array.from(toolsByName.entries()).map(([toolName, tools], index) => (
                  <tr key={index} className="hover:bg-[#2a0854] transition-colors bg-[linear-gradient(135deg,rgba(79,0,140,0.54),rgba(25,2,55,0.5),rgba(25,2,55,0.3))]">
                    <td className="py-3 px-6 font-bold text-center border-2 border-[#ff7702] text-md xl:text-2xl">
                      {toolName}
                    </td>
                    {data?.packsData?.map((pack: any, packIndex: number) => {
                      const packToolIds = JSON.parse(pack.pack_tools);
                      const isIncluded = tools.some(t => packToolIds.includes(t.tool_id));
                      return (
                        <td key={packIndex} className="py-3 px-6 text-center border-[#ff7702] border-2 text-md xl:text-2xl">
                          <span title={isIncluded ? t('plans.included') : t('plans.notIncluded')}>
                            {isIncluded ? (
                              <CircleCheckBig className="inline-block" strokeWidth={3} size={20} color={"#00c48c"} />
                            ) : (
                              <CircleX className="inline-block" strokeWidth={3} size={20} color={"#ff7702"} />
                            )}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>

      <ModalPayment
        modalOpen={openPaymentModal}
        setModalOpen={setOpenPaymentModal}
        productId={productType === 'pack' ? packDetails?.pack_id : packDetails?.plan_id}
        productData={packDetails}
        productType={productType}
        period={selectedPeriod}
        onBuySuccess={(bankName: "cih" | "tijari") => {
          setOpenPaymentModal(false);
          if (bankName === "cih") {
            setOpenCihDetailsModal(true);
          } else {
            setOpenTijariDetailsModal(true);
          }
        }}
      />

      <CihBankOrderDetailsInfoModalPlans
        modalOpen={openCihDetailsModal}
        setModalOpen={setOpenCihDetailsModal}
        packDetails={packDetails}
      />

      <TijariOrderDetailsInfoModalPlans
        modalOpen={openTijariDetailsModal}
        setModalOpen={setOpenTijariDetailsModal}
        packDetails={packDetails}
      />
    </>
  );
};

export default PlansPage;
