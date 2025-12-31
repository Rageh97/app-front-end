"use client";

import React, { useState, useEffect, useRef } from "react";
import axios from "@/utils/api";
import { Folder, Video, Image as ImageIcon, Download, Lock, ChevronRight, ArrowLeft, Play, LayoutGrid, X, ArrowLeftCircle, Search, Film } from "lucide-react";
import { toast } from "react-hot-toast";
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from "next/link";
import i18n from "@/i18n";
import PremiumLoader from "@/components/PremiumLoader";
import ShinyText from "@/components/ShinyText";

interface Category {
  category_id: number;
  name: string;
  description: string;
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
  expiryDate?: string;
}

// Old Loader for content sections
const InlineLoader = () => (
  <div className="relative flex items-center justify-center w-24 h-24">
    {/* Outer Ring */}
    <div className="absolute inset-0 rounded-full border-t-2 border-l-2 border-[#00c48c] animate-spin"></div>
    {/* Inner Ring */}
    <div className="absolute inset-2 rounded-full border-b-2 border-r-2 border-orange animate-spin-slow"></div>
    {/* Pulse Center */}
    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#00c48c] to-orange animate-pulse opacity-80 shadow-[0_0_30px_rgba(0,196,140,0.4)]"></div>
  </div>
);

const MediaHubContent = () => {
  const searchParams = useSearchParams();
  const catParam = searchParams.get('cat');

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;
  
  // Modal State
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

  const [isMediaHubEnabled, setIsMediaHubEnabled] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get("/api/admin/settings/media_hub_enabled");
        if (String(res.data.value) === 'false') {
          setIsMediaHubEnabled(false);
          window.location.href = "/dashboard";
        }
      } catch (error) {
        console.error("Failed to fetch media hub setting:", error);
      }
    };
    fetchSettings();
    fetchCategories();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get("/api/media/stats");
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const res = await axios.get("/api/media/categories");
      setCategories(res.data);
      // Select category from URL if exists, otherwise first one
      if (catParam) {
        setSelectedCategoryId(parseInt(catParam));
      } else if (res.data.length > 0) {
        setSelectedCategoryId(res.data[0].category_id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    if (selectedCategoryId) {
      fetchFiles(selectedCategoryId);
    }
  }, [selectedCategoryId]);

  const fetchFiles = async (catId: number) => {
    setLoading(true);
    setIsTransitioning(true);
    
    // Minimum 2 seconds loader as requested
    const minWait = new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      const fetchPromise = axios.get(`/api/media/files/${catId}`);
      const [res] = await Promise.all([fetchPromise, minWait]);
      setFiles(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setIsTransitioning(false);
    }
  };

  // High-performance client-side filtering using useMemo
  const filteredFiles = React.useMemo(() => {
    if (!searchQuery.trim()) return files;
    const query = searchQuery.toLowerCase();
    return files.filter(file => 
      file.title.toLowerCase().includes(query) || 
      file.description.toLowerCase().includes(query)
    );
  }, [files, searchQuery]);

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategoryId, searchQuery]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredFiles.length / ITEMS_PER_PAGE);
  const paginatedFiles = filteredFiles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE, 
    currentPage * ITEMS_PER_PAGE
  );

  const handleDownload = async (fileId: number, fallbackUrl: string, title: string, variantId?: number) => {
    try {
      // 1. Check Permission
      const permRes = await axios.get(`/api/media/permission/${fileId}`);
      
      if (!permRes.data.allowed) {
        if (permRes.data.code === "NO_SUBSCRIPTION" || permRes.data.code === "LIMIT_REACHED") {
          setUpgradeModalOpen(true);
          return;
        }
         toast.error("Access denied");
         return;
      }

      // 2. Get Clean URL and Extension from permission response
      let downloadUrl = permRes.data.file.storage_url; 
      let extension = permRes.data.file.extension;

      if (variantId && permRes.data.file.variants) {
        const variant = permRes.data.file.variants.find((v: any) => v.variant_id === variantId);
        if (variant) {
            downloadUrl = variant.storage_url;
            extension = variant.extension || extension;
        }
      }

      // 3. Log Download
      await axios.post("/api/media/download", { fileId: fileId });
      
      // Refresh stats
      fetchStats();

      // 4. Trigger Download
      try {
        const response = await fetch(downloadUrl, { mode: 'cors' });
        if (!response.ok) throw new Error('Fetch failed');
        
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.style.display = 'none';
        link.href = blobUrl;
        
        // Construct filename: Use original title + proper extension
        const cleanTitle = title.replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '_');
        link.download = `${cleanTitle}.${extension}`;
        
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
        }, 100);
        
        toast.success("Download started");
      } catch (e) {
        console.error("Blob download failed, falling back to direct link", e);
        // Fallback that tries to trigger download without opening a new tab if supported
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = title;
        link.target = "_self"; // Force same tab
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

    } catch (err: any) {
        console.error(err);
        toast.error("Download failed");
    }
  };

  // Initial Full Screen Load
  if (loadingCategories) {
    return <PremiumLoader />;
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      
      {/* Header Section */}
      {/* Hero Header Section */}
      <div className="relative w-full h-[600px] flex items-start  mb-8 overflow-hidden rounded-b-[3rem] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] border-b border-white/5">
         
         {/* Background Media */}
         <div className="absolute inset-0 z-0">
             {/* Replace with your preferred video or image URL */}
             <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-[#0d0d0d]/50 to-[#00c48c30] z-10"></div>
             {/* <img 
               src="https://images.unsplash.com/photo-1706174131367-bb0e7e1212a5?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 

               alt="Hero Background" 
               className="w-full h-full object-cover opacity-60 mix-blend-overlay"
             /> */}
           <div style={{position:'relative', width:'100%', height:'0px', paddingBottom:'56.250%'}}><iframe allow="fullscreen;autoplay" allowFullScreen height="100%" src="https://streamable.com/e/uhfvf7?autoplay=1&muted=1" width="100%" style={{border:'none', width:'100%', height:'100%', position:'absolute', left:'0px', top:'0px', overflow:'hidden'}}></iframe></div>
             {/* <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 z-10"></div> */}
             {/* Bottom Fade */}
             <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#0d0d0d] to-transparent z-10"></div>
         </div>

         {/* Content */}
         <div className="w-full max-w-7xl mx-auto mt-12 md:mt-20 px-4 md:px-6 z-20 flex flex-col xl:flex-row justify-between items-center gap-12 lg:gap-16">
            <div className="w-full xl:max-w-3xl flex flex-col items-center xl:items-start text-center xl:text-left">
              <Link href="/dashboard" className="cursor-pointer flex items-center gap-2 mb-6 hover:text-[#00c48c] transition-colors group">
                <ArrowLeftCircle className="group-hover:-translate-x-1 transition-transform w-5 h-5 md:w-6 md:h-6" />
                <span className="font-medium text-sm md:text-base">Back to dashboard </span>
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
/></span>
               </h1>
               <p className="text-gray-400 text-sm md:text-lg lg:text-xl max-w-2xl leading-relaxed font-light mb-8 md:mb-12">
                 Unlimited access to high-quality videos, images, and creative assets curated for professional creators.
               </p>

               {/* Responsive Professional Search Bar */}
               <div className="relative w-full max-w-2xl group mb-4 xl:mb-0">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#00c48c]/30 to-orange/30 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700"></div>
                  <div className="relative flex items-center bg-black/40 backdrop-blur-3xl border border-white/40 rounded-xl md:rounded-2xl p-1 md:p-2 shadow-2xl transition-all duration-300 ">
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
                 
                 <div className="space-y-3">
                   <div className="flex justify-between items-end">
                      <span className="text-gray-400 text-xs md:text-sm uppercase tracking-widest font-bold">Limit</span>
                      <span className="font-black text-white text-xl md:text-2xl tracking-tighter">
                        {stats.remaining} <span className="text-gray-500 text-xs md:text-sm font-normal">/ {stats.limit}</span>
                      </span>
                   </div>
                   {/* Progress Bar */}
                   <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden p-[1px]">
                      <div 
                        className="h-full bg-gradient-to-r from-orange via-orange to-[#00c48c] rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,119,2,0.5)]"
                        style={{ width: `${(Number(stats.remaining) / Number(stats.limit)) * 100}%` }}
                      ></div>
                   </div>
                 </div>
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
      </div>

      {/* Categories Bar */}
      <div className=" sticky top-0 bg-[#0d0d0d]/95 backdrop-blur z-40">
        <div className=" mx-auto px-4 overflow-x-auto no-scrollbar">
          <div className="flex gap-2 py-4 min-w-max">
            {categories.map((cat) => (
              <button
                key={cat.category_id}
                onClick={() => setSelectedCategoryId(cat.category_id)}
                className={`text-lg font-bold transition-all duration-300 relative ${
                  selectedCategoryId === cat.category_id 
                    ? "text-black scale-105 border rounded-lg px-2 bg-gradient-to-r from-orange to-[#00c48c]" 
                    : "text-gray-500 hover:text-gray-300 rounded-lg border border-white/40 rounded px-2"
                }`}
              >
                {cat.name}
                {/* {selectedCategoryId === cat.category_id && (
                  <span className="absolute -bottom-4 left-0 w-full h-1 bg-orange rounded-t-full shadow-[0_-2px_10px_rgba(255,119,2,0.5)]"></span>
                )} */}
              </button>
            ))}
            {!loadingCategories && categories.length === 0 && <span className="text-gray-500">No categories found</span>}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className=" mx-auto px-4 py-8 relative min-h-[500px]">
        {loading || isTransitioning ? (
           <div className="flex flex-col justify-center items-center h-[50vh] animate-in fade-in duration-500">
             <InlineLoader />
           </div>
        ) : (
          <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">
            {paginatedFiles.map((file) => (
              <MediaCard 
                key={file.file_id} 
                file={file} 
                onDownload={handleDownload} 
                onOpen={() => setSelectedFile(file)}
              />
            ))}
            {paginatedFiles.length === 0 && (
              <div className="col-span-full text-center py-20 text-gray-500 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search size={32} className="opacity-20" />
                </div>
                <h3 className="text-white font-bold text-xl mb-2">No results found</h3>
                <p>We couldn't find any results matching "{searchQuery}"</p>
                <button 
                  onClick={() => setSearchQuery("")}
                  className="mt-6 text-[#00c48c] font-bold underline hover:text-[#00e0a0]"
                >
                  Clear search and show all
                </button>
              </div>
            )}
          </div>
          
          {/* Professional Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-12 mb-8">
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  window.scrollTo({ top: 600, behavior: 'smooth' }); // Scroll back to grid top
                }}
              />
            </div>
          )}
          </>
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

      {/* Upgrade Modal */}
      {upgradeModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#1e1e1e] border border-orange/50 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange/20 blur-3xl rounded-full"></div>
            
            <div className="w-16 h-16 bg-orange/20 rounded-full flex items-center justify-center mx-auto mb-6 text-orange animate-bounce">
              <Lock size={32} />
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-2">Access Restricted</h3>
            <p className="text-gray-400 mb-6">
              You've reached your download limit or don't have an active subscription for this content.
            </p>
            
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => setUpgradeModalOpen(false)}
                className="px-6 py-3 rounded-xl border border-gray-600 text-gray-300 hover:bg-white/5 transition"
              >
                Close
              </button>
              <button 
                onClick={() => window.location.href = '/plans'}
                className="px-6 py-3 rounded-xl bg-orange hover:bg-orange/90 text-white font-bold shadow-lg shadow-orange/20 transition hover:scale-105"
              >
                Upgrade Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Modern Media Details Modal
const MediaDetailsModal = ({ file, onClose, onDownload }: { file: FileItem, onClose: () => void, onDownload: (id: number, url: string, title: string, variantId?: number) => void }) => {
  const [activeVariantId, setActiveVariantId] = useState<number | null>(null);
  
  // Calculate current preview based on selection
  const currentVariant = activeVariantId ? file.variants.find(v => v.variant_id === activeVariantId) : null;
  const previewUrl = currentVariant ? currentVariant.storage_url : (file.preview_video_url || file.storage_url);
  const previewType = currentVariant ? currentVariant.file_type : (file.preview_video_url ? 'video' : file.file_type);

  // Helper to get the right icon for a type
  const getTypeIcon = (type: string, size = 18) => {
    switch(type) {
      case 'video': return <Video size={size} />;
      case 'prores': return <Film size={size} />;
      case 'image': return <ImageIcon size={size} />;
      case 'png_sequence': 
      case 'archive': return <Folder size={size} />;
      default: return <Download size={size} />;
    }
  };

  return (
    <div className="fixed inset-0 z-[50] flex items-center justify-center bg-[#19023750] backdrop-blur-xl p-4 md:p-10 animate-in zoom-in duration-300">
      <button onClick={onClose} className="absolute top-6 right-6 text-red  transition-colors p-2 bg-white rounded-full z-[60]">
        <X size={24} />
      </button>

      <div className="w-full max-w-7xl h-full max-h-[90vh] gradient-border-analysis border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row shadow-2xl">
         
         {/* Media Preview Section */}
         <div className="flex-1 bg-black flex items-center justify-center relative group overflow-hidden">
            {previewType === 'video' ? (
              <video 
                key={previewUrl}
                src={previewUrl} 
                controls 
                autoPlay 
                loop 
                className="w-full h-full object-contain transition-all duration-500 animate-in fade-in"
              />
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
            
            {/* Watermark Overlay for Modal */}
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
                 <LayoutGrid size={14} className="text-orange" /> Select Format
               </label>
               
               <div className="grid grid-cols-1 gap-3">
                  {/* Original Format */}
                  <button 
                    onClick={() => setActiveVariantId(null)}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 group ${
                      activeVariantId === null 
                        ? "bg-orange/10 border-orange text-white " 
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

                  {/* Variants */}
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

// Extracted Card Component for Hover Logic
const MediaCard = ({ file, onDownload, onOpen }: { file: FileItem, onDownload: (id: number, url: string, title: string, variantId?: number) => void, onOpen: () => void }) => {
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
      onClick={onOpen}
      tabIndex={0}
      onKeyDown={(e) => { if(e.key === 'Enter') onOpen(); }}
    >
      {/* Media Display */}
      <div className="aspect-[4/3] w-full relative rounded overflow-hidden bg-[#1f1f1f] shadow-lg group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-shadow duration-500">
        {/* Static Thumbnail (Main Image or Video Thumbnail) */}
        <img 
          src={file.thumbnail_url || (file.file_type === 'image' ? file.storage_url : '')} 
          alt={file.title} 
          className={`w-full h-full object-cover transition-opacity duration-300 ${isHovering && showHoverVideo ? 'opacity-0' : 'opacity-100'}`}
        />
        
        {/* Hover Video Preview */}
        {showHoverVideo && (
          <video
            ref={videoRef}
            src={hoverVideoUrl}
            muted
            loop
            playsInline
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isHovering ? 'opacity-100' : 'opacity-0'}`}
          />
        )}

        {/* Play Icon overlay for videos when not hovering */}
        {!isHovering && file.file_type === 'video' && (
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-12 h-12 bg-black/40 backdrop-blur rounded-full flex items-center justify-center pl-1">
               <Play size={20} fill="white" className="text-white" />
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
        <div className={`absolute inset-y-0 right-0 w-24 p-2 flex flex-col gap-2 ${i18n.language === 'ar' ? 'items-start' : 'items-end'} justify-start bg-gradient-to-l from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10`}>
           
           {/* Download Main */}
           <button 
             onClick={(e) => { e.stopPropagation(); onDownload(file.file_id, file.storage_url, file.title); }}
             className="mt-2 bg-[#E1FE26] hover:bg-[#c9e31d] text-black text-[10px] font-bold py-1 px-3 rounded-lg flex items-center gap-1 shadow-lg transform translate-x-4 group-hover:translate-x-0 transition-transform duration-300"
             title="Download Original"
           >
              <Download size={12} /> ORIG
           </button>
           
           {/* Download Variants */}
           {file.variants && file.variants.slice(0, 3).map((v, idx) => (
             <button 
              key={v.variant_id}
              onClick={(e) => { e.stopPropagation(); onDownload(file.file_id, v.storage_url, `${file.title}-${v.label}`, v.variant_id); }}
              className="bg-white/20  hover:bg-white/90 hover:text-black text-white text-[9px] font-bold py-1 px-3 rounded-lg backdrop-blur-md flex items-center gap-1 shadow-lg transform translate-x-4 group-hover:translate-x-0 transition-transform duration-300"
              style={{ transitionDelay: `${idx * 50}ms` }}
              title={`Download ${v.label}`}
             >
               <Download size={12} /> {v.label}
             </button>
           ))}
           {file.variants && file.variants.length > 5 && (
             <div className="text-[8px] text-white/50 px-2 uppercase font-bold tracking-tighter">+{file.variants.length - 5} More</div>
           )}
        </div>

        {/* Info Overlay at bottom */}
         <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent p-5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
            <h4 className="text-white font-bold text-base truncate mb-1">{file.title}</h4>
            {/* <div className="flex items-center gap-3">
               <span className="text-[10px] font-bold text-[#E1FE26] uppercase tracking-[0.1em]">{file.file_type}</span>
               <span className="w-1 h-1 rounded-full bg-white/20"></span>
               <span className="text-[10px] font-medium text-white/60 uppercase tracking-[0.1em]">{file.variants?.length || 0} Formats</span>
            </div> */}
         </div>
         
         <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-[#00c48c] backdrop-blur border border-white/10 px-3  rounded-full text-[9px] font-bold text-white uppercase tracking-widest">
              Preview
            </div>
         </div>
      </div>
    </div>
  );
};

const Pagination = ({ currentPage, totalPages, onPageChange }: { currentPage: number, totalPages: number, onPageChange: (page: number) => void }) => {
  return (
    <div className="flex items-center gap-2 bg-black/40 backdrop-blur-xl border border-white/10 p-2 rounded-full shadow-2xl animate-in slide-in-from-bottom duration-500">
      <button 
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="p-3 rounded-full hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
      >
        <ArrowLeft size={18} />
      </button>

      <div className="flex items-center gap-1 px-2">
         {Array.from({ length: totalPages }).map((_, idx) => {
           const page = idx + 1;
           // Logic to show limited pages if many
           if (totalPages > 7 && (page < currentPage - 2 || page > currentPage + 2) && page !== 1 && page !== totalPages) {
             if (page === currentPage - 3 || page === currentPage + 3) return <span key={page} className="text-gray-600">...</span>;
             return null;
           }
           
           return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-10 h-10 rounded-full font-bold transition-all duration-300 flex items-center justify-center ${
                currentPage === page 
                  ? "bg-gradient-to-r from-orange to-[#00c48c] text-black scale-110 shadow-[0_0_15px_rgba(0,196,140,0.5)]" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {page}
            </button>
           );
         })}
      </div>

      <button 
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="p-3 rounded-full hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
      >
        <ChevronRight size={18} />
      </button>
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
