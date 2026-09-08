import { useState } from 'react';
import { Plus } from 'lucide-react';
import useQuestions from './useQuestions';
import { useTranslation } from 'react-i18next';

const MostQuestions = () => {
  const { t, i18n } = useTranslation();
  const [expandedQuestions, setExpandedQuestions] = useState<Record<number, boolean>>({});
  const { questions, loading, error } = useQuestions();

  const toggleAnswer = (id: number) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  if (loading) return <div className="text-white p-4">Loading questions...</div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  
  return (
    <div className="w-full mt-12 mb-6">
      {/* Section Header */}
      <div className="flex flex-col items-center justify-center text-center my-8">
        <h2 className="text-xl md:text-2xl font-black text-emerald-400">
          {t("dashboard.Questions")}
        </h2>
        <div className="w-12 h-0.5 bg-emerald-500/40 rounded-full mt-2" />
      </div>

      <div className="px-1 lg:px-0 flex flex-col items-center justify-center mt-2">
        {questions.length === 0 ? (
          <p className="text-slate-500 py-8 text-xs">No questions found</p>
        ) : (
          <div className="w-full grid grid-cols-1 xl:grid-cols-2 gap-3.5">
            {questions.map((question) => {
              const isExpanded = !!expandedQuestions[question.question_Id];
              const qText = typeof question.question === 'object' 
                ? question.question 
                : { en: question.question, ar: question.question };
              const questionString = i18n.language === 'ar' 
                ? (qText.ar || qText.en) 
                : (qText.en || qText.ar);

              const aText = typeof question.answer === 'object'
                ? question.answer
                : { en: question.answer, ar: question.answer };
              const answerString = i18n.language === 'ar'
                ? (aText.ar || aText.en)
                : (aText.en || aText.ar);

              return (
                <div 
                  key={question.question_Id} 
                  className={`flex flex-col w-full rounded-lg transition-all duration-200 overflow-hidden border border-white/[0.08] ${
                    isExpanded 
                      ? 'bg-[#0F121C] rtl:border-r-[3.5px] rtl:border-r-emerald-400 ltr:border-l-[3.5px] ltr:border-l-emerald-400' 
                      : 'bg-[#0B0E17] hover:bg-[#0E121E] rtl:border-r-[3.5px] rtl:border-r-emerald-500/40 hover:rtl:border-r-emerald-400 ltr:border-l-[3.5px] ltr:border-l-emerald-500/40 hover:ltr:border-l-emerald-400'
                  }`}
                >
                  <div 
                    className="w-full flex items-center justify-between gap-3 py-3.5 px-4 cursor-pointer select-none transition-colors"
                    onClick={() => toggleAnswer(question.question_Id)}
                  >
                    <span className={`text-sm lg:text-base font-bold transition-colors ${isExpanded ? 'text-emerald-400' : 'text-white'}`}>
                      {questionString}
                    </span>
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center transition-all duration-300 shrink-0 ${
                      isExpanded 
                        ? 'bg-emerald-500/20 text-emerald-400 rotate-45' 
                        : 'bg-white/5 text-slate-400'
                    }`}>
                      <Plus strokeWidth={2.5} size={16} />
                    </div>
                  </div>
                  
                  <div className={`w-full transition-all duration-300 overflow-hidden ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="p-4 pt-3 border-t border-white/[0.06] bg-[#07090F] rounded-b-lg text-slate-300 text-xs sm:text-sm leading-relaxed">
                      {answerString}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MostQuestions;