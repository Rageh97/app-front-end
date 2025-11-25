import React from 'react'
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { useState, useEffect } from 'react';
import useReviews from "@/hooks/useReviews"
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

interface Review {
  review_id: number;
  user_id: number;
  comment: string;
  isApproved: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    first_name: string;
    last_name: string;
  };
}

const ClientReviews = () => {
  const { t } = useTranslation();
  const { loading, error, getApprovedReviews } = useReviews();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [expandedReviews, setExpandedReviews] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchReviews = async () => {
      const data = await getApprovedReviews();
      if (Array.isArray(data)) {
        setReviews(data);
      }
    };
    fetchReviews();
  }, []);

  if (loading) return <div>Loading reviews...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!reviews || reviews.length === 0) return <div>No reviews available</div>;

  const extendedReviews = [...reviews, ...reviews];

  return (
    <div className="w-full mt-10">
        <div className="px-4 md:px-0 flex items-center text-center justify-center w-full">
          <h2 className="w-full px-20 md:px-40 py-3 md:py-4 font-bold text-lg lg:text-4xl text-white bg-[linear-gradient(135deg,#4f008c,#190237,#190237)] gradient-border-3 rounded-xl"> {t("dashboard.Reviews")}</h2>
        </div>
       
        <Swiper
          modules={[Autoplay, Navigation, Pagination]}
          spaceBetween={50}
          slidesPerView={3}
          centeredSlides={true}
          loop={true}    
          //  loopAdditionalSlides={3}
           speed={800}
          autoplay={{
            delay: 2000,
            disableOnInteraction: false,
          }}
          dir={i18n.language === "ar" ? "ltr" : "ltr"}
          breakpoints={{
            0: {
              slidesPerView: 1,
              
            },
            640: {
              slidesPerView: 1,
            },
            768: {
              slidesPerView: 2,
            },

            1024: {
              slidesPerView: 2,
            },
            1280: {
              slidesPerView: 3,
            },
          }}
          // pagination={false}
          className="w-full flex justify-center items-center relative mt-20"
        >
          {extendedReviews.map((review, index) => (
            <SwiperSlide key={review.review_id + index} className="flex justify-center py-10 px-10 md:px-0 ">
              <div  className="bg-[linear-gradient(135deg,_#4f008c,_#190237,_#190237)]  rounded-3xl gradient-border-review shadow-md relative transition-all duration-300">
                <div className="absolute -top-10 left-1/2 -translate-x-1/2">
                  <img
                    src="/images/User free icons designed by Uniconlabs.jpeg"
                    alt="Client"
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-[#ffffff]"
                  />
                <div className="relative">
                
                  <img
                    src="/images/verify.png"
                    alt="verified"
                    className="absolute -bottom-1 -right-14 w-4 sm:-right-25 md:-right-18 lg:-right-30"
                  />
                  <img
                    src="/images/quote.png"
                    alt="quote"
                    className="absolute -bottom-1 -left-14 w-4 sm:-left-25 md:-left-18 lg:-left-30"
                  />
                </div>
              </div>
             
              <div
                className="pt-7 md:pt-13 pb-2 px-3 flex items-center gap-1 flex-col justify-center"
              >
                <div className="whitespace-normal w-full max-w-xs text-center">
                  <h3 className="font-bold text-[#00c48c] text-lg sm:text-xl break-words">
                   {review.user.first_name + " " + review.user.last_name}
                  </h3>
                </div>
                <div className="whitespace-normal w-full max-w-xs text-center">
                  <p className="text-sm sm:text-lg text-white mt-2  break-words">
                 {review.comment}
                  </p>
                </div>
               
                <div className="text-orange text-2xl sm:text-3xl">★★★★★</div>
             

              
              </div> 
            </div>
          
          </SwiperSlide>
          ))}
         
          
      </Swiper>
      </div> 
  )
}

export default ClientReviews
