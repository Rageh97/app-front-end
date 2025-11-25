import { Dialog } from "@headlessui/react";
import { NewToolsDto } from "@/types/tools/new-tools-dto";
import LoadingButton from "../LoadingButton";
import { checkIfImageUrl } from "@/utils/imageValidator";
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';

interface ReviewModalProps {
  modalOpen: boolean;
  setModalOpen: Function;
}

const ReviewModal: React.FC<
ReviewModalProps & {
    setModalOpen: Function;
    
  }
> = ({ modalOpen, setModalOpen}) => {
  const [review, setReview] = useState({
    rating: 0,
    comment: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', isError: false });
  const handleSubmit = async () => {
    if (!review.comment ) {
      setMessage({ text: 'الرجاء ملئ حقل التعليق', isError: true });
      toast.error('الرجاء ملئ حقل التعليق');
      return;
    }
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('a');

      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await axios.post(process.env.NEXT_PUBLIC_API_URL + '/api/reviews', review, {
        headers: {
          'Authorization': `Bearer ${token}`,
          "User-Client": global.clientId1328, // Custom header for visitorId
          'Content-Type': 'application/json'
        }
      });

      toast.success('تم إرسال التقييم بنجاح!');
      setReview({ rating: 0, comment: '' });
      setModalOpen(false);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         'حدث خطأ أثناء إرسال التقييم';
      if (errorMessage === 'You already sent a review') {
        toast.error('لقد أضفت تعليق من قبل');
      } else {
        toast.error("'لقد أضفت تعليق من قبل");
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <>
    <Toaster
      position="top-right"
      reverseOrder={false}
    />
    <Dialog
      open={modalOpen}
      onClose={() => {
        setModalOpen(false);
      }}
      className="fixed top-0 left-0 z-999999 flex h-full min-h-screen w-full items-center justify-center bg-black/90 px-4 py-5"
    >
      <Dialog.Panel className="w-full max-w-[730px] h-[350px] text-center dark:bg-boxdark">
        <div className="flex bg-[linear-gradient(180deg,_#00c48c,_#4f008c)] overflow-hidden w-full h-full rounded-[20px] bg-white">
         
          <div className="w-[100%] p-5 h-full flex flex-col items-center gap-8 py-8">
           <div className="flex items-center flex-col w-full">
           <h3 className="bg-[#00c48c] w-30 rounded-xl inner-shadow text-black p-1 mb-1">اكتب تعليقك</h3>
            
            <textarea required   value={review.comment}
          onChange={(e) => setReview(prev => ({ ...prev, comment: e.target.value }))}
          placeholder="يسرنا تشاركنا رايك وان تضف تعليقك وتقييم خدماتنا"  className="p-2 w-full h-30 rounded-xl border-2 border-[#ff7702] bg-[#190237] focus:outline-none focus:border-orange-500">

            </textarea>
            
           </div>
            <div className="text-orange w-70 bg-[#00c48c] bg-opacity-20 rounded-2xl px-1 text-2xl sm:text-3xl">★ ★ ★ ★ ★</div>
            {/* <p className="text-white font-bold">سوف يظهر  لك كوبون خصم على جميع باقاتنا بعد تقييمك لنا</p> */}
            <button
             onClick={handleSubmit}
             disabled={isSubmitting}
             className="flex items-center justify-center w-40 border-white font-bold text-white rounded-xl  bg-[#00c48c] gap-1 px-3 py-1">
            
            {isSubmitting ? (
              <button
                type="button"
                className="flex items-center justify-center w-40 border-white font-bold text-white rounded-xl  bg-[#00c48c] gap-1 px-2 py-1"
                onClick={() => setModalOpen(false)}
              >
                Close
              </button>
            ) : (
              'Send'
            )}
              <ChevronRight />
            </button>
            <p className="text-orange text-lg">{message.text}</p>
            
          </div>

            {/* <div className="w-[40%]  gap-1 h-full flex flex-col items-center p-4 text-start relative">
              
              <h3 className="bg-[#00c48c] w-50 text-center rounded-xl inner-shadow text-white p-1 mb-1">استلم كوبونك من هنا </h3>

              
              <div className="bg-[#190237] flex flex-col items-center w-full text-white text-center rounded-2xl border-2 border-[#ff7702] p-3 ">
               <img className="w-50" src="/images/coupon.png"/>
                <h1 className="text-5xl font-bold">
                ch13
                </h1>
                <button className="text-orange rounded-xl px-2 py-1 ">Copy coupon</button>
              </div>
              <div className="bg-[#00c48c] w-full text-center bg-opacity-20 rounded-xl px-3 py-1 inner-shadow text-white">ينتهي الكوبون بعد 3Days</div>
            </div> */}

        </div>
      </Dialog.Panel>
    </Dialog>
    </>
  );
};

export default ReviewModal;