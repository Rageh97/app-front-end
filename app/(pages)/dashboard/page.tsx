"use client";
import CardItem from "@/components/CardItem";
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
import axios from "axios";
import i18n from "@/i18n";
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
  const [openChatModal, setOpenChatModal] = useState<boolean>(false);
  const [toolsData, setToolsData] = useState(global.globalToolsData);
  const [toolData, setToolData] = useState<NewToolsDto>(null);
  const [openReviewModal, setOpenReviewModal] = useState<boolean>(false);
  const [openDetailModal, setOpenDetailModal] = useState<boolean>(false);
  const [openPaymentModal, setOpenPaymentModal] = useState<boolean>(false);
  const [seachedTool, setSearchedTool] = useState<string>("");
  const [stabilityFilter, setStabilityFilter] = useState<'all' | boolean>('all');
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

  const {
    isLoading: isSearching,
    data: searchedData,
  } = useSearchToolByName(seachedTool);
  
  // Filter tools based on search and stability
  const filteredTools = (seachedTool.trim() !== "" ? (searchedData || []) : (toolsData || []))
    .filter(tool => {
      // If 'all' is selected, show all tools regardless of stability
      if (stabilityFilter === 'all') return true;
      // Otherwise, filter by stability
      return tool.isStable === stabilityFilter;
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

  return (
    <>

    <div className="mt-5 mb-0 xxl:mb-5 flex flex-col xl:flex-row items-center justify-between gap-2 lg:gap-0">
          <div className="flex items-center mb-5 xl:mb-0 gap-15 lg:gap-20">
           
            <div onClick={() => setOpenReviewModal(true)} className={`cursor-pointer ml-0 ${i18n.language === 'ar' ? 'lg:mr-7' :'lg:ml-7'} px-3 py-2 lg:px-8 lg:py-2 flex items-center justify-center gap-1 lg:gap-5 bg-[#35214f] inner-shadow rounded-xl`}>
                <h1 className="text-white text-lg lg:text-2xl">{t('dashboard.rateUs')}</h1>
                <img className="w-7 md:w-12" src="https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExdTl4czFqbnc2YjQyOXpjejU5NHZ6cnhka20yNGh3dWxldWttcXd0biZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/C4b6GwFKbYxK8/giphy.gif"/>
            </div>
    
          

            <div className="flex items-center border-1 border-[#ff7702] bg-[#190237] rounded-xl cursor-pointer">
                <div 
                  onClick={() => setStabilityFilter('all')} 
                  className={`px-2 lg:px-5 py-3 lg:py-3 ${stabilityFilter === 'all' ? 'bg-[#35214f]' : 'bg-[#190237]'} text-white text-sm sm:text-2xl ${i18n.language === 'ar'?" rounded-r-xl" :"rounded-l-xl"} lg:text-2xl  cursor-pointer`}>
                  {t('dashboard.all')}
                </div>
                <div 
                  onClick={() => setStabilityFilter(false)} 
                  className={`px-2 lg:px-5 py-3 lg:py-3 ${stabilityFilter === false ? 'bg-[#35214f]' : 'bg-[#190237]'} text-white ${i18n.language === 'ar' ? 'text-sm lg:text-lg xxl:text-xl' : 'text-sm sm:text-2xl'}   cursor-pointer`}>
                  {t('dashboard.unstable')}
                </div>
                <div 
                  onClick={() => setStabilityFilter(true)}
                  className={`px-2 lg:px-5 py-3 lg:py-3 ${stabilityFilter === true ? 'bg-[#35214f]' : 'bg-[#190237]'} text-white text-sm sm:text-2xl lg:text-2xl ${i18n.language === 'ar'?" rounded-l-xl " :"rounded-r-xl"} cursor-pointer`}>
                  {t('dashboard.stable')}
                </div>
            </div>
           
            </div>

        <div className=" mx-7 px-2 md:px-0 w-full lg:w-[850px]">
            <div className="relative flex items-center  w-full">
              
            <Search className="absolute text-white w-4 lg:w-7 h-4 lg:h-7 top-3.5 left-2.5  " />
            <input
            value={seachedTool}
            onChange={(event) => {
              
              setSearchedTool(event.target.value);
            }}
            
            className={`w-full bg-transparent placeholder:text-start placeholder:text-slate-400 text-white text-sm border border-white rounded-full pl-10 pr-3 py-2 lg:py-4 transition duration-300 ease focus:outline-none focus:border-slate-400 hover:border-slate-300 shadow-sm focus:shadow ${i18n.language === 'ar' ? 'placeholder:text-left' : ''}`}
            placeholder={displayedText}/>
            </div>
        </div>
     
    </div>


{/* ............................... */}
 {/* Banner Slideshow Section */}
      {bannerError && <p className="text-red text-center my-3">Error loading banners: {bannerError}</p>}
      {banners.length > 0 ? (
        <div  className="rounded-2xl mb-5 px-1 lg:px-5 mt-5">
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
                        src={`${process.env.NEXT_PUBLIC_API_URL}${banner.image_url}`} 
                        alt={banner.title || 'Banner'} />
                    </a>
                  ) : (
                    <img 
                    
                      className="w-full rounded-2xl h-full object-cover" 
                      src={`${process.env.NEXT_PUBLIC_API_URL}${banner.image_url}`} 
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

      {/* ......... */}

      <div className="flex flex-wrap w-full gap-2 justify-center px-3  md:px-0">
  {isSearching ? (
    <div className="col-span-full text-center text-white">{t('dashboard.searching')}</div>
  ) : showNoResults ? (
    <div className="col-span-full text-center text-orange text-xl">
      {t('dashboard.noToolsFound')} <span className="font-bold text-white">"{seachedTool}"</span>
    </div>
  ) : filteredTools && filteredTools.length > 0 ? (
    filteredTools.map((item: NewToolsDto, index: number) => (
      <CardItem
        onClick={() => {
          setPeriod("month");
          setToolData(item);
          setOpenDetailModal(true);
        }}
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
    </>
  );
};

export default Dashboard;
