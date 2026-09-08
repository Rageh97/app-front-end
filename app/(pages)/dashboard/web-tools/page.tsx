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
import { AlignJustify, Search, ShoppingCart, X, ArrowRight, Wrench } from "lucide-react";
import Link from "next/link";
import { useSearchToolByName } from "@/utils/tool/getToolByName";
import { useTranslation } from "react-i18next";
import axios from "@/utils/api";
import i18n from "@/i18n";
import ToolErrorExtention from "@/components/Modals/ToolErrorExtention";

type Period = "month" | "year" | "day";

const WebToolsPage: FunctionComponent = () => {
  const { t } = useTranslation();
  const { data } = useMyInfo();
  const [isLoadingPage, setIsLoadingPage] = useState(true);
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
  const [period, setPeriod] = useState<Period>("month");
  const [openCihDetailsModal, setOpenCihDetailsModal] = useState<boolean>(false);
  const [openTijariDetailsModal, setOpenTijariDetailsModal] = useState<boolean>(false);

  const {
    isLoading: isSearching,
    data: searchedData,
  } = useSearchToolByName(seachedTool);
  
  // Filter tools based on search and stability, then deduplicate by name
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
    document.title = 'أدوات المواقع | Nexus Toolz';
    if (global.shuffleArray) {
      setToolsData(global.globalToolsData);
    }
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/tool-categories`, {
          headers: {
            Authorization: localStorage.getItem("a") || "",
            "User-Client": global.clientId1328,
          },
        });
        const data = await response.json();
        setCategories(data);
      } catch (error) {}
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

  // Animated search placeholder
  const placeholders = [
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
      }, 100);

      return () => clearTimeout(timeout);
    } else {
      const pause = setTimeout(() => {
        setCharIndex(0);
        setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
        setDisplayedText("");
      }, 2000);

      return () => clearTimeout(pause);
    }
  }, [charIndex, placeholderIndex]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoadingPage(false);
    }, 1500);
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
      {/* Page Header with Back to AI Dashboard */}
      <div className="mt-2 mb-4 px-1 lg:px-5">
        <div className="flex items-center gap-3 mb-4">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#12141F] dark:bg-[#12141F] border border-zinc-800/80 hover:border-[#00c48c]/40 text-zinc-300 hover:text-[#00c48c] text-sm font-bold transition-all duration-300"
          >
            <ArrowRight size={16} className={i18n.language === 'ar' ? '' : 'rotate-180'} />
            <span>{t('dashboard.Dashboard')}</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-3 border-s-4 border-[#ff7702] ps-3">
          <Wrench size={22} className="text-[#ff7702]" />
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-white dark:text-white">
              أدوات المواقع والخدمات
            </h1>
            <p className="text-zinc-400 text-xs mt-0.5">تصفح جميع أدوات المواقع والخدمات الاحترافية</p>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="mt-2 mb-4 flex flex-col xl:flex-row items-center justify-between gap-3 lg:gap-0 px-1 lg:px-5">
        <div className="flex items-center mb-2 xl:mb-0 gap-3 lg:gap-3 flex-wrap justify-center sm:justify-start">
          {/* Stability Filter */}
          <div className="flex items-center border border-[#ff7702] dark:border-zinc-800/80 bg-[#190237] dark:bg-[#12141F] rounded-xl cursor-pointer p-0.5 shadow-sm">
            <div 
              onClick={() => setStabilityFilter('all')} 
              className={`px-3 py-1.5 ${stabilityFilter === 'all' ? 'bg-[#35214f] dark:bg-[#00c48c]/20 dark:text-[#00c48c] dark:font-bold' : 'bg-[#190237] dark:bg-transparent dark:text-zinc-400 dark:hover:text-zinc-200'} text-white text-xs sm:text-sm ${i18n.language === 'ar' ? "rounded-r-lg" : "rounded-l-lg"} cursor-pointer transition-all duration-200 whitespace-nowrap`}>
              {t('dashboard.all')}
            </div>
            <div 
              onClick={() => setStabilityFilter(false)} 
              className={`px-3 py-1.5 ${stabilityFilter === false ? 'bg-[#35214f] dark:bg-[#00c48c]/20 dark:text-[#00c48c] dark:font-bold' : 'bg-[#190237] dark:bg-transparent dark:text-zinc-400 dark:hover:text-zinc-200'} text-white text-xs sm:text-sm cursor-pointer transition-all duration-200 whitespace-nowrap`}>
              {t('dashboard.unstable')}
            </div>
            <div 
              onClick={() => setStabilityFilter(true)}
              className={`px-3 py-1.5 ${stabilityFilter === true ? 'bg-[#35214f] dark:bg-[#00c48c]/20 dark:text-[#00c48c] dark:font-bold' : 'bg-[#190237] dark:bg-transparent dark:text-zinc-400 dark:hover:text-zinc-200'} text-white text-xs sm:text-sm ${i18n.language === 'ar' ? "rounded-l-lg" : "rounded-r-lg"} cursor-pointer transition-all duration-200 whitespace-nowrap`}>
              {t('dashboard.stable')}
            </div>
          </div>

          {/* Access Filter */}
          <div className="flex items-center border border-[#00c48c] dark:border-zinc-800/80 bg-[#190237] dark:bg-[#12141F] rounded-xl cursor-pointer p-0.5 shadow-sm">
            <div 
              onClick={() => setAccessFilter('all')} 
              className={`px-3 py-1.5 ${accessFilter === 'all' ? 'bg-[#123645] dark:bg-[#00c48c]/20 dark:text-[#00c48c] dark:font-bold' : 'bg-transparent dark:text-zinc-400 dark:hover:text-zinc-200'} text-white text-xs sm:text-sm ${i18n.language === 'ar' ? 'rounded-r-lg' : 'rounded-l-lg'} transition-all duration-200 whitespace-nowrap`}>
              {t('dashboard.all')}
            </div>
            <div 
              onClick={() => setAccessFilter('free')} 
              className={`px-3 py-1.5 ${accessFilter === 'free' ? 'bg-[#00c48c] dark:bg-[#00c48c]/20 dark:text-[#00c48c] dark:font-bold' : 'bg-transparent dark:text-zinc-400 dark:hover:text-zinc-200'} text-white text-xs sm:text-sm transition-all duration-200 whitespace-nowrap`}>
              {t('dashboard.free')}
            </div>
            <div 
              onClick={() => setAccessFilter('pro')} 
              className={`px-3 py-1.5 ${accessFilter === 'pro' ? 'bg-[#ff7702] dark:bg-amber-500/20 dark:text-amber-400 dark:font-bold' : 'bg-transparent dark:text-zinc-400 dark:hover:text-zinc-200'} text-white text-xs sm:text-sm ${i18n.language === 'ar' ? 'rounded-l-lg' : 'rounded-r-lg'} transition-all duration-200 whitespace-nowrap`}>
              {t('dashboard.pro')}
            </div>
          </div>

          {/* Categories Dropdown */}
          <div className="relative">
            <div 
              onClick={() => setShowCategories(!showCategories)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl cursor-pointer bg-[#190237] dark:bg-[#12141F] border border-[#ff7702] dark:border-zinc-800/80 text-white text-xs sm:text-sm font-bold hover:border-[#00c48c]/40 transition-all"
            >
              <AlignJustify size={14} />
              <span>{t('dashboard.categories')}</span>
            </div>

            {showCategories && (
              <div className="absolute right-0 mt-2 w-60 origin-top-right bg-[#12141F] rounded-2xl shadow-2xl ring-1 ring-black ring-opacity-5 border border-zinc-800 z-50 overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
                <div className="py-1 max-h-64 overflow-y-auto no-scrollbar">
                  <button
                    onClick={() => {
                      setSelectedCategory('All');
                      setToolsData(global.globalToolsData);
                      setShowCategories(false);
                      setShowNoResults(false);
                    }}
                    className="w-full text-right px-4 py-2.5 text-xs sm:text-sm text-white hover:bg-zinc-800/80 hover:text-[#00c48c] transition-colors duration-200 font-bold border-b border-zinc-800/60"
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
                        className="w-full text-right px-4 py-2.5 text-xs sm:text-sm text-zinc-200 hover:bg-zinc-800/80 hover:text-[#00c48c] transition-colors duration-200"
                      >
                        {category}
                      </button>
                    ))
                  ) : (
                    <p className="px-4 py-3 text-xs text-zinc-400 text-center">{t('dashboard.loading')}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Click outside handler */}
          {showCategories && (
            <div 
              className="fixed inset-0 z-[40]" 
              onClick={() => setShowCategories(false)}
            />
          )}
        </div>

        {/* Search Bar */}
        <div className="mx-2 lg:mx-5 w-full lg:w-[500px] xl:w-[600px]">
          <div className="relative flex items-center w-full">
            <Search className={`absolute text-white/70 dark:text-zinc-400 w-4 h-4 top-1/2 -translate-y-1/2 ${i18n.language === 'ar' ? 'right-3.5' : 'left-3.5'}`} />
            <input
              value={seachedTool}
              onChange={(event) => setSearchedTool(event.target.value)}
              className={`w-full bg-transparent dark:bg-[#12141F] placeholder:text-slate-400 dark:placeholder:text-zinc-500 text-white text-xs sm:text-sm border border-white/20 dark:border-zinc-800/90 rounded-full py-2.5 transition-all duration-300 ease focus:outline-none focus:border-slate-400 dark:focus:border-[#00c48c]/60 dark:focus:ring-1 dark:focus:ring-[#00c48c]/20 hover:border-slate-300 dark:hover:border-zinc-700 shadow-sm ${
                i18n.language === 'ar' 
                  ? `pr-10 ${seachedTool ? 'pl-9' : 'pl-4'} text-right placeholder:text-right` 
                  : `pl-10 ${seachedTool ? 'pr-9' : 'pr-4'} text-left placeholder:text-left`
              }`}
              placeholder={displayedText}
            />
            {seachedTool && (
              <button
                onClick={() => setSearchedTool("")}
                className={`absolute text-zinc-400 hover:text-white top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-zinc-800 transition-colors ${
                  i18n.language === 'ar' ? 'left-3' : 'right-3'
                }`}
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 w-full gap-4 px-1 lg:px-5">
        {isSearching ? (
          <div className="col-span-full py-16 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-[#12141F] border border-zinc-800 text-zinc-300 text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00c48c] animate-ping"></span>
              {t('dashboard.searching')}...
            </div>
          </div>
        ) : showNoResults ? (
          <div className="col-span-full py-16 text-center">
            <div className="max-w-md mx-auto p-6 rounded-2xl bg-[#12141F] border border-zinc-800 flex flex-col items-center gap-3">
              <Search className="w-8 h-8 text-zinc-500" />
              <p className="text-zinc-300 text-sm sm:text-base">
                {t('dashboard.noToolsFound')} <span className="font-bold text-[#00c48c]">"{seachedTool}"</span>
              </p>
              <button
                onClick={() => {
                  setSearchedTool("");
                  setSelectedCategory("All");
                  setToolsData(global.globalToolsData);
                  setShowNoResults(false);
                }}
                className="mt-2 px-4 py-1.5 rounded-full bg-[#00c48c]/15 text-[#00c48c] border border-[#00c48c]/30 text-xs font-bold hover:bg-[#00c48c]/25 transition-colors"
              >
                إعادة ضبط البحث
              </button>
            </div>
          </div>
        ) : filteredTools && filteredTools.length > 0 ? (
          filteredTools.map((item: NewToolsDto, index: number) => (
            <CardItem
              onClick={() => handleToolCardClick(item)}
              key={`${item.tool_id}-${index}`}
              toolData={item}
            />
          ))
        ) : (
          <div className="col-span-full py-16 text-center text-zinc-400">
            {t('dashboard.noToolsAvailable')}
          </div>
        )}
      </div>

      {/* Modals */}
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

export default WebToolsPage;
