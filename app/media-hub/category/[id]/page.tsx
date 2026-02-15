"use client";

import React, { useState, useEffect, useRef } from "react";
import axios from "@/utils/api";
import { ArrowLeft, ArrowLeftCircle, Search, X, ChevronRight, ArrowRight, Download, Play, Pause, Music, Lock, ChevronDown, Folder, Video, Image as ImageIcon, Film, LayoutGrid } from "lucide-react";
import { toast } from "react-hot-toast";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import i18n from "@/i18n";
import PremiumLoader from "@/components/PremiumLoader";
import ShinyText from "@/components/ShinyText";
import { useMyInfo } from "@/utils/user-info/getUserInfo";
import { trackPageView } from "@/utils/analytics";
import { BorderBeam } from "@/components/ui/border-beam";
import Image from "next/image";

interface HeroCategory {
  hero_category_id: number;
  name: string;
  description: string;
  type?: 'visual' | 'audio';
  subCategories: Category[];
}

interface Category {
  category_id: number;
  name: string;
  description: string;
  cover_image_url?: string;
}

interface Variant {
  variant_id: number;
  file_type: string;
  label: string;
  storage_url: string;
  size: number;
  extension: string;
}

interface FileItem {
  file_id: number;
  title: string;
  description: string;
  file_type: string;
  storage_url: string;
  thumbnail_url: string;
  preview_video_url?: string;
  variants: Variant[];
  isWatermarked?: boolean;
  extension: string;
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

const CategoryPage = () => {
  const params = useParams();
  const router = useRouter();
  const { data } = useMyInfo();
  const categoryId = parseInt(params.id as string);
  
  const [heroCategory, setHeroCategory] = useState<HeroCategory | null>(null);
  const [allHeroCategories, setAllHeroCategories] = useState<HeroCategory[]>([]); // New state for nav bar
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeAudioId, setActiveAudioId] = useState<number | null>(null);
  const [activeBanner, setActiveBanner] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    fetchCategoryData();
    fetchBanner();
    fetchStats();
    trackPageView('media_hub', `category_${categoryId}`);
  }, [categoryId]);

  const fetchStats = async () => {
    try {
      const res = await axios.get("/api/media/stats");
      setStats(res.data);
    } catch (err) {
      console.error(err);
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

  const fetchCategoryData = async () => {
    setLoading(true);
    try {
      // Fetch hero categories to get the parent
      const heroRes = await axios.get("/api/media/hero-categories");
      setAllHeroCategories(heroRes.data); // Store all for navigation

      const hero = heroRes.data.find((h: HeroCategory) => 
        h.subCategories?.some(s => s.category_id === categoryId)
      );
      
      if (hero) {
        setHeroCategory(hero);
        const cat = hero.subCategories.find(s => s.category_id === categoryId);
        setCurrentCategory(cat || null);
      }

      // Fetch files for this category
      const filesRes = await axios.get(`/api/media/files/${categoryId}`);
      setFiles(filesRes.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load category");
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (catId: number) => {
    router.push(`/media-hub/category/${catId}`);
  };

  const filteredFiles = React.useMemo(() => {
    if (!searchQuery.trim()) return files;
    const query = searchQuery.toLowerCase();
    return files.filter(file => 
      file.title.toLowerCase().includes(query) || 
      file.description.toLowerCase().includes(query)
    );
  }, [files, searchQuery]);

  const handleDownload = async (fileId: number, fallbackUrl: string, title: string, variantId?: number) => {
    try {
      const permRes = await axios.get(`/api/media/permission/${fileId}`);
      
      if (!permRes.data.allowed) {
        toast.error("Access denied - Please upgrade your plan");
        return;
      }

      let downloadUrl = permRes.data.file.storage_url; 
      let extension = permRes.data.file.extension;

      if (variantId && permRes.data.file.variants) {
        const variant = permRes.data.file.variants.find((v: any) => v.variant_id === variantId);
        if (variant) {
          downloadUrl = variant.storage_url;
          extension = variant.extension || extension;
        }
      }

      await axios.post("/api/media/download", { fileId });

      const response = await fetch(downloadUrl, { mode: 'cors' });
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${title.replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '_')}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      
      toast.success("Download started");
    } catch (err) {
      console.error(err);
      toast.error("Download failed");
    }
  };

  if (loading) {
    return <PremiumLoader />;
  }

  const isAudioCategory = heroCategory?.type === 'audio';

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      
      {/* Hero Header Section - Same as main page */}
      <div className="relative w-full h-[600px] flex items-start mb-8 overflow-hidden rounded-b-[3rem] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] border-b border-white/5">
         
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
              <Link href="/media-hub" className="cursor-pointer flex items-center gap-2 mb-6 hover:text-[#00c48c] transition-colors group">
                <ArrowLeftCircle className="group-hover:-translate-x-1 transition-transform w-5 h-5 md:w-6 md:h-6" />
                <span className="font-medium text-sm md:text-base">Back to Media Hub</span>
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
                     <Link 
                        href="/media-hub"
                        className={`flex items-center gap-2 px-2 py-2 rounded-full transition-all duration-300 font-bold text-xs md:text-sm whitespace-nowrap overflow-visible shrink-0 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/10`}
                      >
                        <LayoutGrid size={16} />
                        <span className="hidden lg:inline">All Collections</span>
                        <span className="lg:hidden">All</span>
                      </Link>

                      <div className="w-px h-6 bg-white/10 mx-2 shrink-0 hidden md:block"></div>
                      
                      {allHeroCategories.map((hero) => (
                        <Link
                          key={hero.hero_category_id}
                          href={`/media-hub#hero-section-${hero.hero_category_id}`}
                          className={`group flex items-center gap-2 from-neutral-50 px-4 py-2 md:px-5 md:py-2.5 rounded-full  transition-all duration-300 whitespace-nowrap min-w-fit shrink-0 ${
                            heroCategory?.hero_category_id === hero.hero_category_id
                              ? '  text-[#00c48c] '
                              : 'bg-transparent border-transparent text-white font-bold hover:bg-white/5 hover:text-white hover:border-white/10'
                          }`}
                        >
                           <span className={`transition-colors duration-300 ${heroCategory?.hero_category_id === hero.hero_category_id ? 'text-[#00c48c]' : 'text-gray-500 group-hover:text-white'}`}>
                             {hero.type === 'audio' && <Music size={16} /> }
                           </span>
                           
                           <span className="font-medium text-xs md:text-sm">
                             {hero.name}
                           </span>
                        </Link>
                      ))}
                  </div>
               </div>

                {/* Left: Logo */}
               <div className="flex-shrink-0 w-auto md:w-55 text-left">
                  <Link href="/dashboard" className="flex items-center gap-3 group">
                              {/* <div className="w-11 h-11 bg-white text-black rounded-2xl flex items-center justify-center shadow-xl group-hover:rotate-[10deg] transition-all duration-500">
                                <Sparkles size={24} fill="currentColor" />
                              </div> */}
                                            <span className="text-2xl font-black tracking-tighter">NEXUS TOOLZ </span>
                
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

      {/* Categories Navigation Bar */}
      {heroCategory && heroCategory.subCategories.length > 1 && (
        <div className="sticky top-0 bg-[#0d0d0d]/95 backdrop-blur z-40 border-b border-white/10">
          <div className="mx-auto px-4 relative">
            <button
              onClick={() => {
                const container = document.getElementById('cat-scroll');
                if (container) container.scrollBy({ left: i18n.language === 'ar' ? 200 : -200, behavior: 'smooth' });
              }}
              className={`absolute ${i18n.language === 'ar' ? 'right-0' : 'left-0'} top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-[#272830] text-white flex items-center justify-center shadow-lg  transition-transform`}
            >
              {i18n.language === 'ar' ? <ChevronRight size={20} /> : <ArrowLeft size={20} />}
            </button>

            <button
              onClick={() => {
                const container = document.getElementById('cat-scroll');
                if (container) container.scrollBy({ left: i18n.language === 'ar' ? -200 : 200, behavior: 'smooth' });
              }}
              className={`absolute ${i18n.language === 'ar' ? 'left-0' : 'right-0'} top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-[#272830] text-white flex items-center justify-center shadow-lg  transition-transform`}
            >
              {i18n.language === 'ar' ? <ArrowLeft size={20} /> : <ChevronRight size={20} />}
            </button>

            <div id="cat-scroll" className="overflow-x-auto no-scrollbar scroll-smooth">
              <div className="flex gap-2 py-4 min-w-max px-12">
                {heroCategory.subCategories.map((cat) => (
                  <button
                    key={cat.category_id}
                    onClick={() => handleCategoryChange(cat.category_id)}
                    className={`text-sm font-bold transition-all duration-300 whitespace-nowrap px-4 py-1 rounded-md ${
                      cat.category_id === categoryId
                        ? "bg-[#272830] text-white border-1 border-[#00c48c]"
                        : "text-gray-200 bg-[#272830] hover:text-white border border-white/20 hover:border-white/40"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Files Content */}
      <div className="mx-auto px-4 py-8">
        {filteredFiles.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search size={32} className="opacity-20" />
            </div>
            <h3 className="text-white font-bold text-xl mb-2">
              {searchQuery ? "No results found" : "Coming Soon"}
            </h3>
            <p className="text-gray-500">
              {searchQuery ? `No files matching "${searchQuery}"` : "Content will be added soon"}
            </p>
          </div>
        ) : isAudioCategory ? (
          <AudioListView files={filteredFiles} activeAudioId={activeAudioId} setActiveAudioId={setActiveAudioId} onDownload={handleDownload} />
        ) : (
          <GridView files={filteredFiles} onDownload={handleDownload} onOpen={setSelectedFile} />
        )}
      </div>

      {/* Media Details Modal */}
      {selectedFile && (
        <MediaDetailsModal 
          file={selectedFile} 
          onClose={() => setSelectedFile(null)} 
          onDownload={handleDownload}
        />
      )}
    </div>
  );
};

// Audio List View Component
const AudioListView = ({ files, activeAudioId, setActiveAudioId, onDownload }: any) => {
  return (
    <div className="flex flex-col">
      <div className="flex items-center px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-white/10">
        <div className="w-8"></div>
        <div className="w-8"></div>
        <div className="w-1/4 min-w-[200px]">Title</div>
        <div className="w-20 text-right mr-8">Duration</div>
        <div className="flex-1">Visualizer</div>
      </div>
      
      {files.map((file: FileItem) => (
        <AudioListItem 
          key={file.file_id}
          file={file}
          activeId={activeAudioId}
          onPlay={(id: number) => setActiveAudioId((prev: number | null) => prev === id ? null : id)}
          onDownload={onDownload}
        />
      ))}
    </div>
  );
};

// Grid View Component  
const GridView = ({ files, onDownload, onOpen }: any) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {files.map((file: FileItem) => (
        <MediaCard key={file.file_id} file={file} onDownload={onDownload} onOpen={onOpen} />
      ))}
    </div>
  );
};

// Headless Audio List Item (Invisible to DOM Scrapers + Instant Streaming)
const AudioListItem = ({ file, activeId, onPlay, onDownload }: any) => {
  const isPlaying = activeId === file.file_id;
  // Use a ref to hold the audio instance - unrelated to DOM
  const audioInstance = useRef<HTMLAudioElement | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  // Generate bars for visualizer
  const bars = React.useMemo(() => Array.from({ length: 200 }, () => Math.random()), []);

  // Initialize Audio Instance once
  useEffect(() => {
    // Create audio object in memory only - not in DOM
    const audio = new Audio(file.storage_url);
    audio.preload = "metadata"; // Fetch metadata (duration) immediately
    audioInstance.current = audio;

    // Event Listeners
    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
       if (audio.duration && audio.duration !== Infinity) {
         setDuration(audio.duration);
       }
    };
    const onEnded = () => onPlay(file.file_id); // Toggle off

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', onEnded);
    
    // Check if metadata is already loaded (cached)
    if (audio.readyState >= 1) {
      updateDuration();
    }

    return () => {
      // Cleanup
      audio.pause();
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', onEnded);
      audioInstance.current = null;
    };
  }, [file.storage_url, file.file_id]); // Re-create if file url changes

  // Control Playback
  useEffect(() => {
    const audio = audioInstance.current;
    if (!audio) return;

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Playback failed:", error);
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="group flex items-center gap-4 px-4 py-3 border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer">
      {/* No <audio> tag in DOM - Invisible to scrapers */}
      
      <div className="relative" ref={downloadMenuRef}>
        <button onClick={(e) => { e.stopPropagation(); setShowDownloadMenu(!showDownloadMenu); }} className="text-gray-500 hover:text-white p-2 rounded-full hover:bg-white/10">
          <Download size={16} />
        </button>
        {showDownloadMenu && (
          <div className="absolute right-0 top-full mt-2 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 min-w-[200px]">
            <button onClick={() => { onDownload(file.file_id, file.storage_url, file.title); setShowDownloadMenu(false); }} className="w-full px-4 py-3 hover:bg-white/10 text-right">
              {file.extension.toUpperCase()} (Original)
            </button>
            {file.variants?.map((v: Variant) => (
              <button key={v.variant_id} onClick={() => { onDownload(file.file_id, v.storage_url, file.title, v.variant_id); setShowDownloadMenu(false); }} className="w-full px-4 py-3 hover:bg-white/10 text-right border-t border-white/5">
                {v.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <button 
        onClick={() => onPlay(file.file_id)} 
        className={`w-8 h-8 flex items-center justify-center transition-all ${isPlaying ? 'text-[#00c48c] scale-110' : 'text-white hover:text-[#00c48c]'}`}
      >
        {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
      </button>

      <div className="w-1/4 min-w-[200px]">
        <h4 className={`font-medium truncate text-sm transition-colors ${isPlaying ? 'text-[#00c48c]' : 'text-gray-300'}`}>{file.title}</h4>
      </div>

      <div className="text-xs font-mono text-gray-500 w-20 text-right mr-8">
        {formatTime(currentTime > 0 ? currentTime : duration)}
      </div>

      <div className="flex-1 flex items-center gap-[2px] h-6 w-full overflow-hidden">
        {bars.map((height, i) => (
          <div 
            key={i} 
            className={`w-0.5 rounded-full transition-all duration-300 ${isPlaying ? 'bg-[#00c48c] opacity-100' : 'bg-gray-500 opacity-30'}`} 
            style={{ 
              height: isPlaying ? `${Math.max(20, Math.random() * 100)}%` : `${height * 100}%`,
              animation: isPlaying ? `music-bar 0.5s ease-in-out infinite alternate` : 'none',
              animationDelay: `${i * 0.05}s`
            }}
          ></div>
        ))}
        {/* Style for animation */}
        <style jsx>{`
          @keyframes music-bar {
            0% { height: 20%; }
            100% { height: 100%; }
          }
        `}</style>
      </div>
    </div>
  );
};

// Media Card with hover effects and download options
const MediaCard = ({ file, onDownload, onOpen }: any) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const hasPreviewVideo = !!file.preview_video_url;
    const isMainVideo = file.file_type === 'video';
    
    if ((hasPreviewVideo || isMainVideo) && videoRef.current) {
      if (isHovering) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [isHovering, file.file_type, file.preview_video_url]);

  const showHoverVideo = !!file.preview_video_url || file.file_type === 'video';
  const hoverVideoUrl = file.preview_video_url || file.storage_url;

  return (
    <div 
      className="group relative rounded overflow-hidden bg-transparent mb-4 cursor-pointer focus:outline-none"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={() => onOpen(file)}
      tabIndex={0}
      onKeyDown={(e) => { if(e.key === 'Enter') onOpen(file); }}
    >
      {/* Media Display */}
      <div className="aspect-[4/3] w-full relative rounded overflow-hidden bg-[#1f1f1f] shadow-lg group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-shadow duration-500">
        {/* Static Thumbnail */}
        <img 
          src={file.thumbnail_url || (file.file_type === 'image' ? file.storage_url : '')} 
          alt={file.title} 
          className={`w-full h-full object-cover transition-opacity duration-300 ${isHovering && showHoverVideo ? 'opacity-0' : 'opacity-100'}`}
        />
        
        {/* Hover Video Preview */}
        {showHoverVideo && (
          <video
            ref={videoRef}
            muted
            loop
            playsInline
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isHovering ? 'opacity-100' : 'opacity-0'}`}
          >
            <source src={hoverVideoUrl} type={hoverVideoUrl.toLowerCase().endsWith('.mov') ? 'video/quicktime' : 'video/mp4'} />
          </video>
        )}

        {/* Play Icon overlay for videos when not hovering */}
        {!isHovering && (file.file_type === 'video' || file.file_type === 'audio') && (
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-12 h-12 bg-black/40 backdrop-blur rounded-full flex items-center justify-center pl-1">
               {file.file_type === 'video' ? <Play size={20} fill="white" className="text-white" /> : <Music size={24} className="text-orange" />}
             </div>
          </div>
        )}

        {/* Watermark Overlay */}
        {file.isWatermarked && (
          <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center overflow-hidden">
             <div className="absolute inset-0 bg-black/5 backdrop-grayscale-[0.3]"></div>
             <div className="flex flex-col items-center justify-center transform -rotate-45 scale-150 select-none opacity-[0.15] mix-blend-plus-lighter">
                 <div className="whitespace-nowrap text-3xl font-black text-white space-x-8">
                    <span>NEXUS</span><span>NEXUS</span><span>NEXUS</span>
                 </div>
                 <div className="whitespace-nowrap text-3xl font-black text-white space-x-8 mt-8 ml-12">
                    <span>NEXUS</span><span>NEXUS</span><span>NEXUS</span>
                 </div>
                 <div className="whitespace-nowrap text-3xl font-black text-white space-x-8 mt-8">
                    <span>NEXUS</span><span>NEXUS</span><span>NEXUS</span>
                 </div>
             </div>
          </div>
        )}

        {/* Overlay - Quick Actions on Hover */}
        <div className={`absolute inset-y-0 right-0 p-2 flex flex-col gap-2 ${i18n.language === 'ar' ? 'items-start' : 'items-end'} justify-start bg-gradient-to-l from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10`}>
           
           {/* Download Main */}
           <button 
             onClick={(e) => { e.stopPropagation(); onDownload(file.file_id, file.storage_url, file.title); }}
             className="mt-2 bg-[#E1FE26] hover:bg-[#c9e31d] text-black text-[10px] font-bold py-1 px-3 rounded-lg flex items-center gap-1 shadow-lg transform translate-x-4 group-hover:translate-x-0 transition-transform duration-300"
             title="Download Original"
           >
              <Download size={12} /> ORIG
           </button>
           
           {/* Download Variants */}
           {file.variants && file.variants.slice(0, 3).map((v: Variant, idx: number) => (
             <button 
              key={v.variant_id}
              onClick={(e) => { e.stopPropagation(); onDownload(file.file_id, v.storage_url, `${file.title}-${v.label}`, v.variant_id); }}
              className="bg-gradient-to-r from-orange/60 to-[#00c48c70] hover:bg-orange hover:text-black text-white text-[9px] font-bold py-1 px-2 rounded-lg backdrop-blur-md flex items-center gap-1 shadow-lg transform transition-transform duration-300"
              style={{ transitionDelay: `${idx * 50}ms` }}
              title={`Download ${v.label}`}
             >
               <Download size={12} /> {v.label}
             </button>
           ))}
           {file.variants && file.variants.length > 3 && (
             <div className="text-[8px] text-white/50 px-2 uppercase font-bold tracking-tighter">+{file.variants.length - 3} More</div>
           )}
        </div>

        {/* Info Overlay at bottom */}
         <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent p-5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
            <h4 className="text-white font-bold text-base truncate mb-1">{file.title}</h4>
         </div>
         
         <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-[#00c48c] backdrop-blur border border-white/10 px-3 rounded-full text-[9px] font-bold text-white uppercase tracking-widest">
              Preview
            </div>
         </div>
      </div>
    </div>
  );
};

// Media Details Modal
const MediaDetailsModal = ({ file, onClose, onDownload }: { file: FileItem, onClose: () => void, onDownload: (id: number, url: string, title: string, variantId?: number) => void }) => {
  const [activeVariantId, setActiveVariantId] = useState<number | null>(null);
  
  const currentVariant = activeVariantId ? file.variants.find(v => v.variant_id === activeVariantId) : null;
  const previewUrl = currentVariant ? currentVariant.storage_url : (file.preview_video_url || file.storage_url);
  const previewType = currentVariant ? currentVariant.file_type : (file.preview_video_url ? 'video' : file.file_type);

  const getTypeIcon = (type: string, size = 18) => {
    switch(type) {
      case 'video': return <Video size={size} />;
      case 'mov': return <Film size={size} />;
      case 'prores': return <Film size={size} />;
      case 'image': return <ImageIcon size={size} />;
      case 'audio': return <Music size={size} />;
      case 'png_sequence': 
      case 'archive': return <Folder size={size} />;
      default: return <Download size={size} />;
    }
  };

  return (
    <div className="fixed inset-0 z-[50] flex items-center justify-center bg-[#19023750] backdrop-blur-xl p-4 md:p-10 animate-in zoom-in duration-300">
      <button onClick={onClose} className="absolute top-6 right-6 text-red transition-colors p-2 bg-white rounded-full z-[60]">
        <X size={24} />
      </button>

      <div className="w-full max-w-7xl h-full max-h-[90vh] gradient-border-analysis border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row shadow-2xl">
         
         {/* Media Preview Section */}
         <div className="flex-1 bg-black flex items-center justify-center relative group overflow-hidden">
            {(currentVariant?.extension || file.extension || '').toLowerCase().replace('.','') === 'mov' || 
             (currentVariant?.label || '').toLowerCase() === 'mov' ||
             (currentVariant?.label || '').toLowerCase().includes('prores') ||
             previewType === 'mov' ||
             previewType === 'prores' ? (
              <div className="flex flex-col items-center gap-6 animate-in zoom-in-95">
                 <div className="w-40 h-40 rounded-3xl bg-gradient-to-br from-[#4f008c]/30 to-[#00c48c]/20 border border-[#00c48c]/30 flex items-center justify-center text-[#00c48c] shadow-[0_0_60px_rgba(0,196,140,0.15)] relative">
                    <Film size={80} />
                    <div className="absolute -bottom-2 -right-2 bg-orange text-black text-xs font-bold px-2 py-1 rounded-lg">
                      {(currentVariant?.label || '').toLowerCase().includes('prores') || previewType === 'prores' ? 'ProRes' : 'MOV'}
                    </div>
                 </div>
                 <div className="text-center">
                    <p className="text-white font-bold text-xl uppercase tracking-widest">
                      {(currentVariant?.label || '').toLowerCase().includes('prores') || previewType === 'prores' ? '4K ProRes File' : 'MOV Video File'}
                    </p>
                    <p className="text-white/40 text-sm mt-1">
                      {(currentVariant?.label || '').toLowerCase().includes('prores') || previewType === 'prores' 
                        ? 'Professional format - Download to play' 
                        : 'QuickTime format - Download to play'}
                    </p>
                 </div>
              </div>
            ) : previewType === 'video' ? (
              <video 
                key={previewUrl}
                controls 
                autoPlay 
                loop 
                className="w-full h-full object-contain transition-all duration-500 animate-in fade-in"
              >
                <source src={previewUrl} type={'video/mp4'} />
                Your browser does not support the video tag.
              </video>
            ) : previewType === 'audio' ? (
              <div className="flex flex-col items-center gap-6 animate-in zoom-in-95">
                 <div className="w-40 h-40 rounded-full bg-orange/10 border border-orange/20 flex items-center justify-center text-orange shadow-2xl animate-pulse">
                    <Music size={80} />
                 </div>
                 <audio controls src={previewUrl} className="w-full max-w-sm" />
                 <div className="text-center">
                    <p className="text-white font-bold text-xl uppercase tracking-widest">Audio Asset</p>
                    <p className="text-white/40 text-sm mt-1">High-quality audio resource</p>
                 </div>
              </div>
            ) : previewType === 'image' ? (
              <img 
                key={previewUrl}
                src={previewUrl} 
                alt={file.title} 
                className="max-w-full max-h-full object-contain shadow-2xl shadow-[#00c48c]/20 transition-all duration-500 animate-in zoom-in-95"
              />
            ) : (
              <div className="flex flex-col items-center gap-6 animate-in zoom-in-95">
                 <div className="w-32 h-32 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-[#00c48c] shadow-[0_0_50px_rgba(0,196,140,0.1)]">
                    <Folder size={64} />
                 </div>
                 <div className="text-center">
                    <p className="text-white font-bold text-xl uppercase tracking-widest">{previewType.replace('_', ' ')}</p>
                    <p className="text-white/40 text-sm mt-1">Professional Asset Package</p>
                 </div>
              </div>
            )}
            
            {file.isWatermarked && (
               <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden flex items-center justify-center">
                   <div className="absolute inset-0 bg-black/5 backdrop-blur-[1px]"></div>
                   <div className="grid grid-cols-3 gap-24 p-10 opacity-[0.07] -rotate-12 transform scale-150 select-none mix-blend-overlay">
                      <span className="text-6xl font-black text-white tracking-widest">NEXUS</span>
                      <span className="text-6xl font-black text-white tracking-widest">NEXUS</span>
                      <span className="text-6xl font-black text-white tracking-widest">NEXUS</span>
                      <span className="text-6xl font-black text-white tracking-widest">NEXUS</span>
                      <span className="text-6xl font-black text-white tracking-widest">NEXUS</span>
                      <span className="text-6xl font-black text-white tracking-widest">NEXUS</span>
                      <span className="text-6xl font-black text-white tracking-widest">NEXUS</span>
                      <span className="text-6xl font-black text-white tracking-widest">NEXUS</span>
                      <span className="text-6xl font-black text-white tracking-widest">NEXUS</span>
                   </div>
               </div>
            )}
            
            <div className="absolute top-8 left-8">
              <div className="px-4 py-2 rounded-full bg-black/60 backdrop-blur gradient-border-analysis text-xs font-bold uppercase tracking-widest text-[#00c48c] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00c48c]"></span>
                {activeVariantId ? `Variant: ${currentVariant?.label}` : `Original ${file.file_type}`}
              </div>
            </div>
         </div>

         {/* Content & Options Section */}
         <div className="w-full md:w-[450px] p-8 md:p-12 flex flex-col gap-8 bg-gradient-to-b from-white/[0.03] to-transparent border-l border-white/5">
            <div>
              <h2 className="text-3xl md:text-4xl font-black mb-4 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                {file.title}
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed font-light">
                {file.description || "Premium media asset optimized for creators. Perfect for high-end production, social media, or professional web projects."}
              </p>
            </div>

            <div className="space-y-4">
               <label className="text-xs uppercase tracking-[0.2em] font-bold text-gray-500 flex items-center gap-2">
                 <Download size={14} className="text-orange" /> Select Format
               </label>
               
               <div className="grid grid-cols-1 gap-3">
                  <button 
                    onClick={() => setActiveVariantId(null)}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 group ${
                      activeVariantId === null 
                        ? "bg-orange/10 border-orange text-white" 
                        : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                       <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeVariantId === null ? "bg-orange text-black" : "bg-white/10 text-white"}`}>
                          {getTypeIcon(file.file_type)}
                       </div>
                       <div className="text-left">
                          <p className="font-bold text-sm">Original File</p>
                          <p className="text-[10px] opacity-60">Source resolution & quality</p>
                       </div>
                    </div>
                    {activeVariantId === null && <div className="w-2 h-2 rounded-full bg-orange animate-pulse"></div>}
                  </button>

                  {file.variants?.map((v) => (
                    <button 
                      key={v.variant_id}
                      onClick={() => setActiveVariantId(v.variant_id)}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 group ${
                        activeVariantId === v.variant_id 
                          ? "bg-[#00c48c]/10 border-[#00c48c] text-white shadow-[0_0_20px_rgba(0,196,140,0.2)]" 
                          : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeVariantId === v.variant_id ? "bg-[#00c48c] text-black" : "bg-white/10 text-white"}`}>
                            {getTypeIcon(v.file_type)}
                         </div>
                         <div className="text-left">
                            <p className="font-bold text-sm uppercase">{v.label}</p>
                            <p className="text-[10px] opacity-60">Optimized {v.label} format</p>
                         </div>
                      </div>
                      {activeVariantId === v.variant_id && <div className="w-2 h-2 rounded-full bg-[#00c48c] animate-pulse"></div>}
                    </button>
                  ))}
               </div>
            </div>

            <div className="mt-auto space-y-4">
              <button 
                onClick={() => {
                  if (activeVariantId === null) {
                    onDownload(file.file_id, file.storage_url, file.title);
                  } else {
                    const v = file.variants.find(v => v.variant_id === activeVariantId);
                    if (v) onDownload(file.file_id, v.storage_url, `${file.title}-${v.label}`, v.variant_id);
                  }
                }}
                className="w-full bg-white text-black hover:bg-[#E1FE26] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 py-5 rounded-3xl font-black text-lg flex items-center justify-center gap-3 shadow-xl group"
              >
                <Download size={22} className="group-hover:translate-y-0.5 transition-transform" /> 
                DOWNLOAD NOW
              </button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default CategoryPage;
