"use client";

import React, { useState, useEffect, useRef } from "react";
import axios from "@/utils/api";
import { Trash2, Edit, Upload, FolderPlus, Film, Image as ImageIcon, Plus, X, Eye, EyeOff, Pause, Play, AlertCircle, Download, Layers } from "lucide-react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import useTusUpload, { formatBytes, calculateETA } from "@/hooks/useTusUpload";
import { finalizeMainFile, finalizePreviewVideo, finalizeVariant, updateMainFile } from "@/utils/tusMediaUpload";

interface HeroCategory {
  hero_category_id: number;
  name: string;
  description: string;
  type?: 'visual' | 'audio';
  cover_image_url?: string;
  subCategories?: Category[];
}

interface Category {
  category_id: number;
  name: string;
  description: string;
  cover_image_url?: string;
  filesCount?: number;
  hero_category_id?: number | null;
}

interface Variant {
  file: File | null;
  type: "image" | "video" | "audio" | "prores" | "png_sequence" | "archive";
  label: string;
  title?: string;
  isIndependent?: boolean;
}

interface ExistingVariant {
  variant_id: number;
  file_type: string;
  label: string;
  storage_url: string;
  size: number;
  extension: string;
}

interface MediaFileData {
  file_id: number;
  title: string;
  description: string;
  file_type: string;
  storage_url: string;
  thumbnail_url: string;
  preview_video_url?: string;
  category_id: number;
  variants: ExistingVariant[];
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
  title?: string; // Added for bulk uploads
  description?: string; // Added for bulk uploads
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 animate-in fade-in duration-200 font-cairo">
      <div className="bg-[#0F121C] border border-white/10 w-full max-w-md rounded-lg p-5">
        <h3 className="text-base font-bold text-emerald-400 mb-2">{title}</h3>
        <p className="text-slate-400 text-xs mb-5 leading-relaxed">{message}</p>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-3.5 py-1.5 rounded-md text-xs bg-white/5 text-slate-300 hover:bg-white/10 transition-colors">{cancelText}</button>
          <button onClick={onConfirm} className="px-3.5 py-1.5 rounded-md text-xs bg-red-600 hover:bg-red-500 text-white transition-colors font-bold">{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

const MediaAdminPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"hero" | "categories" | "uploads" | "banner" | "analytics">("hero");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMediaHubEnabled, setIsMediaHubEnabled] = useState(true);

  // Hero Categories State
  const [heroCategories, setHeroCategories] = useState<HeroCategory[]>([]);
  const [loadingHero, setLoadingHero] = useState(false);
  const [editingHeroId, setEditingHeroId] = useState<number | null>(null);
  const [heroName, setHeroName] = useState("");
  const [heroDesc, setHeroDesc] = useState("");
  const [heroCover, setHeroCover] = useState<File | null>(null);
  const [heroType, setHeroType] = useState<"visual" | "audio">("visual");

  // Analytics State
  const [analytics, setAnalytics] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Banner State
  const [banners, setBanners] = useState<any[]>([]);
  const [loadingBanners, setLoadingBanners] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>("");
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Category Form
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [catCover, setCatCover] = useState<File | null>(null);
  const [selectedHeroId, setSelectedHeroId] = useState<number | null>(null);

  // Files Management
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  const [categoryFiles, setCategoryFiles] = useState<any[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  // Deletion Modal State
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; type: 'hero' | 'category' | 'file' | 'variant' | null; id: number | null; }>({ isOpen: false, type: null, id: null });

