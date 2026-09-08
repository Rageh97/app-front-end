"use client"
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, FileText, Scale, CheckCircle2, Loader2 } from 'lucide-react';

const PolicyPage = () => {
  const { t, i18n } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [policies, setPolicies] = useState<any[]>([]);
  const [conditions, setConditions] = useState<any[]>([]);

  // Fetch all policies
  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const response = await axios.get(process.env.NEXT_PUBLIC_API_URL + '/api/policy');
      setPolicies(response.data || []);
    } catch (error) {
      console.error('Error fetching policies:', error);
      toast.error(t('policy.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const fetchConditions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(process.env.NEXT_PUBLIC_API_URL + '/api/condition');
      setConditions(response.data || []);
    } catch (error) {
      console.error('Error fetching conditions:', error);
      toast.error(t('policy.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
    fetchConditions();
  }, []);

  const isRtl = i18n.language === 'ar';

  return (
    <div className="w-full min-h-screen pb-16">
      <Toaster position="top-right" reverseOrder={false} />

      {/* Dark Mode Header */}
      <div className="hidden dark:flex items-center gap-3 border-s-4 border-[#00c48c] ps-3 mb-8 mt-6">
        <h1 className="text-xl md:text-2xl font-extrabold animate-emerald-shimmer">
          {t('footer.returnPolicy')} والشروط والأحكام
        </h1>
      </div>

      {/* Light Mode Header */}
      <div className="dark:hidden flex items-center justify-center mt-10 mb-6">
        <h2 className="px-10 lg:px-30 text-center w-80 lg:w-full py-3 text-xl lg:text-4xl text-white bg-[linear-gradient(135deg,_#4f008c,_#35214f,_#35214f)] inner-shadow rounded-2xl">
          {t('footer.returnPolicy')}
        </h2>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-400 gap-3">
          <Loader2 className="animate-spin text-[#00c48c]" size={32} />
          <p className="text-sm">جاري تحميل السياسات والشروط...</p>
        </div>
      ) : (
        <>
          {/* ==================== DARK MODE 2-COLUMN BENTO LAYOUT ==================== */}
          <div className="hidden dark:grid grid-cols-1 lg:grid-cols-2 gap-8 my-6">
            {/* Column 1: Terms & Conditions */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#12141F] border border-zinc-800/80 hover:border-[#00c48c]/40 shadow-xl transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 inset-x-1/4 h-[1px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent pointer-events-none" />

              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800/60" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400">
                  <FileText size={22} />
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-white">
                  الشروط والأحكام العامة
                </h2>
              </div>

              <div className="space-y-6 text-sm text-zinc-300 leading-relaxed" dir={isRtl ? 'rtl' : 'ltr'}>
                {conditions.length === 0 ? (
                  <p className="text-zinc-500 text-xs italic">لا توجد شروط متاحة حالياً.</p>
                ) : (
                  conditions.map((condition, idx) => {
                    const titleText = typeof condition.conditionTitle === 'object' 
                      ? (isRtl ? condition.conditionTitle.ar || condition.conditionTitle.en : condition.conditionTitle.en || condition.conditionTitle.ar)
                      : condition.conditionTitle;
                    
                    const contentText = typeof condition.conditionContent === 'object'
                      ? (isRtl ? condition.conditionContent.ar || condition.conditionContent.en : condition.conditionContent.en || condition.conditionContent.ar)
                      : condition.conditionContent;

                    return (
                      <div key={condition.condition_id || idx} className="p-4 rounded-2xl bg-[#181B29]/80 border border-zinc-800/60">
                        {titleText && (
                          <h3 className="font-bold text-amber-400 text-base mb-2 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                            <span>{titleText}</span>
                          </h3>
                        )}
                        <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                          {contentText}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Column 2: Refund & Warranty Policy */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#12141F] border border-zinc-800/80 hover:border-[#00c48c]/40 shadow-xl transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 inset-x-1/4 h-[1px] bg-gradient-to-r from-transparent via-[#00c48c]/50 to-transparent pointer-events-none" />

              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800/60" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-[#00c48c]">
                  <ShieldCheck size={22} />
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-white">
                  سياسة الاسترجاع والضمان
                </h2>
              </div>

              <div className="space-y-6 text-sm text-zinc-300 leading-relaxed" dir={isRtl ? 'rtl' : 'ltr'}>
                {policies.length === 0 ? (
                  <p className="text-zinc-500 text-xs italic">لا توجد سياسات متاحة حالياً.</p>
                ) : (
                  policies.map((policy, idx) => {
                    const titleText = typeof policy.policyTitle === 'object' 
                      ? (isRtl ? policy.policyTitle.ar || policy.policyTitle.en : policy.policyTitle.en || policy.policyTitle.ar)
                      : policy.policyTitle;
                    
                    const contentText = typeof policy.policyContent === 'object'
                      ? (isRtl ? policy.policyContent.ar || policy.policyContent.en : policy.policyContent.en || policy.policyContent.ar)
                      : policy.policyContent;

                    return (
                      <div key={policy.policy_id || idx} className="p-4 rounded-2xl bg-[#181B29]/80 border border-zinc-800/60">
                        {titleText && (
                          <h3 className="font-bold text-[#00c48c] text-base mb-2 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00c48c] shrink-0" />
                            <span>{titleText}</span>
                          </h3>
                        )}
                        <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                          {contentText}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* ==================== LIGHT MODE ORIGINAL LAYOUT ==================== */}
          <div className="dark:hidden min-h-screen w-full flex flex-col lg:flex-row gap-8 mt-10 px-3 xl:px-0">
            {/* Conditions */}
            <div className="relative w-full h-full">
              <div className="flex-1 max-w-3xl bg-[linear-gradient(135deg,_#190237,_#190237,_#4f008c)] mx-auto py-10 gradient-border-inf rounded-[30px] px-4 text-right" dir="rtl">
                {conditions.map((condition, index) => (
                  <React.Fragment key={index}>
                    <h1 dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} className="text-xl xl:text-2xl font-bold mb-6 text-orange flex items-center gap-2">
                      {(() => {
                        const text = typeof condition.conditionTitle === 'object' ? condition.conditionTitle : { en: condition.conditionTitle, ar: condition.conditionTitle };
                        return i18n.language === 'ar' ? text.ar || text.en : text.en || text.ar;
                      })()}
                    </h1>
                    <p dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} className="mb-8 text-md xl:text-lg text-white">
                      {(() => {
                        const text = typeof condition.conditionContent === 'object' ? condition.conditionContent : { en: condition.conditionContent, ar: condition.conditionContent };
                        return i18n.language === 'ar' ? text.ar || text.en : text.en || text.ar;
                      })()}
                    </p>
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Refund Policy */}
            <div className="relative w-full h-full">
              <div className="flex-1 max-w-3xl bg-[linear-gradient(135deg,_#190237,_#190237,_#4f008c)] rounded-[30px] mx-auto py-10 px-4 text-right gradient-border-inf" dir="rtl">
                {policies.map((policy, index) => (
                  <React.Fragment key={index}>
                    <h1 dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} className="text-xl xl:text-2xl font-bold mb-6 text-[#00c48c] flex items-center gap-2">
                      {(() => {
                        const text = typeof policy.policyTitle === 'object' ? policy.policyTitle : { en: policy.policyTitle, ar: policy.policyTitle };
                        return i18n.language === 'ar' ? text.ar || text.en : text.en || text.ar;
                      })()}
                    </h1>
                    <p dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} className="mb-8 text-md xl:text-lg text-white">
                      {(() => {
                        const text = typeof policy.policyContent === 'object' ? policy.policyContent : { en: policy.policyContent, ar: policy.policyContent };
                        return i18n.language === 'ar' ? text.ar || text.en : text.en || text.ar;
                      })()}
                    </p>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PolicyPage;