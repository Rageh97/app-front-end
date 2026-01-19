"use client";

import React, { useState, useEffect, useMemo, Suspense, useRef } from "react";
import axios from "@/utils/api";
import { 
  Folder, Download, Lock, ChevronRight, ArrowLeft, 
  Search, X, ArrowRight, Star, Filter, SlidersHorizontal,
  Type, Sparkles
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useSearchParams, useRouter } from 'next/navigation';
import Link from "next/link";
import i18n from "@/i18n";
import PremiumLoader from "@/components/PremiumLoader";
import ShinyText from "@/components/ShinyText";
import { useMyInfo } from "@/utils/user-info/getUserInfo";
import { trackPageView } from "@/utils/analytics";

interface Category {
  category_id: number;
  name: string;
  name_ar?: string;
  description?: string;
  cover_image_url?: string;
  font_count?: number;
}

interface Font {
  font_id: number;
  name: string;
  name_ar?: string;
  slug: string;
  description?: string;
  designer?: string;
  is_free: boolean;
  download_count: number;
  main_preview_image?: string;
  font_style?: string;
  featured: boolean;
  category?: Category;
  created_at: string;
}

interface UserStats {
  hasPack: boolean;
  packName?: string;
  limit?: number | string;
  usage?: number;
  remaining?: number | string;
  dailyLimit?: number | string;
  dailyRemaining?: number | string;
  expiryDate?: string;
}

// Inline Loader Component
const InlineLoader = () => (
  <div className="relative flex items-center justify-center w-24 h-24">
    <div className="absolute inset-0 rounded-full border-t-2 border-l-2 border-[#00c48c] animate-spin"></div>
    <div className="absolute inset-2 rounded-full border-b-2 border-r-2 border-orange animate-spin-slow"></div>
    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#00c48c] to-orange animate-pulse opacity-80 shadow-[0_0_30px_rgba(0,196,140,0.4)]"></div>
  </div>
);