  // Edit File Modal State
  const [editFileModal, setEditFileModal] = useState<{ isOpen: boolean; file: MediaFileData | null }>({ isOpen: false, file: null });
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null);
  const [savingFile, setSavingFile] = useState(false);
  
  // New Variant in Edit Modal
  const [newVariantsToUpload, setNewVariantsToUpload] = useState<Variant[]>([]);
  const [uploadingNewVariant, setUploadingNewVariant] = useState(false);
  const [newVariantProgress, setNewVariantProgress] = useState(0);
  const [currentUploadingVariantIndex, setCurrentUploadingVariantIndex] = useState(-1);

  // File Replacements
  const [newMainFile, setNewMainFile] = useState<File | null>(null);
  const [newPreviewFile, setNewPreviewFile] = useState<File | null>(null);
  const [filesUpdateProgress, setFilesUpdateProgress] = useState(0);
  const [isUpdatingFiles, setIsUpdatingFiles] = useState(false);

  // Upload Form - TUS Based
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploadCategory, setUploadCategory] = useState("");
  const [mainFileType, setMainFileType] = useState<"video" | "image" | "audio">("image");
  const [mainFiles, setMainFiles] = useState<File[]>([]); // Changed to support bulk
  const [bulkMetadata, setBulkMetadata] = useState<{title: string, description: string}[]>([]);
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
  
  // Filtering states
  const [filterHeroId, setFilterHeroId] = useState<number | null>(null);
  const [uploadHeroId, setUploadHeroId] = useState<number | null>(null);
  
  const bulkVariantInputRef = useRef<HTMLInputElement>(null);
  const editBulkVariantInputRef = useRef<HTMLInputElement>(null);
  
  const tusUpload = useTusUpload();

  useEffect(() => {
    fetchHeroCategories();
    fetchCategories();
    fetchMediaHubSetting();
    fetchBanners();
    fetchAnalytics();
  }, []);

  const fetchHeroCategories = async () => {
    setLoadingHero(true);
    try {
      const res = await axios.get("/api/media/hero-categories");
      setHeroCategories(res.data);
    } catch (err) {
      console.error(err);
      toast.error("فشل في تحميل المجموعات");
    } finally {
      setLoadingHero(false);
    }
  };

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

  // --- Banner Handlers ---
  const fetchBanners = async () => {
    setLoadingBanners(true);
    try {
      const res = await axios.get("/api/media/banners");
      setBanners(res.data);
    } catch (err) {
      console.error(err);
      toast.error("فشل في تحميل البانرات");
    } finally {
      setLoadingBanners(false);
    }
  };

  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const res = await axios.get("/api/media/admin/analytics");
      setAnalytics(res.data);
    } catch (err) {
      console.error(err);
      toast.error("فشل في تحميل الإحصائيات");
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleUploadBanner = async () => {
    if (!bannerFile) {
      toast.error("يرجى اختيار صورة أو فيديو للبانر");
      return;
    }

    setUploadingBanner(true);
    try {
      const formData = new FormData();
      formData.append("bannerMedia", bannerFile);
      formData.append("media_type", bannerFile.type.startsWith('video') ? 'video' : 'image');

      await axios.post("/api/media/banners", formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success("تم رفع البانر بنجاح");
      setBannerFile(null);
      setBannerPreview("");
      fetchBanners();
    } catch (err) {
      console.error(err);
      toast.error("فشل في رفع البانر");
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleDeleteBanner = async (bannerId: number) => {
    try {
      await axios.delete(`/api/media/banners/${bannerId}`);
      toast.success("تم حذف البانر بنجاح");
      fetchBanners();
    } catch (err) {
      console.error(err);
      toast.error("فشل في حذف البانر");
    }
  };

  const handleToggleBannerActive = async (bannerId: number, currentStatus: boolean) => {
    try {
      await axios.put(`/api/media/banners/${bannerId}`, {
        is_active: !currentStatus
      });
      toast.success(currentStatus ? "تم إخفاء البانر" : "تم تفعيل البانر");
      fetchBanners();
    } catch (err) {
      console.error(err);
      toast.error("فشل في تحديث حالة البانر");
    }
  };

  // --- Hero Category Handlers ---
  const handleCreateOrUpdateHero = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("name", heroName);
      formData.append("description", heroDesc);
      formData.append("type", heroType);
      if (heroCover) formData.append("coverImage", heroCover);

      if (editingHeroId) {
        await axios.put(`/api/media/hero-categories/${editingHeroId}`, formData, { headers: { "Content-Type": "multipart/form-data" } });
        toast.success("تم تحديث المجموعة بنجاح");
      } else {
        await axios.post("/api/media/hero-categories", formData, { headers: { "Content-Type": "multipart/form-data" } });
        toast.success("تم إنشاء المجموعة بنجاح");
      }
      setHeroName(""); setHeroDesc(""); setHeroCover(null); setHeroType("visual"); setEditingHeroId(null);
      fetchHeroCategories();
    } catch (err) {
      console.error(err);
      toast.error(t('mediaAdmin.failedOperation'));
    }
  };

  const handleEditHero = (hero: HeroCategory) => {
      setEditingHeroId(hero.hero_category_id);
      setHeroName(hero.name);
      setHeroDesc(hero.description);
      setHeroType(hero.type || "visual");
  };
  
  const handleCancelEditHero = () => {
      setEditingHeroId(null);
      setHeroName("");
      setHeroDesc("");
      setHeroCover(null);
      setHeroType("visual");
  };

  const handleDeleteHero = async (id: number) => {
    try {
      await axios.delete(`/api/media/hero-categories/${id}`);
      fetchHeroCategories();
      toast.success(t('mediaAdmin.successDeleted'));
    } catch (err) {
      console.error(err);
      toast.error("فشل في حذف المجموعة");
    }
    setDeleteModal({ isOpen: false, type: null, id: null });
  };


  // --- Category Handlers ---
  const handleCreateOrUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("name", catName);
      formData.append("description", catDesc);
      if (selectedHeroId) formData.append("hero_category_id", selectedHeroId.toString());
      if (catCover) formData.append("coverImage", catCover);

      if (editingCatId) {
        await axios.put(`/api/media/categories/${editingCatId}`, formData, { headers: { "Content-Type": "multipart/form-data" } });
        toast.success(t('mediaAdmin.successUpdated'));
      } else {
        await axios.post("/api/media/categories", formData, { headers: { "Content-Type": "multipart/form-data" } });
        toast.success(t('mediaAdmin.successCreated'));
      }
      setCatName(""); setCatDesc(""); setCatCover(null); setEditingCatId(null); setSelectedHeroId(null);
      fetchCategories();
    } catch (err) {
      toast.error(t('mediaAdmin.failedOperation'));
    }
  };

  const handleEditCategory = (cat: Category) => { 
      setEditingCatId(cat.category_id); 
      setCatName(cat.name); 
      setCatDesc(cat.description); 
      setSelectedHeroId(cat.hero_category_id || null);
  };
  const handleCancelEdit = () => { setEditingCatId(null); setCatName(""); setCatDesc(""); setSelectedHeroId(null); };

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

  const openDeleteModal = (type: 'hero' | 'category' | 'file' | 'variant', id: number) => { setDeleteModal({ isOpen: true, type, id }); };

  // --- Edit File Handlers ---
  const handleOpenEditFile = async (fileId: number) => {
    try {
      const res = await axios.get(`/api/media/files/single/${fileId}`);
      const file = res.data;
      setEditFileModal({ isOpen: true, file });
      setEditTitle(file.title);
      setEditDesc(file.description || "");
      setEditCategoryId(file.category_id);
    } catch (err) {
      console.error(err);
      toast.error("فشل في تحميل بيانات الملف");
    }
  };

  const handleCloseEditFile = () => {
    setEditFileModal({ isOpen: false, file: null });
    setEditTitle("");
    setEditDesc("");
    setEditCategoryId(null);
    setNewVariantsToUpload([]);
    setNewVariantProgress(0);
    setCurrentUploadingVariantIndex(-1);
    setNewMainFile(null);
    setNewPreviewFile(null);
    setFilesUpdateProgress(0);
    setIsUpdatingFiles(false);
  };

  const handleSaveFileEdit = async () => {
    if (!editFileModal.file) return;
    setSavingFile(true);
    try {
      // 1. Update Metadata
      await axios.put(`/api/media/files/${editFileModal.file.file_id}`, {
        title: editTitle,
        description: editDesc,
        category_id: editCategoryId
      });

      // 2. Handle File Replacements if any
      if (newMainFile || newPreviewFile) {
        setIsUpdatingFiles(true);
        setFilesUpdateProgress(0);

        const totalUploads = (newMainFile ? 1 : 0) + (newPreviewFile ? 1 : 0);
        let completedUploads = 0;

        // Helper to update progress based on current file progress + completed files
        const updateOverallProgress = (currentFileProgress: number) => {
          const totalProgress = ((completedUploads * 100) + currentFileProgress) / totalUploads;
          setFilesUpdateProgress(Math.round(totalProgress));
        };

        // Upload Main File
        if (newMainFile) {
          const mainFileType = newMainFile.type.startsWith('video') ? 'video' : newMainFile.type.startsWith('audio') ? 'audio' : 'image';
          
          const uploadId = await tusUpload.startUpload(newMainFile, {
            onProgress: (progress) => updateOverallProgress(progress.percentage),
            metadata: {
              uploadType: "main_replacement",
              filename: newMainFile.name,
              filetype: newMainFile.type || "application/octet-stream", 
            }
          });

          await updateMainFile({
            uploadId,
            fileId: editFileModal.file.file_id,
            filename: newMainFile.name,
            mainFileType: mainFileType as any
          });
          
          completedUploads++;
        }

        // Upload Preview File
        if (newPreviewFile) {
          const uploadId = await tusUpload.startUpload(newPreviewFile, {
            onProgress: (progress) => updateOverallProgress(progress.percentage),
            metadata: {
              uploadType: "preview_replacement",
              filename: newPreviewFile.name,
              filetype: newPreviewFile.type || "application/octet-stream",
            }
          });

          await finalizePreviewVideo({
            uploadId,
            parentFileId: editFileModal.file.file_id,
            filename: newPreviewFile.name,
          });
          
          completedUploads++;
        }
      }

      toast.success("تم تحديث الملف بنجاح");
      handleCloseEditFile();
      if (selectedCatId) handleViewFiles(selectedCatId);
      fetchCategories();
    } catch (err: any) {
      console.error(err);
      toast.error("فشل في تحديث الملف: " + (err.message || ""));
    } finally {
      setSavingFile(false);
      setIsUpdatingFiles(false);
    }
  };

  const handleDeleteVariant = async (variantId: number) => {
    try {
      await axios.delete(`/api/media/variants/${variantId}`);
      toast.success("تم حذف الصيغة بنجاح");
      // Refresh the edit modal data
      if (editFileModal.file) {
        handleOpenEditFile(editFileModal.file.file_id);
      }
    } catch (err) {
      console.error(err);
      toast.error("فشل في حذف الصيغة");
    }
    setDeleteModal({ isOpen: false, type: null, id: null });
  };

  // Upload new variant to existing file
  const addNewVariantRow = (label = "", type: Variant['type'] = "video") => {
    setNewVariantsToUpload([...newVariantsToUpload, { file: null, type, label }]);
  };

  const removeNewVariantRow = (index: number) => {
    const updated = [...newVariantsToUpload];
    updated.splice(index, 1);
    setNewVariantsToUpload(updated);
  };

  const updateNewVariantRow = (index: number, field: keyof Variant, value: any) => {
    const updated = [...newVariantsToUpload];
    const item = { ...updated[index] };
    (item as any)[field] = value;

    // Auto-set title and label if it's a file change
    if (field === 'file' && value instanceof File) {
      if (!item.title) {
        item.title = value.name.split('.').slice(0, -1).join('.') || value.name;
      }
      if (!item.label) {
        const ext = value.name.split('.').pop() || "";
        item.label = ext.toUpperCase();
      }
    }

    updated[index] = item;
    setNewVariantsToUpload(updated);
  };

  const handleUploadNewVariants = async () => {
    if (!editFileModal.file) return;
    
    const variantsWithFiles = newVariantsToUpload.filter(v => v.file && v.label);
    if (variantsWithFiles.length === 0) {
      toast.error("يرجى إضافة ملف واسم لكل صيغة");
      return;
    }

    setUploadingNewVariant(true);

    try {
      for (let i = 0; i < variantsWithFiles.length; i++) {
        const v = variantsWithFiles[i];
        if (!v.file) continue;
        
        setCurrentUploadingVariantIndex(i);
        setNewVariantProgress(0);

        // Start TUS upload
        const uploadId = await tusUpload.startUpload(v.file, {
          onProgress: (progress) => {
            setNewVariantProgress(progress.percentage);
          },
          metadata: {
            uploadType: "variant",
            variantType: v.type,
            variantLabel: v.label,
            filename: v.file.name,
            filetype: v.file.type || "application/octet-stream",
            fileextension: v.file.name.split('.').pop()?.toLowerCase() || "",
          },
        });

        // Finalize variant
        await finalizeVariant({
          uploadId,
          parentFileId: editFileModal.file.file_id,
          variantType: v.type,
          variantLabel: v.label,
          filename: v.file.name,
        });
      }

      toast.success(`تم إضافة ${variantsWithFiles.length} صيغة بنجاح`);
      
      // Reset
      setNewVariantsToUpload([]);
      setNewVariantProgress(0);
      setCurrentUploadingVariantIndex(-1);
      
      // Refresh file data
      handleOpenEditFile(editFileModal.file.file_id);
      
    } catch (err: any) {
      console.error(err);
      toast.error("فشل في رفع الصيغة: " + (err.message || ""));
    } finally {
      setUploadingNewVariant(false);
    }
  };

  const handleBulkAddVariants = (e: React.ChangeEvent<HTMLInputElement>, isEditModal = false) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    const newItems: Variant[] = files.map(file => {
      const extension = file.name.split('.').pop()?.toLowerCase() || "";
      let type: Variant['type'] = "audio";
      
      if (['mp3', 'wav', 'ogg', 'm4a'].includes(extension)) type = "audio";
      else if (['mp4', 'mov', 'mkv', 'webm', 'prores', 'mxf'].includes(extension)) type = "video";
      else if (['zip', 'rar', '7z'].includes(extension)) type = "archive";
      else if (['png', 'jpg', 'jpeg'].includes(extension)) type = "image";
      
      const isMulti = mainFiles.length === 0;
      return {
        file,
        type,
        label: extension.toUpperCase(),
        title: isMulti ? (file.name.split('.').slice(0, -1).join('.') || file.name) : undefined,
        isIndependent: isMulti
      };
    });
    
    if (isEditModal) {
      setNewVariantsToUpload([...newVariantsToUpload, ...newItems]);
    } else {
      setVariants([...variants, ...newItems]);
    }
    
    // Reset
    e.target.value = "";
  };

  // --- TUS Upload Handlers ---
  const handleMainFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setMainFiles(files);
      
      // If single file, initialize metadata
      if (files.length === 1) {
        // We can still use uploadDesc as a base
      }
      
      // Initialize metadata for each file using filename as default title
      const newMetadata = files.map(file => ({
        title: file.name.split('.').slice(0, -1).join('.') || file.name,
        description: uploadDesc // Carry over existing desc if any
      }));
      setBulkMetadata(newMetadata);
    }
  };

  const updateBulkMetadata = (index: number, field: 'title' | 'description', value: string) => {
    const updated = [...bulkMetadata];
    updated[index] = { ...updated[index], [field]: value };
    setBulkMetadata(updated);
    
    // If it's the first file, also update the main uploadDesc for UI consistency
    if (index === 0) {
      if (field === 'description') setUploadDesc(value);
    }
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
    const item = { ...newVars[index] };
    (item as any)[field] = value;

    // Auto-set title and label if it's a file change
    if (field === 'file' && value instanceof File) {
      if (!item.title) {
        item.title = value.name.split('.').slice(0, -1).join('.') || value.name;
      }
      if (!item.label) {
        const ext = value.name.split('.').pop() || "";
        item.label = ext.toUpperCase();
      }
    }

    newVars[index] = item;
    setVariants(newVars);
  };

  // Build upload queue from selected files
  const buildUploadQueue = (): UploadQueueItem[] => {
    const queue: UploadQueueItem[] = [];
    
    // 1. Identify the Master Main File (Priority 1)
    let mainFileItem: any = null;
    
    if (mainFiles.length > 0) {
      const file = mainFiles[0];
      mainFileItem = { 
        id: `main-0-${Date.now()}`, 
        file: file, 
        type: "main", 
        status: "pending", 
        progress: 0,
        filetype: file.type || "application/octet-stream",
        fileextension: file.name.split('.').pop()?.toLowerCase() || "",
        title: bulkMetadata[0]?.title || file.name.split('.').slice(0, -1).join('.') || file.name,
        description: uploadDesc
      };
      queue.push(mainFileItem);
    }
    
    // 2. Add Preview Video (associated with the first main file)
    if (previewVideo) {
      queue.push({ 
        id: `preview-${Date.now()}`, 
        file: previewVideo, 
        type: "preview", 
        status: "pending", 
        progress: 0,
        filetype: previewVideo.type || "application/octet-stream",
        fileextension: previewVideo.name.split('.').pop()?.toLowerCase() || ""
      } as any);
    }
    
    // 3. Process Variants Section
    variants.forEach((v, idx) => {
      if (!v.file) return;

      // Logic: If NO main file yet, the very first variant becomes the Main (Parent)
      // Logic: If v.isIndependent is true, it MUST be a "main" (Separate Card)
      const shouldBeMain = !mainFileItem || v.isIndependent;
      
      const item: any = {
        id: `variant-${idx}-${Date.now()}`,
        file: v.file,
        status: "pending",
        progress: 0,
        filetype: v.file.type || "application/octet-stream",
        fileextension: v.file.name.split('.').pop()?.toLowerCase() || "",
        variantType: v.type,
        variantLabel: v.label || v.type.toUpperCase()
      };

      if (shouldBeMain) {
        item.type = "main";
        item.title = v.title || v.file.name.split('.').slice(0, -1).join('.') || v.file.name;
        item.description = uploadDesc;
        if (!mainFileItem) mainFileItem = item; // First one becomes the parent for subsequent non-independent variants
      } else {
        item.type = "variant";
      }

      queue.push(item);
    });

    // 4. Handle extra mainFiles as variants of the first one
    mainFiles.forEach((file, idx) => {
      if (idx === 0) return;
      queue.push({
        id: `main-extra-${idx}-${Date.now()}`,
        file: file,
        type: "variant",
        variantLabel: file.name.split('.').pop()?.toUpperCase() || "FILE",
        status: "pending",
        progress: 0,
        filetype: file.type || "application/octet-stream",
        fileextension: file.name.split('.').pop()?.toLowerCase() || ""
      } as any);
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
            filename: item.file.name,
            filetype: item.file.type || "application/octet-stream",
            fileextension: item.file.name.split('.').pop()?.toLowerCase() || "",
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
            // Priority: item.variantType (for variants-turned-main) > tempMainFileType > mainFileType
            const actualMainFileType = (item as any).variantType || (window as any).tempMainFileType || mainFileType;
            
            result = await finalizeMainFile({
              uploadId,
              categoryId: uploadCategory,
              title: item.title,
              description: item.description || uploadDesc,
              mainFileType: actualMainFileType,
              filename: item.file?.name,
            });
          } else if (item.type === "preview" && fileId) { 
            result = await finalizePreviewVideo({ 
              uploadId, 
              parentFileId: fileId,
              filename: item.file?.name || "preview.mp4",
            });
          } else if (item.type === "variant" && fileId) {
            result = await finalizeVariant({
              uploadId,
              parentFileId: fileId,
              variantType: item.variantType || "video",
              variantLabel: item.variantLabel || "VARIANT",
              filename: item.file.name,
            });
          }

          // If the server returned "processing", we need to wait for cloud sync to finish
          if (result && result.status === "processing") {
            await new Promise<void>((resolve, reject) => {
              const checkStatus = async () => {
                try {
                  const statusRes = await axios.get(`/api/tus/status/${uploadId}`);
                  if (statusRes.data?.status === "completed") {
                    const finalFileId = statusRes.data.fileId || fileId;
                    setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: "completed" as const, cloudProgress: 100 } : q));
                    clearInterval(pollInterval);
                    clearInterval(statusTimer);
                    resolve(finalFileId);
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
    
    // Validation: Need either main file OR at least one variant
    const hasMainFile = mainFiles.length > 0;
    const hasVariants = variants.some(v => v.file);
    
    if (!uploadCategory) {
      toast.error("يرجى اختيار تصنيف");
      return;
    }
    
    if (!hasMainFile && !hasVariants) {
      toast.error("يرجى اختيار ملف رئيسي أو إضافة صيغة واحدة على الأقل");
      return;
    }
    
    // Title validation for bulk
    if (mainFiles.length > 0) {
      const missingTitle = bulkMetadata.some(m => !m.title.trim());
      if (missingTitle) {
        toast.error("يرجى إدخال عنوان لكل ملف");
        return;
      }
    } else if (variants.some(v => v.file && !v.title?.trim())) {
      // Check variants if they are the primary files
      const variantMissingTitle = variants.some(v => v.file && !v.title?.trim());
      if (variantMissingTitle) {
        toast.error("يرجى إدخال عنوان لكل ملف");
        return;
      }
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
      // Build queue is already handling the single-main-card logic
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
      setUploadDesc("");
      setMainFiles([]);
      setBulkMetadata([]);
      setPreviewVideo(null);
      setVariants([]);
      setUploadQueue([]);
      (window as any).tempMainFileType = undefined;
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
    mainFiles.forEach(f => total += f.size);
    if (previewVideo) total += previewVideo.size;
    variants.forEach(v => { if (v.file) total += v.file.size; });
    return total;
  };

  return (
    <div className="p-6 min-h-screen text-white dark:text-gray-200">
      {/* TUS Upload Progress Overlay */}
      {isUploading && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 animate-in fade-in duration-200">
          <div className="bg-[#0F121C] border border-white/10 w-full max-w-xl rounded-lg p-6 overflow-hidden font-cairo">
            <div className="flex flex-col items-center">
              <h3 className="text-base font-bold text-emerald-400 mb-1">
                {isPaused ? "متوقف مؤقتاً" : (uploadQueue[currentUploadIndex]?.status === "processing" ? "جاري المزامنة مع السيرفر" : "جاري الرفع...")}
              </h3>
              <p className="text-slate-400 text-xs mb-4 font-medium">{uploadQueue[currentUploadIndex]?.title || "ملف ميديا"}</p>
              
              {/* Current file info */}
              <div className="w-full bg-[#07090F] rounded-md p-3 mb-4 border border-white/10">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs text-slate-400">الملف الحالي ({currentUploadIndex + 1}/{uploadQueue.length})</span>
                  <span className="text-xs text-emerald-400 font-bold">{formatBytes(getTotalSize())}</span>
                </div>
                <p className="text-xs font-medium text-white truncate">{uploadQueue[currentUploadIndex]?.file.name || "-"}</p>
                <div className="flex gap-1.5 mt-2">
                  {uploadQueue.map((item) => (
                    <div key={item.id} className={`h-1.5 flex-1 rounded-full ${
                      item.status === "completed" ? "bg-emerald-500" :
                      item.status === "uploading" ? "bg-emerald-400" :
                      item.status === "error" ? "bg-red-500" :
                      "bg-white/10"
                    }`} />
                  ))}
                </div>
              </div>

              {/* Progress Container */}
              <div className="w-full space-y-3">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-xs font-bold text-slate-400">
                    {uploadQueue[currentUploadIndex]?.status === "processing" 
                      ? "جاري المزامنة السحابية..." 
                      : (tusUpload.isPaused ? "الرفع متوقف" : "رفع سريع للملفات")}
                  </span>
                  <span className="text-xl font-black text-white">
                    {uploadQueue[currentUploadIndex]?.status === "processing"
                      ? (uploadQueue[currentUploadIndex]?.cloudProgress && uploadQueue[currentUploadIndex]?.cloudProgress > 0 
                          ? `${uploadQueue[currentUploadIndex]?.cloudProgress}%` 
                          : "جاري المعالجة...")
                      : `${tusUpload.progress.percentage}%`}
                  </span>
                </div>
                
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ 
                      width: uploadQueue[currentUploadIndex]?.status === "processing" 
                        ? (uploadQueue[currentUploadIndex]?.cloudProgress ? `${uploadQueue[currentUploadIndex]?.cloudProgress}%` : "100%")
                        : `${tusUpload.progress.percentage}%` 
                    }}
                  ></div>
                </div>
                
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                  <span>
                    {uploadQueue[currentUploadIndex]?.status === "processing"
                      ? "يتم الآن نقل الملف إلى خوادم التخزين..."
                      : `${formatBytes(tusUpload.progress.bytesUploaded)} / ${formatBytes(tusUpload.progress.bytesTotal)}`}
                  </span>
                  <span>
                    {uploadQueue[currentUploadIndex]?.status === "processing"
                      ? "يرجى الانتظار"
                      : (uploadStartTime ? calculateETA(tusUpload.progress.bytesUploaded, tusUpload.progress.bytesTotal, uploadStartTime) : "")}
                  </span>
                </div>

                {/* Control Buttons */}
                <div className="flex gap-2 justify-center pt-3">
                  <button onClick={handlePauseResume} className={`px-4 py-1.5 rounded-md font-bold text-xs flex items-center gap-1.5 transition-colors ${isPaused ? "bg-emerald-600 text-white hover:bg-emerald-500" : "bg-white/10 text-white hover:bg-white/20"}`}>
                    {isPaused ? <><Play size={14} /> استئناف</> : <><Pause size={14} /> إيقاف مؤقت</>}
                  </button>
                  <button onClick={handleCancelUpload} className="px-3.5 py-1.5 rounded-md bg-red-600/10 border border-red-500/30 text-red-400 hover:bg-red-600 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-colors">
                    <X size={14} /> إلغاء
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-xl font-black text-emerald-400">{t('mediaAdmin.pageTitle')}</h1>
        <button onClick={toggleMediaHub} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-1.5 ${isMediaHubEnabled ? 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20' : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'}`}>
          {isMediaHubEnabled ? <EyeOff size={14} /> : <Eye size={14} />}
          <span>{isMediaHubEnabled ? "إخفاء المكتبة من الموقع" : "إظهار المكتبة في الموقع"}</span>
        </button>
      </div>
      
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        <button onClick={() => setActiveTab("hero")} className={`px-3.5 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-colors ${activeTab === "hero" ? "bg-emerald-600 text-white" : "bg-[#0B0E17] border border-white/[0.08] text-slate-400 hover:text-white"}`}>
          المجموعات (Collections)
        </button>
        <button onClick={() => setActiveTab("categories")} className={`px-3.5 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-colors ${activeTab === "categories" ? "bg-emerald-600 text-white" : "bg-[#0B0E17] border border-white/[0.08] text-slate-400 hover:text-white"}`}>
          {t('mediaAdmin.categoriesTab')}
        </button>
        <button onClick={() => setActiveTab("uploads")} className={`px-3.5 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-colors ${activeTab === "uploads" ? "bg-emerald-600 text-white" : "bg-[#0B0E17] border border-white/[0.08] text-slate-400 hover:text-white"}`}>
          {t('mediaAdmin.uploadsTab')}
        </button>
        <button onClick={() => setActiveTab("banner")} className={`px-3.5 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-colors ${activeTab === "banner" ? "bg-emerald-600 text-white" : "bg-[#0B0E17] border border-white/[0.08] text-slate-400 hover:text-white"}`}>
          إدارة البانر
        </button>
        <button onClick={() => setActiveTab("analytics")} className={`px-3.5 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-colors ${activeTab === "analytics" ? "bg-emerald-600 text-white" : "bg-[#0B0E17] border border-white/[0.08] text-slate-400 hover:text-white"}`}>
          الإحصائيات
        </button>
      </div>

      {activeTab === "hero" && (
        <div className="grid md:grid-cols-1 gap-6">
           <div className="bg-[#0B0E17] p-5 rounded-md border border-white/[0.08] h-fit">
            <h2 className="text-sm font-bold mb-4 text-emerald-400">{editingHeroId ? "تعديل المجموعة" : "إضافة مجموعة جديدة (Collection)"}</h2>
            <form onSubmit={handleCreateOrUpdateHero} className="flex flex-col gap-3">
              <input type="text" placeholder="اسم المجموعة (مثال: مؤثرات صوتية)" className="p-2.5 rounded-md border border-white/10 bg-[#07090F] text-white text-xs placeholder-white/30 focus:border-emerald-500/50 focus:outline-none" value={heroName} onChange={(e) => setHeroName(e.target.value)} required />
              <textarea placeholder="وصف المجموعة" className="p-2.5 rounded-md border border-white/10 bg-[#07090F] text-white text-xs placeholder-white/30 focus:border-emerald-500/50 focus:outline-none min-h-[70px]" value={heroDesc} onChange={(e) => setHeroDesc(e.target.value)} />
              <div>
              <label className="block mb-2 text-xs font-medium text-slate-400">نوع المجموعة</label>
              <div className="flex gap-3">
                <label className={`cursor-pointer border p-2.5 rounded-md flex items-center gap-2 transition-colors text-xs ${heroType === 'visual' ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' : 'border-white/10 text-slate-400'}`}>
                  <input type="radio" name="heroType" value="visual" className="hidden" checked={heroType === 'visual'} onChange={() => setHeroType('visual')} />
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${heroType === 'visual' ? 'border-emerald-400' : 'border-slate-500'}`}>
                    {heroType === 'visual' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>}
                  </div>
                  <span>Visual (Photos/Videos)</span>
                </label>
                <label className={`cursor-pointer border p-2.5 rounded-md flex items-center gap-2 transition-colors text-xs ${heroType === 'audio' ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' : 'border-white/10 text-slate-400'}`}>
                  <input type="radio" name="heroType" value="audio" className="hidden" checked={heroType === 'audio'} onChange={() => setHeroType('audio')} />
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${heroType === 'audio' ? 'border-emerald-400' : 'border-slate-500'}`}>
                    {heroType === 'audio' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>}
                  </div>
                  <span>Audio (Music/SFX)</span>
                </label>
              </div>
            </div>

              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-md text-xs transition-colors">{editingHeroId ? t('mediaAdmin.update') : t('mediaAdmin.create')}</button>
                {editingHeroId && <button type="button" onClick={handleCancelEditHero} className="bg-white/10 hover:bg-white/15 text-white px-4 py-2 rounded-md text-xs transition-colors">{t('mediaAdmin.cancel')}</button>}
              </div>
            </form>
           </div>

           <div className="bg-[#0B0E17] p-5 rounded-md border border-white/[0.08]">
             <h2 className="text-sm font-bold mb-4 text-emerald-400">المجموعات الحالية (Hero Categories)</h2>
             {loadingHero ? <p className="text-xs text-slate-400">{t('common.loading')}</p> : (
               <div className="space-y-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {heroCategories.map(hero => (
                    <div key={hero.hero_category_id} className="flex items-center gap-3 p-3 bg-[#0F121C] rounded-md border border-white/[0.08] hover:border-white/20 transition-colors">
                        <div className="w-12 h-12 rounded-md bg-black/40 overflow-hidden flex-shrink-0">
                           {hero.cover_image_url ? (
                              <img src={hero.cover_image_url} alt="" className="w-full h-full object-cover" />
                           ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">مجموعة</div>
                           )}
                        </div>
                        <div className="flex-1 min-w-0">
                           <h4 className="font-bold text-xs text-white truncate">{hero.name}</h4>
                           <p className="text-[10px] text-slate-400 truncate">{hero.description || '-'}</p>
                           <p className="text-[10px] text-emerald-400 font-medium mt-1">
                              {hero.subCategories?.length || 0} تصنيف فرعي
                           </p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <button onClick={() => handleEditHero(hero)} className="bg-white/5 hover:bg-white/10 text-slate-300 p-1.5 rounded-md transition-colors"><Edit size={13} /></button>
                          <button onClick={() => openDeleteModal('hero', hero.hero_category_id)} className="bg-red-500/10 text-red-400 hover:bg-red-500/20 p-1.5 rounded-md transition-colors"><Trash2 size={13} /></button>
                        </div>
                    </div>
                  ))}
                  {heroCategories.length === 0 && <p className="opacity-50 text-white col-span-full text-xs">لا توجد مجموعات</p>}
               </div>
             )}
           </div>
        </div>
      )}

      {activeTab === "categories" && (
        <div className="grid md:grid-cols-1 gap-6">
          <div className="bg-[#0B0E17] p-5 rounded-md border border-white/[0.08] h-fit">
            <h2 className="text-sm font-bold mb-4 text-emerald-400">{editingCatId ? t('mediaAdmin.editCategory') : t('mediaAdmin.addCategory')}</h2>
            <form onSubmit={handleCreateOrUpdateCategory} className="flex flex-col gap-3">
              <input type="text" placeholder={t('mediaAdmin.categoryName')} className="p-2.5 rounded-md border border-white/10 bg-[#07090F] text-white text-xs placeholder-white/30 focus:border-emerald-500/50 focus:outline-none" value={catName} onChange={(e) => setCatName(e.target.value)} required />
              
              <select className="p-2.5 rounded-md border border-white/10 bg-[#07090F] text-white text-xs focus:border-emerald-500/50 focus:outline-none" value={selectedHeroId || ""} onChange={(e) => setSelectedHeroId(Number(e.target.value) || null)}>
                 <option value="" className="bg-[#07090F] text-white">-- اختر المجموعة الأم (Collection) --</option>
                 {heroCategories.map(h => (
                    <option key={h.hero_category_id} value={h.hero_category_id} className="bg-[#07090F] text-white">{h.name}</option>
                 ))}
              </select>

              <textarea placeholder={t('mediaAdmin.description')} className="p-2.5 rounded-md border border-white/10 bg-[#07090F] text-white text-xs placeholder-white/30 focus:border-emerald-500/50 focus:outline-none min-h-[70px]" value={catDesc} onChange={(e) => setCatDesc(e.target.value)} />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-400">رفع صورة التصنيف</label>
                <input type="file" accept="image/*" onChange={(e) => setCatCover(e.target.files?.[0] || null)} className="w-full text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20" />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-md text-xs transition-colors">{editingCatId ? t('mediaAdmin.update') : t('mediaAdmin.create')}</button>
                {editingCatId && <button type="button" onClick={handleCancelEdit} className="bg-white/10 hover:bg-white/15 text-white px-4 py-2 rounded-md text-xs transition-colors">{t('mediaAdmin.cancel')}</button>}
              </div>
            </form>
          </div>

          <div className="bg-[#0B0E17] p-5 rounded-md border border-white/[0.08]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
              <h2 className="text-sm font-bold text-emerald-400">{t('mediaAdmin.existingCategories')}</h2>
              
              {/* Filter Row */}
              <div className="flex flex-wrap gap-1.5">
                <button 
                  onClick={() => setFilterHeroId(null)} 
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${filterHeroId === null ? 'bg-emerald-600 text-white' : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white'}`}
                >
                  الكل
                </button>
                {heroCategories.map(hero => (
                  <button 
                    key={hero.hero_category_id}
                    onClick={() => setFilterHeroId(hero.hero_category_id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${filterHeroId === hero.hero_category_id ? 'bg-emerald-600 text-white' : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white'}`}
                  >
                    {hero.name}
                  </button>
                ))}
              </div>
            </div>

            {loading ? <p className="text-xs text-slate-400">{t('common.loading')}</p> : (
              <div className="space-y-3 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {categories
                  .filter(cat => filterHeroId === null || cat.hero_category_id === filterHeroId)
                  .map(cat => (
                  <div key={cat.category_id} className={`flex flex-col p-3 bg-[#0F121C] border rounded-md cursor-pointer transition-colors ${selectedCatId === cat.category_id ? 'border-emerald-500 bg-emerald-500/5' : 'border-white/[0.08] hover:border-white/20'}`} onClick={() => handleViewFiles(cat.category_id)}>
                    <div className="mb-2">
                      <h4 className="font-bold text-xs text-white truncate">{cat.name}</h4>
                      {cat.hero_category_id && (
                          <span className="text-[9px] bg-white/5 px-1 py-0.5 rounded text-slate-400 block w-fit mb-1">
                             {heroCategories.find(h => h.hero_category_id === cat.hero_category_id)?.name || "Unknown"}
                          </span>
                      )}
                      <p className="text-[10px] text-slate-400 truncate">{cat.description || '-'}</p>
                    </div>
                    <div className="flex justify-between items-center mt-auto pt-2 border-t border-white/5">
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-bold">{cat.filesCount || 0}</span>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => handleEditCategory(cat)} className="text-slate-300 hover:bg-white/10 p-1 rounded transition-colors"><Edit size={13} /></button>
                        <button onClick={() => openDeleteModal('category', cat.category_id)} className="text-red-400 hover:bg-red-500/10 p-1 rounded transition-colors"><Trash2 size={13} /></button>
                      </div>
                    </div>
                  </div>
                ))}
                {categories.length === 0 && <p className="opacity-50 text-white col-span-full text-xs">{t('mediaAdmin.noCategories')}</p>}
              </div>
            )}
          </div>

          {/* Files List Section */}
          {selectedCatId && (
            <div className="bg-[#0B0E17] p-5 rounded-md border border-white/[0.08] mt-2">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                  <span className="text-slate-400">{t('mediaAdmin.filesInCategory')}:</span>
                  <span className="text-white">{categories.find(c => c.category_id === selectedCatId)?.name}</span>
                </h2>
                <button onClick={() => setSelectedCatId(null)} className="text-slate-400 hover:text-white bg-white/5 p-1 rounded-md transition-colors"><X size={16} /></button>
              </div>

              {loadingFiles ? (
                <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-400"></div></div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                  {categoryFiles.map((file) => (
                    <div key={file.file_id} className="bg-[#0F121C] border border-white/[0.08] rounded-md overflow-hidden group hover:border-emerald-500/40 transition-colors">
                      <div className="aspect-[4/3] relative bg-black/40 flex items-center justify-center">
                        {file.type === 'video' ? <Film size={22} className="text-white/30" /> : <ImageIcon size={22} className="text-white/30" />}
                        {file.thumbnail_url && <img src={file.thumbnail_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />}
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 transition-opacity">
                          <button onClick={() => handleOpenEditFile(file.file_id)} className="bg-white/10 hover:bg-white/20 text-white p-1.5 rounded-md transition-colors" title="تعديل"><Edit size={14} /></button>
                          <button onClick={() => openDeleteModal('file', file.file_id)} className="bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white p-1.5 rounded-md transition-colors" title={t('mediaAdmin.deleteFile')}><Trash2 size={14} /></button>
                        </div>
                      </div>
                      <div className="p-2 bg-black/20">
                        <h4 className="font-medium text-[10px] text-white truncate mb-0.5">{file.title}</h4>
                        <p className="text-[9px] text-slate-400 uppercase tracking-tight">
                          {file.file_type === 'video' ? t('mediaAdmin.video') : 
                           file.file_type === 'audio' ? 'Audio' : t('mediaAdmin.image')}
                        </p>
                      </div>
                    </div>
                  ))}
                  {categoryFiles.length === 0 && (
                    <div className="col-span-full py-10 text-center text-slate-500 flex flex-col items-center gap-1">
                      <p className="text-xs">{t('mediaAdmin.noFilesInCategory')}</p>
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
          if (deleteModal.type === 'hero' && deleteModal.id) handleDeleteHero(deleteModal.id);
          if (deleteModal.type === 'category' && deleteModal.id) handleDeleteCategory(deleteModal.id);
          if (deleteModal.type === 'file' && deleteModal.id) handleDeleteFile(deleteModal.id);
          if (deleteModal.type === 'variant' && deleteModal.id) handleDeleteVariant(deleteModal.id);
        }}
        title={
          deleteModal.type === 'hero' ? "حذف المجموعة" :
          deleteModal.type === 'category' ? t('mediaAdmin.deleteConfirm') : 
          deleteModal.type === 'variant' ? "حذف الصيغة" : 
          t('mediaAdmin.deleteFile')
        }
        message={
          deleteModal.type === 'hero' ? "هل أنت متأكد من حذف هذه المجموعة؟ التصنيفات التابعة لها ستصبح مستقلة." :
          deleteModal.type === 'category' ? t('mediaAdmin.deleteConfirm') : 
          deleteModal.type === 'variant' ? "هل أنت متأكد من حذف هذه الصيغة؟" : 
          t('mediaAdmin.deleteFileConfirm')
        }
        confirmText={t('admin.delete')}
        cancelText={t('mediaAdmin.cancel')}
      />

      {/* Edit File Modal */}
      {editFileModal.isOpen && editFileModal.file && (
        <div className="fixed inset-0 z-[30] mt-25 flex items-center justify-center p-4 bg-black/70 animate-in fade-in duration-200">
          <div className="bg-[#0F121C] border border-white/10 w-full max-w-2xl rounded-lg overflow-hidden font-cairo">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-white/10">
              <h3 className="text-sm font-bold text-emerald-400">
                تعديل الملف
              </h3>
              <button onClick={handleCloseEditFile} className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/5 transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Preview */}
              <div className="flex gap-3 items-start p-3 bg-[#07090F] rounded-md border border-white/10">
                <div className="w-16 h-16 rounded-md bg-black/40 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {editFileModal.file.thumbnail_url ? (
                    <img src={editFileModal.file.thumbnail_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    editFileModal.file.file_type === 'video' ? <Film size={24} className="text-white/30" /> : <ImageIcon size={24} className="text-white/30" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white font-medium mb-1">النوع: {editFileModal.file.file_type}</p>
                  <p className="text-[10px] text-slate-400 truncate">URL: {editFileModal.file.storage_url}</p>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-medium mb-1.5 text-slate-300">التصنيف</label>
                <select 
                  value={editCategoryId || ""} 
                  onChange={(e) => setEditCategoryId(Number(e.target.value))}
                  className="w-full p-2.5 rounded-md border border-white/10 bg-[#07090F] text-white text-xs focus:border-emerald-500/50 focus:outline-none"
                >
                  {categories.map(cat => (
                    <option key={cat.category_id} value={cat.category_id} className="bg-[#07090F] text-white">{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Update Main File & Preview */}
              <div className="bg-[#07090F] p-4 rounded-md border border-white/10 space-y-3">
                 <h4 className="font-bold text-xs text-emerald-400">
                    تحديث الملفات الأساسية
                 </h4>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-medium mb-1 block text-slate-400">استبدال الملف الرئيسي</label>
                      <input 
                        type="file" 
                        onChange={(e) => setNewMainFile(e.target.files?.[0] || null)}
                        disabled={isUpdatingFiles}
                        className="w-full text-xs text-slate-300 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20"
                      />
                      {newMainFile && <p className="text-[10px] text-emerald-400 mt-1 truncate">{newMainFile.name}</p>}
                    </div>
                    
                    <div>
                      <label className="text-[10px] font-medium mb-1 block text-slate-400">استبدال فيديو الهوفر (Preview)</label>
                      <input 
                        type="file" 
                        accept="video/*"
                        onChange={(e) => setNewPreviewFile(e.target.files?.[0] || null)}
                        disabled={isUpdatingFiles}
                        className="w-full text-xs text-slate-300 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20"
                      />
                      {newPreviewFile && <p className="text-[10px] text-emerald-400 mt-1 truncate">{newPreviewFile.name}</p>}
                    </div>
                 </div>

                 {isUpdatingFiles && (
                    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden mt-2">
                      <div 
                        className="h-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${filesUpdateProgress}%` }}
                      />
                    </div>
                 )}
              </div>

              {/* Variants Section */}
              <div>
                <label className="block text-xs font-bold mb-2 text-emerald-400">
                  الصيغ المتاحة ({editFileModal.file.variants?.length || 0})
                </label>
                
                {editFileModal.file.variants && editFileModal.file.variants.length > 0 ? (
                  <div className="space-y-2">
                    {editFileModal.file.variants.map((variant) => (
                      <div key={variant.variant_id} className="flex items-center justify-between p-2.5 bg-[#07090F] rounded-md border border-white/10">
                        <div className="flex items-center gap-2.5">
                          <div>
                            <p className="font-bold text-xs text-white">{variant.label}</p>
                            <p className="text-[10px] text-slate-400">{variant.file_type} • {variant.extension}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => openDeleteModal('variant', variant.variant_id)}
                          className="text-red-400 hover:text-red-500 hover:bg-red-500/10 p-1.5 rounded-md transition-colors"
                          title="حذف الصيغة"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-3 border border-dashed border-white/10 rounded-md text-slate-500 text-xs">
                    لا توجد صيغ إضافية
                  </div>
                )}

                {/* Add New Variants Section */}
                <div className="mt-4 space-y-3">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-emerald-400">
                      إضافة ملفات أو صيغ جديدة
                    </label>

                    {/* Quick Add Buttons */}
                    <div className="flex flex-wrap gap-1.5 items-center bg-[#07090F] p-2.5 rounded-md border border-white/10">
                      <span className="text-[10px] text-slate-400 font-medium">{t('mediaAdmin.quickAdd')}</span>
                      <button type="button" onClick={() => addNewVariantRow("4K PRORES", "prores")} className="text-[10px] bg-white/5 hover:bg-white/10 text-slate-300 px-2 py-1 rounded-md border border-white/10 transition font-bold">+ PRORES</button>
                      <button type="button" onClick={() => addNewVariantRow("MP4", "video")} className="text-[10px] bg-white/5 hover:bg-white/10 text-slate-300 px-2 py-1 rounded-md border border-white/10 transition font-bold">+ MP4</button>
                      <button type="button" onClick={() => addNewVariantRow("MP3", "audio")} className="text-[10px] bg-white/5 hover:bg-white/10 text-slate-300 px-2 py-1 rounded-md border border-white/10 transition font-bold">+ MP3</button>
                      <button type="button" onClick={() => addNewVariantRow("PNG SEQUENCE", "png_sequence")} className="text-[10px] bg-white/5 hover:bg-white/10 text-slate-300 px-2 py-1 rounded-md border border-white/10 transition font-bold">+ PNG SEQ.</button>
                      <button type="button" onClick={() => addNewVariantRow("MOV", "video")} className="text-[10px] bg-white/5 hover:bg-white/10 text-slate-300 px-2 py-1 rounded-md border border-white/10 transition font-bold">+ MOV</button>

                      <div className="h-4 w-[1px] bg-white/10 mx-1"></div>
                      
                      <input 
                        type="file" 
                        id="edit-bulk-variants" 
                        multiple 
                        className="hidden" 
                        onChange={(e) => handleBulkAddVariants(e, true)}
                        ref={editBulkVariantInputRef}
                      />
                      <button 
                        type="button" 
                        onClick={() => editBulkVariantInputRef.current?.click()} 
                        className="text-[10px] bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 px-2.5 py-1 rounded-md border border-emerald-500/30 transition font-bold"
                      >
                        + رفع أكثر من ملف
                      </button>
                    </div>
                  </div>

                  {/* New Variants Rows */}
                  {newVariantsToUpload.map((v, idx) => (
                    <div key={idx} className="flex gap-2 items-end bg-[#07090F] p-2.5 rounded-md border border-white/10 flex-wrap">
                      {v.isIndependent && (
                        <div className="flex-[2] min-w-[150px]">
                          <label className="text-[10px] block mb-1 text-slate-400">العنوان الرئيسي</label>
                          <input 
                            type="text" 
                            className="w-full p-2 text-xs rounded-md bg-[#0B0E17] border border-white/10 text-white focus:border-emerald-500/50 focus:outline-none" 
                            value={v.title || ""} 
                            onChange={(e) => updateNewVariantRow(idx, 'title', e.target.value)} 
                            placeholder="عنوان الميديا"
                            disabled={uploadingNewVariant}
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-[100px]">
                        <label className="text-[10px] block mb-1 text-slate-400">الاسم (مثل 4K)</label>
                        <input 
                          type="text" 
                          className="w-full p-2 text-xs rounded-md bg-[#0B0E17] border border-white/10 text-white focus:border-emerald-500/50 focus:outline-none" 
                          value={v.label} 
                          onChange={(e) => updateNewVariantRow(idx, 'label', e.target.value)} 
                          placeholder="مثال: MP3"
                          disabled={uploadingNewVariant}
                        />
                      </div>
                      <div className="w-24">
                        <label className="text-[10px] block mb-1 text-slate-400">النوع</label>
                        <select 
                          className="w-full p-2 text-xs rounded-md bg-[#0B0E17] border border-white/10 text-white focus:border-emerald-500/50 focus:outline-none" 
                          value={v.type} 
                          onChange={(e) => updateNewVariantRow(idx, 'type', e.target.value as Variant['type'])}
                          disabled={uploadingNewVariant}
                        >
                          <option value="video">فيديو</option>
                          <option value="audio">صوت</option>
                          <option value="image">صورة</option>
                          <option value="prores">PRORES</option>
                          <option value="png_sequence">PNG SEQ.</option>
                          <option value="archive">ZIP/RAR</option>
                        </select>
                      </div>
                      <div className="flex-1 min-w-0">
                        <label className="text-[10px] block mb-1 text-slate-400">الملف {v.file ? `(${formatBytes(v.file.size)})` : ''}</label>
                        <input 
                          type="file" 
                          accept={
                            v.type === 'video' || v.type === 'prores' ? 'video/*,.mov,.prores,.mxf,.zip,.rar,.7z' : 
                            v.type === 'audio' ? 'audio/*,.mp3,.wav,.zip,.rar,.7z' :
                            'image/*,.zip,.rar,.7z'
                          } 
                          className="w-full text-xs text-slate-300 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20" 
                          onChange={(e) => updateNewVariantRow(idx, 'file', e.target.files ? e.target.files[0] : null)}
                          disabled={uploadingNewVariant}
                        />
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removeNewVariantRow(idx)} 
                        className="text-red-400 hover:text-red-500 p-2 bg-red-500/10 hover:bg-red-500/20 rounded-md transition-colors"
                        disabled={uploadingNewVariant}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}

                  {/* Upload Progress */}
                  {uploadingNewVariant && (
                    <div className="p-2.5 bg-[#07090F] border border-white/10 rounded-md space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">
                          جاري رفع الصيغة {currentUploadingVariantIndex + 1} من {newVariantsToUpload.filter(v => v.file && v.label).length}...
                        </span>
                        <span className="text-emerald-400 font-bold">{newVariantProgress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                          style={{ width: `${newVariantProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Upload Button */}
                  {newVariantsToUpload.length > 0 && (
                    <button
                      type="button"
                      onClick={handleUploadNewVariants}
                      disabled={uploadingNewVariant || newVariantsToUpload.every(v => !v.file || !v.label)}
                      className="w-full py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                    >
                      {uploadingNewVariant ? "جاري الرفع..." : `رفع الصيغ الجديدة (${newVariantsToUpload.filter(v => v.file && v.label).length})`}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-2 justify-end p-4 border-t border-white/10 bg-[#07090F]">
              <button 
                onClick={handleCloseEditFile} 
                className="px-3.5 py-1.5 rounded-md text-xs bg-white/5 text-slate-300 hover:bg-white/10 transition-colors"
              >
                إلغاء
              </button>
              <button 
                onClick={handleSaveFileEdit}
                disabled={savingFile}
                className="px-4 py-1.5 rounded-md text-xs bg-emerald-600 hover:bg-emerald-500 text-white transition-colors font-bold disabled:opacity-50"
              >
                {savingFile ? "جاري الحفظ..." : "حفظ التغييرات"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banner Tab */}
      {activeTab === "banner" && (
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Upload New Banner */}
          <div className="bg-[#0B0E17] p-5 rounded-md border border-white/[0.08]">
            <h2 className="text-sm font-bold mb-4 text-emerald-400">
              رفع بانر جديد
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-xs font-medium text-slate-300">اختر صورة أو فيديو للبانر</label>
                <input 
                  type="file" 
                  accept="image/*,video/*"
                  onChange={handleBannerFileChange}
                  className="w-full text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer"
                />
              </div>

              {bannerPreview && (
                <div className="relative w-full h-56 bg-black rounded-md overflow-hidden border border-white/10">
                  {bannerFile?.type.startsWith('video') ? (
                    <video 
                      src={bannerPreview} 
                      className="w-full h-full object-cover"
                      controls
                      autoPlay
                      muted
                      loop
                    />
                  ) : (
                    <img 
                      src={bannerPreview} 
                      alt="Banner Preview" 
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              )}

              <button
                onClick={handleUploadBanner}
                disabled={!bannerFile || uploadingBanner}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-md text-xs flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {uploadingBanner ? "جاري الرفع..." : "رفع البانر"}
              </button>
            </div>
          </div>

          {/* Existing Banners */}
          <div className="bg-[#0B0E17] p-5 rounded-md border border-white/[0.08]">
            <h2 className="text-sm font-bold mb-4 text-emerald-400">
              البانرات الموجودة ({banners.length})
            </h2>

            {loadingBanners ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-400"></div>
              </div>
            ) : banners.length === 0 ? (
              <div className="text-center p-8 text-slate-500">
                <p className="text-xs">لا توجد بانرات حالياً</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {banners.map((banner) => (
                  <div key={banner.banner_id} className="bg-[#0F121C] rounded-md overflow-hidden border border-white/[0.08] hover:border-white/20 transition-colors">
                    <div className="relative h-44 bg-black">
                      {banner.media_type === 'video' ? (
                        <video 
                          src={banner.media_url} 
                          className="w-full h-full object-cover"
                          muted
                          loop
                          onMouseEnter={(e) => e.currentTarget.play()}
                          onMouseLeave={(e) => {
                            e.currentTarget.pause();
                            e.currentTarget.currentTime = 0;
                          }}
                        />
                      ) : (
                        <img 
                          src={banner.media_url} 
                          alt="Banner" 
                          className="w-full h-full object-cover"
                        />
                      )}
                      
                      {/* Status Badge */}
                      <div className="absolute top-2.5 right-2.5">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          banner.is_active 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {banner.is_active ? 'نشط' : 'معطل'}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>{banner.media_type === 'video' ? 'فيديو' : 'صورة'}</span>
                        <span className="text-[10px]">
                          {new Date(banner.createdAt).toLocaleDateString('ar-EG')}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleBannerActive(banner.banner_id, banner.is_active)}
                          className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-colors ${
                            banner.is_active
                              ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
                          }`}
                        >
                          {banner.is_active ? "إخفاء" : "تفعيل"}
                        </button>
                        <button
                          onClick={() => handleDeleteBanner(banner.banner_id)}
                          className="px-3 py-1.5 rounded-md text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "uploads" && (
        <div className="max-w-5xl mx-auto bg-[#0B0E17] p-6 rounded-md border border-white/[0.08]">
          <h2 className="text-base font-bold mb-5 text-emerald-400">
            <span>{t('mediaAdmin.uploadNewMedia')}</span>
          </h2>
          <form onSubmit={handleUpload} className="space-y-4">
            
            {/* Metadata */}
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block mb-1.5 text-xs font-medium text-slate-300">المجموعة (Collection)</label>
                <select 
                  className="w-full p-2.5 rounded-md border border-white/10 bg-[#07090F] text-white text-xs font-medium focus:border-emerald-500/50 focus:outline-none" 
                  value={uploadHeroId || ""} 
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : null;
                    setUploadHeroId(val);
                    setUploadCategory(""); // Reset category when hero changes
                  }}
                >
                  <option value="" className="bg-[#07090F]">كل المجموعات</option>
                  {heroCategories.map(h => <option key={h.hero_category_id} value={h.hero_category_id} className="bg-[#07090F]">{h.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block mb-1.5 text-xs font-medium text-slate-300">{t('mediaAdmin.selectCategory')}</label>
                <select 
                  className="w-full p-2.5 rounded-md border border-white/10 bg-[#07090F] text-white text-xs font-medium focus:border-emerald-500/50 focus:outline-none" 
                  value={uploadCategory} 
                  onChange={(e) => setUploadCategory(e.target.value)} 
                  required
                >
                  <option value="" className="bg-[#07090F]">{t('mediaAdmin.chooseCategory')}</option>
                  {categories
                    .filter(cat => !uploadHeroId || cat.hero_category_id === uploadHeroId)
                    .map(cat => <option key={cat.category_id} value={cat.category_id} className="bg-[#07090F]">{cat.name}</option>)
                  }
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div className="border border-white/10 bg-[#07090F] p-3.5 rounded-md">
                <h3 className="font-bold mb-2 text-xs text-emerald-400">
                  {t('mediaAdmin.mainFile')} 
                  <span className="text-[10px] text-slate-400 font-normal mr-1">(اختياري)</span>
                </h3>
                <div className="grid grid-cols-2 gap-2 mb-2.5">
                  <label className={`cursor-pointer border p-1.5 rounded-md flex items-center justify-center gap-1 text-xs transition-colors ${mainFileType === 'image' ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' : 'border-white/10 text-slate-400'}`}>
                    <input type="radio" name="mainType" value="image" className="hidden" checked={mainFileType === 'image'} onChange={() => setMainFileType('image')} />
                    <span>{t('mediaAdmin.image')}</span>
                  </label>
                  <label className={`cursor-pointer border p-1.5 rounded-md flex items-center justify-center gap-1 text-xs transition-colors ${mainFileType === 'video' ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' : 'border-white/10 text-slate-400'}`}>
                    <input type="radio" name="mainType" value="video" className="hidden" checked={mainFileType === 'video'} onChange={() => setMainFileType('video')} />
                    <span>{t('mediaAdmin.video')}</span>
                  </label>
                </div>
                <input 
                  type="file" 
                  accept={
                    mainFileType === 'video' ? 'video/*,.mov,.prores,.mxf,.zip,.rar,.7z' : 
                    mainFileType === 'audio' ? 'audio/*,.mp3,.wav,.zip,.rar,.7z' : 
                    'image/*,.zip,.rar,.7z'
                  } 
                  onChange={handleMainFileChange} 
                  className="w-full text-xs text-slate-300 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20" 
                />
                {mainFiles.length > 0 && <p className="text-[10px] text-emerald-400 mt-1.5 truncate">📁 {mainFiles[0].name} ({formatBytes(mainFiles[0].size)})</p>}
              </div>

              <div className="border border-white/10 bg-[#07090F] p-3.5 rounded-md">
                <h3 className="font-bold mb-2 text-xs text-emerald-400">
                  Hover Video Preview
                  <span className="text-[10px] text-slate-400 font-normal mr-1">(اختياري)</span>
                </h3>
                <div className="mt-8">
                  <input type="file" accept="video/*,.mov" onChange={(e) => setPreviewVideo(e.target.files?.[0] || null)} className="w-full text-xs text-slate-300 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20" />
                  {previewVideo && <p className="text-[10px] text-emerald-400 mt-1.5 truncate">📁 {previewVideo.name} ({formatBytes(previewVideo.size)})</p>}
                </div>
              </div>
            </div>

            {/* Main File Title */}
            {mainFiles.length > 0 && (
              <div className="bg-[#07090F] p-3.5 rounded-md border border-white/10">
                <label className="block mb-1.5 text-xs font-medium text-slate-300">العنوان الرئيسي للميديا</label>
                <input 
                  type="text" 
                  placeholder="عنوان الكار ميديا" 
                  value={bulkMetadata[0]?.title || ""} 
                  onChange={(e) => updateBulkMetadata(0, 'title', e.target.value)}
                  className="w-full p-2.5 rounded-md border border-white/10 bg-[#0B0E17] text-white text-xs font-medium focus:border-emerald-500/50 focus:outline-none"
                  required
                />
              </div>
            )}

            {/* Variants Section */}
            <div className="space-y-2.5">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-emerald-400">{t('mediaAdmin.variants')}</label>
                </div>

                {/* Format Presets */}
                <div className="flex flex-wrap gap-1.5 items-center bg-[#07090F] p-2.5 rounded-md border border-white/10">
                  <span className="text-[10px] text-slate-400 font-medium">{t('mediaAdmin.quickAdd')}</span>
                  <button type="button" onClick={() => addVariant("4K PRORES", "prores")} className="text-[10px] bg-white/5 hover:bg-white/10 text-slate-300 px-2 py-1 rounded-md border border-white/10 transition font-bold">+ PRORES</button>
                  <button type="button" onClick={() => addVariant("MP4 (PREVIEW)", "video")} className="text-[10px] bg-white/5 hover:bg-white/10 text-slate-300 px-2 py-1 rounded-md border border-white/10 transition font-bold">+ MP4</button>
                  <button type="button" onClick={() => addVariant("MP3", "audio")} className="text-[10px] bg-white/5 hover:bg-white/10 text-slate-300 px-2 py-1 rounded-md border border-white/10 transition font-bold">+ MP3</button>
                  <button type="button" onClick={() => addVariant("WAV", "audio")} className="text-[10px] bg-white/5 hover:bg-white/10 text-slate-300 px-2 py-1 rounded-md border border-white/10 transition font-bold">+ WAV</button>
                  <button type="button" onClick={() => addVariant("PNG SEQUENCE", "png_sequence")} className="text-[10px] bg-white/5 hover:bg-white/10 text-slate-300 px-2 py-1 rounded-md border border-white/10 transition font-bold">+ PNG SEQ.</button>
                  <button type="button" onClick={() => addVariant("MOV", "video")} className="text-[10px] bg-white/5 hover:bg-white/10 text-slate-300 px-2 py-1 rounded-md border border-white/10 transition font-bold">+ MOV</button>
                  
                  <div className="h-4 w-[1px] bg-white/10 mx-1"></div>
                  
                  <input 
                    type="file" 
                    id="bulk-variants" 
                    multiple 
                    className="hidden" 
                    onChange={(e) => handleBulkAddVariants(e)}
                    ref={bulkVariantInputRef}
                  />
                  <button 
                    type="button" 
                    onClick={() => bulkVariantInputRef.current?.click()} 
                    className="text-[10px] bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 px-2.5 py-1 rounded-md border border-emerald-500/30 transition font-bold"
                  >
                    + رفع أكثر من ملف
                  </button>
                </div>
              </div>

              {variants.length === 0 && (
                <div className="text-center p-4 border border-dashed border-white/10 rounded-md text-slate-500 text-xs">{t('mediaAdmin.noVariants')}</div>
              )}
              
              {variants.map((v, idx) => (
                <div key={idx} className="flex gap-2 items-end bg-[#07090F] p-2.5 rounded-md border border-white/10 flex-wrap">
                  {v.isIndependent && (
                    <div className="flex-[2] min-w-[180px]">
                      <label className="text-[10px] block mb-1 text-slate-400">العنوان الرئيسي</label>
                      <input 
                        type="text" 
                        className="w-full p-2 text-xs rounded-md bg-[#0B0E17] border border-white/10 text-white focus:border-emerald-500/50 focus:outline-none" 
                        value={v.title || ""} 
                        onChange={(e) => updateVariant(idx, 'title', e.target.value)} 
                        placeholder="عنوان الميديا" 
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-[100px]">
                    <label className="text-[10px] block mb-1 text-slate-400">{t('mediaAdmin.label')}</label>
                    <input type="text" className="w-full p-2 text-xs rounded-md bg-[#0B0E17] border border-white/10 text-white focus:border-emerald-500/50 focus:outline-none" value={v.label} onChange={(e) => updateVariant(idx, 'label', e.target.value)} placeholder="مثال: MP3" />
                  </div>
                  <div className="w-24">
                    <label className="text-[10px] block mb-1 text-slate-400">{t('mediaAdmin.type')}</label>
                    <select className="w-full p-2 text-xs rounded-md bg-[#0B0E17] border border-white/10 text-white focus:border-emerald-500/50 focus:outline-none" value={v.type} onChange={(e) => updateVariant(idx, 'type', e.target.value as Variant['type'])}>
                      <option value="video">{t('mediaAdmin.video')}</option>
                      <option value="audio">Audio</option>
                      <option value="image">{t('mediaAdmin.image')}</option>
                      <option value="prores">PRORES</option>
                      <option value="png_sequence">PNG SEQ.</option>
                      <option value="archive">ZIP/RAR</option>
                    </select>
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="text-[10px] block mb-1 text-slate-400">{t('mediaAdmin.file')} {v.file ? `(${formatBytes(v.file.size)})` : ''}</label>
                    <input 
                      type="file" 
                      accept={
                        v.type === 'video' || v.type === 'prores' ? 'video/*,.mov,.prores,.mxf,.zip,.rar,.7z' : 
                        v.type === 'audio' ? 'audio/*,.mp3,.wav,.zip,.rar,.7z' :
                        'image/*,.zip,.rar,.7z'
                      } 
                      className="w-full text-xs text-slate-300 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20" 
                      onChange={(e) => updateVariant(idx, 'file', e.target.files ? e.target.files[0] : null)} 
                    />
                  </div>
                  <button type="button" onClick={() => removeVariant(idx)} className="text-red-400 hover:text-red-500 p-2 bg-red-500/10 hover:bg-red-500/20 rounded-md transition-colors"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>

            {/* Total Size Display */}
            {getTotalSize() > 0 && (
              <div className="bg-[#07090F] border border-white/10 rounded-md p-3 flex items-center justify-between">
                <span className="text-xs text-slate-400">إجمالي حجم الملفات:</span>
                <span className="text-sm font-bold text-emerald-400">{formatBytes(getTotalSize())}</span>
              </div>
            )}

            <button disabled={isUploading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-md text-xs flex justify-center items-center gap-2 disabled:opacity-50 transition-colors">
              {isUploading ? t('mediaAdmin.uploading') : t('mediaAdmin.uploadEverything')}
            </button>
          </form>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && (
        <div className="max-w-7xl mx-auto space-y-4">
          {loadingAnalytics ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
            </div>
          ) : analytics ? (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Total Downloads */}
                <div className="bg-[#0B0E17] border border-white/[0.08] rounded-md p-4 transition-colors hover:border-white/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400 font-medium">إجمالي التحميلات</span>
                    <span className="text-[10px] text-emerald-400 font-bold">الكل</span>
                  </div>
                  <h3 className="text-2xl font-black text-white mb-0.5">{analytics.totalDownloads?.toLocaleString() || 0}</h3>
                  <p className="text-slate-500 text-[10px]">كافة الملفات</p>
                </div>

                {/* Downloads Today */}
                <div className="bg-[#0B0E17] border border-white/[0.08] rounded-md p-4 transition-colors hover:border-white/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400 font-medium">تحميلات اليوم</span>
                    <span className="text-[10px] text-emerald-400 font-bold">اليوم</span>
                  </div>
                  <h3 className="text-2xl font-black text-white mb-0.5">{analytics.downloadsToday?.toLocaleString() || 0}</h3>
                  <p className="text-slate-500 text-[10px]">خلال 24 ساعة</p>
                </div>

                {/* Downloads This Month */}
                <div className="bg-[#0B0E17] border border-white/[0.08] rounded-md p-4 transition-colors hover:border-white/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400 font-medium">تحميلات الشهر</span>
                    <span className="text-[10px] text-emerald-400 font-bold">الشهر</span>
                  </div>
                  <h3 className="text-2xl font-black text-white mb-0.5">{analytics.downloadsThisMonth?.toLocaleString() || 0}</h3>
                  <p className="text-slate-500 text-[10px]">خلال الشهر الحالي</p>
                </div>

                {/* Unique Users */}
                <div className="bg-[#0B0E17] border border-white/[0.08] rounded-md p-4 transition-colors hover:border-white/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400 font-medium">مستخدمين فريدين</span>
                    <span className="text-[10px] text-emerald-400 font-bold">المستخدمين</span>
                  </div>
                  <h3 className="text-2xl font-black text-white mb-0.5">{analytics.uniqueDownloaders?.toLocaleString() || 0}</h3>
                  <p className="text-slate-500 text-[10px]">قاموا بالتحميل</p>
                </div>
              </div>

              {/* Additional Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-[#0B0E17] border border-white/[0.08] rounded-md p-4">
                  <h4 className="text-xs font-medium text-slate-400 mb-1">التصنيفات</h4>
                  <p className="text-2xl font-black text-white">{analytics.totalCategories || 0}</p>
                </div>

                <div className="bg-[#0B0E17] border border-white/[0.08] rounded-md p-4">
                  <h4 className="text-xs font-medium text-slate-400 mb-1">الملفات</h4>
                  <p className="text-2xl font-black text-white">{analytics.totalFiles || 0}</p>
                </div>

                <div className="bg-[#0B0E17] border border-white/[0.08] rounded-md p-4">
                  <h4 className="text-xs font-medium text-slate-400 mb-1">زيارات Media Hub</h4>
                  <p className="text-2xl font-black text-white">{analytics.pageViews?.toLocaleString() || 0}</p>
                </div>
              </div>

              {/* Top Downloaded Files */}
              {analytics.topFiles && analytics.topFiles.length > 0 && (
                <div className="bg-[#0B0E17] border border-white/[0.08] rounded-md p-4">
                  <h3 className="text-xs font-bold mb-3 text-emerald-400">
                    الملفات الأكثر تحميلاً (أفضل 3)
                  </h3>
                  <div className="space-y-2">
                    {analytics.topFiles.slice(0, 3).map((item: any, idx: number) => (
                      <div key={item.file_id} className="flex items-center gap-3 p-3 bg-[#0F121C] rounded-md border border-white/[0.08] hover:border-white/20 transition-colors">
                        <div className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center flex-shrink-0">
                          <span className="text-emerald-400 font-bold text-xs">#{idx + 1}</span>
                        </div>
                        
                        {item.file?.thumbnail_url && (
                          <div className="w-12 h-12 rounded-md overflow-hidden bg-black/40 flex-shrink-0">
                            <img src={item.file.thumbnail_url} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-xs text-white truncate">{item.file?.title || 'Unknown'}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-[10px] text-slate-400">{item.file?.file_type || 'N/A'}</p>
                            {item.file?.category?.name && (
                              <>
                                <span className="text-white/20">•</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 text-slate-400 border border-white/10">
                                  {item.file.category.name}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-base font-black text-emerald-400">{item.download_count}</p>
                          <p className="text-[10px] text-slate-400">تحميل</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center p-8 text-slate-500">
              <p className="text-xs">لا توجد إحصائيات متاحة</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MediaAdminPage;
