"use client"
import { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface Question {
  question_Id: number;
  question: {
    en: string;
    ar: string;
  } | string;
  answer: {
    en: string;
    ar: string;
  } | string;
}

const Page = () => {
  const { t, i18n } = useTranslation();
  // Local state to manage questions
  const [questions, setQuestions] = useState<Question[]>([]);
  const [formData, setFormData] = useState({
    question_en: '',
    question_ar: '',
    answer_en: '',
    answer_ar: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch questions directly
  const fetchQuestions = async () => {
    try {
      const response = await axios.get(process.env.NEXT_PUBLIC_API_URL + '/api/questions');
      setQuestions(response.data);
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError(t('questions.failedToLoad'));
    }
  };
  
  // Load questions on component mount
  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      const payload = {
        question: {
          en: formData.question_en,
          ar: formData.question_ar,
        },
        answer: {
          en: formData.answer_en,
          ar: formData.answer_ar,
        },
      };

      await axios.post(process.env.NEXT_PUBLIC_API_URL +'/api/questions', payload);
      
      // Refetch the questions to show the new one
      await fetchQuestions();
      
      setFormData({ question_en: '', question_ar: '', answer_en: '', answer_ar: '' }); // Reset form
      
      toast.success(t('questions.questionAdded'));
      
    } catch (err: any) {
      setError(err.response?.data?.error || t('questions.failedToAdd'));
      toast.error(t('questions.failedToAdd'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (questionId: number) => {
    try {
      await axios.delete(process.env.NEXT_PUBLIC_API_URL + `/api/questions/${questionId}`);
      
      // Refetch questions after deletion
      await fetchQuestions();
      
      toast.success(t('questions.questionDeleted'));
    } catch (err: any) {
      setError(err.response?.data?.error || t('questions.failedToDelete'));
      toast.error(t('questions.failedToDelete'));
    }
  };

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <div className="p-6 bg-transparent">
        <div className="w-[100%] md:w-[80%] mx-auto bg-[linear-gradient(135deg,_#4f008c,_#190237,_#190237)] rounded-lg p-8">
          <h1 className="text-2xl font-bold mb-6 text-center text-white">{t('questions.addQuestion')}</h1>
          {error && <p className="text-red-500 text-center mb-4">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="question_en" className="block text-sm font-medium text-white mb-1">Question (English)</label>
                <textarea
                  id="question_en"
                  name="question_en"
                  value={formData.question_en}
                  onChange={handleChange}
                  className="p-3 bg-transparent border border-orange text-white rounded-lg w-full"
                  placeholder="Enter question in English"
                  required
                  rows={2}
                />
              </div>
              <div>
                <label htmlFor="question_ar" className="block text-sm font-medium text-white mb-1">Question (العربية)</label>
                <textarea
                  id="question_ar"
                  name="question_ar"
                  value={formData.question_ar}
                  onChange={handleChange}
                  className="p-3 bg-transparent border border-orange text-white rounded-lg w-full"
                  placeholder="أدخل السؤال باللغة العربية"
                  required
                  rows={2}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="answer_en" className="block text-sm font-medium text-white mb-1">Answer (English)</label>
                <textarea
                  id="answer_en"
                  name="answer_en"
                  value={formData.answer_en}
                  onChange={handleChange}
                  className="p-3 bg-transparent border border-orange text-white rounded-lg w-full"
                  placeholder="Enter answer in English"
                  required
                  rows={4}
                />
              </div>
              <div>
                <label htmlFor="answer_ar" className="block text-sm font-medium text-white mb-1">Answer (العربية)</label>
                <textarea
                  id="answer_ar"
                  name="answer_ar"
                  value={formData.answer_ar}
                  onChange={handleChange}
                  className="p-3 bg-transparent border border-orange text-white rounded-lg w-full"
                  placeholder="أدخل الإجابة باللغة العربية"
                  required
                  rows={4}
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full p-3 bg-[#00c48c] text-white rounded-lg hover:bg-[#ff8c00] focus:outline-none"
              disabled={isSubmitting}
            >
              {isSubmitting ? t('questions.submitting') : t('questions.submit')}
            </button>
          </form>
        </div>
      </div>
      
      {questions.length === 0 && !error && (
        <div className='flex items-center justify-center p-3 text-orange'>
          {t('questions.noQuestions')}
        </div>
      )}
      
      {/* all questions and answers */}
      {questions.length > 0 && (
        <div className="flex flex-col items-center justify-center p-5">
          <div className="w-full overflow-x-auto">
            <table className="w-full table-auto datatable-one">
              <thead>
                <tr className="bg-gray-800 shadow-xl text-orange bg-[linear-gradient(135deg,_#4f008c,_#190237,_#190237)]">
                  <th className="p-3 text-center font-bold text-xs md:text-lg inner-shadow">{t('questions.id')}</th>
                  <th className="p-3 text-center font-bold text-xs md:text-lg inner-shadow">{t('questions.question')}</th>
                  <th className="p-3 text-center font-bold text-xs md:text-lg inner-shadow">{t('questions.answer')}</th>
                  <th className="p-3 text-center font-bold text-xs md:text-lg inner-shadow">{t('questions.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {questions.map(q => (
                  <tr key={q.question_Id} className="border-b-2 border-gray-500 bg-[linear-gradient(135deg,rgba(79,0,140,0.54),rgba(25,2,55,0.5),rgba(25,2,55,0.3))]">
                    <td className="p-3 text-white text-center text-xs md:text-sm">{q.question_Id}</td>
                    <td className="p-3 text-white text-xs md:text-sm text-left">
                      {(() => {
                        const text = typeof q.question === 'object' ? q.question : { en: q.question, ar: q.question };
                        return i18n.language === 'ar' ? text.ar || text.en : text.en || text.ar;
                      })()}
                    </td>
                    <td className="p-3 text-white text-xs md:text-sm text-left">
                      {(() => {
                        const text = typeof q.answer === 'object' ? q.answer : { en: q.answer, ar: q.answer };
                        return i18n.language === 'ar' ? text.ar || text.en : text.en || text.ar;
                      })()}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2 justify-center">
                        <button
                          className="text-xs md:text-sm bg-red px-3 py-1 rounded-lg text-white text-center hover:bg-red-600 transition"
                          onClick={() => handleDelete(q.question_Id)}
                        >
                          {t('questions.delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}

export default Page;
