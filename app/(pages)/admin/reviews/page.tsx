"use client";

import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import useReviews from "@/hooks/useReviews";
import { useTranslation } from "react-i18next";

type ReviewItem = {
  review_id: number;
  comment: string;
  rating?: number;
  createdAt?: string;
  user?: {
    first_name: string;
    last_name: string;
    email?: string;
  };
};

const AdminReviewPanel = () => {
  const { t } = useTranslation();
  const { getPendingReviews, approveReview, deleteReview, getApprovedReviews } = useReviews();

  const [pendingReviews, setPendingReviews] = useState<ReviewItem[]>([]);
  const [allReviews, setAllReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [operationInProgress, setOperationInProgress] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"pending" | "approved">("pending");

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [pendingData, approvedData] = await Promise.all([
        getPendingReviews(),
        getApprovedReviews(),
      ]);
      setPendingReviews(pendingData || []);
      setAllReviews(approvedData || []);
    } catch (err) {
      console.error("Error fetching reviews:", err);
      toast.error(t("reviews.failedToLoad") || "فشل في تحميل التقييمات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleApprove = async (reviewId: number) => {
    if (operationInProgress !== null) return;
    setOperationInProgress(reviewId);

    const toastId = toast.loading(t("reviews.approving") || "جاري الاعتماد...");
    const reviewToApprove = pendingReviews.find((r) => r.review_id === reviewId);

    if (reviewToApprove) {
      setPendingReviews((prev) => prev.filter((r) => r.review_id !== reviewId));
      setAllReviews((prev) => [...prev, reviewToApprove]);
    }

    try {
      await approveReview(reviewId);
      toast.success(t("reviews.reviewApproved") || "تم اعتماد التقييم بنجاح", { id: toastId });
    } catch (err) {
      console.error("Error approving review:", err);
      if (reviewToApprove) {
        setPendingReviews((prev) => [...prev, reviewToApprove]);
        setAllReviews((prev) => prev.filter((r) => r.review_id !== reviewId));
      }
      toast.error(t("reviews.failedToApprove") || "فشل في اعتماد التقييم", { id: toastId });
      await fetchAllData();
    } finally {
      setOperationInProgress(null);
    }
  };

  const handleDelete = async (reviewId: number) => {
    if (operationInProgress !== null) return;
    if (!confirm("هل أنت متأكد من حذف هذا التقييم؟")) return;

    setOperationInProgress(reviewId);
    const toastId = toast.loading(t("reviews.deleting") || "جاري الحذف...");
    const isPending = pendingReviews.some((r) => r.review_id === reviewId);

    if (isPending) {
      setPendingReviews((prev) => prev.filter((r) => r.review_id !== reviewId));
    } else {
      setAllReviews((prev) => prev.filter((r) => r.review_id !== reviewId));
    }

    try {
      await deleteReview(reviewId);
      toast.success(t("reviews.reviewDeleted") || "تم حذف التقييم بنجاح", { id: toastId });
    } catch (err) {
      console.error("Error deleting review:", err);
      await fetchAllData();
      toast.error(t("reviews.failedToDelete") || "فشل في حذف التقييم", { id: toastId });
    } finally {
      setOperationInProgress(null);
    }
  };

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <div className="p-4 md:p-6 min-h-screen text-slate-200 font-sans" dir="rtl">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-white/[0.08] gap-4">
            <div>
              <h1 className="text-xl font-black tracking-tight text-emerald-400">
                إدارة تقييمات وآراء العملاء
              </h1>
              <p className="text-slate-400 text-xs mt-1">مراجعة التقييمات المقدمة من المستخدمين واعتمادها للنشر أو حذفها</p>
            </div>

            {/* Tab switchers */}
            <div className="flex items-center gap-1.5 p-1 bg-[#0E121E] rounded-md border border-white/[0.08]">
              <button
                onClick={() => setActiveTab("pending")}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  activeTab === "pending"
                    ? "bg-emerald-600 text-white"
                    : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <span>التقييمات المعلقة</span>
                {pendingReviews.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-black">
                    {pendingReviews.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("approved")}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  activeTab === "approved"
                    ? "bg-emerald-600 text-white"
                    : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <span>المعتمدة</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white/10 text-white">
                  {allReviews.length}
                </span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="border border-white/[0.08] rounded-lg p-12 bg-[#0B0E17] text-center text-slate-400 text-xs font-semibold">
              جاري تحميل بيانات التقييمات...
            </div>
          ) : activeTab === "pending" ? (
            /* Pending Reviews Table */
            <div className="border border-white/[0.08] rounded-lg p-5 bg-[#0B0E17]">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.06]">
                <h2 className="text-base font-bold text-emerald-400">
                  قائمة التقييمات بانتظار الموافقة ({pendingReviews.length})
                </h2>
              </div>

              {pendingReviews.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs font-semibold">
                  لا توجد أي تقييمات معلقة حالياً
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.08] text-slate-400 text-[11px] font-bold">
                        <th className="pb-3 pr-2 w-16">المعرف</th>
                        <th className="pb-3 w-48">العميل</th>
                        <th className="pb-3">التعليق والتقييم</th>
                        <th className="pb-3 text-center w-36">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.05]">
                      {pendingReviews.map((review) => {
                        const userName = `${review.user?.first_name || ""} ${review.user?.last_name || ""}`.trim() || "عميل مجهول";
                        const initials = `${review.user?.first_name?.[0] || ""}${review.user?.last_name?.[0] || ""}`.toUpperCase() || "U";
                        const isBusy = operationInProgress === review.review_id;

                        return (
                          <tr key={review.review_id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3 pr-2 font-mono text-slate-500">#{review.review_id}</td>
                            <td className="py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="h-7 w-7 rounded-full bg-[#161B29] border border-white/10 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                                  {initials}
                                </div>
                                <span className="font-bold text-white truncate max-w-[140px]">{userName}</span>
                              </div>
                            </td>
                            <td className="py-3 text-slate-300 leading-relaxed max-w-md">
                              <p className="line-clamp-2">{review.comment}</p>
                            </td>
                            <td className="py-3">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleApprove(review.review_id)}
                                  disabled={isBusy}
                                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition-colors disabled:opacity-50"
                                >
                                  {isBusy ? "جاري..." : "اعتماد"}
                                </button>
                                <button
                                  onClick={() => handleDelete(review.review_id)}
                                  disabled={isBusy}
                                  className="px-3 py-1 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded text-xs font-bold transition-colors disabled:opacity-50"
                                >
                                  {isBusy ? "جاري..." : "حذف"}
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
          ) : (
            /* Approved Reviews Table */
            <div className="border border-white/[0.08] rounded-lg p-5 bg-[#0B0E17]">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.06]">
                <h2 className="text-base font-bold text-emerald-400">
                  التقييمات المعتمدة المنشورة ({allReviews.length})
                </h2>
              </div>

              {allReviews.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs font-semibold">
                  لا توجد تقييمات معتمدة مسجلة حالياً
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.08] text-slate-400 text-[11px] font-bold">
                        <th className="pb-3 pr-2 w-16">المعرف</th>
                        <th className="pb-3 w-48">العميل</th>
                        <th className="pb-3">التعليق</th>
                        <th className="pb-3 text-center w-28">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.05]">
                      {allReviews.map((review) => {
                        const userName = `${review.user?.first_name || ""} ${review.user?.last_name || ""}`.trim() || "عميل مجهول";
                        const initials = `${review.user?.first_name?.[0] || ""}${review.user?.last_name?.[0] || ""}`.toUpperCase() || "U";
                        const isBusy = operationInProgress === review.review_id;

                        return (
                          <tr key={review.review_id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3 pr-2 font-mono text-slate-500">#{review.review_id}</td>
                            <td className="py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="h-7 w-7 rounded-full bg-[#161B29] border border-white/10 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                                  {initials}
                                </div>
                                <span className="font-bold text-white truncate max-w-[140px]">{userName}</span>
                              </div>
                            </td>
                            <td className="py-3 text-slate-300 leading-relaxed max-w-md">
                              <p className="line-clamp-2">{review.comment}</p>
                            </td>
                            <td className="py-3">
                              <div className="flex items-center justify-center">
                                <button
                                  onClick={() => handleDelete(review.review_id)}
                                  disabled={isBusy}
                                  className="px-3 py-1 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded text-xs font-bold transition-colors disabled:opacity-50"
                                >
                                  {isBusy ? "جاري..." : "حذف"}
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
          )}
        </div>
      </div>
    </>
  );
};

export default AdminReviewPanel;
