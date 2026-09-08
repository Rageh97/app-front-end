import React from 'react'
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { useState, useEffect } from 'react';
import useReviews from "@/hooks/useReviews"
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Quote, Star } from 'lucide-react';
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

  useEffect(() => {
    const fetchReviews = async () => {
      const data = await getApprovedReviews();
      if (Array.isArray(data)) {
        setReviews(data);
      }
    };
    fetchReviews();
  }, []);

  if (loading) return null;
  if (error || !reviews || reviews.length === 0) return null;

  const extendedReviews = reviews.length > 3 ? [...reviews, ...reviews] : reviews;
  const isRtl = i18n.language === "ar";

  return (
    <div className="w-full mt-12 mb-8">
      {/* Dark Mode Section Header (Centered) */}
      <div className="hidden dark:flex flex-col items-center justify-center text-center my-8">
        <h2 className="text-xl md:text-3xl font-extrabold text-white animate-emerald-shimmer">
          {t("dashboard.Reviews")}
        </h2>
        <div className="w-20 h-1 bg-gradient-to-r from-transparent via-[#00c48c] to-transparent rounded-full mt-2.5" />
      </div>

      {/* Light Mode Header */}
      <div className="dark:hidden px-4 md:px-0 flex items-center text-center justify-center w-full mb-6">
        <h2 className="w-full px-20 md:px-40 py-3 md:py-4 font-bold text-lg lg:text-4xl text-white bg-[linear-gradient(135deg,#4f008c,#190237,#190237)] gradient-border-3 rounded-xl">
          {t("dashboard.Reviews")}
        </h2>
      </div>
     
      <Swiper
        key={`reviews-carousel-${i18n.language}`}
        modules={[Autoplay, Pagination]}
        spaceBetween={20}
        slidesPerView={1}
        loop={extendedReviews.length >= 3}
        speed={700}
        autoplay={{
          delay: 3500,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        dir={isRtl ? "rtl" : "ltr"}
        breakpoints={{
          640: {
            slidesPerView: 1.5,
            spaceBetween: 20,
          },
          768: {
            slidesPerView: 2,
            spaceBetween: 20,
          },
          1024: {
            slidesPerView: 2.5,
            spaceBetween: 24,
          },
          1280: {
            slidesPerView: 3,
            spaceBetween: 24,
          },
        }}
        className="w-full !py-2"
      >
        {extendedReviews.map((review, index) => {
          const clientName = `${review.user?.first_name || ""} ${review.user?.last_name || ""}`.trim() || "عميل متميز";
          
          return (
            <SwiperSlide key={`${review.review_id}-${index}`} className="h-auto">
              {/* ==================== DARK MODE LUXURY CARD ==================== */}
              <div className="hidden dark:flex flex-col justify-between w-full h-full min-h-[190px] p-5 sm:p-6 rounded-2xl bg-[#12141F] border border-zinc-800/80 hover:border-[#00c48c]/50 transition-all duration-300 shadow-lg shadow-black/30 relative overflow-hidden group">
                {/* Subtle Top Glow Highlight */}
                <div className="absolute top-0 inset-x-1/4 h-[1px] bg-gradient-to-r from-transparent via-[#00c48c]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                {/* Card Header: Avatar, Name & Rating */}
                <div>
                  <div className="flex items-center justify-between gap-3 mb-3.5">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src="/images/User free icons designed by Uniconlabs.jpeg"
                          alt={clientName}
                          className="w-11 h-11 rounded-full border-2 border-[#00c48c]/40 object-cover shadow-sm bg-zinc-900 shrink-0"
                        />
                        <div className="absolute -bottom-0.5 -end-0.5 bg-[#12141F] rounded-full p-0.5">
                          <CheckCircle2 size={13} className="text-[#00c48c] fill-[#00c48c]/20" />
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <h3 className="font-bold text-white group-hover:text-[#00c48c] transition-colors text-sm sm:text-base leading-tight">
                          {clientName}
                        </h3>
                        <span className="text-[11px] text-zinc-400 font-medium mt-0.5">
                          عميل موثق
                        </span>
                      </div>
                    </div>

                    {/* 5 Stars */}
                    <div className="flex items-center gap-0.5 text-amber-400 shrink-0">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>

                  {/* Comment Body */}
                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed line-clamp-3 italic">
                    "{review.comment}"
                  </p>
                </div>

                {/* Bottom Watermark Quote Accent */}
                <div className="flex justify-end mt-3 pt-2 border-t border-zinc-800/40">
                  <Quote size={16} className="text-[#00c48c]/30 rotate-180" />
                </div>
              </div>

              {/* ==================== LIGHT MODE ORIGINAL CARD ==================== */}
              <div className="dark:hidden flex justify-center py-10 px-4 md:px-0">
                <div className="w-full max-w-sm bg-[linear-gradient(135deg,_#4f008c,_#190237,_#190237)] rounded-3xl gradient-border-review shadow-md relative transition-all duration-300">
                  {/* Client Avatar with verify & quote badges */}
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2">
                    <img
                      src="/images/User free icons designed by Uniconlabs.jpeg"
                      alt="Client"
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-[#ffffff] object-cover"
                    />
                    <div className="relative">
                      <img
                        src="/images/verify.png"
                        alt="verified"
                        className="absolute -bottom-1 -right-14 w-4 sm:-right-25 md:-right-18 lg:-right-30 object-contain"
                      />
                      <img
                        src="/images/quote.png"
                        alt="quote"
                        className="absolute -bottom-1 -left-14 w-4 sm:-left-25 md:-left-18 lg:-left-30 object-contain"
                      />
                    </div>
                  </div>
               
                  <div className="pt-7 md:pt-13 pb-4 px-3 flex items-center gap-1 flex-col justify-center text-center">
                    <div className="whitespace-normal w-full max-w-xs text-center">
                      <h3 className="font-bold text-[#00c48c] text-lg sm:text-xl break-words">
                        {clientName}
                      </h3>
                    </div>
                    <div className="whitespace-normal w-full max-w-xs text-center">
                      <p className="text-sm sm:text-base text-white mt-2 break-words leading-relaxed">
                        {review.comment}
                      </p>
                    </div>
                    <div className="text-orange text-2xl sm:text-3xl mt-1 select-none">
                      ★★★★★
                    </div>
                  </div> 
                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div> 
  );
};

export default ClientReviews;
