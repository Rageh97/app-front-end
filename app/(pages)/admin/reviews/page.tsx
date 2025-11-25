"use client"
import { useEffect, useState } from "react"
import toast, { Toaster } from "react-hot-toast";
import useReviews from "@/hooks/useReviews"
import { useTranslation } from 'react-i18next';

const AdminReviewPanel = () => {
  const { t } = useTranslation();
  const { getPendingReviews, approveReview, deleteReview, getApprovedReviews } = useReviews();
  
  const [pendingReviews, setPendingReviews] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operationInProgress, setOperationInProgress] = useState<number | null>(null);

  // Function to fetch all reviews data
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [pendingData, approvedData] = await Promise.all([
        getPendingReviews(),
        getApprovedReviews()
      ]);
      setPendingReviews(pendingData);
      setAllReviews(approvedData);
    } catch (err) {
      console.error("Error fetching reviews:", err);
      toast.error(t('reviews.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  // Handle approve action with optimistic UI update
  const handleApprove = async (reviewId: number) => {
    if (operationInProgress !== null) return;
    setOperationInProgress(reviewId);
    
    const toastId = toast.loading(t('reviews.approving'));
    const reviewToApprove = pendingReviews.find(r => r.review_id === reviewId);

    // Optimistic update
    if (reviewToApprove) {
      setPendingReviews(prev => prev.filter(r => r.review_id !== reviewId));
      setAllReviews(prev => [...prev, reviewToApprove]);
    }

    try {
      await approveReview(reviewId);
      toast.success(t('reviews.reviewApproved'), { id: toastId });
    } catch (err) {
      console.error("Error approving review:", err);
      // Revert optimistic update if failed
      if (reviewToApprove) {
        setPendingReviews(prev => [...prev, reviewToApprove]);
        setAllReviews(prev => prev.filter(r => r.review_id !== reviewId));
      }
      toast.error(t('reviews.failedToApprove'), { id: toastId });
      // Refresh data to ensure consistency
      await fetchAllData();
    } finally {
      setOperationInProgress(null);
    }
  };

  // Handle delete action with optimistic UI update
  const handleDelete = async (reviewId: number) => {
    if (operationInProgress !== null) return;
    setOperationInProgress(reviewId);
    
    const toastId = toast.loading(t('reviews.deleting'));
    const isPending = pendingReviews.some(r => r.review_id === reviewId);

    // Optimistic update
    if (isPending) {
      setPendingReviews(prev => prev.filter(r => r.review_id !== reviewId));
    } else {
      setAllReviews(prev => prev.filter(r => r.review_id !== reviewId));
    }

    try {
      await deleteReview(reviewId);
      toast.success(t('reviews.reviewDeleted'), { id: toastId });
    } catch (err) {
      console.error("Error deleting review:", err);
      // Revert optimistic update if failed
      await fetchAllData();
      toast.error(t('reviews.failedToDelete'), { id: toastId });
    } finally {
      setOperationInProgress(null);
    }
  };

  if (loading) return <div className="text-white text-center p-5">{t('reviews.loading')}</div>;
  if (pendingReviews.length === 0 && allReviews.length === 0) {
    return <p className="text-center text-orange p-5">{t('reviews.noReviews')}</p>
  }

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <div className="w-full overflow-x-auto mt-4 p-5">
        {pendingReviews.length > 0 && (
          <div className="mb-8">
            <h2 className="text-orange text-xl mb-3 font-bold">{t('reviews.pendingReviews')}</h2>
            <table className="w-full table-auto datatable-one">
              <thead>
                <tr className="bg-gray-800 shadow-xl text-orange bg-[linear-gradient(135deg,_#4f008c,_#190237,_#190237)]">
                  <th className="p-3 text-center font-bold text-xs md:text-lg inner-shadow">{t('reviews.id')}</th>
                  <th className="p-3 text-center font-bold text-xs md:text-lg inner-shadow">{t('reviews.userName')}</th>
                  <th className="p-3 text-center font-bold text-xs md:text-lg inner-shadow">{t('reviews.reviewComment')}</th>
                  <th className="p-3 text-center font-bold text-xs md:text-lg inner-shadow">{t('reviews.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {pendingReviews.map(review => (
                  <tr key={review.review_id} className="border-b border-gray-500 bg-[linear-gradient(135deg,rgba(79,0,140,0.54),rgba(25,2,55,0.5),rgba(25,2,55,0.3))]">
                    <td className="p-3 text-white text-center text-xs md:text-sm">{review.review_id}</td>
                    <td className="p-3 text-white text-center text-xs md:text-sm">{review.user.first_name + " " + review.user.last_name}</td>
                    <td className="p-3 text-white text-center text-xs md:text-sm">{review.comment}</td>
                    <td className="p-3">
                      <div className="flex gap-2 justify-center">
                        <button 
                          onClick={() => handleApprove(review.review_id)}
                          disabled={operationInProgress === review.review_id}
                          className={`text-xs md:text-sm px-3 py-1 rounded-lg text-white ${
                            operationInProgress === review.review_id 
                              ? 'bg-gray-500' 
                              : 'bg-[#00c48c] hover:bg-[#00aa77]'
                          }`}
                        >
                          {operationInProgress === review.review_id ? t('reviews.processing') : t('reviews.approve')}
                        </button>
                        <button 
                          onClick={() => handleDelete(review.review_id)}
                          disabled={operationInProgress === review.review_id}
                          className={`text-xs md:text-sm px-3 py-1 rounded-lg text-white ${
                            operationInProgress === review.review_id 
                              ? 'bg-gray-500' 
                              : 'bg-red hover:bg-red-600'
                          }`}
                        >
                          {operationInProgress === review.review_id ? t('reviews.processing') : t('reviews.delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {allReviews.length > 0 && (
          <div>
            <h2 className="text-orange text-xl mb-3 font-bold">{t('reviews.approvedReviews')}</h2>
            <table className="w-full table-auto datatable-one">
            <thead>
                <tr className="bg-gray-800 shadow-xl text-orange bg-[linear-gradient(135deg,_#4f008c,_#190237,_#190237)]">
                  <th className="p-3 text-center font-bold text-xs md:text-lg inner-shadow">{t('reviews.id')}</th>
                  <th className="p-3 text-center font-bold text-xs md:text-lg inner-shadow">{t('reviews.userName')}</th>
                  <th className="p-3 text-center font-bold text-xs md:text-lg inner-shadow">{t('reviews.reviewComment')}</th>
                  <th className="p-3 text-center font-bold text-xs md:text-lg inner-shadow">{t('reviews.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {allReviews.map(review => (
                  <tr key={review.review_id} className="border-b border-gray-500 bg-[linear-gradient(135deg,rgba(79,0,140,0.7),rgba(25,2,55,0.7),rgba(25,2,55,0.5))]">
                  <td className="p-3 text-white text-center text-xs md:text-sm">{review.review_id}</td>
                  <td className="p-3 text-white text-center text-xs md:text-sm">{review.user.first_name + " " + review.user.last_name}</td>
                  <td className="p-3 text-white text-center text-xs md:text-sm">{review.comment}</td>
                  <td className="p-3">
                      <div className="flex gap-2 justify-center">
                        <button 
                          onClick={() => handleDelete(review.review_id)}
                          disabled={operationInProgress === review.review_id}
                          className={`text-xs md:text-sm px-3 py-1 rounded-lg text-white ${
                            operationInProgress === review.review_id 
                              ? 'bg-gray-500' 
                              : 'bg-red hover:bg-red-600'
                          }`}
                        >
                          {operationInProgress === review.review_id ? t('reviews.processing') : t('reviews.delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminReviewPanel;