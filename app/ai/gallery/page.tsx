"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { 
  ArrowRight, Sparkles, Filter, LayoutGrid, PlayCircle, 
  Image as ImageIcon, Search, Download, ExternalLink,
  ChevronLeft, ChevronRight, User, Calendar, Info, X,
  Maximize2, Copy
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import { BorderBeam } from "@/components/ui/border-beam";
import Image from "next/image";
import { PremiumButton } from "@/components/PremiumButton";

export default function ProfessionalGalleryPage() {
    const [gallery, setGallery] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');
    const [page, setPage] = useState(1);
    const [selectedItem, setSelectedItem] = useState<any | null>(null);

    const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL, []);

    const fetchGallery = async () => {
        if (!apiBase) return;
        setLoading(true);
        try {
            const res = await fetch(`${apiBase}/api/ai/gallery?type=${filterType}&page=${page}&limit=100`);
            if (res.status === 200) {
                const data = await res.json();
                if (data.success) {
                    setGallery(data.gallery);
                }
            }
        } catch (error) {
            console.error("Failed to fetch gallery", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGallery();
    }, [filterType, page]);

    const downloadMedia = async (item: any) => {
        const url = item.cloudinary_url || item.image_url || item.video_url;
        window.open(url, '_blank');
        toast.success('تم فتح الرابط للتحميل');
    };

    return (
        <div className="min-h-screen bg-[#000000] text-white selection:bg-purple-500/30 overflow-x-hidden font-sans" dir="rtl">
            <Toaster position="top-right" />
            
            {/* Ambient Background */}
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,#1a0b2e_0%,transparent_50%)] pointer-events-none opacity-40"></div>
            <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>

            {/* Header */}
            <header className="sticky top-0 z-50 bg-black/60 backdrop-blur-2xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-6">
                        <Link href="/ai" className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-xs font-bold">
                            <ArrowRight size={14} /> عودة
                        </Link>
                        <div className="flex items-center gap-3">
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
                            <div>
                                <h1 className="text-lg md:text-xl font-black tracking-tight">معرض المحترفين</h1>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">إبداعات مجتمع نيكسوس</p>
                            </div>
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center p-1 bg-white/5 backdrop-blur-3xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                        {[
                            { id: 'all', label: 'الكل', icon: LayoutGrid },
                            { id: 'image', label: 'الصور', icon: ImageIcon },
                            { id: 'video', label: 'الفيديو', icon: PlayCircle },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => { setFilterType(tab.id as any); setPage(1); }}
                                className={`relative flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-black transition-all duration-500 overflow-hidden group ${
                                    filterType === tab.id 
                                    ? 'text-white shadow-lg shadow-purple-900/40 ring-1 ring-white/10' 
                                    : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'
                                }`}
                            >
                                {filterType === tab.id && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-100"></div>
                                )}
                                <span className="relative z-10 flex items-center gap-2">
                                    <tab.icon size={16} className={filterType === tab.id ? 'animate-pulse' : ''} />
                                    {tab.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* Gallery Grid */}
            <main className="max-w-7xl mx-auto px-6 py-12 relative z-10">
                {loading && gallery.length === 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse">
                        {[...Array(12)].map((_, i) => (
                            <div key={i} className="aspect-[4/5] bg-white/5 rounded-3xl border border-white/5"></div>
                        ))}
                    </div>
                ) : gallery.length === 0 ? (
                    <div className="py-32 text-center">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-700">
                             <Info size={40} />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">لا يوجد محتوى في المعرض حالياً</h2>
                        <p className="text-gray-500">كن أول من ينشر إبداعه هنا!</p>
                    </div>
                ) : (
                    <div className="columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
                        {gallery.map((item) => (
                            <div 
                                key={item.id || item.image_id || item.video_id}
                                onClick={() => setSelectedItem(item)}
                                className="break-inside-avoid group relative rounded-[2rem] overflow-hidden bg-[#0c0c0c] border border-white/5 hover:border-purple-500/30 transition-all duration-500 cursor-pointer shadow-2xl hover:translate-y-[-8px]"
                            >
                                {/* Media Content */}
                                {item.media_type === 'video' ? (
                                    <div className="relative w-full flex items-center justify-center bg-black">
                                       <video 
                                            src={(item.cloudinary_url || item.video_url) + "#t=1"} 
                                            className="w-full h-auto object-contain opacity-80 group-hover:opacity-100 transition-opacity" 
                                            muted 
                                            preload="metadata"
                                            onMouseOver={e => (e.target as HTMLVideoElement).play()}
                                            onMouseOut={e => { (e.target as HTMLVideoElement).pause(); (e.target as HTMLVideoElement).currentTime = 0; }}
                                       />
                                       <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center group-hover:scale-110 transition-transform border border-white/20">
                                                <PlayCircle size={24} className="text-white fill-white/20" />
                                            </div>
                                       </div>
                                    </div>
                                ) : (
                                    <div className="relative w-full overflow-hidden bg-black">
                                        <img 
                                            src={item.cloudinary_url || item.image_url} 
                                            className="w-full h-auto object-contain transition-transform duration-700 group-hover:scale-110" 
                                            alt={item.prompt} 
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {(gallery.length >= 100 || page > 1) && (
                    <div className="mt-20 flex justify-center items-center gap-8">
                        <button 
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                            className="p-3 bg-white/5 rounded-2xl border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white disabled:opacity-20 transition-all font-bold"
                        >
                            <ArrowRight size={20} />
                        </button>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-white">الصفحة {page}</span>
                        </div>
                        <button 
                            onClick={() => setPage(page + 1)}
                            disabled={gallery.length < 100}
                            className="p-3 bg-white/5 rounded-2xl border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white disabled:opacity-20 transition-all font-bold"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    </div>
                )}
            </main>

            {/* Lightbox / Modal View */}
            {selectedItem && (
                 <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/98 backdrop-blur-3xl" dir="rtl">
                    <button 
                        onClick={() => setSelectedItem(null)}
                        className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-20"
                    >
                        <X size={24} />
                    </button>

                    <div className="w-full max-w-7xl h-[85vh] flex flex-col lg:flex-row gap-8 items-stretch">
                        
                        {/* Content Area */}
                        <div className="flex-1 overflow-hidden rounded-[1rem] bg-black gradient-border-analysis flex items-center justify-center shadow-2xl relative">
                             {selectedItem.media_type === 'video' ? (
                                 <video 
                                    src={selectedItem.cloudinary_url || selectedItem.video_url} 
                                    controls 
                                    autoPlay 
                                    className="max-h-full max-w-full"
                                 />
                             ) : (
                                 <img 
                                    src={selectedItem.cloudinary_url || selectedItem.image_url} 
                                    className="max-h-full max-w-full object-contain"
                                    alt=""
                                 />
                             )}
                        </div>

                        {/* Sidebar */}
                        <div className="w-full lg:w-[400px] shrink-0 gradient-border-analysis rounded-[1rem] p-8 flex flex-col justify-between">
                            <div className="space-y-8">
                                <div className="flex items-center gap-4">
                                     <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center font-black text-xl text-black shadow-lg">
                                        {selectedItem.user?.name?.[0] || 'N'}
                                     </div>
                                     <div>
                                         <h3 className="font-black text-white">{selectedItem.user?.name || 'مستخدم نيكسوس'}</h3>
                                         <p className="text-xs text-emerald-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                            <Calendar size={10} /> 
                                            {new Date(selectedItem.created_at).toLocaleDateString('ar-EG')}
                                         </p>
                                     </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black text-white uppercase tracking-widest">الوصف الأصلي (Prompt)</label>
                                        <button onClick={() => { navigator.clipboard.writeText(selectedItem.prompt); toast.success('تم نسخ البروميت!'); }} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all" title="نسخ البروميت"><Copy size={14} className="text-gray-400" /></button>
                                    </div>
                                    <div className="p-5 bg-gray-900 rounded-xl border border-white/5 text-sm text-gray-300 leading-relaxed max-h-[250px] overflow-y-auto custom-scrollbar break-words">
                                        {selectedItem.prompt}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 mt-8">
                                {/* <button
                                    onClick={() => downloadMedia(selectedItem)}
                                    className="w-full py-5 bg-white text-black font-black rounded-[1.5rem] hover:scale-[1.02] transition-all flex items-center justify-center gap-3 shadow-xl"
                                >
                                    <Download size={20} />
                                    تحميل العمل
                                </button> */}
                                {/* <Link 
                                    href="/ai/plans"
                                    className="w-full py-5 bg-purple-600/10 border border-purple-500/20 text-purple-400 font-black rounded-[1.5rem] hover:bg-purple-600 hover:text-white transition-all flex items-center justify-center gap-3"
                                >
                                    <Sparkles size={18} />
                                    جرب نيكسوس الآن
                                </Link> */}
                                <Link href="/ai/plans">
                                    <PremiumButton
                                        label={"جرب نيكسوس الان"}
                                        icon={Sparkles}
                                        className="w-full py-4 text-xs rounded-xl"
                                    />
                                </Link>
                                 
                            </div>
                        </div>
                    </div>
                 </div>
            )}
        </div>
    );
}

function ArrowLeft(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}
