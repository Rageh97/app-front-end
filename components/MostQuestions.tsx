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
    <div className="w-full mt-10">
      <div className="px-4 md:px-0 flex items-center w-full text-center justify-center">
        <h2 className="w-full px-20 font-bold md:px-40 py-3 md:py-4 text-lg lg:text-4xl text-white bg-[linear-gradient(135deg,#4f008c,#190237,#190237)] gradient-border-3 rounded-xl">
         {t("dashboard.Questions")}
        </h2>
      </div>

      

      <div className=" px-4 md:px-0 gap-6 md:gap-10 flex flex-col items-center justify-center mt-10">
        {questions.length === 0 ? (
          <p className="text-white">No questions found</p>
        ) : (
          <div className="w-full grid grid-cols-1 xl:grid-cols-2 gap-6">
            {questions.map((question) => (
              <div key={question.question_Id} className="flex flex-col w-full">
                <div 
                  className="w-full flex items-center gap-3 rounded-xl py-2 md:py-3 px-3 bg-[linear-gradient(135deg,#4f008c,#190237,#190237)] gradient-border-Qs cursor-pointer hover:brightness-110 transition-all"
                  onClick={() => toggleAnswer(question.question_Id)}
                >
                  <div className={`transition-transform duration-200 ${expandedQuestions[question.question_Id] ? 'rotate-45' : ''}`}>
                    <Plus strokeWidth={3} size={32} color="#ff7702" />
                  </div>
                  <span className="text-white text-sm lg:text-xl font-medium">
                    {(() => {
                      const qText = typeof question.question === 'object' 
                        ? question.question 
                        : { en: question.question, ar: question.question };
                      return i18n.language === 'ar' 
                        ? (qText.ar || qText.en) 
                        : (qText.en || qText.ar);
                    })()}
                  </span>
                </div>
                
                <div className={`w-full transition-all duration-300 overflow-hidden ${expandedQuestions[question.question_Id] ? 'max-h-96 mt-2' : 'max-h-0'}`}>
                  <div className="p-3 rounded-lg bg-[#190237] text-white text-sm lg:text-lg">
                    {(() => {
                      const aText = typeof question.answer === 'object'
                        ? question.answer
                        : { en: question.answer, ar: question.answer };
                      return i18n.language === 'ar'
                        ? (aText.ar || aText.en)
                        : (aText.en || aText.ar);
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MostQuestions;