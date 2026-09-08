import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { NewToolsDto } from "@/types/tools/new-tools-dto";
import { checkIfImageUrl } from "@/utils/imageValidator";
import { ChevronRight, X, Sparkles, Check, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import i18n from "@/i18n";

type Period = "month" | "year" | "day";

interface ToolModalDetailsProps {
  toolData: NewToolsDto;
  modalOpen: boolean;
  period: Period;
  setModalOpen: (open: boolean) => void;
  setPeriod: (period: Period) => void;
  onBuy: () => void;
}

const ToolModalDetails: React.FC<ToolModalDetailsProps> = ({
  modalOpen,
  setModalOpen,
  setPeriod,
  period,
  onBuy,
  toolData,
}) => {
  const { t } = useTranslation();
  const isFree = !!toolData?.isFree;

  if (!toolData) return null;

  return (
    <Transition.Root show={modalOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-[999999]"
        onClose={() => setModalOpen(false)}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity" />
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-3xl bg-white dark:bg-[#0E1017] dark:border dark:border-zinc-800/90 shadow-2xl text-start transition-all w-full max-w-3xl">
                
                {/* Close Button */}
                <button
                  onClick={() => setModalOpen(false)}
                  className={`absolute top-4 ${i18n.language === 'ar' ? 'left-4' : 'right-4'} z-30 p-2 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white transition-all`}
                  title="Close"
                >
                  <X size={18} />
                </button>

                <div className="flex flex-col md:flex-row">
                  {/* Left Column: Image & Tool Preview */}
                  <div className="md:w-5/12 w-full p-6 sm:p-8 bg-slate-50 dark:bg-gradient-to-b dark:from-[#141724] dark:to-[#0A0C14] border-b md:border-b-0 md:border-e border-slate-200 dark:border-zinc-800/80 flex flex-col items-center justify-center text-center relative overflow-hidden">
                    {/* Top Glow Accent */}
                    <div className="hidden dark:block absolute -top-12 -left-12 w-40 h-40 bg-[#00c48c]/15 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="relative w-full aspect-[16/11] rounded-2xl overflow-hidden bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 p-3 shadow-sm flex items-center justify-center">
                      <img
                        className="w-full h-full object-contain rounded-xl"
                        src={
                          checkIfImageUrl(toolData?.tool_image)
                            ? toolData?.tool_image
                            : "/images/default_image.png"
                        }
                        alt={toolData?.tool_name || "Tool"}
                      />
                    </div>

                    <div className="mt-4 flex flex-col items-center gap-1.5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-[#00c48c] border border-emerald-500/20 text-xs font-bold">
                        <Sparkles size={12} className="text-[#00c48c]" />
                        {isFree ? t('toolModal.freeAccess') : (toolData?.tool_category || "Premium Tool")}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Details, Periods & Checkout */}
                  <div className="md:w-7/12 w-full p-6 sm:p-7 flex flex-col justify-between">
                    <div>
                      {/* Tool Title */}
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                        {toolData?.tool_name}
                      </h2>

                      {/* Description Card */}
                      <div className="mt-4 p-3.5 rounded-2xl bg-slate-100/80 dark:bg-[#141724]/80 border border-slate-200 dark:border-zinc-800/80">
                        <p className="text-xs font-bold text-slate-700 dark:text-[#00c48c] mb-1 flex items-center gap-1.5">
                          <Check size={14} className="text-[#00c48c]" />
                          {t('toolModal.youWillGet')}
                        </p>
                        <div
                          dangerouslySetInnerHTML={{ __html: toolData?.tool_description || "" }}
                          className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed max-h-28 overflow-y-auto no-scrollbar"
                        />
                      </div>

                      {/* Period Selection (Monthly / Annual / Day) */}
                      {!isFree && (
                        <div className="mt-4">
                          <p className="text-xs font-bold text-slate-600 dark:text-zinc-400 mb-2">
                            اختر مدة الاشتراك:
                          </p>
                          <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-[#141724] border border-slate-200 dark:border-zinc-800">
                            {/* Monthly */}
                            <button
                              type="button"
                              onClick={() => setPeriod("month")}
                              className={`py-2 px-2 rounded-lg text-xs font-bold transition-all duration-200 text-center ${
                                period === "month"
                                  ? "bg-white dark:bg-[#00c48c]/15 text-slate-900 dark:text-[#00c48c] border border-slate-300 dark:border-[#00c48c]/30 shadow-sm"
                                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                              }`}
                            >
                              {t('toolModal.monthly')}
                            </button>

                            {/* Annual */}
                            <button
                              type="button"
                              onClick={() => setPeriod("year")}
                              className={`py-2 px-2 rounded-lg text-xs font-bold transition-all duration-200 text-center ${
                                period === "year"
                                  ? "bg-white dark:bg-[#00c48c]/15 text-slate-900 dark:text-[#00c48c] border border-slate-300 dark:border-[#00c48c]/30 shadow-sm"
                                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                              }`}
                            >
                              {t('toolModal.annual')}
                            </button>

                            {/* 1-Day Trial if available */}
                            {toolData?.tool_day_price ? (
                              <button
                                type="button"
                                onClick={() => setPeriod("day")}
                                className={`py-2 px-2 rounded-lg text-xs font-bold transition-all duration-200 text-center ${
                                  period === "day"
                                    ? "bg-white dark:bg-[#00c48c]/15 text-slate-900 dark:text-[#00c48c] border border-slate-300 dark:border-[#00c48c]/30 shadow-sm"
                                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                                }`}
                              >
                                {t('toolModal.trial1Day')}
                              </button>
                            ) : (
                              <div className="flex items-center justify-center text-[10px] text-zinc-500 font-medium select-none">
                                غير متوفر يومي
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Section */}
                    <div className="mt-6 pt-4 border-t border-slate-200 dark:border-zinc-800/80 flex items-center justify-between gap-3">
                      {/* Price Section */}
                      <div>
                        {isFree ? (
                          <div className="text-sm font-extrabold text-[#00c48c]">
                            {t('toolModal.freeAccess')}
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400">
                              {t('toolModal.total')}:
                            </span>
                            <div className="flex items-baseline gap-1.5">
                              {/* Strikethrough price if exists */}
                              {((period === "month" && toolData?.tool_none_price_month) ||
                                (period === "year" && toolData?.tool_none_price_year)) && (
                                <span className="text-xs text-slate-400 dark:text-zinc-500 line-through">
                                  IQD {period === "month" ? toolData?.tool_none_price_month : toolData?.tool_none_price_year}
                                </span>
                              )}
                              <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-[#00c48c]">
                                IQD {period === "day" ? toolData?.tool_day_price : period === "month" ? toolData?.tool_month_price : toolData?.tool_year_price}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      <div>
                        {isFree ? (
                          <a
                            href={toolData?.tool_url || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-5 py-2.5 sm:py-3 rounded-xl font-extrabold text-xs sm:text-sm bg-[#00c48c] hover:bg-[#00b07d] text-slate-950 shadow-md shadow-[#00c48c]/20 hover:scale-[1.02] active:scale-95 transition-all"
                          >
                            <span>{t('toolModal.launchForFree')}</span>
                            <ExternalLink size={16} />
                          </a>
                        ) : (
                          <button
                            onClick={() => onBuy()}
                            className="inline-flex items-center gap-2 px-6 py-2.5 sm:py-3 rounded-xl font-extrabold text-xs sm:text-sm bg-[#00c48c] hover:bg-[#00b07d] text-slate-950 shadow-md shadow-[#00c48c]/20 hover:scale-[1.02] active:scale-95 transition-all"
                          >
                            <span>{t('toolModal.buyNow')}</span>
                            <ChevronRight size={18} className={i18n.language === 'ar' ? 'rotate-180' : ''} />
                          </button>
                        )}
                      </div>
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

export default ToolModalDetails;
