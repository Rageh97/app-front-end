"use client";

import React, { useState, useEffect } from "react";
import axios from "@/utils/api";
import { 
  Download, Lock, ChevronRight, ArrowLeft, ChevronLeft,
  Star, Type, Copy, Check, ExternalLink, Heart, Share2,
  Maximize2, X
} from "lucide-react";
import JSZip from "jszip";
import { toast } from "react-hot-toast";
import { useParams, useRouter } from 'next/navigation';
import Link from "next/link";
import i18n from "@/i18n";
import PremiumLoader from "@/components/PremiumLoader";
import { useMyInfo } from "@/utils/user-info/getUserInfo";
import { trackPageView } from "@/utils/analytics";

interface Category {
  category_id: number;
  name: string;
  name_ar?: string;
}

interface Variant {
  variant_id: number;
  label: string;
  weight: number;
  style: string;
  file_format: string;
  storage_url: string;
  file_size: number;
}

interface PreviewImage {
  image_id: number;
  image_url: string;
  display_order: number;
  caption?: string;
  is_primary: boolean;
}

interface FontDetails {
  font_id: number;
  name: string;
  name_ar?: string;
  slug: string;
  description?: string;
  description_ar?: string;
  designer?: string;
  is_free: boolean;
  download_count: number;
  main_preview_image?: string;
  storage_url?: string;
  file_size: number;
  font_style?: string;
  supported_languages?: string;
  license_type?: string;
  version?: string;
  featured: boolean;
  tags?: string;
  category?: Category;
  variants: Variant[];
  previewImages: PreviewImage[];
  created_at: string;
}

