"use client";
import CardItem from "@/components/CardItem";
import PremiumLoader from "@/components/PremiumLoader";
import { FunctionComponent, useEffect, useState } from "react";
import { NewToolsDto } from "@/types/tools/new-tools-dto";
import ToolModalDetails from "@/components/Modals/ToolModalDetails";
import ModalPayment from "@/components/Modals/PaymentModal";
import ReviewModal from "@/components/Modals/ReviewModal";
import CihBankOrderDetailsInfoModal from "@/components/Modals/CihBankOrderDetailsInfoModal";
import { useMyInfo } from "@/utils/user-info/getUserInfo";
import TijariBankOrderDetailsInfoModal from "@/components/Modals/TijariBankOrderDetailsInfoModal";
import { AlignJustify, Search, ShoppingCart, X } from "lucide-react";
import Link from "next/link";
import { useSearchToolByName } from "@/utils/tool/getToolByName";
import { useTranslation } from "react-i18next";
import axios from "@/utils/api";
import i18n from "@/i18n";
import ToolErrorExtention from "@/components/Modals/ToolErrorExtention";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface Banner {
  id: number;
  image_url: string;
  link_url?: string | null;
  title?: string | null;
}

type Period = "month" | "year" | "day";

const Dashboard: FunctionComponent = () => {

  const { t } = useTranslation();
  const { data } = useMyInfo();
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [openChatModal, setOpenChatModal] = useState<boolean>(false);
  const [toolsData, setToolsData] = useState(global.globalToolsData);
  const [toolData, setToolData] = useState<NewToolsDto>(null);
  const [openReviewModal, setOpenReviewModal] = useState<boolean>(false);
  const [openDetailModal, setOpenDetailModal] = useState<boolean>(false);
  const [openPaymentModal, setOpenPaymentModal] = useState<boolean>(false);
  const [seachedTool, setSearchedTool] = useState<string>("");
  const [stabilityFilter, setStabilityFilter] = useState<'all' | boolean>('all');
  const [accessFilter, setAccessFilter] = useState<'all' | 'free' | 'pro'>('all');
  const [extensionDetected, setExtensionDetected] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return !!global.freeToolsExtensionDetected;
  });
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [showCihBankOrderDetailsInfoModal, setShowCihBankOrderDetailsInfoModal] = useState<boolean>(false);
  const [showTijariBankOrderDetailsInfoModal, setShowTijariBankOrderDetailsInfoModal] = useState<boolean>(false);
  const [showNoResults, setShowNoResults] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("month");
  const [openCihDetailsModal, setOpenCihDetailsModal] = useState<boolean>(false);
  const [openTijariDetailsModal, setOpenTijariDetailsModal] = useState<boolean>(false);
  
  // Media Hub Visibility State
  const [isMediaHubEnabled, setIsMediaHubEnabled] = useState(true);
  const [isAiHubEnabled, setIsAiHubEnabled] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [mediaRes, aiRes] = await Promise.all([
          axios.get("/api/admin/settings/media_hub_enabled"),
          axios.get("/api/admin/settings/ai_hub_enabled")
        ]);
        setIsMediaHubEnabled(String(mediaRes.data.value) !== 'false');
        setIsAiHubEnabled(String(aiRes.data.value) !== 'false');
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      }
    };
    fetchSettings();

    const handleSettingsChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        if (customEvent.detail.key === 'media_hub_enabled') {
          setIsMediaHubEnabled(customEvent.detail.value);
        } else if (customEvent.detail.key === 'ai_hub_enabled') {
          setIsAiHubEnabled(customEvent.detail.value);
        }
      }
    };

    window.addEventListener('settingsChanged', handleSettingsChange);
    return () => window.removeEventListener('settingsChanged', handleSettingsChange);
  }, []);

  interface MediaCategoryDashboard {
    category_id: number;
    name: string;
    description: string;
    filesCount: number;
    cover_image: string | null;
  }
  const [mediaCategories, setMediaCategories] = useState<MediaCategoryDashboard[]>([]);

  useEffect(() => {
    const fetchMediaCategories = async () => {
      try {
        const response = await axios.get(`/api/media/categories?t=${Date.now()}`);
        setMediaCategories(response.data);
      } catch (error) {
        console.error("Failed to fetch media categories", error);
      }
    };
    fetchMediaCategories();
  }, []);

  const {
    isLoading: isSearching,
    data: searchedData,
  } = useSearchToolByName(seachedTool);
  
  // Filter tools based on search and stability, then deduplicate by name (trim trailing spaces)
  const filteredToolsOriginal = (seachedTool.trim() !== "" ? (searchedData || []) : (toolsData || []))
    .filter(tool => {
      if (stabilityFilter !== 'all' && tool.isStable !== stabilityFilter) {
        return false;
      }
      if (accessFilter === 'free' && !tool.isFree) {
        return false;
      }
      if (accessFilter === 'pro' && tool.isFree) {
        return false;
      }
      return true;
    });

  const seenTools = new Set();
  const filteredTools = filteredToolsOriginal.filter((tool: any) => {
    const cleanName = tool.tool_name.trim();
    if (seenTools.has(cleanName)) return false;
    seenTools.add(cleanName);
    return true;
  });

  const shuffleArray = async (array: any) => {
    let data = array;
    for (let i = data.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [data[i], data[j]] = [data[j], data[i]];
    }
    return data;
  };

  if (data && !toolsData && !global.shuffleArray) {
    if (!global.shuffleArray) {
      const shuffleNow = async () => {
        let shuffledData = await shuffleArray(data.toolsData);
        global.globalToolsData = shuffledData;
        setToolsData(shuffledData);
      };
      shuffleNow();
      global.shuffleArray = true;
    }
  }

  useEffect(() => {
    const handleExtensionPing = (event: MessageEvent) => {
      if (
        (event.data?.type === "FROM_EXTENSION" &&
        event.data?.data?.m === "Hello from the extension!") ||
        event.data?.type === 'NT_NEW_EXT_DETECTED'
      ) {
        setExtensionDetected(true);
        global.freeToolsExtensionDetected = true;
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("message", handleExtensionPing);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("message", handleExtensionPing);
      }
    };
  }, []);

  useEffect(() => {
    document.title = 'Toolz & Apps';
    if (global.shuffleArray) {
      setToolsData(global.globalToolsData);
    }
  }, []);

  useEffect(() => {
    const fetchActiveBanners = async () => {
      try {
        setBannerError(null);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/banners`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: response.statusText }));
          throw new Error(`Failed to fetch banners: ${errorData.message || response.statusText}`);
        }
        const data: Banner[] = await response.json();
        setBanners(data);
      } catch (err: any) {
        setBannerError(err.message);
       
      } finally {
      }
    };
    fetchActiveBanners();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/tool-categories`, {
          headers: {
            Authorization: localStorage.getItem("a") || "",
            "User-Client": global.clientId1328,          },
        });
        const data = await response.json();
        setCategories(data);
      } catch (error) {
      }
    };

    fetchCategories();
  }, []);

  const handleCategoryClick = async (category: string) => {
    setSelectedCategory(category);
    setShowCategories(false);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/search-tools-by-category`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: localStorage.getItem("a") || "",
          "User-Client": global.clientId1328,
        },
        body: JSON.stringify({ category }),
      });
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        setToolsData(data);
        setShowNoResults(false);
      } else {
        setToolsData([]);
        setShowNoResults(true);
      }
    } catch (error) {
      setToolsData([]);
      setShowNoResults(true);
    }
  };
//...........................................
const placeholders  = [
  t('dashboard.search'),
  t('dashboard.searchSubscribe'),
];





const [displayedText, setDisplayedText] = useState("");
const [placeholderIndex, setPlaceholderIndex] = useState(0);
const [charIndex, setCharIndex] = useState(0);
useEffect(() => {
  const currentPhrase = placeholders[placeholderIndex];
  
  if (charIndex < currentPhrase.length) {
    const timeout = setTimeout(() => {
      setDisplayedText(currentPhrase.slice(0, charIndex + 1));
      setCharIndex(charIndex + 1);
    }, 100); // سرعة الكتابة

    return () => clearTimeout(timeout);
  } else {
    // بعد كتابة الجملة كاملة، انتظر قليلاً ثم انتقل للجملة التالية
    const pause = setTimeout(() => {
      setCharIndex(0);
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
      setDisplayedText("");
    }, 2000); // مدة الانتظار بعد الكتابة الكاملة

    return () => clearTimeout(pause);
  }
}, [charIndex, placeholderIndex]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoadingPage(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleToolCardClick = (item: NewToolsDto) => {
    if (item?.isFree) {
      if (!extensionDetected) {
        setShowExtensionModal(true);
        return;
      }
      if (item?.tool_url && typeof window !== "undefined") {
        window.open(item.tool_url, "_blank", "noopener,noreferrer");
      }
      return;
    }
    setPeriod("month");
    setToolData(item);
    setOpenDetailModal(true);
  };

  if (isLoadingPage) {
    return <PremiumLoader />;
  }

  return (
    <>

    <div className="mt-2 mb-0 xxl:mb-2 flex flex-col xl:flex-row items-center justify-between gap-2 lg:gap-0">
          <div className="flex items-center mb-5 xl:mb-0 gap-10 lg:gap-2">
           
          <div onClick={() => setOpenReviewModal(true)} className={`cursor-pointer hidden md:flex ml-0 ${i18n.language === 'ar' ? 'lg:mr-7' :'lg:ml-7'} px-3 py-1.5 lg:px-6 lg:py-1.5 flex items-center justify-center gap-1 lg:gap-3 bg-[#35214f] inner-shadow rounded-xl`}>
                <h1 className="text-white text-base lg:text-lg whitespace-nowrap">{t('dashboard.rateUs')}</h1>
                <img className="w-6 md:w-8" src="https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExdTl4czFqbnc2YjQyOXpjejU5NHZ6cnhka20yNGh3dWxldWttcXd0biZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/C4b6GwFKbYxK8/giphy.gif" alt="rate us"/>
            </div>
    
            <div className="flex items-center border-1 border-[#ff7702] bg-[#190237] rounded-xl cursor-pointer ">
                <div 
                  onClick={() => setStabilityFilter('all')} 
                  className={`px-3 lg:px-4 py-2 lg:py-2 ${stabilityFilter === 'all' ? 'bg-[#35214f]' : 'bg-[#190237]'} text-white text-xs sm:text-base lg:text-lg ${i18n.language === 'ar'?" rounded-r-xl" :"rounded-l-xl"} cursor-pointer transition-colors duration-200 whitespace-nowrap`}>
                  {t('dashboard.all')}
                </div>
                <div 
                  onClick={() => setStabilityFilter(false)} 
                  className={`px-3 lg:px-4 py-2 lg:py-2 ${stabilityFilter === false ? 'bg-[#35214f]' : 'bg-[#190237]'} text-white text-xs sm:text-base lg:text-lg cursor-pointer transition-colors duration-200 whitespace-nowrap`}>
                  {t('dashboard.unstable')}
                </div>
                <div 
                  onClick={() => setStabilityFilter(true)}
                  className={`px-3 lg:px-4 py-2 lg:py-2 ${stabilityFilter === true ? 'bg-[#35214f]' : 'bg-[#190237]'} text-white text-xs sm:text-base lg:text-lg ${i18n.language === 'ar'?" rounded-l-xl " :"rounded-r-xl"} cursor-pointer transition-colors duration-200 whitespace-nowrap`}>
                  {t('dashboard.stable')}
                </div>
            </div>

            <div className="flex items-center border-1 border-[#00c48c] bg-[#190237] rounded-xl cursor-pointer ">
                <div 
                  onClick={() => setAccessFilter('all')} 
                  className={`px-3 lg:px-4 py-2 lg:py-2 ${accessFilter === 'all' ? 'bg-[#123645]' : 'bg-transparent'} text-white text-xs sm:text-base lg:text-lg ${i18n.language === 'ar' ? 'rounded-r-xl' : 'rounded-l-xl'} transition-colors duration-200 whitespace-nowrap`}>
                  {t('dashboard.all')}
                </div>
                <div 
                  onClick={() => setAccessFilter('free')} 
                  className={`px-3 lg:px-4 py-2 lg:py-2 ${accessFilter === 'free' ? 'bg-[#00c48c]' : 'bg-transparent'} text-white text-xs sm:text-base lg:text-lg transition-colors duration-200 whitespace-nowrap`}>
                  {t('dashboard.free')}
                </div>
                <div 
                  onClick={() => setAccessFilter('pro')} 
                  className={`px-3 lg:px-4 py-2 lg:py-2 ${accessFilter === 'pro' ? 'bg-[#ff7702]' : 'bg-transparent'} text-white text-xs sm:text-base lg:text-lg ${i18n.language === 'ar' ? 'rounded-l-xl' : 'rounded-r-xl'} transition-colors duration-200 whitespace-nowrap`}>
                  {t('dashboard.pro')}
                </div>
            </div>
           
            </div>

        <div className=" mx-7 px-2 md:px-0 w-full lg:w-[600px] xl:w-[700px]">
            <div className="relative flex items-center w-full">
            <Search className={`absolute text-white w-4 lg:w-5 h-4 lg:h-5 top-1/2 -translate-y-1/2 ${i18n.language === 'ar' ? 'right-3' : 'left-3'}`} />
            <input
            value={seachedTool}
            onChange={(event) => {
              setSearchedTool(event.target.value);
            }}
            className={`w-full bg-transparent placeholder:text-slate-400 text-white text-sm border border-white rounded-full py-2 lg:py-2.5 transition duration-300 ease focus:outline-none focus:border-slate-400 hover:border-slate-300 shadow-sm focus:shadow ${i18n.language === 'ar' ? 'pr-9 pl-3 text-right placeholder:text-right' : 'pl-9 pr-3 text-left placeholder:text-left'}`}
            placeholder={displayedText}/>
            </div>
        </div>
     
    </div>


{/* ............................... */}
 {/* Banner Slideshow Section */}
      {bannerError && <p className="text-red text-center my-3">Error loading banners: {bannerError}</p>}
      {banners.length > 0 ? (
        <div  className="rounded-2xl mb-2 px-1 lg:px-5 mt-2">
          <div className="overflow-hidden rounded-2xl">
            <Swiper
              modules={[Autoplay, Navigation, Pagination]}
              spaceBetween={20}
              slidesPerView={1}
              loop={true}
              autoplay={{ delay: 3000, disableOnInteraction: false }}
              // pagination={{ clickable: true }}
              // navigation

              dir={i18n.language === "ar" ? "rtl" : "rtl"}
              
              

        

              className="w-full h-full "
            >
              {banners.map(banner => (
                <SwiperSlide className="pb-20w" key={banner.id}>
                  {banner.link_url ? (
                    <a href={banner.link_url} target="_blank" rel="noopener noreferrer">
                      <img 
                      
                        className="w-full rounded-2xl h-full object-cover" 
                        src={banner.image_url?.startsWith('http') ? banner.image_url : `${process.env.NEXT_PUBLIC_API_URL}${banner.image_url}`} 
                        alt={banner.title || 'Banner'} />
                    </a>
                  ) : (
                    <img 
                    
                      className="w-full rounded-2xl h-full object-cover" 
                      src={banner.image_url?.startsWith('http') ? banner.image_url : `${process.env.NEXT_PUBLIC_API_URL}${banner.image_url}`} 
                      alt={banner.title || 'Banner'} />
                  )}
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      ) : (
        !bannerError && <p className="text-center text-white my-3">{t('dashboard.loading')}</p>
      )}
      {/* ............................... */}

      {/* AI Tools Hub Swiper Section */}
      {(isAiHubEnabled || data?.userRole === "admin" || data?.userRole === "manager") && (
      <div className="mb-0 px-1 lg:px-5 mt-2">
            {/* Swiper Loop Fix */}
            {(() => {
               const aiTools = [
                   { id: 'image', name: 'انشاء صور احترافية', path: '/ai', img: '/images/انشاء الصور.png' },
                   { id: 'video', name: 'انشاء فيديوهات احترافية', path: '/ai', img: '/images/تاثيرات الفيديو.png' },
                   { id: 'chat', name: 'نيكسوس  GPT', path: '/ai', img: '/images/chat.jpg' },
                   { id: 'image-to-text', name: 'استخراج النص من الصورة', path: '/ai', img: '/images/الصورة لنص.png' },
                   { id: 'bg-remove', name: 'حذف الخلفية', path: '/ai', img: '/images/ازالة الخلفية.png' },
                   { id: 'restore', name: 'ترميم الصور', path: '/ai', img: '/images/ترميم الصور .jpeg' },
                   { id: 'avatar', name: 'صانع الأفاتار', path: '/ai', img: '/images/انشاء افاتار.png' },
                   { id: 'nano', name: 'نانو بانانا برو', path: '/ai', img: '/images/Whisk_d2a441bc8622fa5b2774cf54a715f70feg.png' },
                   { id: 'product', name: 'نماذج لمنتجك', path: '/ai', img: '/images/نماذج لمنتجك.png' },
                   { id: 'colorize', name: 'تلوين الصور', path: '/ai', img: '/images/تلوين الصورة.png' },
                   { id: 'edit', name: 'المحرر الذكي', path: '/ai', img: '/images/تعديل الصور.png' },
                   { id: 'long-video', name: 'تحريك الصور', path: '/ai', img: '/images/محاكاة الحركة.png' },
                   { id: 'sketch', name: 'رسم إلى صورة', path: '/ai', img: '/images/رسم الصور.png' },
                   { id: 'logo', name: 'صانع الشعارات', path: '/ai', img: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=1000' },
               ];

               // Ensure we have enough items for the largest breakpoint (6 slides)
               let loopedTools = [...aiTools, ...aiTools];
               
               return (
                <Swiper
                  key={`ai-tools-${i18n.language}`} 
                  dir={i18n.language === "ar" ? "rtl" : "ltr"}
                  modules={[Navigation, Autoplay]}
                  spaceBetween={15}
                  slidesPerView={2}
                  loop={true}
                
                  autoplay={{ delay: 2500, disableOnInteraction: false, reverseDirection: true }}
                  breakpoints={{
                    640: { slidesPerView: 3 },
                    768: { slidesPerView: 4 },
                    1024: { slidesPerView: 5 },
                    1280: { slidesPerView: 6 },
                  }}
                  className="w-full py-4 pl-1"
                >
                  {loopedTools.map((tool, index) => (
                    <SwiperSlide key={`${tool.id}-${index}`}>
                      <Link href={tool.path}>
                        <div 
                          className="cursor-pointer h-40 rounded-2xl relative overflow-hidden group shadow-lg transition-all duration-300 hover:shadow-[#7c3aed]/30"
                        >
                          {/* Background Image */}
                          <img 
                            src={tool.img} 
                            alt={tool.name} 
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          
                          {/* Overlay Gradient */}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#4c00b080] via-black/20 to-transparent group-hover:via-black/50 transition-colors duration-300"></div>

                          {/* Content */}
                          <div className="absolute inset-0 flex flex-col justify-end p-4">
                              <h3 className="text-white font-bold text-lg leading-tight drop-shadow-md transform translate-y-0 transition-transform duration-300">
                                {tool.name}
                              </h3>
                              <div className="flex items-center gap-1 mt-1">
                                <span className="w-2 h-2 rounded-full bg-[#a855f7] animate-pulse"></span>
                                <p className="text-gray-200 text-[10px] font-bold">AI Powered</p>
                              </div>
                          </div>
                        </div>
                      </Link>
                    </SwiperSlide>
                  ))}
                </Swiper>
               );
            })()}
      </div>
      )}

      {/* Media Categories Swiper Section */}
      {(isMediaHubEnabled || data?.userRole === "admin" || data?.userRole === "manager") && mediaCategories.length > 0 && (
        <div className="mb-8 px-1 lg:px-5 mt-2">
            {/* <div className="flex items-center gap-2 mb-4 px-2">
               <div className="w-1 h-6 bg-[#ff7702] rounded-full"></div>
               <h2 className="text-xl font-bold text-white">Media Categories</h2>
            </div> */}
            
            {/* 
              Swiper Loop Fix:
              Swiper requires the number of slides to be >= slidesPerView * 2 (roughly) for loop to work smoothly without visual glitches.
              We duplicate the array to ensure we have enough items.
            */}
            {(() => {
               // Ensure we have enough items for the largest breakpoint (6 slides)
               let loopedCategories = [...mediaCategories];
               while (loopedCategories.length < 12 && loopedCategories.length > 0) {
                 loopedCategories = [...loopedCategories, ...mediaCategories];
               }
               
               return (
                <Swiper
                  key={`${loopedCategories.length}-${i18n.language}`} 
                  dir={i18n.language === "ar" ? "rtl" : "ltr"}
                  modules={[Navigation, Autoplay]}
                  spaceBetween={15}
                  slidesPerView={2}
                  loop={true}
                  autoplay={{ delay: 2000, disableOnInteraction: false }}
                  breakpoints={{
                    640: { slidesPerView: 3 },
                    768: { slidesPerView: 4 },
                    1024: { slidesPerView: 5 },
                    1280: { slidesPerView: 6 },
                  }}
                  className="w-full py-4 pl-1"
                >
                  {loopedCategories.map((category, index) => (
                    <SwiperSlide key={`${category.category_id}-${index}`}>
                      <Link href={`/media-hub?cat=${category.category_id}`}>
                        <div 
                          className="cursor-pointer h-40 rounded-2xl relative overflow-hidden group shadow-lg transition-all duration-300  hover:shadow-[#ff7702]/30"
                        >
                          {/* Background Image */}
                          {category.cover_image_url ? (
                            <img 
                              src={category.cover_image_url} 
                              alt={category.name} 
                              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 "
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-[#35214f] to-[#190237]"></div>
                          )}
                          
                          {/* Overlay Gradient */}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#00c48c40] via-black/40 to-transparent group-hover:via-black/60 transition-colors duration-300"></div>

                          {/* Content */}
                          <div className="absolute inset-0 flex flex-col justify-end p-4">
                              <h3 className="text-white font-bold text-lg md:text-xl leading-tight drop-shadow-md transform translate-y-0 transition-transform duration-300">
                                {category.name}
                              </h3>
                              {/* <p className="text-gray-300 text-xs mt-1 opacity-80">{category.filesCount || 0} items</p> */}
                          </div>
                        </div>
                      </Link>
                    </SwiperSlide>
                  ))}
                </Swiper>
               );
            })()}
        </div>
      )}



      {/* <h2 className="text-title-sm2 px-3 pb-7 font-extrabold text-black dark:text-white">
        Available Tools
      </h2> */}
      {/* <div className="w-full flex gap-0 lg:gap-0 flex items-center flex-wrap justify-center  mb-10 px-0 lg:px-5"> */}

        {/* <div className="flex items-center border-2 border-[#ff7702] gap-3 rounded-full text-2xl px-2 py-1 text-white bg-[linear-gradient(135deg,_#4f008c,_#190237,_#190237)]">
          <p className="text-xs md:text-2xl cursor-pointer">التصنيفات</p>
          <AlignJustify color="#ff7702" size={25}/>
        </div> */}
        <div className=" w-full  p-2 lg:p-4 flex items-center justify-between flex-wrap space-y-2 xl:space-y-0  mb-5 ">
        <div  className="relative w-[45%]  xl:w-[19%] " >
         <div className="absolute inset-0 animate-glow-shadow z-0 rounded-xl" />
        <div   onClick={() => {
    // Open the chat widget instead of TawkTo
    const chatWidget = document.querySelector('[data-chat-widget-toggle]') as HTMLButtonElement;
    if (chatWidget) {
      chatWidget.click();
    }
  }} className={`flex   items-center justify-center gradient-border-Qs ${i18n.language ==='ar'? 'gap-5 lg:gap-0 xxl:gap-20' : 'gap-0'} rounded-full text-2xl px-2 py-1 lg:py-2 text-white bg-[linear-gradient(135deg,_#4f008c,_#190237,_#190237)] cursor-pointer`}>
          <p className="text-sm font-bold md:text-lg xxl:text-xl ">{t('dashboard.technicalSupport')}</p>
          <img className="w-7 md:w-10" src="/images/headphones.gif"/>
        </div>
        </div>
        
        <Link className="w-[45%]  xl:w-[19%]" href="/videos">
        <div className="relative ">
         <div className="absolute inset-0 animate-glow-shadow z-0 rounded-full" />
        <div  className="flex items-center justify-center gradient-border-Qs xxl:gap-22 lg:gap-5 gap-10 rounded-full text-2xl px-3 py-1 lg:px-2 lg:py-2 text-white bg-[linear-gradient(135deg,_#4f008c,_#190237,_#190237)]">
          <p  className="text-sm font-bold md:text-xl cursor-pointer">{t('dashboard.tutorials')}</p>
          <img className="w-7 md:w-10" src="/images/video.gif"/>
        </div>
        </div>
        </Link>

        <Link className="w-[45%]  xl:w-[19%]" href="https://wa.me/9647702930873" target="_blank">
        <div className="relative ">
         <div className="absolute inset-0 animate-glow-shadow z-0 rounded-full" />
        <div className= {`flex items-center justify-center gradient-border-Qs ${i18n.language ==='ar'? 'xxl:gap-22 lg:gap-5 gap-3' : 'gap-6'} rounded-full text-2xl px-3 py-1 lg:px-2 lg:py-2 text-white bg-[linear-gradient(135deg,_#4f008c,_#190237,_#190237)]`}>
          <p className="text-sm font-bold md:text-xl cursor-pointer">{t('dashboard.whatsappChannel')}</p>
          <img className="w-7 md:w-10" src="/images/phone-call.gif"/>
        </div>
        </div>
        </Link>


        <div className="relative w-[45%]  xl:w-[19%]">
          <div className="relative">
            <div className="absolute inset-0 animate-glow-shadow z-0 rounded-full" />
            <div 
              onClick={() => setShowCategories(!showCategories)}
              className="flex items-center justify-center gradient-border-Qs xxl:gap-22 lg:gap-5 gap-10 rounded-full text-2xl px-3 py-1 lg:px-2 lg:py-2 text-white bg-[linear-gradient(135deg,_#4f008c,_#190237,_#190237)] cursor-pointer z-10 relative"
            >
              <p className="text-sm font-bold md:text-xl">{t('dashboard.categories')}</p>
              <img className="w-7 md:w-10" src="/images/layout.gif"/>
              </div>
          </div>

          {/* Categories Dropdown */}
          {showCategories && (
            <div className="absolute right-0 mt-2 w-56 origin-top-right bg-[linear-gradient(135deg,_#4f008c,_#190237,_#190237)] rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 gradient-border-packet z-50">
              <div className="py-1">
                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    setToolsData(global.globalToolsData);
                    setShowCategories(false);
                    setShowNoResults(false);
                  }}
                  className="w-full text-right px-4 py-2 text-sm text-white hover:bg-[#6a00bf] transition-colors duration-200 font-bold"
                >
                  {t('dashboard.all') || 'ALL'}
                </button>
                {categories.length > 0 ? (
                  categories.map((category, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        handleCategoryClick(category);
                        setShowCategories(false);
                      }}
                      className="w-full text-right px-4 py-2 text-sm text-white hover:bg-[#6a00bf] transition-colors duration-200"
                    >
                      {category}
                    </button>
                  ))
                ) : (
                  <p className="px-4 py-2 text-sm text-white text-center">{t('dashboard.loading')}</p>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Click outside handler */}
        {showCategories && (
          <div 
            className="fixed inset-0 z-[9999999999] gradient-border-2" 
            onClick={() => setShowCategories(false)}
          />
        )}


        <Link className="w-[45%]  xl:w-[19%]" href="/orders">
        <div className="relative ">
         <div className="absolute inset-0 animate-glow-shadow z-0 rounded-full" />
        <div className="flex items-center justify-center gradient-border-Qs lg-gap-5 xxl:gap-29 gap-15 rounded-full text-2xl px-3 py-1 lg:px-2 lg:py-2 text-white bg-[linear-gradient(135deg,_#4f008c,_#190237,_#190237)]">
          <p className="text-sm font-bold md:text-xl cursor-pointer">{t('dashboard.orders')}</p>
          <img className="w-7 md:w-10" src="/images/sale.gif"/>
        </div>
        </div>
        </Link>


        </div>
       
      {/* </div> */}


      <div className="grid grid-cols-1 xsm:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xxl:grid-cols-5 w-full gap-4 px-1 md:px-2">
  {isSearching ? (
    <div className="col-span-full text-center text-white">{t('dashboard.searching')}</div>
  ) : showNoResults ? (
    <div className="col-span-full text-center text-orange text-xl">
      {t('dashboard.noToolsFound')} <span className="font-bold text-white">"{seachedTool}"</span>
    </div>
  ) : filteredTools && filteredTools.length > 0 ? (
    filteredTools.map((item: NewToolsDto, index: number) => (
      <CardItem
        onClick={() => handleToolCardClick(item)}
        key={`${item.tool_id}-${index}`} // Better key using item.id if available
        toolData={item}
      />
    ))
  ) : (
    <div className="col-span-full text-center text-white">
      {t('dashboard.noToolsAvailable')}
    </div>
  )}
</div>
      


      
      
          
         

         

      {/* <DataStatsThree /> */}

      <ToolModalDetails
        modalOpen={openDetailModal}
        setModalOpen={setOpenDetailModal}
        toolData={toolData}
        onBuy={() => {
          setOpenDetailModal(false);
          setOpenPaymentModal(true);
        }}
        period={period}
        setPeriod={setPeriod}
      />
      <ReviewModal
        modalOpen={openReviewModal}
        setModalOpen={setOpenReviewModal}
        
      />

      <ModalPayment
        modalOpen={openPaymentModal}
        setModalOpen={setOpenPaymentModal}
        productId={toolData?.tool_id}
        productData={toolData}
        productType="tool"
        period={period}
        onBuySuccess={(bankName: "cih" | "tijari") => {
          setOpenPaymentModal(false);
          if (bankName === "cih") {
            setOpenCihDetailsModal(true);
          } else {
            setOpenTijariDetailsModal(true);
          }
        }}
      />

      <CihBankOrderDetailsInfoModal
        modalOpen={openCihDetailsModal}
        setModalOpen={setOpenCihDetailsModal}
        toolData={toolData}
        period={period}
      />

      <TijariBankOrderDetailsInfoModal
        modalOpen={openTijariDetailsModal}
        setModalOpen={setOpenTijariDetailsModal}
        toolData={toolData}
        period={period}
      />
      <ToolErrorExtention
        modalOpen={showExtensionModal}
        setModalOpen={setShowExtensionModal}
        message={t('subscriptions.extensionNotDetected')}
        title={t('subscriptions.extensionNotDetected')}
      />
    </>
  );
};

export default Dashboard;
