"use client";

import React, { useState, useEffect, useRef } from "react";
import axios from "@/utils/api";
import { Folder, Video, Image as ImageIcon, Download, Lock, ChevronRight, ArrowLeft, Play, Pause, LayoutGrid, X, ArrowLeftCircle, Search, Film, Music, ArrowRight } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';
import Link from "next/link";
import i18n from "@/i18n";
import PremiumLoader from "@/components/PremiumLoader";
import ShinyText from "@/components/ShinyText";
import { useMyInfo } from "@/utils/user-info/getUserInfo";
import { trackPageView } from "@/utils/analytics";
import Image from "next/image";
import { BorderBeam } from "@/components/ui/border-beam";

interface HeroCategory {
  hero_category_id: number;
  name: string;
  description: string;
  cover_image_url?: string;
  type?: 'visual' | 'audio';
  subCategories: Category[];
}

interface Category {
  category_id: number;
  name: string;
  description: string;
  cover_image_url?: string;
  filesCount?: number;
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

const MediaHubContent = () => {
  const { data } = useMyInfo();
  const router = useRouter();
  
  // Track page view only once
  const hasTrackedView = useRef(false);

  const [heroCategories, setHeroCategories] = useState<HeroCategory[]>([]);
  const [selectedHeroCategory, setSelectedHeroCategory] = useState<HeroCategory | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // View Mode: 'hero' -> 'categories'
  const [viewMode, setViewMode] = useState<'hero' | 'categories'>('hero');

  const [isMediaHubEnabled, setIsMediaHubEnabled] = useState(true);
  const [activeBanner, setActiveBanner] = useState<any>(null);
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get("/api/admin/settings/media_hub_enabled");
        const isEnabled = String(res.data.value) !== 'false';
        
        // Admin and Manager can always access, regular users only if enabled
        const isAdmin = data?.userRole === "admin" || data?.userRole === "manager";
        
        if (!isEnabled && !isAdmin) {
          setIsMediaHubEnabled(false);
          window.location.href = "/dashboard";
        }
      } catch (error) {
        console.error("Failed to fetch media hub setting:", error);
      }
    };

    const fetchBanner = async () => {
      try {
        const res = await axios.get("/api/media/banner/active");
        setActiveBanner(res.data);
      } catch (error) {
        console.error("Failed to fetch banner:", error);
      }
    };
    
    if (data) {
      fetchSettings();
    }
    fetchHeroCategories();
    fetchBanner();
    fetchStats();
  }, [data]);

  // Separate effect for tracking - runs only once on mount
  useEffect(() => {
    if (!hasTrackedView.current) {
      trackPageView('media_hub');
      hasTrackedView.current = true;
    }
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get("/api/media/stats");
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHeroCategories = async () => {
    setLoadingCategories(true);
    try {
      const res = await axios.get("/api/media/hero-categories");
      setHeroCategories(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Handle Hero Category selection
  const handleHeroCategorySelect = (heroCat: HeroCategory) => {
    // If we are in 'hero' mode, just scroll to the section
    if (viewMode === 'hero') {
      const element = document.getElementById(`hero-section-${heroCat.hero_category_id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      // Switch back to hero view then scroll
      setViewMode('hero');
      setTimeout(() => {
        const element = document.getElementById(`hero-section-${heroCat.hero_category_id}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
    
    setSelectedHeroCategory(heroCat);
    setCategories(heroCat.subCategories || []);
  };

  // Handle View All selection - Switch to categories view
  const handleViewAll = (heroCat: HeroCategory) => {
    setSelectedHeroCategory(heroCat);
    setCategories(heroCat.subCategories || []);
    setViewMode('categories');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle category selection - Navigate to dedicated category page
  const handleCategorySelect = (catId: number) => {
    router.push(`/media-hub/category/${catId}`);
  };

  // Handle back to Hero Categories
  const handleBackToHero = () => {
    setViewMode('hero');
    setSelectedHeroCategory(null);
    setCategories([]);
    setSearchQuery("");
  };

  // Initial Full Screen Load
  if (loadingCategories) {
    return <PremiumLoader />;
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      
      {/* Hero Header Section */}
      <div className="relative w-full h-[650px] md:h-[700px] flex items-start mb-8 overflow-hidden rounded-b-[3rem] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] border-b border-white/5">
         
         {/* Background Media */}
         <div className="absolute inset-0 z-0">
             {/* Dynamic Banner */}
             <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-[#0d0d0d]/50 to-[#00c48c30] z-10"></div>
             
             {activeBanner ? (
               activeBanner.media_type === 'video' ? (
                 <video 
                   src={activeBanner.media_url}
                   className="w-full h-full object-cover opacity-60 mix-blend-overlay"
                   autoPlay
                   muted
                   loop
                   playsInline
                 />
               ) : (
                 <img 
                   src={activeBanner.media_url}
                   alt="Hero Background" 
                   className="w-full h-full object-cover opacity-60 mix-blend-overlay"
                 />
               )
             ) : (
               // Fallback to default video if no banner
               <div style={{position:'relative', width:'100%', height:'0px', paddingBottom:'56.250%'}}>
                 <iframe 
                   allow="fullscreen;autoplay" 
                   allowFullScreen 
                   height="100%" 
                   src="https://streamable.com/e/uhfvf7?autoplay=1&muted=1" 
                   width="100%" 
                   style={{border:'none', width:'100%', height:'100%', position:'absolute', left:'0px', top:'0px', overflow:'hidden'}}
                 />
               </div>
             )}
             
             {/* Bottom Fade */}
             <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#0d0d0d] to-transparent z-10"></div>
         </div>

         {/* Content */}
         <div className="w-full mx-auto mt-28 md:mt-36 px-4 md:px-6 z-20 flex flex-col xl:flex-row justify-between items-center gap-12 lg:gap-16">
            <div className="w-full xl:max-w-3xl flex flex-col items-center xl:items-start text-center xl:text-left">
              <Link href="/dashboard" className="cursor-pointer flex items-center gap-2 mb-6 hover:text-[#00c48c] transition-colors group">
                <ArrowLeftCircle className="group-hover:-translate-x-1 transition-transform w-5 h-5 md:w-6 md:h-6" />
                <span className="font-medium text-sm md:text-base">Back to dashboard</span>
              </Link>
               <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] md:text-xs font-bold text-[#00c48c] mb-6 md:mb-8 backdrop-blur-md">
                 <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[#00c48c] animate-pulse"></span>
                 PREMIUM ASSETS & RESOURCES
               </div>
               <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-[1.1] tracking-tighter">
                 <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00c48c] via-[#00e0a0] to-orange drop-shadow-2xl">
                   <ShinyText 
                     text="NEXUS PREMIUM HUB" 
                     disabled={false} 
                     speed={4} 
                     className='custom-class' 
                   />
                 </span>
               </h1>
               <p className="text-gray-400 text-sm md:text-lg lg:text-xl max-w-2xl leading-relaxed font-light mb-8 md:mb-12">
                 Unlimited access to high-quality videos, images, and creative assets curated for professional creators.
               </p>

               {/* Responsive Professional Search Bar */}
               <div className="relative w-full max-w-2xl group mb-4 xl:mb-0">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#00c48c]/30 to-orange/30 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700"></div>
                  <div className="relative flex items-center bg-black/40 backdrop-blur-3xl border border-white/40 rounded-xl md:rounded-2xl p-1 md:p-2 shadow-2xl transition-all duration-300">
                    <div className="pl-3 md:pl-5 pr-2 md:pr-3 text-gray-400">
                      <Search size={18} className="md:w-[22px] md:h-[22px] group-focus-within:text-[#00c48c] transition-colors" />
                    </div>
                    <input 
                      type="text"
                      placeholder="Search assets..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
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

            {/* Stats Banner Optimized for Mobile */}
            {stats && stats.hasPack ? (
              <div className="w-full max-w-md xl:max-w-lg bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl md:rounded-3xl p-5 md:p-6 flex flex-col gap-6 md:gap-8 shadow-2xl hover:border-[#00c48c]/20 transition-all duration-500 group">
                 <div className="flex justify-between items-center pb-2 border-b border-white/5">
                   <div className="flex flex-col">
                     <span className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Current Plan</span>
                     <span className="text-orange font-black text-lg md:text-xl tracking-tight uppercase leading-none">{stats.packName}</span>
                   </div>
                    <div className="flex flex-col items-end text-[10px]">
                      <span className="text-gray-500 mb-1">Renews in</span>
                      <span className="text-white bg-white/5 px-2 py-1 rounded border border-white/5 font-mono">
                        {stats.expiryDate ? new Date(stats.expiryDate).toLocaleDateString() : 'N/A'}
                      </span>
                   </div>
                 </div>
                 
                 {/* Monthly Limit */}
                 <div className="space-y-3">
                   <div className="flex justify-between items-end">
                      <span className="text-gray-400 text-xs md:text-sm uppercase tracking-widest font-bold">Monthly Limit</span>
                      <span className="font-black text-white text-xl md:text-2xl tracking-tighter">
                        {stats.remaining} <span className="text-gray-500 text-xs md:text-sm font-normal">/ {stats.limit}</span>
                      </span>
                   </div>
                   <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden p-[1px]">
                      <div 
                        className="h-full bg-gradient-to-r from-orange via-orange to-[#00c48c] rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,119,2,0.5)]"
                        style={{ width: `${(Number(stats.remaining) / Number(stats.limit)) * 100}%` }}
                      ></div>
                   </div>
                 </div>

                 {/* Daily Limit */}
                 {stats.dailyLimit && stats.dailyLimit !== "Unlimited" && (
                   <div className="space-y-3 pt-2 border-t border-white/5">
                     <div className="flex justify-between items-end">
                        <span className="text-gray-400 text-xs md:text-sm uppercase tracking-widest font-bold">Daily Limit</span>
                        <span className="font-black text-white text-xl md:text-2xl tracking-tighter">
                          {stats.dailyRemaining} <span className="text-gray-500 text-xs md:text-sm font-normal">/ {stats.dailyLimit}</span>
                        </span>
                     </div>
                     <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden p-[1px]">
                        <div 
                          className="h-full bg-gradient-to-r from-[#00c48c] via-[#00c48c] to-orange rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,196,140,0.5)]"
                          style={{ width: `${(Number(stats.dailyRemaining) / Number(stats.dailyLimit)) * 100}%` }}
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
                      <p className="text-white font-bold text-lg leading-tight">Access Restricted</p>
                      <p className="text-red-400 text-xs font-medium">No active subscription found</p>
                    </div>
                  </div>
                  
                  <p className="text-gray-400 text-sm z-10 leading-relaxed">Unlock unlimited downloads and premium assets today.</p>

                  <a href="/plans" className="z-10 bg-red-600 hover:bg-red-500 text-white text-center py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-red-900/20 flex items-center justify-center gap-2 active:scale-95">
                     View Plans <ChevronRight size={16} />
                  </a>
              </div>
            )}
         </div>

         {/* Hero Categories Navigation Bar */}
         <div className="absolute top-0 left-0 w-full z-30 bg-[#0d0d0d]/80 backdrop-blur-xl border-b border-white/10 px-4 md:px-8 py-2 md:py-3">  
             <div className="w-full max-w-[1920px] mx-auto flex items-center justify-between gap-4">
                {/* Right: Back to Dashboard */}
               <div className="flex-shrink-0 w-auto md:w-48 flex justify-end">
                   <Link href="/dashboard" className="group flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-full transition-all duration-300">
                      <span className="text-[10px] md:text-xs font-bold text-gray-300 group-hover:text-white uppercase tracking-wider hidden md:block">Dashboard</span>
                      <ArrowRight size={16} className="text-gray-400 group-hover:text-[#00c48c] group-hover:translate-x-0.5 transition-transform" />
                   </Link>
               </div>
             

               {/* Center: Navigation */}
               <div className="flex-1 flex justify-center min-w-0">
                  <div className="flex items-center gap-2  overflow-x-auto py-2 [&::-webkit-scrollbar]:hidden mask-image-linear-gradient-to-r max-w-full px-2 scroll-smooth">  
                     <button 
                        onClick={handleBackToHero}
                        className={`flex items-center gap-2 px-2 py-2 rounded-full transition-all duration-300 font-bold text-xs md:text-sm whitespace-nowrap overflow-visible shrink-0 ${
                          viewMode === 'hero' 
                            ? 'text-[#00c48c] ' 
                            : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/10'
                        }`}
                      >
                        <LayoutGrid size={16} />
                        <span className="hidden lg:inline">All Collections</span>
                        <span className="lg:hidden">All</span>
                      </button>

                      <div className="w-px h-6 bg-white/10 mx-2 shrink-0 hidden md:block"></div>

                      {heroCategories.map((hero) => (
                        <button
                          key={hero.hero_category_id}
                          onClick={() => handleHeroCategorySelect(hero)}
                          className={`group flex items-center gap-2 from-neutral-50 px-4 py-2 md:px-5 md:py-2.5 rounded-full  transition-all duration-300 whitespace-nowrap min-w-fit shrink-0 ${
                            selectedHeroCategory?.hero_category_id === hero.hero_category_id
                              ? 'text-[#00c48c]  '
                              : 'bg-transparent border-transparent text-white font-bold hover:bg-white/5 hover:text-white hover:border-white/10'
                          }`}
                        >
                           <span className={`transition-colors duration-300 ${selectedHeroCategory?.hero_category_id === hero.hero_category_id ? 'text-[#00c48c]' : 'text-gray-500 group-hover:text-white'}`}>
                             {hero.type === 'audio' && <Music size={16} /> }
                           </span>
                           
                           <span className="font-medium text-xs md:text-sm">
                             {hero.name}
                           </span>
                        </button>
                      ))}
                  </div>
               </div>

                {/* Left: Logo */}
               <div className="flex-shrink-0 w-auto md:w-55 text-left">
                  <Link href="/dashboard" className="flex items-center gap-3 group">
                              {/* <div className="w-11 h-11 bg-white text-black rounded-2xl flex items-center justify-center shadow-xl group-hover:rotate-[10deg] transition-all duration-500">
                                <Sparkles size={24} fill="currentColor" />
                              </div> */}
                                            <span className="text-2xl font-black tracking-tighter">NEXUS TOOLZ</span>
                
                             <div className="relative w-fit rounded-full overflow-hidden">
                               <Image
                                src="/images/icon.png.png"
                                alt="Logo"
                                width={50}
                                height={50}
                                className="rounded-full"
                              />
                              <BorderBeam size={50} duration={1} className="rounded-full" />
                             </div>
                            </Link>
               </div>

             </div>
         </div>
      </div>

      {/* Content Area */}
      <div className="mx-auto px-4 py-2 relative min-h-[500px]">
        
        {/* Hero Categories View */}
        {viewMode === 'hero' && (
          <div className="animate-in fade-in duration-500 space-y-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-black mb-3">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange via-[#00c48c] to-orange animate-gradient bg-300%">
                  BROWSE COLLECTIONS
                </span>
              </h2>
              <p className="text-gray-400 text-sm md:text-lg max-w-xl mx-auto font-light">
                Select a collection to explore premium assets
              </p>
            </div>
            
            {heroCategories.map((hero) => (
              <div key={hero.hero_category_id} id={`hero-section-${hero.hero_category_id}`} className="relative scroll-mt-32">
                <div className="flex flex-col md:flex-row justify-between items-end mb-8 px-2 border-b border-white/5 pb-4">
                  <div className="mb-4 md:mb-0">
                    <h2 className="text-2xl md:text-4xl font-black text-white mb-2 tracking-tight flex items-center gap-3">
                      {hero.name}
                      <span className="text-xs font-normal text-gray-500 bg-white/5 px-2 py-1 rounded-full border border-white/5">
                        {hero.subCategories?.length || 0} Categories
                      </span>
                    </h2>
                    <p className="text-gray-400 text-sm md:text-base font-light max-w-2xl">
                      {hero.description}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  {hero.subCategories && hero.subCategories.length > 0 ? (
                    <>
                      {hero.subCategories.slice(0, 11).map((cat) => (
                        <CategoryCard 
                          key={cat.category_id} 
                          category={cat} 
                          onClick={() => handleCategorySelect(cat.category_id)}
                        />
                      ))}
                      
                      {/* View All Card as 12th item */}
                      {hero.subCategories.length > 11 && (
                        <div 
                          onClick={() => handleViewAll(hero)}
                          className="group relative rounded-2xl overflow-hidden cursor-pointer aspect-[4/3] bg-gradient-to-br from-[#00c48c]/20 to-orange/20 border border-[#00c48c]/30 hover:border-[#00c48c]/60 transition-all duration-500 hover:scale-[1.02] "
                        >
                          {/* Animated Background */}
                          <div className="absolute inset-0 bg-gray-700  transition-all duration-500" />
                          
                          {/* Content */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                            <div className="w-16 h-16 rounded-full  flex items-center justify-center mb-4  transition-transform duration-300 ">
                              <ChevronRight size={32} className="text-white" />
                            </div>
                            <h3 className="text-white font-black text-lg md:text-xl mb-2 group-hover:text-[#00c48c] transition-colors duration-300">
                              View All
                            </h3>
                            <p className="text-gray-400 text-xs md:text-sm font-medium">
                              +{hero.subCategories.length - 11} More Categories
                            </p>
                          </div>
                          
                          {/* Glow Effect */}
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[#00c48c]/30 rounded-full blur-3xl"></div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-500 bg-white/[0.02] rounded-2xl border border-white/5 border-dashed">
                      <Folder size={32} className="mb-3 opacity-20" />
                      <p className="text-sm font-medium">Coming soon</p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {heroCategories.length === 0 && (
              <div className="text-center py-20 text-gray-500">
                <Folder size={48} className="mx-auto mb-4 opacity-30" />
                <p>No collections available</p>
              </div>
            )}
          </div>
        )}

        {/* Categories Grid View (Sub-categories) */}
        {viewMode === 'categories' && (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <button 
              onClick={handleBackToHero}
              className="flex items-center gap-2 mb-8 text-gray-400 hover:text-[#00c48c] transition-colors group px-4"
            >
               <ArrowLeftCircle className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
               <span className="font-bold uppercase tracking-wider text-xs">Back to Collections</span>
            </button>
            
            <div className="text-center mb-10">
              <h2 className="text-4xl md:text-6xl font-black mb-4 text-white tracking-tight">
                {selectedHeroCategory?.name}
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-orange to-[#00c48c] mx-auto rounded-full mb-4"></div>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                {selectedHeroCategory?.description}
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
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
                  <p>No categories in this collection</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Category Card Component
const CategoryCard = ({ category, onClick }: { category: Category, onClick: () => void }) => {
  return (
    <div 
      onClick={onClick}
      className="group relative rounded-2xl overflow-hidden cursor-pointer aspect-[4/3] bg-[#1a1a1a] border border-white/5 hover:border-[#00c48c]/30 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-[#00c48c]/10"
    >
      {/* Background Image */}
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
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />
      
      {/* Content */}
      <div className="absolute inset-0 p-6 flex flex-col justify-end">
        <h3 className="text-white font-black text-xl md:text-2xl mb-2 group-hover:text-[#00c48c] transition-colors duration-300">
          {category.name}
        </h3>
        {category.description && (
          <p className="text-gray-400 text-sm line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {category.description}
          </p>
        )}
        
        {/* Arrow indicator */}
        <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1">
          <ChevronRight size={20} className="text-white" />
        </div>
      </div>
    </div>
  );
};

const MediaHubPage = () => {
  return (
    <Suspense fallback={<PremiumLoader />}>
      <MediaHubContent />
    </Suspense>
  )
}

export default MediaHubPage;
