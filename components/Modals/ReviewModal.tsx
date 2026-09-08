import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import { ChevronRight, X, Star, Send, Loader2 } from 'lucide-react';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import i18n from "@/i18n";

interface ReviewModalProps {
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ modalOpen, setModalOpen }) => {
  const [review, setReview] = useState({
    rating: 5,
    comment: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!review.comment.trim()) {
      toast.error('الرجاء كتابة تعليقك أولاً');
      return;
    }
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('a');

      if (!token) {
        throw new Error('Authentication required');
      }

      await axios.post(process.env.NEXT_PUBLIC_API_URL + '/api/reviews', review, {
        headers: {
          'Authorization': `Bearer ${token}`,
          "User-Client": (global as any).clientId1328,
          'Content-Type': 'application/json'
        }
      });

      toast.success('تم إرسال تقييمك بنجاح! شكرًا لك ✨');
      setReview({ rating: 5, comment: '' });
      setModalOpen(false);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         'حدث خطأ أثناء إرسال التقييم';
      if (errorMessage === 'You already sent a review') {
        toast.error('لقد قمت بإضافة تقييم مسبقاً');
      } else {
        toast.error('تعذر إرسال التقييم، يرجى المحاولة مرة أخرى');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
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
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95 translate-y-4"
                enterTo="opacity-100 scale-100 translate-y-0"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100 translate-y-0"
                leaveTo="opacity-0 scale-95 translate-y-4"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-3xl bg-white dark:bg-[#0E1017] dark:border dark:border-zinc-800/90 shadow-2xl p-6 sm:p-8 text-center transition-all w-full max-w-lg">
                  {/* Close Button */}
                  <button
                    onClick={() => setModalOpen(false)}
                    className={`absolute top-4 ${i18n.language === 'ar' ? 'left-4' : 'right-4'} p-2 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white transition-all`}
                  >
                    <X size={18} />
                  </button>

                  <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">
                    شاركنا رأيك وتقييمك
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mb-6">
                    رأيك يساعدنا على تطوير الخدمات وتقديم تجربة أفضل دائماً.
                  </p>

                  {/* Rating Stars */}
                  <div className="flex items-center justify-center gap-2 mb-6 py-2 px-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 w-fit mx-auto">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReview((prev) => ({ ...prev, rating: star }))}
                        className="transition-transform hover:scale-125 focus:outline-none"
                      >
                        <Star
                          size={24}
                          className={`${
                            star <= review.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-zinc-600"
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  {/* Textarea */}
                  <textarea
                    required
                    rows={4}
                    value={review.comment}
                    onChange={(e) => setReview((prev) => ({ ...prev, comment: e.target.value }))}
                    placeholder="اكتب تعليقك هنا..."
                    className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#141724] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 text-xs sm:text-sm focus:outline-none focus:border-[#00c48c] transition-all resize-none mb-6"
                  />

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-extrabold text-sm bg-[#00c48c] hover:bg-[#00b07d] text-slate-950 shadow-md shadow-[#00c48c]/20 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>جاري الإرسال...</span>
                      </>
                    ) : (
                      <>
                        <span>إرسال التقييم</span>
                        <Send size={16} className={i18n.language === 'ar' ? 'rotate-180' : ''} />
                      </>
                    )}
                  </button>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
};

export default ReviewModal;