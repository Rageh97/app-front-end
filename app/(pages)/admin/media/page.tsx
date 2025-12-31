"use client";

import React, { useState, useEffect } from "react";
import axios from "@/utils/api";
import { Trash2, Edit, Upload, FolderPlus, Film, Image as ImageIcon, Plus, X, Eye, EyeOff } from "lucide-react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

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
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 transition-colors font-bold"
          >
            {confirmText}
          </button>
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

  // Media Hub Visibility State
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
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'category' | 'file' | null;
    id: number | null;
  }>({ isOpen: false, type: null, id: null });

  // Upload Form
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploadCategory, setUploadCategory] = useState("");
  const [mainFileType, setMainFileType] = useState<"video" | "image">("image");
  const [mainFile, setMainFile] = useState<File | null>(null);
  const [previewVideo, setPreviewVideo] = useState<File | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    fetchCategories();
    fetchMediaHubSetting();
  }, []);

  const fetchMediaHubSetting = async () => {
    try {
      const res = await axios.get("/api/admin/settings/media_hub_enabled");
      // If value is explicitly "false", then it is disabled. Default to true if not set or "true".
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
      
      // Notify other components (like Sidebar) about the change
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('settingsChanged', { 
          detail: { key: 'media_hub_enabled', value: newValue } 
        });
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

  const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

  // --- Category Handlers ---

  const handleCreateOrUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("name", catName);
      formData.append("description", catDesc);
      if (catCover) formData.append("coverImage", catCover);

      if (editingCatId) {
        await axios.put(`/api/media/categories/${editingCatId}`, formData, {
           headers: { "Content-Type": "multipart/form-data" }
        });
        toast.success(t('mediaAdmin.successUpdated'));
      } else {
        await axios.post("/api/media/categories", formData, {
           headers: { "Content-Type": "multipart/form-data" }
        });
        toast.success(t('mediaAdmin.successCreated'));
      }
      setCatName("");
      setCatDesc("");
      setCatCover(null);
      setEditingCatId(null);
      fetchCategories();
    } catch (err) {
      toast.error(t('mediaAdmin.failedOperation'));
    }
  };

  const handleEditCategory = (cat: Category) => {
    setEditingCatId(cat.category_id);
    setCatName(cat.name);
    setCatDesc(cat.description);
  };

  const handleCancelEdit = () => {
    setEditingCatId(null);
    setCatName("");
    setCatDesc("");
  };

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
      fetchCategories(); // Refresh counts
    } catch (err) {
      toast.error(t('mediaAdmin.failedDeleteFile'));
    }
    setDeleteModal({ isOpen: false, type: null, id: null });
  };

  const openDeleteModal = (type: 'category' | 'file', id: number) => {
    setDeleteModal({ isOpen: true, type, id });
  };

  // --- Upload Handlers ---

  const handleMainFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMainFile(e.target.files[0]);
    }
  };

  const addVariant = (label = "", type: Variant['type'] = "image") => {
    // Default to mainType if none specified
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
    // @ts-ignore
    newVars[index][field] = value;
    setVariants(newVars);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mainFile || !uploadCategory) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("categoryId", uploadCategory);
      formData.append("title", uploadTitle);
      formData.append("description", uploadDesc);
      formData.append("mainFileType", mainFileType);
      formData.append("mainFile", mainFile);
      if (previewVideo) {
        formData.append("previewVideo", previewVideo);
      }

      const variantMetadata: any[] = [];
      variants.forEach((v) => {
        if (v.file) {
          formData.append("variantFiles", v.file);
          variantMetadata.push({
            type: v.type,
            label: v.label || v.type.toUpperCase(),
          });
        }
      });

      formData.append("variantsMetadata", JSON.stringify(variantMetadata));

      const uploadPromise = axios.post("/api/media/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setUploadProgress(percentCompleted);
        },
      });

      await uploadPromise;

      toast.success(t('mediaAdmin.successUpload'));
      // Reset Form
      setUploadTitle("");
      setUploadDesc("");
      setMainFile(null);
      setPreviewVideo(null);
      setVariants([]);
      setUploadProgress(0);
    } catch (err: any) {
      console.error(err);
      toast.error(t('mediaAdmin.failedUpload') + " " + (err.response?.data || err.message));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (uploading) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [uploading]);

  return (
    <div className="p-6  min-h-screen text-white dark:text-gray-200">
      {/* Professional Upload Progress Overlay */}
      {uploading && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-[#190237] border border-orange/30 w-full max-w-lg rounded-[2rem] p-10 shadow-[0_0_100px_rgba(255,119,2,0.2)] scale-in-center overflow-hidden relative">
              {/* Background Glow */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-orange/20 blur-[80px] rounded-full"></div>
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#00c48c]/20 blur-[80px] rounded-full"></div>

              <div className="relative z-10 flex flex-col items-center">
                 <div className="w-20 h-20 bg-orange/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <Upload size={36} className="text-orange" />
                 </div>
                 
                 <h3 className="text-2xl font-black mb-2 tracking-tight">{t('mediaAdmin.uploading')}...</h3>
                 <p className="text-white/40 text-sm mb-10 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-xs">{uploadTitle || "Media Asset"}</p>

                 {/* Progress Container */}
                 <div className="w-full space-y-4">
                    <div className="flex justify-between items-end mb-1">
                       <span className="text-xs font-bold uppercase tracking-widest text-orange">Server Sync Progress</span>
                       <span className="text-3xl font-black text-white">{uploadProgress}%</span>
                    </div>
                    
                    <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden p-1 border border-white/10">
                       <div 
                         className="h-full bg-gradient-to-r from-orange via-orange to-[#00c48c] rounded-full transition-all duration-300 ease-out shadow-[0_0_20px_rgba(255,119,2,0.4)]"
                         style={{ width: `${uploadProgress}%` }}
                       ></div>
                    </div>
                    
                    {/* <div className="flex justify-between items-center text-[9px] text-white/30 uppercase tracking-[0.2em] font-bold py-2">
                       <span>Processing Chunks</span>
                       <span className="animate-pulse">Resumable Session Active</span>
                    </div> */}

                    <p className="text-center text-[10px] text-orange uppercase tracking-[0.2em] pt-4">
                       Please do not close this tab until finished
                    </p>
                 </div>
              </div>
           </div>
        </div>
      )}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold">{t('mediaAdmin.pageTitle')}</h1>
        <button
          onClick={toggleMediaHub}
          className={`px-4 py-2 rounded-lg font-bold transition-all transform hover:scale-105 flex items-center gap-2 shadow-lg ${isMediaHubEnabled ? 'bg-red-500/10 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-green-500/10 border border-green-500/50 text-green-500 hover:bg-green-500 hover:text-white'}`}
        >
          {isMediaHubEnabled ? <EyeOff size={18} /> : <Eye size={18} />}
          <span>{isMediaHubEnabled ? "إخفاء المكتبة من الموقع" : "إظهار المكتبة  في الموقع"}</span>
        </button>
      </div>
      
      <div className="flex gap-4 mb-8">
        <button 
          onClick={() => setActiveTab("categories")}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${activeTab === "categories" ? "bg-orange text-white inner-shadow" : "bg-[#190237]  text-white"}`}
        >
          <FolderPlus size={18} /> {t('mediaAdmin.categoriesTab')}
        </button>
        <button 
          onClick={() => setActiveTab("uploads")}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${activeTab === "uploads" ? "bg-orange text-white inner-shadow" : "bg-[#190237]  text-white"}`}
        >
          <Upload size={18} /> {t('mediaAdmin.uploadsTab')}
        </button>
      </div>

      {activeTab === "categories" && (
        <div className="grid md:grid-cols-1 gap-8">
          <div className="bg-[#190237]  p-6 rounded-xl shadow-lg h-fit">
            <h2 className="text-xl font-semibold mb-4">{editingCatId ? t('mediaAdmin.editCategory') : t('mediaAdmin.addCategory')}</h2>
            <form onSubmit={handleCreateOrUpdateCategory} className="flex flex-col gap-4">
              <input
                type="text"
                placeholder={t('mediaAdmin.categoryName')}
                className="p-3 rounded-lg border border-[#00c48c]  bg-white text-black"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                required
              />
              <textarea
                placeholder={t('mediaAdmin.description')}
                className="p-3 rounded-lg border border-[#00c48c]  bg-white text-black"
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
              />
              <div className="flex flex-col gap-2">
                 <label className="text-sm font-bold opacity-70 text-white">رفع صورة التصنيف</label>
                 <input 
                   type="file" 
                   accept="image/*" 
                   onChange={(e) => setCatCover(e.target.files?.[0] || null)}
                   className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-orange/10 file:text-orange hover:file:bg-orange/20"
                 />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-orange hover:bg-orange/80 text-white font-bold py-2 rounded-lg transition">
                  {editingCatId ? t('mediaAdmin.update') : t('mediaAdmin.create')}
                </button>
                {editingCatId && (
                  <button type="button" onClick={handleCancelEdit} className="bg-gray-500 text-white px-4 py-2 rounded-lg">
                    {t('mediaAdmin.cancel')}
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="bg-[#190237]  p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4">{t('mediaAdmin.existingCategories')}</h2>
            {loading ? <p>{t('common.loading')}</p> : (
              <div className="space-y-3 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {categories.map(cat => (
                  <div 
                    key={cat.category_id} 
                    className={`flex flex-col p-2.5 bg-white text-black rounded-xl shadow-sm cursor-pointer transition-all hover:shadow-md ${selectedCatId === cat.category_id ? 'ring-2 ring-orange scale-[1.02]' : ''}`} 
                    onClick={() => handleViewFiles(cat.category_id)}
                  >
                    <div className="mb-2">
                      <h4 className="font-bold text-sm truncate">{cat.name}</h4>
                      <p className="text-[10px] opacity-60 truncate">{cat.description || '-'}</p>
                    </div>
                    <div className="flex justify-between items-center mt-auto pt-2 border-t border-gray-100">
                      <span className="text-[10px] bg-orange/10 text-orange px-1.5 py-0.5 rounded-md font-medium">
                        {cat.filesCount || 0}
                      </span>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => handleEditCategory(cat)} className="text-blue-500 hover:bg-blue-50 p-1 rounded transition-colors">
                          <Edit size={14} />
                        </button>
                        <button onClick={() => openDeleteModal('category', cat.category_id)} className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors">
                          <Trash2 size={14} />
                        </button>
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
                <button onClick={() => setSelectedCatId(null)} className="text-gray-400 hover:text-white bg-white/5 p-1.5 rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>

              {loadingFiles ? (
                <div className="flex justify-center p-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange"></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                  {categoryFiles.map((file) => (
                    <div key={file.file_id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden group hover:border-orange/50 transition-all hover:shadow-xl">
                      <div className="aspect-[4/3] relative bg-black/40 flex items-center justify-center">
                        {file.type === 'video' ? (
                          <Film size={28} className="text-orange/40" />
                        ) : (
                          <ImageIcon size={28} className="text-orange/40" />
                        )}
                        {file.thumbnail_url && (
                          <img 
                            src={file.thumbnail_url} 
                            alt="" 
                            className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" 
                          />
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                           <button 
                             onClick={() => openDeleteModal('file', file.file_id)}
                             className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transform scale-90 group-hover:scale-100 transition-transform shadow-lg"
                             title={t('mediaAdmin.deleteFile')}
                           >
                             <Trash2 size={16} />
                           </button>
                        </div>
                      </div>
                      <div className="p-2 bg-black/20">
                        <h4 className="font-medium text-[10px] truncate mb-0.5">{file.title}</h4>
                        <p className="text-[9px] text-white/40 uppercase tracking-tight">
                          {file.type === 'video' ? t('mediaAdmin.video') : t('mediaAdmin.image')}
                        </p>
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
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white"><Upload /> {t('mediaAdmin.uploadNewMedia')}</h2>
          <form onSubmit={handleUpload} className="space-y-6">
            
            {/* Metadata */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-medium text-white">{t('mediaAdmin.selectCategory')}</label>
                <select 
                  className="w-full p-3 rounded-lg border border-[#00c48c]  bg-white text-black"
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  required
                >
                  <option value="">{t('mediaAdmin.chooseCategory')}</option>
                  {categories.map(cat => (
                    <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2 font-medium text-white">{t('mediaAdmin.title')}</label>
                <input 
                  type="text" 
                  className="w-full p-3 rounded-lg border border-[#00c48c]  bg-white text-black"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  required
                />
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

                <input 
                  type="file" 
                  accept={mainFileType === 'video' ? 'video/*,.mov,.prores,.mxf,.zip,.rar,.7z' : 'image/*,.zip,.rar,.7z'}
                  onChange={handleMainFileChange}
                  required
                  className="w-full text-sm text-white"
                />
              </div>

              <div className="border border-[#00c48c]/30 bg-[#00c48c]/5 p-4 rounded-lg">
                <h3 className="font-bold mb-3 flex items-center gap-2 text-white"><Film size={18} /> Hover Video Preview </h3>
                
                <input 
                  type="file" 
                  accept="video/*"
                  onChange={(e) => setPreviewVideo(e.target.files?.[0] || null)}
                  className="w-full text-sm text-white mt-10"
                />
              </div>
            </div>

            {/* Variants */}
            <div className="space-y-3">
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <label className="font-medium text-white">{t('mediaAdmin.variants')}</label>
                  {/* <div className="flex gap-2">
                     <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 transition">
                        <Plus size={14} /> {t('mediaAdmin.bulkAdd')}
                        <input 
                          type="file" 
                          multiple 
                          className="hidden" 
                          onChange={(e) => {
                            if (e.target.files) {
                              const newFiles = Array.from(e.target.files);
                              const newVariants: Variant[] = newFiles.map(f => {
                                const ext = f.name.split('.').pop()?.toUpperCase() || '';
                                let label = ext;
                                let type: "image" | "video" = f.type.startsWith('video') ? 'video' : 'image';
                                
                                if (ext === 'MOV' || ext === 'MP4') type = 'video';
                                if (ext === 'PRORES') {
                                    type = 'video';
                                    label = 'PRORES';
                                }
                                
                                return { file: f, type, label };
                              });
                              setVariants(prev => [...prev, ...newVariants]);
                            }
                          }}
                        />
                     </label>
                     <button type="button" onClick={() => addVariant()} className="text-xs bg-gray-600 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition">
                       <Plus size={14} /> {t('mediaAdmin.addEmptyRow')}
                     </button>
                  </div> */}
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
                <div className="text-center p-6 border border-dashed border-[#00c48c] rounded-lg text-gray-400 text-sm">
                   {t('mediaAdmin.noVariants')}
                </div>
              )}
              
              {variants.map((v, idx) => (
                <div key={idx} className="flex gap-3 items-end bg-black/20 p-3 rounded-lg border border-gray-700">
                  <div className="flex-1">
                    <label className="text-xs block mb-1 opacity-70 text-white">{t('mediaAdmin.label')}</label>
                    <input 
                      type="text"
                      className="w-full p-2 text-sm rounded bg-white text-black border-none focus:ring-1 focus:ring-orange" 
                      value={v.label}
                      onChange={(e) => updateVariant(idx, 'label', e.target.value)}
                      placeholder="e.g. 4K"
                    />
                  </div>
                  <div className="w-24">
                    <label className="text-xs block mb-1 opacity-70 text-white">{t('mediaAdmin.type')}</label>
                    <select 
                      className="w-full p-2 text-sm rounded bg-white text-black border-none focus:ring-1 focus:ring-orange"
                      value={v.type}
                      onChange={(e) => updateVariant(idx, 'type', e.target.value as Variant['type'])}
                    >
                      <option value="video">{t('mediaAdmin.video')}</option>
                      <option value="image">{t('mediaAdmin.image')}</option>
                      <option value="prores">PRORES</option>
                      <option value="png_sequence">PNG SEQ.</option>
                      <option value="archive">ZIP/RAR</option>
                    </select>
                  </div>
                  <div className="flex-1 min-w-0">
                     <label className="text-xs block mb-1 opacity-70 text-white">{t('mediaAdmin.file')} {v.file ? `(${Math.round(v.file.size / 1024)} KB)` : ''}</label>
                     <div className="relative"> 
                        <input 
                          type="file" 
                          accept={v.type === 'video' ? 'video/*,.mov,.prores,.mxf,.zip,.rar,.7z' : 'image/*,.zip,.rar,.7z'}
                          className="w-full text-xs text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-orange/10 file:text-orange hover:file:bg-orange/20"
                          onChange={(e) => updateVariant(idx, 'file', e.target.files ? e.target.files[0] : null)}
                        />
                     </div>
                  </div>
                  <button type="button" onClick={() => removeVariant(idx)} className="text-red-400 hover:text-red-600 p-2 bg-red-400/10 hover:bg-red-400/20 rounded-lg transition"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>

            <button 
              disabled={uploading}
              className="w-full bg-orange hover:bg-orange/80 text-white font-bold py-3 rounded-lg flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {uploading ? t('mediaAdmin.uploading') : <><Upload size={20} /> {t('mediaAdmin.uploadEverything')}</>}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default MediaAdminPage;