// Font Card Component
const FontCard = ({ font, onClick }: { font: Font; onClick: () => void }) => {
  return (
    <div 
      onClick={onClick}
      className="group relative bg-[#1a1a1a] border border-white/5 rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 hover:border-[#00c48c]/30 hover:shadow-2xl hover:shadow-[#00c48c]/10 hover:scale-[1.02]"
    >
      {/* Preview Image */}
      <div className="relative aspect-[4/3] bg-[#0d0d0d] overflow-hidden">
        {font.main_preview_image ? (
          <img 
            src={font.main_preview_image} 
            alt={font.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#00c48c]/20 to-orange/20">
            <Type size={48} className="text-white/20" />
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
        
        {/* Skewed Badge */}
        <div className="absolute top-0 left-0 w-32 h-32 overflow-hidden rounded-tl-2xl z-20 pointer-events-none">
          <div
            className={`absolute -top-1 -left-9 pr-7 w-[150px] py-1.5 rotate-[-45deg] shadow-[0_5px_15px_rgba(0,0,0,0.3)] border-y border-white/20 backdrop-blur-md transition-all duration-500 ${
              font.is_free 
                ? "bg-gradient-to-r from-[#00c48c] to-[#008c64] text-white" 
                : "bg-gradient-to-r from-[#ff7702] to-[#00c48c] text-white"
            }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              {font.is_free ? (
                <>
                  <div className="w-1 h-1 rounded-full bg-black animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-widest">FREE</span>
                </>
              ) : (
                <>
                  <Lock size={12} className="text-white drop-shadow-md" />
                  <span className="text-[10px] font-black uppercase tracking-widest">PREMIUM</span>
                </>
              )}
            </div>
          </div>
        </div>
        {/*  {font.featured && (
            <span className="px-2 py-1 text-[10px] font-bold bg-yellow-500 text-black rounded-full flex items-center gap-1">
              <Star size={10} /> FEATURED
            </span>
          )} */}
        
        {/* Download Count */}
        <div className="absolute top-3 right-3 px-2 py-1 text-[10px] font-medium bg-black/60 backdrop-blur-sm text-white rounded-full flex items-center gap-1">
          <Download size={10} /> {font.download_count?.toLocaleString() || 0}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        <h3 className="text-white font-bold text-lg mb-1 group-hover:text-[#00c48c] transition-colors truncate">
          {font.name}
        </h3>
        {font.name_ar && (
          <p className="text-gray-400 text-sm mb-2 truncate" dir="rtl">{font.name_ar}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-gray-500 text-xs">{font.designer || 'Unknown Designer'}</span>
          {font.font_style && (
            <span className="text-gray-500 text-xs px-2 py-0.5 bg-white/5 rounded">{font.font_style}</span>
          )}
        </div>
      </div>
      
      {/* Hover Arrow */}
      <div className="absolute bottom-4 right-4 w-8 h-8 rounded-full bg-white/10 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1">
        <ChevronRight size={16} className="text-white" />
      </div>
    </div>
  );
};

// Category Card Component
const CategoryCard = ({ category, onClick }: { category: Category; onClick: () => void }) => {
  return (
    <div 
      onClick={onClick}
      className="group relative rounded-2xl overflow-hidden cursor-pointer aspect-[4/3] bg-[#1a1a1a] border border-white/5 hover:border-[#00c48c]/30 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-[#00c48c]/10"
    >
      {category.cover_image_url ? (
        <img 
          src={category.cover_image_url} 
          alt={category.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#00c48c]/20 to-orange/20 flex items-center justify-center">
          <Folder size={64} className="text-white/20" />
        </div>
      )}
      
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />
      
      <div className="absolute inset-0 p-6 flex flex-col justify-end">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white font-black text-xl group-hover:text-[#00c48c] transition-colors">
            {i18n.language === 'ar' && category.name_ar ? category.name_ar : category.name}
          </h3>
          {category.font_count !== undefined && (
            <span className="text-gray-400 text-sm bg-white/10 px-2 py-1 rounded-full">
              {category.font_count} {i18n.language === 'ar' ? 'خط' : 'fonts'}
            </span>
          )}
        </div>
        {category.description && (
          <p className="text-gray-400 text-sm line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {category.description}
          </p>
        )}
      </div>
      
      <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1">
        <ChevronRight size={20} className="text-white" />
      </div>
    </div>
  );
};

// Main Content Component
const FontsHubContent = () => {
  const { data } = useMyInfo();
  const router = useRouter();
  const searchParams = useSearchParams();
  const catParam = searchParams.get('cat');
  
  // Track page view only once
  const hasTrackedView = useRef(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [fonts, setFonts] = useState<Font[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'categories' | 'fonts'>('categories');
  const [filterFree, setFilterFree] = useState<boolean | null>(null);

  // Upgrade Modal
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [activeBanner, setActiveBanner] = useState<any>(null);

  useEffect(() => {
    fetchCategories();
    fetchStats();
    fetchBanner();
    
    // Track page view only once
    if (!hasTrackedView.current) {
      trackPageView('fonts_hub');
      hasTrackedView.current = true;
    }
  }, []);

  useEffect(() => {
    if (catParam) {
      setSelectedCategoryId(parseInt(catParam));
      setViewMode('fonts');
    }
  }, [catParam]);

  useEffect(() => {
    if (viewMode === 'fonts') {
      fetchFonts();
    }
  }, [viewMode, selectedCategoryId, filterFree, searchQuery]);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const res = await axios.get("/api/fonts/categories");
      setCategories(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load categories");
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get("/api/fonts/stats");
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBanner = async () => {
    try {
      const res = await axios.get("/api/fonts/banner/active");
      setActiveBanner(res.data);
    } catch (error) {
      console.error("Failed to fetch font banner:", error);
    }
  };

  const fetchFonts = async () => {
    setLoading(true);
    try {
      const params: any = {};
      
      if (selectedCategoryId) params.category_id = selectedCategoryId;
      if (filterFree !== null) params.is_free = filterFree;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      
      const res = await axios.get("/api/fonts/all", { params });
      setFonts(res.data.fonts || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load fonts");
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (catId: number) => {
    setSelectedCategoryId(catId);
    setViewMode('fonts');
    setSearchQuery("");
  };

  const handleBackToCategories = () => {
    setViewMode('categories');
    setSelectedCategoryId(null);
    setFonts([]);
    setSearchQuery("");
    setFilterFree(null);
  };

  const handleFontClick = (font: Font) => {
    router.push(`/fonts/${font.slug || font.font_id}`);
  };

  if (loadingCategories) {
    return <PremiumLoader />;
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      {/* Hero Header Section */}
      <div className="relative w-full min-h-[500px] flex items-start mb-8 overflow-hidden rounded-b-[3rem] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] border-b border-white/5">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-[#0d0d0d]/20 to-[#4f008c30] z-10"></div>
          
          {activeBanner ? (
            activeBanner.media_type === 'video' ? (
              <video 
                src={activeBanner.media_url}
                className="absolute inset-0 w-full h-full object-cover opacity-30"
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              <img 
                src={activeBanner.media_url}
                alt="Fonts Background" 
                className="absolute inset-0 w-full h-full object-cover opacity-30"
              />
            )
          ) : (
            <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/6475823/pexels-photo-6475823.jpeg')] bg-cover bg-center opacity-30"></div>
          )}
          
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#0d0d0d] to-transparent z-10"></div>
        </div>

        {/* Content */}
        <div className="w-full mx-auto mt-12 md:mt-20 px-4 md:px-6 z-20 flex flex-col xl:flex-row justify-between items-center gap-12 lg:gap-16">
          <div className="w-full xl:max-w-3xl flex flex-col items-center xl:items-start text-center xl:text-left">
            <Link href="/dashboard" className="cursor-pointer flex items-center gap-2 mb-6 hover:text-[#00c48c] transition-colors group">
              <ArrowLeft className="group-hover:-translate-x-1 transition-transform w-5 h-5 md:w-6 md:h-6" />
              <span className="font-medium text-sm md:text-base">
                {i18n.language === 'ar' ? 'العودة للوحة التحكم' : 'Back to dashboard'}
              </span>
            </Link>
            
            <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] md:text-xs font-bold text-[#00c48c] mb-6 md:mb-8 backdrop-blur-md">
              <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[#00c48c] animate-pulse"></span>
              {i18n.language === 'ar' ? 'مكتبة الخطوط الاحترافية' : 'PREMIUM FONTS LIBRARY'}
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-[1.1] tracking-tighter">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00c48c] via-[#00e0a0] to-orange drop-shadow-2xl">
                <ShinyText 
                  text={i18n.language === 'ar' ? "مكتبة الخطوط" : "FONTS HUB"} 
                  disabled={false} 
                  speed={4} 
                  className='custom-class' 
                />
              </span>
            </h1>
            
            <p className="text-gray-400 text-sm md:text-lg lg:text-xl max-w-2xl leading-relaxed font-light mb-8 md:mb-12">
              {i18n.language === 'ar' 
                ? 'اكتشف مجموعة واسعة من الخطوط العربية والإنجليزية الاحترافية للمصممين والمبدعين.'
                : 'Discover a wide collection of professional Arabic and English fonts for designers and creators.'}
            </p>

            {/* Search Bar */}
            <div className="relative w-full max-w-2xl group mb-4 xl:mb-0">
              <div className="absolute inset-0 bg-gradient-to-r from-[#00c48c]/30 to-orange/30 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700"></div>
              <div className="relative flex items-center bg-black/40 backdrop-blur-3xl border border-white/40 rounded-xl md:rounded-2xl p-1 md:p-2 shadow-2xl transition-all duration-300">
                <div className="pl-3 md:pl-5 pr-2 md:pr-3 text-gray-400">
                  <Search size={18} className="md:w-[22px] md:h-[22px] group-focus-within:text-[#00c48c] transition-colors" />
                </div>
                <input 
                  type="text"
                  placeholder={i18n.language === 'ar' ? "ابحث عن خط..." : "Search fonts..."}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setViewMode('fonts');
                  }}
                  className="w-full bg-transparent border-none outline-none text-white py-3 md:py-4 text-sm md:text-lg font-light placeholder:text-gray-500"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="p-1.5 md:p-2 mr-1 md:mr-2 hover:bg-white/10 rounded-lg md:rounded-xl text-gray-400 hover:text-white transition-all"
                  >
                    <X size={16} className="md:w-5 md:h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Stats Card */}
          {stats && stats.hasPack ? (
            <div className="w-full max-w-md xl:max-w-lg bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl md:rounded-3xl p-5 md:p-6 flex flex-col gap-6 md:gap-8 shadow-2xl hover:border-[#00c48c]/20 transition-all duration-500 group">
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">
                    {i18n.language === 'ar' ? 'الباقة الحالية' : 'Current Plan'}
                  </span>
                  <span className="text-orange font-black text-lg md:text-xl tracking-tight uppercase leading-none">{stats.packName}</span>
                </div>
                <div className="flex flex-col items-end text-[10px]">
                  <span className="text-gray-500 mb-1">{i18n.language === 'ar' ? 'التجديد في' : 'Renews in'}</span>
                  <span className="text-white bg-white/5 px-2 py-1 rounded border border-white/5 font-mono">
                    {stats.expiryDate ? new Date(stats.expiryDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-gray-400 text-xs md:text-sm uppercase tracking-widest font-bold">
                    {i18n.language === 'ar' ? 'الحد الشهري' : 'Monthly Limit'}
                  </span>
                  <span className="font-black text-white text-xl md:text-2xl tracking-tighter">
                    {stats.remaining} <span className="text-gray-500 text-xs md:text-sm font-normal">/ {stats.limit}</span>
                  </span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden p-[1px]">
                  <div 
                    className="h-full bg-gradient-to-r from-orange via-orange to-[#00c48c] rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,119,2,0.5)]"
                    style={{ width: `${(stats.limit === 'Unlimited' || Number(stats.limit) === 0) ? 100 : (Number(stats.remaining) / Number(stats.limit)) * 100}%` }}
                  ></div>
                </div>
              </div>

              {stats.dailyLimit !== undefined && (
                <div className="space-y-3 pt-2 border-t border-white/5">
                  <div className="flex justify-between items-end">
                    <span className="text-gray-400 text-xs md:text-sm uppercase tracking-widest font-bold">
                      {i18n.language === 'ar' ? 'الحد اليومي' : 'Daily Limit'}
                    </span>
                    <span className="font-black text-white text-xl md:text-2xl tracking-tighter">
                      {stats.dailyRemaining} <span className="text-gray-500 text-xs md:text-sm font-normal">/ {stats.dailyLimit}</span>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden p-[1px]">
                    <div 
                      className="h-full bg-gradient-to-r from-[#00c48c] via-[#00c48c] to-orange rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,196,140,0.5)]"
                      style={{ width: `${(stats.dailyLimit === 'Unlimited' || Number(stats.dailyLimit) === 0) ? 100 : (Number(stats.dailyRemaining) / Number(stats.dailyLimit)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full max-w-md bg-black/40 backdrop-blur-xl border border-red-500/30 rounded-2xl p-6 flex flex-col gap-4 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[50px] rounded-full group-hover:bg-red-500/20 transition-all duration-500"></div>
              
              <div className="flex items-center gap-4 z-10">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                  <Lock size={24} className="text-red-500" />
                </div>
                <div>
                  <p className="text-white font-bold text-lg leading-tight">
                    {i18n.language === 'ar' ? 'الوصول مقيد' : 'Access Restricted'}
                  </p>
                  <p className="text-red-400 text-xs font-medium">
                    {i18n.language === 'ar' ? 'لا يوجد اشتراك نشط' : 'No active subscription found'}
                  </p>
                </div>
              </div>
              
              <p className="text-gray-400 text-sm z-10 leading-relaxed">
                {i18n.language === 'ar' 
                  ? 'اشترك الآن للوصول إلى مكتبة الخطوط الكاملة.'
                  : 'Subscribe now to unlock the complete fonts library.'}
              </p>

              <a href="/plans" className="z-10 bg-red-600 hover:bg-red-500 text-white text-center py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-red-900/20 flex items-center justify-center gap-2 active:scale-95">
                {i18n.language === 'ar' ? 'عرض الباقات' : 'View Plans'} <ChevronRight size={16} />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Categories Bar - Only show when viewing fonts */}
      {viewMode === 'fonts' && (
        <div className="sticky top-0 bg-[#0d0d0d]/95 backdrop-blur z-40">
          <div className="mx-auto px-4 relative">
            <div className="overflow-x-auto no-scrollbar scroll-smooth">
              <div className="flex gap-2 py-4 min-w-max items-center px-5">
                <button
                  onClick={handleBackToCategories}
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mr-1 pr-3 border-r border-white/10"
                >
                  {i18n.language === 'ar' ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
                  <span className="text-sm font-medium">
                    {i18n.language === 'ar' ? 'جميع التصنيفات' : 'All Categories'}
                  </span>
                </button>
                
                {/* Filter Buttons */}
                <button
                  onClick={() => setFilterFree(null)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                    filterFree === null 
                      ? 'bg-gradient-to-r from-[#00c48c] to-orange text-black' 
                      : 'text-gray-400 hover:text-white border border-white/10'
                  }`}
                >
                  {i18n.language === 'ar' ? 'الكل' : 'All'}
                </button>
                <button
                  onClick={() => setFilterFree(true)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                    filterFree === true 
                      ? 'bg-[#00c48c] text-black' 
                      : 'text-gray-400 hover:text-white border border-white/10'
                  }`}
                >
                  {i18n.language === 'ar' ? 'مجاني' : 'Free'}
                </button>
                <button
                  onClick={() => setFilterFree(false)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                    filterFree === false 
                      ? 'bg-orange text-black' 
                      : 'text-gray-400 hover:text-white border border-white/10'
                  }`}
                >
                  {i18n.language === 'ar' ? 'مدفوع' : 'Premium'}
                </button>

                <div className="h-6 w-px bg-white/10 mx-2"></div>

                {categories.map((cat) => (
                  <button
                    key={cat.category_id}
                    onClick={() => handleCategorySelect(cat.category_id)}
                    className={`text-sm font-medium transition-all duration-300 relative whitespace-nowrap px-3 py-1.5 rounded-lg ${
                      selectedCategoryId === cat.category_id 
                        ? "text-black bg-gradient-to-r from-orange to-[#00c48c]" 
                        : "text-gray-500 hover:text-gray-300 border border-white/10"
                    }`}
                  >
                    {i18n.language === 'ar' && cat.name_ar ? cat.name_ar : cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="mx-auto px-4 py-6 relative min-h-[500px]">
        {/* Categories Grid View */}
        {viewMode === 'categories' && (
          <div className="animate-in fade-in duration-500">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-black mb-2">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange to-[#00c48c]">
                  {i18n.language === 'ar' ? 'تصفح التصنيفات' : 'BROWSE CATEGORIES'}
                </span>
              </h2>
              <p className="text-gray-400 text-sm md:text-base">
                {i18n.language === 'ar' ? 'اختر تصنيفاً لاكتشاف الخطوط المتاحة' : 'Select a category to explore fonts'}
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {categories.map((cat) => (
                <CategoryCard 
                  key={cat.category_id} 
                  category={cat} 
                  onClick={() => handleCategorySelect(cat.category_id)}
                />
              ))}
              {categories.length === 0 && (
                <div className="col-span-full text-center py-20 text-gray-500">
                  <Folder size={48} className="mx-auto mb-4 opacity-30" />
                  <p>{i18n.language === 'ar' ? 'لا توجد تصنيفات متاحة' : 'No categories available'}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Fonts Grid View */}
        {viewMode === 'fonts' && (
          <>
            {loading ? (
              <div className="flex flex-col justify-center items-center h-[50vh] animate-in fade-in duration-500">
                <InlineLoader />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-12">
                  {fonts.map((font) => (
                    <FontCard 
                      key={font.font_id} 
                      font={font} 
                      onClick={() => handleFontClick(font)}
                    />
                  ))}
                  {fonts.length === 0 && (
                    <div className="col-span-full text-center py-20 animate-in fade-in zoom-in duration-500">
                      <div className="max-w-md mx-auto">
                        <div className="relative mb-8">
                          <div className="w-24 h-24 bg-gradient-to-br from-[#00c48c]/20 to-[#00e0a0]/10 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm border border-[#00c48c]/20 shadow-lg shadow-[#00c48c]/10">
                            <Type size={48} className="text-[#00c48c]" />
                          </div>
                        </div>
                        
                        <h3 className="text-white font-bold text-2xl mb-3">
                          {searchQuery 
                            ? (i18n.language === 'ar' ? 'لا توجد نتائج' : 'No results found')
                            : (i18n.language === 'ar' ? 'قريباً' : 'Coming Soon')}
                        </h3>
                        <p className="text-gray-400 text-lg leading-relaxed">
                          {searchQuery 
                            ? (i18n.language === 'ar' ? `لم نجد نتائج لـ "${searchQuery}"` : `No results matching "${searchQuery}"`)
                            : (i18n.language === 'ar' ? 'سيتم إضافة خطوط جديدة قريباً' : 'New fonts will be added soon')}
                        </p>
                        
                        {searchQuery && (
                          <button 
                            onClick={() => setSearchQuery("")}
                            className="mt-6 text-[#00c48c] font-bold underline hover:text-[#00e0a0] transition-colors"
                          >
                            {i18n.language === 'ar' ? 'مسح البحث وإظهار الكل' : 'Clear search and show all'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Upgrade Modal */}
      {upgradeModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#1e1e1e] border border-orange/50 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange/20 blur-3xl rounded-full"></div>
            
            <div className="w-16 h-16 bg-orange/20 rounded-full flex items-center justify-center mx-auto mb-6 text-orange animate-bounce">
              <Lock size={32} />
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-2">
              {i18n.language === 'ar' ? 'الوصول مقيد' : 'Access Restricted'}
            </h3>
            <p className="text-gray-400 mb-6">
              {modalMessage || (i18n.language === 'ar' 
                ? 'لقد وصلت إلى حد التحميل أو ليس لديك اشتراك نشط.'
                : "You've reached your download limit or don't have an active subscription.")}
            </p>
            
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => {
                  setUpgradeModalOpen(false);
                  setModalMessage(null);
                }}
                className="px-6 py-3 rounded-xl border border-gray-600 text-gray-300 hover:bg-white/5 transition"
              >
                {i18n.language === 'ar' ? 'إغلاق' : 'Close'}
              </button>
              {!modalMessage && (
                <button 
                  onClick={() => router.push('/plans')}
                  className="px-6 py-3 rounded-xl bg-orange hover:bg-orange/90 text-white font-bold shadow-lg shadow-orange/20 transition hover:scale-105"
                >
                  {i18n.language === 'ar' ? 'ترقية الباقة' : 'Upgrade Plan'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main Page Component with Suspense
export default function FontsPage() {
  return (
    <Suspense fallback={<PremiumLoader />}>
      <FontsHubContent />
    </Suspense>
  );
}
