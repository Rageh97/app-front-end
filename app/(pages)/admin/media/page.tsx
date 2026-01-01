"use client";

import React, { useState, useEffect, useRef } from "react";
import axios from "@/utils/api";
import { Trash2, Edit, Upload, FolderPlus, Film, Image as ImageIcon, Plus, X, Eye, EyeOff, Pause, Play, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import useTusUpload, { formatBytes, calculateETA } from "@/hooks/useTusUpload";
import { finalizeMainFile, finalizePreviewVideo, finalizeVariant } from "@/utils/tusMediaUpload";

interface Category {
  category_id: number;
  name: string;
  description: string;
  cover_image_url?: string;
  filesCount?: number;
}

interface Variant {
  file: File | null;
  type: "image" | "video" | "prores" | "png_sequence" | "archive";
  label: string;
}

interface UploadQueueItem {
  id: string;
  file: File;
  type: "main" | "preview" | "variant";
  variantType?: Variant["type"];
  variantLabel?: string;
  status: "pending" | "uploading" | "processing" | "completed" | "error";
  progress: number;
  cloudProgress?: number;
  uploadId?: string;
  error?: string;
}

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText, 
  cancelText 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  title: string; 
  message: string; 
  confirmText: string; 
  cancelText: string;
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#190237] border border-white/10 w-full max-w-md rounded-2xl p-6 shadow-2xl scale-in-center">
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-white/60 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">{cancelText}</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 transition-colors font-bold">{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

const MediaAdminPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"categories" | "uploads">("categories");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMediaHubEnabled, setIsMediaHubEnabled] = useState(true);

  // Category Form
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [catCover, setCatCover] = useState<File | null>(null);

  // Files Management
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  const [categoryFiles, setCategoryFiles] = useState<any[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  // Deletion Modal State
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; type: 'category' | 'file' | null; id: number | null; }>({ isOpen: false, type: null, id: null });

  // Upload Form - TUS Based
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploadCategory, setUploadCategory] = useState("");
  const [mainFileType, setMainFileType] = useState<"video" | "image">("image");
  const [mainFile, setMainFile] = useState<File | null>(null);
  const [previewVideo, setPreviewVideo] = useState<File | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  
  // TUS Upload State
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [currentUploadIndex, setCurrentUploadIndex] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [uploadStartTime, setUploadStartTime] = useState<number>(0);
  const [createdFileId, setCreatedFileId] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  
  const tusUpload = useTusUpload();

  useEffect(() => {
    fetchCategories();
    fetchMediaHubSetting();
  }, []);

  const fetchMediaHubSetting = async () => {
    try {
      const res = await axios.get("/api/admin/settings/media_hub_enabled");
      setIsMediaHubEnabled(String(res.data.value) !== 'false');
    } catch (err) {
      console.error("Failed to fetch media hub setting", err);
    }
  };

  const toggleMediaHub = async () => {
    try {
      const newValue = !isMediaHubEnabled;
      await axios.put("/api/admin/settings/media_hub_enabled", { value: String(newValue) });
      setIsMediaHubEnabled(newValue);
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('settingsChanged', { detail: { key: 'media_hub_enabled', value: newValue } });
        window.dispatchEvent(event);
      }
      toast.success(newValue ? "تم إظهار مكتبة الميديا" : "تم إخفاء مكتبة الميديا");
    } catch (err) {
      console.error(err);
      toast.error(t('mediaAdmin.failedOperation'));
    }
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/media/categories");
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- Category Handlers ---
  const handleCreateOrUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("name", catName);
      formData.append("description", catDesc);
      if (catCover) formData.append("coverImage", catCover);

      if (editingCatId) {
        await axios.put(`/api/media/categories/${editingCatId}`, formData, { headers: { "Content-Type": "multipart/form-data" } });
        toast.success(t('mediaAdmin.successUpdated'));
      } else {
        await axios.post("/api/media/categories", formData, { headers: { "Content-Type": "multipart/form-data" } });
        toast.success(t('mediaAdmin.successCreated'));
      }
      setCatName(""); setCatDesc(""); setCatCover(null); setEditingCatId(null);
      fetchCategories();
    } catch (err) {
      toast.error(t('mediaAdmin.failedOperation'));
    }
  };

  const handleEditCategory = (cat: Category) => { setEditingCatId(cat.category_id); setCatName(cat.name); setCatDesc(cat.description); };
  const handleCancelEdit = () => { setEditingCatId(null); setCatName(""); setCatDesc(""); };

  const handleDeleteCategory = async (id: number) => {
    try {
      await axios.delete(`/api/media/categories/${id}`);
      fetchCategories();
      toast.success(t('mediaAdmin.successDeleted'));
      if (selectedCatId === id) setSelectedCatId(null);
    } catch (err) {
      toast.error(t('mediaAdmin.failedDelete'));
    }
    setDeleteModal({ isOpen: false, type: null, id: null });
  };

  // --- Files Handlers ---
  const handleViewFiles = async (categoryId: number) => {
    setSelectedCatId(categoryId);
    setLoadingFiles(true);
    try {
      const res = await axios.get(`/api/media/files/${categoryId}`);
      setCategoryFiles(res.data);
    } catch (err) {
      console.error(err);
      toast.error(t('mediaAdmin.failedOperation'));
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    try {
      await axios.delete(`/api/media/files/${fileId}`);
      toast.success(t('mediaAdmin.successFileDeleted'));
      if (selectedCatId) handleViewFiles(selectedCatId);
      fetchCategories();
    } catch (err) {
      toast.error(t('mediaAdmin.failedDeleteFile'));
    }
    setDeleteModal({ isOpen: false, type: null, id: null });
  };

  const openDeleteModal = (type: 'category' | 'file', id: number) => { setDeleteModal({ isOpen: true, type, id }); };

  // --- TUS Upload Handlers ---
  const handleMainFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setMainFile(e.target.files[0]);
  };

  const addVariant = (label = "", type: Variant['type'] = "image") => {
    const finalType = type || (mainFileType as Variant['type']);
    setVariants([...variants, { file: null, type: finalType, label }]);
  };

  const removeVariant = (index: number) => {
    const newVars = [...variants];
    newVars.splice(index, 1);
    setVariants(newVars);
  };

  const updateVariant = (index: number, field: keyof Variant, value: any) => {
    const newVars = [...variants];
    (newVars[index] as any)[field] = value;
    setVariants(newVars);
  };

  // Build upload queue from selected files
  const buildUploadQueue = (): UploadQueueItem[] => {
    const queue: UploadQueueItem[] = [];
    
    if (mainFile) {
      queue.push({ id: `main-${Date.now()}`, file: mainFile, type: "main", status: "pending", progress: 0 });
    }
    
    if (previewVideo) {
      queue.push({ id: `preview-${Date.now()}`, file: previewVideo, type: "preview", status: "pending", progress: 0 });
    }
    
    variants.forEach((v, idx) => {
      if (v.file) {
        queue.push({
          id: `variant-${idx}-${Date.now()}`,
          file: v.file,
          type: "variant",
          variantType: v.type,
          variantLabel: v.label || v.type.toUpperCase(),
          status: "pending",
          progress: 0,
        });
      }
    });
    
    return queue;
  };

  // Process single upload item
  const processUploadItem = async (item: UploadQueueItem, fileId: number | null): Promise<number | null> => {
    return new Promise(async (resolve, reject) => {
      try {
        // Update status to uploading
        setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: "uploading" as const } : q));

        // Start TUS upload
        const uploadId = await tusUpload.startUpload(item.file, {
          onProgress: (progress) => {
            setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, progress: progress.percentage } : q));
          },
          metadata: {
            uploadType: item.type,
            variantType: item.variantType || "",
            variantLabel: item.variantLabel || "",
          },
        });

        // Update status to processing
        setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: "processing" as const, uploadId } : q));

        // Polling for cloud sync progress
        const pollInterval = setInterval(async () => {
          try {
            const res = await axios.get(`/api/tus/status/${uploadId}`);
            if (res.data?.cloudProgress !== undefined) {
              setUploadQueue(prev => prev.map(q => q.id === item.id ? { 
                ...q, 
                cloudProgress: res.data.cloudProgress 
              } : q));
            }
          } catch (e) {
            // Silently ignore polling errors
          }
        }, 2000);

        // Finalize based on type
        try {
          let result;
          if (item.type === "main") {
            result = await finalizeMainFile({
              uploadId,
              categoryId: uploadCategory,
              title: uploadTitle,
              description: uploadDesc,
              mainFileType,
            });
          } else if (item.type === "preview" && fileId) {
            result = await finalizePreviewVideo({ uploadId, parentFileId: fileId });
          } else if (item.type === "variant" && fileId) {
            result = await finalizeVariant({
              uploadId,
              parentFileId: fileId,
              variantType: item.variantType || "video",
              variantLabel: item.variantLabel || "VARIANT",
            });
          }

          // If the server returned "processing", we need to wait for cloud sync to finish
          if (result && result.status === "processing") {
            await new Promise<void>((resolve, reject) => {
              const checkStatus = async () => {
                try {
                  const statusRes = await axios.get(`/api/tus/status/${uploadId}`);
                  if (statusRes.data?.status === "completed") {
                    setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: "completed" as const, cloudProgress: 100 } : q));
                    clearInterval(pollInterval);
                    clearInterval(statusTimer);
                    resolve();
                  } else if (statusRes.data?.status === "error") {
                    clearInterval(pollInterval);
                    clearInterval(statusTimer);
                    reject(new Error(statusRes.data.errorMessage || "Cloud sync failed"));
                  }
                } catch (e) {
                  // Keep trying on network errors
                }
              };
              const statusTimer = setInterval(checkStatus, 3000);
            });
          } else {
            setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: "completed" as const, cloudProgress: 100 } : q));
            clearInterval(pollInterval);
          }
          
          resolve(result?.fileId || fileId);
        } catch (err) {
          clearInterval(pollInterval);
          throw err;
        }
      } catch (err: any) {
        console.error(`Upload error for ${item.id}:`, err);
        setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: "error" as const, error: err.message } : q));
        reject(err);
      }
    });
  };

  // Main upload handler
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mainFile || !uploadCategory) {
      toast.error("يرجى اختيار ملف رئيسي وتصنيف");
      return;
    }

    const queue = buildUploadQueue();
    if (queue.length === 0) {
      toast.error("لا توجد ملفات للرفع");
      return;
    }

    setUploadQueue(queue);
    setIsUploading(true);
    setCurrentUploadIndex(0);
    setOverallProgress(0);
    setUploadStartTime(Date.now());
    setCreatedFileId(null);

    let fileId: number | null = null;

    try {
      for (let i = 0; i < queue.length; i++) {
        if (isPaused) {
          // Wait for resume
          await new Promise<void>((resolve) => {
            const checkPause = setInterval(() => {
              if (!isPaused) { clearInterval(checkPause); resolve(); }
            }, 500);
          });
        }

        setCurrentUploadIndex(i);
        const item = queue[i];
        
        fileId = await processUploadItem(item, fileId);
        if (item.type === "main" && fileId) {
          setCreatedFileId(fileId);
        }

        // Update overall progress
        setOverallProgress(Math.round(((i + 1) / queue.length) * 100));
      }

      toast.success(t('mediaAdmin.successUpload'));
      
      // Reset form
      setUploadTitle("");
      setUploadDesc("");
      setMainFile(null);
      setPreviewVideo(null);
      setVariants([]);
      setUploadQueue([]);
      fetchCategories();
      
    } catch (err: any) {
      console.error("Upload failed:", err);
      toast.error(t('mediaAdmin.failedUpload') + " " + (err.message || ""));
    } finally {
      setIsUploading(false);
      setOverallProgress(0);
      setCurrentUploadIndex(0);
    }
  };

  const handlePauseResume = () => {
    if (isPaused) {
      setIsPaused(false);
      tusUpload.resumeUpload();
    } else {
      setIsPaused(true);
      tusUpload.pauseUpload();
    }
  };

  const handleCancelUpload = () => {
    tusUpload.cancelUpload();
    setIsUploading(false);
    setUploadQueue([]);
    setOverallProgress(0);
    setIsPaused(false);
    toast.success("تم إلغاء الرفع");
  };

  // Prevent page close during upload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isUploading) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isUploading]);

  // Calculate total size
  const getTotalSize = () => {
    let total = 0;
    if (mainFile) total += mainFile.size;
    if (previewVideo) total += previewVideo.size;
    variants.forEach(v => { if (v.file) total += v.file.size; });
    return total;
  };

  return (
    <div className="p-6 min-h-screen text-white dark:text-gray-200">
      {/* Professional TUS Upload Progress Overlay */}
      {isUploading && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#190237] border border-orange/30 w-full max-w-2xl rounded-[2rem] p-10 shadow-[0_0_100px_rgba(255,119,2,0.2)] overflow-hidden relative">
            {/* Background Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-orange/20 blur-[80px] rounded-full"></div>
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#00c48c]/20 blur-[80px] rounded-full"></div>

            <div className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 bg-orange/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <Upload size={36} className="text-orange" />
              </div>
              
              <h3 className="text-2xl font-black mb-2 tracking-tight">
                {isPaused ? "⏸️ متوقف مؤقتاً" : (uploadQueue[currentUploadIndex]?.status === "processing" ? "جاري المزامنة  " : "جاري الرفع...")}
              </h3>
              <p className="text-white/40 text-sm mb-4 font-medium">{uploadTitle || "ملف ميديا"}</p>
              
              {/* Current file info */}
              <div className="w-full bg-black/30 rounded-xl p-4 mb-6 border border-white/10">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-white/60">الملف الحالي ({currentUploadIndex + 1}/{uploadQueue.length})</span>
                  <span className="text-xs text-orange font-bold">{formatBytes(getTotalSize())}</span>
                </div>
                <p className="text-sm font-medium truncate">{uploadQueue[currentUploadIndex]?.file.name || "-"}</p>
                <div className="flex gap-2 mt-2">
                  {uploadQueue.map((item, idx) => (
                    <div key={item.id} className={`h-2 flex-1 rounded-full ${
                      item.status === "completed" ? "bg-green-500" :
                      item.status === "uploading" ? "bg-orange animate-pulse" :
                      item.status === "error" ? "bg-red-500" :
                      "bg-white/20"
                    }`} />
                  ))}
                </div>
              </div>

              {/* Progress Container */}
              <div className="w-full space-y-4">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-orange text-shadow-glow">
                    {uploadQueue[currentUploadIndex]?.status === "processing" 
                      ? "جاري المزامنة  (Stage 2)..." 
                      : (tusUpload.isPaused ? "الرفع متوقف" : "رفع خارق للملفات الكبيرة")}
                  </span>
                  <span className="text-3xl font-black text-white">
                    {uploadQueue[currentUploadIndex]?.status === "processing"
                      ? (uploadQueue[currentUploadIndex]?.cloudProgress && uploadQueue[currentUploadIndex]?.cloudProgress > 0 
                          ? `${uploadQueue[currentUploadIndex]?.cloudProgress}%` 
                          : "جاري الرفع إلى Bunny...")
                      : `${tusUpload.progress.percentage}%`}
                  </span>
                </div>
                
                <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden p-1 border border-white/10">
                  <div 
                    className={`h-full bg-gradient-to-r from-orange via-orange to-[#00c48c] rounded-full transition-all duration-300 ease-out shadow-[0_0_20px_rgba(255,119,2,0.4)] ${
                      uploadQueue[currentUploadIndex]?.status === "processing" ? "animate-pulse shadow-[0_0_15px_rgba(255,119,2,0.6)]" : ""
                    }`}
                    style={{ 
                      width: uploadQueue[currentUploadIndex]?.status === "processing" 
                        ? (uploadQueue[currentUploadIndex]?.cloudProgress ? `${uploadQueue[currentUploadIndex]?.cloudProgress}%` : "100%")
                        : `${tusUpload.progress.percentage}%` 
                    }}
                  ></div>
                </div>
                
                <div className="flex justify-between items-center text-[10px] text-white/40 uppercase tracking-wider font-bold">
                  <span>
                    {uploadQueue[currentUploadIndex]?.status === "processing"
                      ? "يتم الآن نقل ملفك إلى  Bunny CDN..."
                      : `${formatBytes(tusUpload.progress.bytesUploaded)} / ${formatBytes(tusUpload.progress.bytesTotal)}`}
                  </span>
                  <span>
                    {uploadQueue[currentUploadIndex]?.status === "processing"
                      ? "يرجى الانتظار، السيرفر يعمل على ملفك"
                      : (uploadStartTime ? calculateETA(tusUpload.progress.bytesUploaded, tusUpload.progress.bytesTotal, uploadStartTime) : "")}
                  </span>
                </div>

                {/* Control Buttons */}
                <div className="flex gap-3 justify-center pt-4">
                  <button onClick={handlePauseResume} className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${isPaused ? "bg-[#00c48c]" : "bg-orange hover:bg-yellow-600"}`}>
                    {isPaused ? <><Play size={18} /> استئناف</> : <><Pause size={18} /> إيقاف مؤقت</>}
                  </button>
                  <button onClick={handleCancelUpload} className="px-3 py-2 rounded-xl bg-red border border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white font-bold flex items-center gap-2 transition-all">
                    <X size={18} /> إلغاء
                  </button>
                </div>

                {/* <p className="text-center text-[10px] text-orange uppercase tracking-[0.2em] pt-2">
                  ✨ يمكنك إيقاف الرفع واستئنافه لاحقاً - الملفات الكبيرة مدعومة
                </p> */}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold">{t('mediaAdmin.pageTitle')}</h1>
        <button onClick={toggleMediaHub} className={`px-4 py-2 rounded-lg font-bold transition-all transform hover:scale-105 flex items-center gap-2 shadow-lg ${isMediaHubEnabled ? 'bg-red-500/10 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-green-500/10 border border-green-500/50 text-green-500 hover:bg-green-500 hover:text-white'}`}>
          {isMediaHubEnabled ? <EyeOff size={18} /> : <Eye size={18} />}
          <span>{isMediaHubEnabled ? "إخفاء المكتبة من الموقع" : "إظهار المكتبة في الموقع"}</span>
        </button>
      </div>
      
      <div className="flex gap-4 mb-8">
        <button onClick={() => setActiveTab("categories")} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${activeTab === "categories" ? "bg-orange text-white inner-shadow" : "bg-[#190237] text-white"}`}>
          <FolderPlus size={18} /> {t('mediaAdmin.categoriesTab')}
        </button>
        <button onClick={() => setActiveTab("uploads")} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${activeTab === "uploads" ? "bg-orange text-white inner-shadow" : "bg-[#190237] text-white"}`}>
          <Upload size={18} /> {t('mediaAdmin.uploadsTab')}
        </button>
      </div>

      {activeTab === "categories" && (
        <div className="grid md:grid-cols-1 gap-8">
          <div className="bg-[#190237] p-6 rounded-xl shadow-lg h-fit">
            <h2 className="text-xl font-semibold mb-4">{editingCatId ? t('mediaAdmin.editCategory') : t('mediaAdmin.addCategory')}</h2>
            <form onSubmit={handleCreateOrUpdateCategory} className="flex flex-col gap-4">
              <input type="text" placeholder={t('mediaAdmin.categoryName')} className="p-3 rounded-lg border border-[#00c48c] bg-white text-black" value={catName} onChange={(e) => setCatName(e.target.value)} required />
              <textarea placeholder={t('mediaAdmin.description')} className="p-3 rounded-lg border border-[#00c48c] bg-white text-black" value={catDesc} onChange={(e) => setCatDesc(e.target.value)} />
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold opacity-70 text-white">رفع صورة التصنيف</label>
                <input type="file" accept="image/*" onChange={(e) => setCatCover(e.target.files?.[0] || null)} className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-orange/10 file:text-orange hover:file:bg-orange/20" />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-orange hover:bg-orange/80 text-white font-bold py-2 rounded-lg transition">{editingCatId ? t('mediaAdmin.update') : t('mediaAdmin.create')}</button>
                {editingCatId && <button type="button" onClick={handleCancelEdit} className="bg-gray-500 text-white px-4 py-2 rounded-lg">{t('mediaAdmin.cancel')}</button>}
              </div>
            </form>
          </div>

          <div className="bg-[#190237] p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4">{t('mediaAdmin.existingCategories')}</h2>
            {loading ? <p>{t('common.loading')}</p> : (
              <div className="space-y-3 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {categories.map(cat => (
                  <div key={cat.category_id} className={`flex flex-col p-2.5 bg-white text-black rounded-xl shadow-sm cursor-pointer transition-all hover:shadow-md ${selectedCatId === cat.category_id ? 'ring-2 ring-orange scale-[1.02]' : ''}`} onClick={() => handleViewFiles(cat.category_id)}>
                    <div className="mb-2">
                      <h4 className="font-bold text-sm truncate">{cat.name}</h4>
                      <p className="text-[10px] opacity-60 truncate">{cat.description || '-'}</p>
                    </div>
                    <div className="flex justify-between items-center mt-auto pt-2 border-t border-gray-100">
                      <span className="text-[10px] bg-orange/10 text-orange px-1.5 py-0.5 rounded-md font-medium">{cat.filesCount || 0}</span>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => handleEditCategory(cat)} className="text-blue-500 hover:bg-blue-50 p-1 rounded transition-colors"><Edit size={14} /></button>
                        <button onClick={() => openDeleteModal('category', cat.category_id)} className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </div>
                ))}
                {categories.length === 0 && <p className="opacity-50 text-white col-span-full">{t('mediaAdmin.noCategories')}</p>}
              </div>
            )}
          </div>

          {/* Files List Section */}
          {selectedCatId && (
            <div className="bg-[#190237] p-6 rounded-xl shadow-lg mt-4 animate-in fade-in slide-in-from-top-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Film size={18} className="text-orange" />
                  <span className="opacity-60">{t('mediaAdmin.filesInCategory')}:</span>
                  <span className="text-white">{categories.find(c => c.category_id === selectedCatId)?.name}</span>
                </h2>
                <button onClick={() => setSelectedCatId(null)} className="text-gray-400 hover:text-white bg-white/5 p-1.5 rounded-lg transition-colors"><X size={20} /></button>
              </div>

              {loadingFiles ? (
                <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange"></div></div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                  {categoryFiles.map((file) => (
                    <div key={file.file_id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden group hover:border-orange/50 transition-all hover:shadow-xl">
                      <div className="aspect-[4/3] relative bg-black/40 flex items-center justify-center">
                        {file.type === 'video' ? <Film size={28} className="text-orange/40" /> : <ImageIcon size={28} className="text-orange/40" />}
                        {file.thumbnail_url && <img src={file.thumbnail_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <button onClick={() => openDeleteModal('file', file.file_id)} className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transform scale-90 group-hover:scale-100 transition-transform shadow-lg" title={t('mediaAdmin.deleteFile')}><Trash2 size={16} /></button>
                        </div>
                      </div>
                      <div className="p-2 bg-black/20">
                        <h4 className="font-medium text-[10px] truncate mb-0.5">{file.title}</h4>
                        <p className="text-[9px] text-white/40 uppercase tracking-tight">{file.type === 'video' ? t('mediaAdmin.video') : t('mediaAdmin.image')}</p>
                      </div>
                    </div>
                  ))}
                  {categoryFiles.length === 0 && (
                    <div className="col-span-full py-16 text-center text-white/20 flex flex-col items-center gap-2">
                      <ImageIcon size={40} className="opacity-10" />
                      <p className="text-sm italic">{t('mediaAdmin.noFilesInCategory')}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal 
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, type: null, id: null })}
        onConfirm={() => {
          if (deleteModal.type === 'category' && deleteModal.id) handleDeleteCategory(deleteModal.id);
          if (deleteModal.type === 'file' && deleteModal.id) handleDeleteFile(deleteModal.id);
        }}
        title={deleteModal.type === 'category' ? t('mediaAdmin.deleteConfirm') : t('mediaAdmin.deleteFile')}
        message={deleteModal.type === 'category' ? t('mediaAdmin.deleteConfirm') : t('mediaAdmin.deleteFileConfirm')}
        confirmText={t('admin.delete')}
        cancelText={t('mediaAdmin.cancel')}
      />

      {activeTab === "uploads" && (
        <div className="max-w-5xl mx-auto bg-[#190237] p-8 rounded-xl shadow-lg">
          {/* TUS Feature Banner */}
          {/* <div className="bg-gradient-to-r from-orange/20 to-[#00c48c]/20 border border-orange/30 rounded-xl p-4 mb-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-orange/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Upload size={24} className="text-orange" />
            </div>
            <div>
              <h3 className="font-bold text-white">رفع احترافي للملفات الكبيرة</h3>
              <p className="text-sm text-white/60">يدعم الملفات الضخمة (ProRes, 4K+) مع إمكانية الإيقاف والاستئناف تلقائياً</p>
            </div>
          </div> */}

          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white"><Upload /> {t('mediaAdmin.uploadNewMedia')}</h2>
          <form onSubmit={handleUpload} className="space-y-6">
            
            {/* Metadata */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-medium text-white">{t('mediaAdmin.selectCategory')}</label>
                <select className="w-full p-3 rounded-lg border border-[#00c48c] bg-white text-black" value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value)} required>
                  <option value="">{t('mediaAdmin.chooseCategory')}</option>
                  {categories.map(cat => <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block mb-2 font-medium text-white">{t('mediaAdmin.title')}</label>
                <input type="text" className="w-full p-3 rounded-lg border border-[#00c48c] bg-white text-black" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} required />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="border border-orange/30 bg-orange/5 p-4 rounded-lg">
                <h3 className="font-bold mb-3 flex items-center gap-2 text-white"><ImageIcon size={18} /> {t('mediaAdmin.mainFile')}</h3>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <label className={`cursor-pointer border p-2 rounded-lg flex flex-col items-center gap-1 ${mainFileType === 'image' ? 'border-orange bg-orange/20' : 'border-gray-500'}`}>
                    <input type="radio" name="mainType" value="image" className="hidden" checked={mainFileType === 'image'} onChange={() => setMainFileType('image')} />
                    <span className="text-sm text-white">{t('mediaAdmin.image')}</span>
                  </label>
                  <label className={`cursor-pointer border p-2 rounded-lg flex flex-col items-center gap-1 ${mainFileType === 'video' ? 'border-orange bg-orange/20' : 'border-gray-500'}`}>
                    <input type="radio" name="mainType" value="video" className="hidden" checked={mainFileType === 'video'} onChange={() => setMainFileType('video')} />
                    <span className="text-sm text-white">{t('mediaAdmin.video')}</span>
                  </label>
                </div>
                <input type="file" accept={mainFileType === 'video' ? 'video/*,.mov,.prores,.mxf,.zip,.rar,.7z' : 'image/*,.zip,.rar,.7z'} onChange={handleMainFileChange} required className="w-full text-sm text-white" />
                {mainFile && <p className="text-xs text-orange mt-2">📁 {mainFile.name} ({formatBytes(mainFile.size)})</p>}
              </div>

              <div className="border border-[#00c48c]/30 bg-[#00c48c]/5 p-4 rounded-lg">
                <h3 className="font-bold mb-3 flex items-center gap-2 text-white"><Film size={18} /> Hover Video Preview</h3>
                <input type="file" accept="video/*" onChange={(e) => setPreviewVideo(e.target.files?.[0] || null)} className="w-full text-sm text-white mt-10" />
                {previewVideo && <p className="text-xs text-[#00c48c] mt-2">📁 {previewVideo.name} ({formatBytes(previewVideo.size)})</p>}
              </div>
            </div>

            {/* Variants */}
            <div className="space-y-3">
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <label className="font-medium text-white">{t('mediaAdmin.variants')}</label>
                </div>

                {/* Format Presets */}
                <div className="flex flex-wrap gap-2 items-center bg-black/30 p-3 rounded-lg border border-white/10">
                  <span className="text-xs text-white/60 font-medium">{t('mediaAdmin.quickAdd')}</span>
                  <button type="button" onClick={() => addVariant("4K PRORES", "prores")} className="text-[10px] bg-orange/20 hover:bg-orange/40 text-orange px-2 py-1 rounded border border-orange/30 transition font-bold">+ PRORES</button>
                  <button type="button" onClick={() => addVariant("MP4 (PREVIEW)", "video")} className="text-[10px] bg-white/20 hover:bg-white/40 text-white px-2 py-1 rounded border border-white/20 transition font-bold">+ MP4</button>
                  <button type="button" onClick={() => addVariant("PNG SEQUENCE", "png_sequence")} className="text-[10px] bg-[#00c48c20] hover:bg-[#00c48c40] text-[#00c48c] px-2 py-1 rounded border border-[#00c48c20] transition font-bold">+ PNG SEQ.</button>
                  <button type="button" onClick={() => addVariant("MOV", "video")} className="text-[10px] bg-[#00c48c20] hover:bg-[#00c48c40] text-[#00c48c] px-2 py-1 rounded border border-[#00c48c20] transition font-bold">+ MOV</button>
                </div>
              </div>

              {variants.length === 0 && (
                <div className="text-center p-6 border border-dashed border-[#00c48c] rounded-lg text-gray-400 text-sm">{t('mediaAdmin.noVariants')}</div>
              )}
              
              {variants.map((v, idx) => (
                <div key={idx} className="flex gap-3 items-end bg-black/20 p-3 rounded-lg border border-gray-700">
                  <div className="flex-1">
                    <label className="text-xs block mb-1 opacity-70 text-white">{t('mediaAdmin.label')}</label>
                    <input type="text" className="w-full p-2 text-sm rounded bg-white text-black border-none focus:ring-1 focus:ring-orange" value={v.label} onChange={(e) => updateVariant(idx, 'label', e.target.value)} placeholder="e.g. 4K" />
                  </div>
                  <div className="w-24">
                    <label className="text-xs block mb-1 opacity-70 text-white">{t('mediaAdmin.type')}</label>
                    <select className="w-full p-2 text-sm rounded bg-white text-black border-none focus:ring-1 focus:ring-orange" value={v.type} onChange={(e) => updateVariant(idx, 'type', e.target.value as Variant['type'])}>
                      <option value="video">{t('mediaAdmin.video')}</option>
                      <option value="image">{t('mediaAdmin.image')}</option>
                      <option value="prores">PRORES</option>
                      <option value="png_sequence">PNG SEQ.</option>
                      <option value="archive">ZIP/RAR</option>
                    </select>
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="text-xs block mb-1 opacity-70 text-white">{t('mediaAdmin.file')} {v.file ? `(${formatBytes(v.file.size)})` : ''}</label>
                    <input type="file" accept={v.type === 'video' || v.type === 'prores' ? 'video/*,.mov,.prores,.mxf,.zip,.rar,.7z' : 'image/*,.zip,.rar,.7z'} className="w-full text-xs text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-orange/10 file:text-orange hover:file:bg-orange/20" onChange={(e) => updateVariant(idx, 'file', e.target.files ? e.target.files[0] : null)} />
                  </div>
                  <button type="button" onClick={() => removeVariant(idx)} className="text-red-400 hover:text-red-600 p-2 bg-red-400/10 hover:bg-red-400/20 rounded-lg transition"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>

            {/* Total Size Display */}
            {getTotalSize() > 0 && (
              <div className="bg-black/30 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                <span className="text-white/60">إجمالي حجم الملفات:</span>
                <span className="text-xl font-bold text-orange">{formatBytes(getTotalSize())}</span>
              </div>
            )}

            <button disabled={isUploading} className="w-full bg-orange hover:bg-orange/80 text-white font-bold py-3 rounded-lg flex justify-center items-center gap-2 disabled:opacity-50">
              {isUploading ? t('mediaAdmin.uploading') : <><Upload size={20} /> {t('mediaAdmin.uploadEverything')}</>}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default MediaAdminPage;
