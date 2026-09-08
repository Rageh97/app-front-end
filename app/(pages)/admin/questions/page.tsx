"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { useTranslation } from "react-i18next";

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

const AdminQuestionsPage = () => {
  const { t, i18n } = useTranslation();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [formData, setFormData] = useState({
    question_en: "",
    question_ar: "",
    answer_en: "",
    answer_ar: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(process.env.NEXT_PUBLIC_API_URL + "/api/questions");
      setQuestions(response.data || []);
    } catch (err) {
      console.error("Error fetching questions:", err);
      setError(t("questions.failedToLoad") || "فشل في تحميل الأسئلة");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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

      await axios.post(process.env.NEXT_PUBLIC_API_URL + "/api/questions", payload);
      await fetchQuestions();
      setFormData({ question_en: "", question_ar: "", answer_en: "", answer_ar: "" });
      toast.success(t("questions.questionAdded") || "تمت إضافة السؤال بنجاح");
    } catch (err: any) {
      setError(err.response?.data?.error || t("questions.failedToAdd") || "فشل في إضافة السؤال");
      toast.error(t("questions.failedToAdd") || "فشل في إضافة السؤال");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (questionId: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا السؤال؟")) return;
    setDeletingId(questionId);

    try {
      await axios.delete(process.env.NEXT_PUBLIC_API_URL + `/api/questions/${questionId}`);
      await fetchQuestions();
      toast.success(t("questions.questionDeleted") || "تم حذف السؤال بنجاح");
    } catch (err: any) {
      setError(err.response?.data?.error || t("questions.failedToDelete") || "فشل في حذف السؤال");
      toast.error(t("questions.failedToDelete") || "فشل في حذف السؤال");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <div className="p-4 md:p-6 min-h-screen text-slate-200 font-sans" dir="rtl">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="pb-4 border-b border-white/[0.08]">
            <h1 className="text-xl font-black tracking-tight text-emerald-400">
              إدارة الأسئلة الشائعة (FAQ)
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              إضافة وإدارة الأسئلة الشائعة وإجاباتها المعروضة في الموقع باللغتين العربية والإنجليزية
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-md flex items-center justify-between text-rose-400 text-xs font-semibold">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="hover:text-white">إغلاق</button>
            </div>
          )}

          {/* Form Card */}
          <div className="border border-white/[0.08] rounded-lg p-5 bg-[#0B0E17]">
            <h2 className="text-base font-bold text-emerald-400 mb-4 pb-2 border-b border-white/[0.06]">
              إضافة سؤال وإجابة جديدة
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Questions row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="question_ar" className="block text-xs font-semibold text-slate-300">
                    السؤال (باللغة العربية)
                  </label>
                  <textarea
                    id="question_ar"
                    name="question_ar"
                    value={formData.question_ar}
                    onChange={handleChange}
                    className="w-full p-2.5 bg-[#07090F] border border-white/10 text-white rounded-md text-xs outline-none focus:border-emerald-500 placeholder:text-slate-600 leading-relaxed"
                    placeholder="أدخل نص السؤال باللغة العربية..."
                    required
                    rows={2}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="question_en" className="block text-xs font-semibold text-slate-300">
                    Question (English)
                  </label>
                  <textarea
                    id="question_en"
                    name="question_en"
                    value={formData.question_en}
                    onChange={handleChange}
                    className="w-full p-2.5 bg-[#07090F] border border-white/10 text-white rounded-md text-xs outline-none focus:border-emerald-500 placeholder:text-slate-600 leading-relaxed text-left"
                    dir="ltr"
                    placeholder="Enter question in English..."
                    required
                    rows={2}
                  />
                </div>
              </div>

              {/* Answers row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="answer_ar" className="block text-xs font-semibold text-slate-300">
                    الإجابة (باللغة العربية)
                  </label>
                  <textarea
                    id="answer_ar"
                    name="answer_ar"
                    value={formData.answer_ar}
                    onChange={handleChange}
                    className="w-full p-2.5 bg-[#07090F] border border-white/10 text-white rounded-md text-xs outline-none focus:border-emerald-500 placeholder:text-slate-600 leading-relaxed"
                    placeholder="أدخل نص الإجابة الشافية باللغة العربية..."
                    required
                    rows={3}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="answer_en" className="block text-xs font-semibold text-slate-300">
                    Answer (English)
                  </label>
                  <textarea
                    id="answer_en"
                    name="answer_en"
                    value={formData.answer_en}
                    onChange={handleChange}
                    className="w-full p-2.5 bg-[#07090F] border border-white/10 text-white rounded-md text-xs outline-none focus:border-emerald-500 placeholder:text-slate-600 leading-relaxed text-left"
                    dir="ltr"
                    placeholder="Enter answer in English..."
                    required
                    rows={3}
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-md transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "جاري الإضافة..." : "إضافة السؤال"}
                </button>
              </div>
            </form>
          </div>

          {/* Questions List Table */}
          <div className="border border-white/[0.08] rounded-lg p-5 bg-[#0B0E17]">
            <h2 className="text-base font-bold text-emerald-400 mb-4 pb-2 border-b border-white/[0.06]">
              قائمة الأسئلة الشائعة المسجلة ({questions.length})
            </h2>

            {loading ? (
              <div className="py-10 text-center text-slate-400 text-xs font-semibold">
                جاري تحميل الأسئلة...
              </div>
            ) : questions.length === 0 ? (
              <div className="py-10 text-center text-slate-500 text-xs font-semibold">
                لا توجد أسئلة شائعة مسجلة حالياً
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-slate-400 text-[11px] font-bold">
                      <th className="pb-3 pr-2 w-16">المعرف</th>
                      <th className="pb-3 w-1/3">السؤال</th>
                      <th className="pb-3">الإجابة</th>
                      <th className="pb-3 text-center w-24">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {questions.map((q) => {
                      const qObj = typeof q.question === "object" ? q.question : { ar: q.question, en: q.question };
                      const aObj = typeof q.answer === "object" ? q.answer : { ar: q.answer, en: q.answer };
                      const isDeleting = deletingId === q.question_Id;

                      return (
                        <tr key={q.question_Id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 pr-2 font-mono text-slate-500">#{q.question_Id}</td>
                          <td className="py-3 font-semibold text-white space-y-1">
                            <div>{qObj.ar || qObj.en}</div>
                            {qObj.en && qObj.ar && (
                              <div className="text-[11px] text-slate-400 font-normal" dir="ltr">
                                {qObj.en}
                              </div>
                            )}
                          </td>
                          <td className="py-3 text-slate-300 leading-relaxed space-y-1">
                            <p className="line-clamp-2">{aObj.ar || aObj.en}</p>
                            {aObj.en && aObj.ar && (
                              <p className="text-[11px] text-slate-500 line-clamp-1" dir="ltr">
                                {aObj.en}
                              </p>
                            )}
                          </td>
                          <td className="py-3">
                            <div className="flex items-center justify-center">
                              <button
                                onClick={() => handleDelete(q.question_Id)}
                                disabled={isDeleting}
                                className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded text-xs font-bold transition-colors disabled:opacity-50"
                              >
                                {isDeleting ? "جاري..." : "حذف"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminQuestionsPage;