// Format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Live Preview Component
const FontLivePreview = ({ fontUrl, fontName, supportedLanguages }: { fontUrl?: string; fontName: string; supportedLanguages?: string }) => {
  // Check if font supports Arabic
  const supportsArabic = supportedLanguages?.toLowerCase().includes('arabic') || supportedLanguages?.toLowerCase().includes('عربي');
  
  // Set initial preview text based on font language support, not site language
  const getInitialText = () => {
    if (supportsArabic) {
      return "اكتب هنا لمعاينة الخط";
    }
    return "Type here to preview the font";
  };
  
  const [previewText, setPreviewText] = useState(getInitialText());
  const [fontSize, setFontSize] = useState(48);
  const [copied, setCopied] = useState(false);
  const [fontStatus, setFontStatus] = useState<'loading' | 'loaded' | 'error' | 'unsupported'>('loading');
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Sample texts based on font language support
  const sampleTexts = supportsArabic 
    ? ["مرحباً بالعالم", "نيكسوس للتصميم", "الخط العربي جميل", "أبجد هوز حطي كلمن"]
    : ["Hello World", "The Quick Brown Fox", "Typography Matters", "Design is Art"];

  useEffect(() => {
    // Reset state when url/name changes
    if (!fontUrl) {
      setFontStatus('error');
      setErrorMsg("No font file available");
      return;
    }

    // Cleanup function references
    let activeFontUrl: string | null = null;
    let fontFace: FontFace | null = null;
    let isMounted = true;

    const loadFont = async () => {
      try {
        const cleanUrl = fontUrl.split('?')[0].toLowerCase();
        let urlToLoad = fontUrl;
        
        // Handle ZIP files
        if (cleanUrl.endsWith('.zip')) {
          setFontStatus('loading');
          try {
            // Use proxy for ZIP files to avoid CORS
            const proxyUrl = `${axios.defaults.baseURL || ''}/api/fonts/proxy?url=${encodeURIComponent(fontUrl)}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error("Failed to fetch ZIP file");
            
            const arrayBuffer = await response.arrayBuffer();
            const zip = await JSZip.loadAsync(arrayBuffer);
            
            // Find first valid font file
            const fontFile = Object.values(zip.files).find(file => 
              !file.dir && /\.(ttf|otf|woff|woff2)$/i.test(file.name)
            );

            if (!fontFile) {
              if (isMounted) {
                setFontStatus('unsupported');
                setErrorMsg(i18n.language === 'ar' ? "الملف المضغوط لا يحتوي على ملفات خطوط مدعومة" : "ZIP does not contain valid font files");
              }
              return;
            }

            const blob = await fontFile.async("blob");
            activeFontUrl = URL.createObjectURL(blob);
            urlToLoad = activeFontUrl;
          } catch (zipErr) {
            console.error("ZIP Error:", zipErr);
            if (isMounted) {
              setFontStatus('error');
              setErrorMsg(i18n.language === 'ar' ? "فشل فك ضغط ملف الخط" : "Failed to extract font from ZIP");
            }
            return;
          }
        } else if (cleanUrl.endsWith('.rar')) {
          if (isMounted) {
            setFontStatus('unsupported');
          }
          return;
        }

        if (!isMounted) return;
        setFontStatus('loading');

        // Create a safe font family name
        const familyName = `preview-${Math.random().toString(36).substr(2, 9)}`;
        const font = new FontFace(familyName, `url(${urlToLoad})`);

        const loadedFont = await font.load();
        
        if (!isMounted) return;

        document.fonts.add(loadedFont);
        fontFace = loadedFont;
        setFontStatus('loaded');
        setConfiguredFontFamily(familyName);

      } catch (err) {
        if (!isMounted) return;
        console.error("Font loading failed:", err);
        setFontStatus('error');
        setErrorMsg(i18n.language === 'ar' ? "تعذر تحميل ملف الخط للمعاينة" : "Could not load font for preview");
      }
    };

    loadFont();

    return () => {
      isMounted = false;
      // Cleanup Blob URL if we created one
      if (activeFontUrl) {
        URL.revokeObjectURL(activeFontUrl);
      }
      // Cleanup FontFace
      if (fontFace && document.fonts.has(fontFace)) {
        document.fonts.delete(fontFace);
      }
    };
  }, [fontUrl]);

  const [configuredFontFamily, setConfiguredFontFamily] = useState<string>('inherit');

  const handleCopy = () => {
    navigator.clipboard.writeText(previewText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="gradient-border-analysis border border-white/10 rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold text-lg flex items-center gap-2">
          <Type size={20} className="text-[#00c48c]" />
          {i18n.language === 'ar' ? 'معاينة الخط' : 'Live Preview'}
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-sm">{fontSize}px</span>
          <input 
            type="range" 
            min="16" 
            max="120" 
            value={fontSize}
            onChange={(e) => setFontSize(parseInt(e.target.value))}
            className="w-24 accent-[#00c48c]"
          />
        </div>
      </div>

      {/* Preview Area */}
      <div 
        className="min-h-[150px] bg-[#0d0d0d] rounded-xl p-6 border border-white/5 flex flex-col items-center justify-center relative overflow-hidden"
      >
        {fontStatus === 'loading' && (
           <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
             <div className="w-8 h-8 border-2 border-[#00c48c] border-t-transparent rounded-full animate-spin"></div>
           </div>
        )}
        
        {fontStatus === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10 text-center p-4">
             <Type size={32} className="text-red-500 mb-2 opacity-50" />
             <p className="text-red-400 text-sm">{errorMsg || "Preview Unavailable"}</p>
          </div>
        )}

        {fontStatus === 'unsupported' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10 text-center p-4">
             <Type size={32} className="text-yellow-500 mb-2 opacity-50" />
             <p className="text-yellow-400 text-sm">
               {i18n.language === 'ar' ? 'المعاينة غير متاحة لهذا النوع من الملفات' : 'Preview not available for this file type'}
             </p>
          </div>
        )}

        <textarea
          className="text-white w-full outline-none relative z-0 bg-transparent resize-none border-none"
          value={previewText}
          onChange={(e) => setPreviewText(e.target.value)}
          dir="auto"
          rows={3}
          style={{ 
            fontFamily: fontStatus === 'loaded' ? `"${configuredFontFamily}", sans-serif` : 'inherit',
            fontSize: `${fontSize}px`,
            lineHeight: 1.4,
            textAlign: 'center'
          }}
        />
      </div>

      {/* Sample Text Buttons */}
      <div className="flex flex-wrap gap-2">
        {sampleTexts.map((text, index) => (
          <button
            key={index}
            onClick={() => setPreviewText(text)}
            className="px-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:border-white/20 transition-colors"
          >
            {text}
          </button>
        ))}
        <button
          onClick={handleCopy}
          className="ml-auto px-3 py-1.5 text-xs bg-[#00c48c]/10 border border-[#00c48c]/20 rounded-lg text-[#00c48c] hover:bg-[#00c48c]/20 transition-colors flex items-center gap-1"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? (i18n.language === 'ar' ? 'تم النسخ' : 'Copied') : (i18n.language === 'ar' ? 'نسخ' : 'Copy')}
        </button>
      </div>
    </div>
  );
};

// Image Gallery Component
const ImageGallery = ({ images, mainImage }: { images: PreviewImage[]; mainImage?: string }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Combine main image with preview images
  const allImages = mainImage 
    ? [{ image_id: 0, image_url: mainImage, display_order: -1, is_primary: true }, ...images]
    : images;

  if (allImages.length === 0) {
    return (
      <div className="aspect-video bg-[#1a1a1a] rounded-2xl flex items-center justify-center border border-white/10">
        <Type size={64} className="text-white/10" />
      </div>
    );
  }

  const currentImage = allImages[selectedIndex];

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      {/* Main Image */}
      <div className="relative aspect-video bg-[#0d0d0d] rounded-2xl overflow-hidden border border-white/10 group">
        <img 
          src={currentImage.image_url}
          alt="Font Preview"
          className="w-full h-full object-contain transition-transform duration-500"
        />
        
        {/* Navigation Arrows */}
        {allImages.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 backdrop-blur flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 backdrop-blur flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

        {/* Fullscreen Button */}
        <button
          onClick={() => setIsFullscreen(true)}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 backdrop-blur flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
        >
          <Maximize2 size={18} />
        </button>

        {/* Image Counter */}
        {allImages.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur text-white text-sm">
            {selectedIndex + 1} / {allImages.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {allImages.length > 1 && (
        <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
          {allImages.map((img, index) => (
            <button
              key={img.image_id}
              onClick={() => setSelectedIndex(index)}
              className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                selectedIndex === index 
                  ? 'border-[#00c48c] shadow-lg shadow-[#00c48c]/20' 
                  : 'border-white/10 hover:border-white/30'
              }`}
            >
              <img 
                src={img.image_url}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setIsFullscreen(false)}
        >
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <X size={24} />
          </button>
          
          {allImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <ChevronLeft size={28} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <ChevronRight size={28} />
              </button>
            </>
          )}
          
          <img 
            src={currentImage.image_url}
            alt="Font Preview Fullscreen"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

// Main Page Component
export default function FontDetailsPage() {
  const { data } = useMyInfo();
  const router = useRouter();
  const params = useParams();
  const fontId = params.fontId as string;

  const [font, setFont] = useState<FontDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);

  // Modal states
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState<string | null>(null);

  useEffect(() => {
    if (fontId) {
      fetchFontDetails();
      // Track page view with font identifier
      trackPageView('font_detail', fontId);
    }
  }, [fontId]);

  const fetchFontDetails = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/fonts/details/${fontId}`);
      setFont(res.data);
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 404) {
        toast.error(i18n.language === 'ar' ? "الخط غير موجود" : "Font not found");
        router.push('/fonts');
      } else {
        toast.error(i18n.language === 'ar' ? "فشل في تحميل تفاصيل الخط" : "Failed to load font details");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (variantId?: number) => {
    if (!font) return;
    
    setDownloading(true);
    try {
      // Check permission first
      const permRes = await axios.get(`/api/fonts/permission/${font.font_id}`);
      
      if (!permRes.data.allowed) {
        if (permRes.data.code === "NO_SUBSCRIPTION" || permRes.data.code === "LIMIT_REACHED" || permRes.data.code === "NO_FONT_ACCESS") {
          setModalMessage(null);
          setUpgradeModalOpen(true);
          return;
        }
        if (permRes.data.code === "DAILY_LIMIT_REACHED") {
          setModalMessage(i18n.language === 'ar' 
            ? "لقد وصلت إلى حد التحميل اليومي. حاول مرة أخرى غداً."
            : "You've reached your daily download limit. Please try again tomorrow.");
          setUpgradeModalOpen(true);
          return;
        }
        toast.error(i18n.language === 'ar' ? "الوصول مرفوض" : "Access denied");
        return;
      }

      // Log download
      await axios.post("/api/fonts/download", { 
        fontId: font.font_id,
        variantId: variantId || null
      });

      // Get download URL
      let downloadUrl = font.storage_url;
      let fileName = `${font.name}.zip`;

      if (variantId && font.variants) {
        const variant = font.variants.find(v => v.variant_id === variantId);
        if (variant) {
          downloadUrl = variant.storage_url;
          fileName = `${font.name}-${variant.label}.${variant.file_format}`;
        }
      }

      if (!downloadUrl) {
        toast.error(i18n.language === 'ar' ? "ملف الخط غير متوفر" : "Font file not available");
        return;
      }

      // Trigger download
      try {
        const response = await fetch(downloadUrl, { mode: 'cors' });
        if (!response.ok) throw new Error('Fetch failed');
        
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.style.display = 'none';
        link.href = blobUrl;
        link.download = fileName;
        
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
        }, 100);
        
        toast.success(i18n.language === 'ar' ? "بدأ التحميل" : "Download started");
      } catch (e) {
        console.error("Blob download failed, falling back to direct link", e);
        // Fallback that tries to trigger download without opening a new tab if supported
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName;
        link.target = "_self"; // Force same tab
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(i18n.language === 'ar' ? "بدأ التحميل (رابط مباشر)" : "Download started (Direct Link)");
      }
      
      // Refresh font to update download count
      fetchFontDetails();
      
    } catch (err) {
      console.error(err);
      toast.error(i18n.language === 'ar' ? "فشل التحميل" : "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!font) return;
    
    const url = `${window.location.origin}/fonts/${font.slug}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: font.name,
          text: font.description || `Check out ${font.name} font`,
          url: url
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success(i18n.language === 'ar' ? "تم نسخ الرابط" : "Link copied to clipboard");
    }
  };

  if (loading) {
    return <PremiumLoader />;
  }

  if (!font) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <div className="text-center">
          <Type size={64} className="text-white/20 mx-auto mb-4" />
          <h2 className="text-white text-2xl font-bold mb-2">
            {i18n.language === 'ar' ? "الخط غير موجود" : "Font Not Found"}
          </h2>
          <Link href="/fonts" className="text-[#00c48c] hover:underline">
            {i18n.language === 'ar' ? "العودة للمكتبة" : "Back to Library"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen  bg-[#0d0d0d] text-white pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0d0d0d]/95 backdrop-blur border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/fonts" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">
              {i18n.language === 'ar' ? "مكتبة الخطوط" : "Fonts Library"}
            </span>
          </Link>
          
          <div className="flex items-center gap-3">
            {/* <button
              onClick={handleShare}
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              <Share2 size={18} />
            </button> */}
            <img className="w-30 h-10" src="/images/logoN.png" alt="" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left - Gallery */}
          <div>
            <ImageGallery 
              images={font.previewImages || []}
              mainImage={font.main_preview_image}
            />
          </div>

          {/* Right - Details */}
          <div className="space-y-6">
            {/* Title & Badges */}
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                {font.is_free ? (
                  <span className="px-3 py-1 text-xs font-bold bg-[#00c48c] text-black rounded-full">
                    {i18n.language === 'ar' ? 'مجاني' : 'FREE'}
                  </span>
                ) : (
                  <span className="px-3 py-1 text-xs font-bold bg-orange text-black rounded-full flex items-center gap-1">
                    <Lock size={12} /> {i18n.language === 'ar' ? 'مدفوع' : 'PREMIUM'}
                  </span>
                )}
                {font.featured && (
                  <span className="px-3 py-1 text-xs font-bold bg-yellow-500 text-white rounded-full flex items-center gap-1">
                    <Star className="text-orange" size={12} /> {i18n.language === 'ar' ? 'مميز' : 'FEATURED'}
                  </span>
                )}
                {font.category && (
                  <Link 
                    href={`/fonts?cat=${font.category.category_id}`}
                    className="px-3 py-1 text-xs bg-white/5 border border-[#00c48c] rounded-full text-gray-400 hover:text-white transition-colors"
                  >
                    {i18n.language === 'ar' && font.category.name_ar ? font.category.name_ar : font.category.name}
                  </Link>
                )}
              </div>
              
              <h1 className="text-3xl md:text-4xl font-black mb-2">{font.name}</h1>
              {font.name_ar && (
                <p className="text-xl text-gray-400" dir="rtl">{font.name_ar}</p>
              )}
            </div>

            {/* Meta Info */}
            <div className="grid grid-cols-2 gap-4">
              {font.designer && (
                <div className="gradient-border-analysis rounded-xl p-4 border border-white/5">
                  <span className="text-gray-500 text-xs uppercase tracking-wider block mb-1">
                    {i18n.language === 'ar' ? 'المصمم' : 'Designer'}
                  </span>
                  <span className="text-white font-medium">{font.designer}</span>
                </div>
              )}
              {font.font_style && (
                <div className="gradient-border-analysis rounded-xl p-4 border border-white/5">
                  <span className="text-gray-500 text-xs uppercase tracking-wider block mb-1">
                    {i18n.language === 'ar' ? 'النمط' : 'Style'}
                  </span>
                  <span className="text-white font-medium">{font.font_style}</span>
                </div>
              )}
              <div className="gradient-border-analysis rounded-xl p-4 border border-white/5">
                <span className="text-gray-500 text-xs uppercase tracking-wider block mb-1">
                  {i18n.language === 'ar' ? 'التحميلات' : 'Downloads'}
                </span>
                <span className="text-white font-medium">{font.download_count?.toLocaleString() || 0}</span>
              </div>
              {/* {font.version && (
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <span className="text-gray-500 text-xs uppercase tracking-wider block mb-1">
                    {i18n.language === 'ar' ? 'الإصدار' : 'Version'}
                  </span>
                  <span className="text-white font-medium">{font.version}</span>
                </div>
              )} */}
            </div>

            {/* Description */}
            {(font.description || font.description_ar) && (
              <div className="gradient-border-analysis rounded-xl p-4 border border-white/5">
                <h3 className="text-gray-500 text-xs uppercase tracking-wider mb-2">
                  {i18n.language === 'ar' ? 'الوصف' : 'Description'}
                </h3>
                <p className="text-gray-300 leading-relaxed break-words" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
                  {i18n.language === 'ar' && font.description_ar ? font.description_ar : font.description}
                </p>
              </div>
            )}

            {/* Additional Info */}
          {/*  <div className="flex flex-wrap gap-4 text-sm">
              {font.supported_languages && (
                <div className="flex items-center gap-2 text-gray-400">
                  <span className="text-gray-500">{i18n.language === 'ar' ? 'اللغات:' : 'Languages:'}</span>
                  <span className="text-white">{font.supported_languages}</span>
                </div>
              )}
              {font.license_type && (
                <div className="flex items-center gap-2 text-gray-400">
                  <span className="text-gray-500">{i18n.language === 'ar' ? 'الترخيص:' : 'License:'}</span>
                  <span className="text-white">{font.license_type}</span>
                </div>
              )}
            </div>*/}

            {/* Download Section */}
            <div className="gradient-border-analysis rounded-2xl p-6 border border-[#00c48c]/20">
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <Download size={20} className="text-[#00c48c]" />
                {i18n.language === 'ar' ? 'تحميل الخط' : 'Download Font'}
              </h3>

              {/* Full Package Download */}
              {font.storage_url && (
                <button
                  onClick={() => handleDownload()}
                  disabled={downloading}
                  className="w-full mb-4 py-4 rounded-xl bg-gradient-to-r from-[#00c48c] to-[#00e0a0] text-black font-bold text-lg flex items-center justify-center gap-3 hover:shadow-lg hover:shadow-[#00c48c]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {downloading ? (
                    <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  ) : (
                    <Download size={20} />
                  )}
                  {i18n.language === 'ar' ? 'تحميل الحزمة الكاملة' : 'Download Full Package'}
                  {font.file_size > 0 && (
                    <span className="text-black/60 font-normal">({formatFileSize(font.file_size)})</span>
                  )}
                </button>
              )}

              {/* Variants */}
              {font.variants && font.variants.length > 0 && (
                <div>
                  <h4 className="text-gray-400 text-sm uppercase tracking-wider mb-3">
                    {i18n.language === 'ar' ? 'أو اختر وزن محدد' : 'Or choose a specific weight'}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {font.variants.map((variant) => (
                      <button
                        key={variant.variant_id}
                        onClick={() => handleDownload(variant.variant_id)}
                        disabled={downloading}
                        className="py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-between disabled:opacity-50"
                      >
                        <span>{variant.label}</span>
                        <span className="text-gray-500 text-xs">.{variant.file_format.toUpperCase()}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tags */}
            {font.tags && (
              <div className="flex flex-wrap gap-2">
                {font.tags.split(',').map((tag, index) => (
                  <span key={index} className="px-3 py-1 text-xs bg-white/5 border border-white/10 rounded-full text-gray-400">
                    #{tag.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Live Preview Section */}
        <div className="mt-12">
          <FontLivePreview 
            fontUrl={font.variants?.find(v => v.label.toLowerCase() === 'regular')?.storage_url || font.variants?.[0]?.storage_url || font.storage_url} 
            fontName={font.name}
            supportedLanguages={font.supported_languages}
          />
        </div>
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
                ? "لقد وصلت إلى حد التحميل أو ليس لديك اشتراك نشط للوصول لهذا الخط."
                : "You've reached your download limit or don't have an active subscription for this content.")}
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
}
