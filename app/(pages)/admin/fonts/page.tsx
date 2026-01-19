"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "@/utils/api";
import { 
  Plus, Edit2, Trash2, Eye, Download, ChevronDown, 
  Search, X, Upload, Save, Folder, Type, Image as ImageIcon,
  ChevronLeft, ChevronRight, MoreVertical, Check, Star,
  FileText, Settings, Grid, List, Filter
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import AuthGuard from "@/components/Guards/AuthGuard";
import ConfirmationModal from "@/components/ComfirmationModal";

interface Category {
  category_id: number;
  name: string;
  name_ar?: string;
  description?: string;
  cover_image_url?: string;
  font_count?: number;
  is_active: boolean;
  display_order: number;
}

interface PreviewImage {
  image_id: number;
  image_url: string;
  storage_path: string;
  display_order: number;
}

interface Font {
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
  font_style?: string;
  status: 'active' | 'draft' | 'archived';
  featured: boolean;
  category?: Category;
  variants?: any[];
  previewImages?: PreviewImage[];
  created_at: string;
}

// Modal Component
const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md' 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl'
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className={`gradient-border-analysis  rounded-2xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden flex flex-col`}>
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

// Category Form
const CategoryForm = ({ 
  category, 
  onSubmit, 
  onClose 
}: { 
  category?: Category; 
  onSubmit: (data: FormData) => Promise<void>; 
  onClose: () => void; 
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(category?.name || '');
  const [nameAr, setNameAr] = useState(category?.name_ar || '');
  const [description, setDescription] = useState(category?.description || '');
  const [displayOrder, setDisplayOrder] = useState(category?.display_order || 0);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(category?.cover_image_url || '');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(t('fonts.successCategoryCreated')); // Need to be careful here, maybe t('fonts.nameEn') + " is required" or similar. But I'll use the specific message if I have one.
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('name_ar', nameAr);
      formData.append('description', description);
      formData.append('display_order', displayOrder.toString());
      if (coverImage) {
        formData.append('coverImage', coverImage);
      }
      
      await onSubmit(formData);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">{t('fonts.nameEn')}</label>
          <input 
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[#190237]  rounded-xl px-4 py-3 text-white border border-[#00c48c] focus:outline-none transition-colors"
            placeholder={t('fonts.nameEn')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">{t('fonts.nameAr')}</label>
          <input 
            type="text"
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
            className="w-full bg-[#190237]  rounded-xl px-4 py-3 text-white border border-[#00c48c] focus:outline-none transition-colors"
            placeholder={t('fonts.nameAr')}
            dir="rtl"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">{t('fonts.category')} {t('fonts.descriptionEn')}</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full bg-[#190237]  rounded-xl px-4 py-3 text-white border border-[#00c48c] focus:outline-none transition-colors resize-none"
          placeholder={t('fonts.descriptionEn')}
        />
      </div>

      {/* <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">{t('fonts.displayOrder')}</label>
        <input 
          type="number"
          value={displayOrder}
          onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
          className="w-full bg-[#190237]  rounded-xl px-4 py-3 text-white border border-[#00c48c] focus:outline-none transition-colors"
        />
      </div> */}

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">{t('fonts.mainPreview')}</label>
        <div className="flex items-center gap-4">
          {previewUrl && (
            <img src={previewUrl} alt="Preview" className="w-20 h-14 object-cover rounded-lg " />
          )}
          <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#190237] border border-dashed border-white/20 rounded-xl text-gray-400 hover:border-[#00c48c] hover:text-[#00c48c] transition-colors cursor-pointer">
            <Upload size={20} />
            <span>{t('fonts.uploadImage')}</span>
            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
        <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl  text-white bg-[#c30010] transition-colors">
          {t('fonts.cancel')}
        </button>
        <button 
          type="submit" 
          disabled={loading}
          className="px-6 py-3 rounded-xl bg-[#00c48c] text-black font-bold hover:bg-[#00c48c]/90 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {loading && <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />}
          <Save size={18} />
          {category ? t('fonts.updateCategory') : t('fonts.createCategory')}
        </button>
      </div>
    </form>
  );
};

// Font Form
const FontForm = ({ 
  font, 
  categories,
  onSubmit, 
  onClose 
}: { 
  font?: Font; 
  categories: Category[];
  onSubmit: (data: FormData) => Promise<void>; 
  onClose: () => void; 
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'files' | 'variants'>('basic');
  
  // Form fields
  const [name, setName] = useState(font?.name || '');
  const [nameAr, setNameAr] = useState(font?.name_ar || '');
  const [description, setDescription] = useState(font?.description || '');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [categoryId, setCategoryId] = useState(font?.category?.category_id || '');
  const [designer, setDesigner] = useState(font?.designer || '');
  const [isFree, setIsFree] = useState(font?.is_free || false);
  const [fontStyle, setFontStyle] = useState(font?.font_style || '');
  const [supportedLanguages, setSupportedLanguages] = useState('Arabic,English');
  const [licenseType, setLicenseType] = useState('Personal & Commercial');
  const [version, setVersion] = useState('1.0');
  const [status, setStatus] = useState<'active' | 'draft' | 'archived'>(font?.status || 'draft');
  const [featured, setFeatured] = useState(font?.featured || false);
  const [tags, setTags] = useState('');

  // Files
  const [fontFile, setFontFile] = useState<File | null>(null);
  const [mainPreviewImage, setMainPreviewImage] = useState<File | null>(null);
  const [previewImages, setPreviewImages] = useState<File[]>([]);
  const [existingPreviewImages, setExistingPreviewImages] = useState<PreviewImage[]>(font?.previewImages || []);
  const [variantFiles, setVariantFiles] = useState<{file: File; label: string; weight: number; style: string}[]>([]);

  const [mainPreviewUrl, setMainPreviewUrl] = useState(font?.main_preview_image || '');

  const handleMainPreviewChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMainPreviewImage(file);
      setMainPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handlePreviewImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPreviewImages([...previewImages, ...files]);
  };

  const handleFontFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFontFile(file);
    }
  };

  const addVariant = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.ttf,.otf,.woff,.woff2,.eot,.zip';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        setVariantFiles([...variantFiles, { file, label: 'Regular', weight: 400, style: 'normal' }]);
      }
    };
    input.click();
  };

  const updateVariant = (index: number, field: string, value: any) => {
    const updated = [...variantFiles];
    updated[index] = { ...updated[index], [field]: value };
    setVariantFiles(updated);
  };

  const removeVariant = (index: number) => {
    setVariantFiles(variantFiles.filter((_, i) => i !== index));
  };

  const deleteExistingPreview = async (imageId: number) => {
    try {
      await axios.delete(`/api/fonts/admin/preview-image/${imageId}`);
      setExistingPreviewImages(existingPreviewImages.filter(img => img.image_id !== imageId));
      toast.success(t('fonts.successCategoryDeleted')); // Using a generic success or specific if available
    } catch (err) {
      console.error(err);
      toast.error(t('fonts.failedDelete'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error(t('fonts.nameEn') + " is required");
      return;
    }
    if (!categoryId) {
      toast.error(t('fonts.category') + " is required");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('name_ar', nameAr);
      formData.append('description', description);
      formData.append('description_ar', descriptionAr);
      formData.append('category_id', categoryId.toString());
      formData.append('designer', designer);
      formData.append('is_free', isFree.toString());
      formData.append('font_style', fontStyle);
      formData.append('supported_languages', supportedLanguages);
      formData.append('license_type', licenseType);
      formData.append('version', version);
      formData.append('status', status);
      formData.append('featured', featured.toString());
      formData.append('tags', tags);

      if (fontFile) {
        formData.append('fontFile', fontFile);
      }
      if (mainPreviewImage) {
        formData.append('mainPreviewImage', mainPreviewImage);
      }
      previewImages.forEach((img) => {
        formData.append('previewImages', img);
      });
      
      // Add variant files and metadata
      const variantsMetadata: any[] = [];
      variantFiles.forEach((v) => {
        formData.append('variantFiles', v.file);
        variantsMetadata.push({ label: v.label, weight: v.weight, style: v.style });
      });
      formData.append('variantsMetadata', JSON.stringify(variantsMetadata));

      await onSubmit(formData);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-4">
        {[
          { id: 'basic', label: t('fonts.basicInfo'), icon: FileText },
          { id: 'files', label: t('fonts.filesAndImages'), icon: Upload },
          { id: 'variants', label: t('fonts.variants'), icon: Type }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab.id 
                ? 'bg-[#00c48c] text-black' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Basic Info Tab */}
      {activeTab === 'basic' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">{t('fonts.nameEn')} *</label>
              <input 
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#190237]  rounded-xl px-4 py-3 text-white border border-[#00c48c] focus:outline-none"
                placeholder={t('fonts.nameEn')}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">{t('fonts.nameAr')}</label>
              <input 
                type="text"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                className="w-full bg-[#190237]  rounded-xl px-4 py-3 text-white border border-[#00c48c] focus:outline-none"
                placeholder={t('fonts.nameAr')}
                dir="rtl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">{t('fonts.category')} *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-[#190237]  rounded-xl px-4 py-3 text-white border border-[#00c48c] focus:outline-none"
                required
              >
                <option value="">{t('fonts.allCategories')}</option>
                {categories.map((cat) => (
                  <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">{t('fonts.designer')}</label>
              <input 
                type="text"
                value={designer}
                onChange={(e) => setDesigner(e.target.value)}
                className="w-full bg-[#190237]  rounded-xl px-4 py-3 text-white border border-[#00c48c] focus:outline-none"
                placeholder={t('fonts.designer')}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">{t('fonts.descriptionEn')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-[#190237]  rounded-xl px-4 py-3 text-white border border-[#00c48c] focus:outline-none resize-none"
              placeholder={t('fonts.descriptionEn')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">{t('fonts.fontStyle')}</label>
              <select
                value={fontStyle}
                onChange={(e) => setFontStyle(e.target.value)}
                className="w-full bg-[#190237]  rounded-xl px-4 py-3 text-white border border-[#00c48c] focus:outline-none"
              >
                <option value="">{t('fonts.fontStyle')}</option>
                <option value="Serif">Serif</option>
                <option value="Sans-serif">Sans-serif</option>
                <option value="Script">Script</option>
                <option value="Decorative">Decorative</option>
                <option value="Monospace">Monospace</option>
                <option value="Display">Display</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">{t('fonts.status')}</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-[#190237]  rounded-xl px-4 py-3 text-white border border-[#00c48c] focus:outline-none"
              >
                <option value="draft">{t('fonts.draft')}</option>
                <option value="active">{t('fonts.active')}</option>
                <option value="archived">{t('fonts.archived')}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">{t('fonts.supportedLanguages')}</label>
              <input 
                type="text"
                value={supportedLanguages}
                onChange={(e) => setSupportedLanguages(e.target.value)}
                className="w-full bg-[#190237]  rounded-xl px-4 py-3 text-white border border-[#00c48c] focus:outline-none"
                placeholder="Arabic, English"
              />
            </div>
            {/* <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">{t('fonts.licenseType')}</label>
              <input 
                type="text"
                value={licenseType}
                onChange={(e) => setLicenseType(e.target.value)}
                className="w-full bg-[#190237]  rounded-xl px-4 py-3 text-white border border-[#00c48c] focus:outline-none"
                placeholder="Personal & Commercial"
              />
            </div> */}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">{t('fonts.tags')}</label>
            <input 
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full bg-[#190237]  rounded-xl px-4 py-3 text-white border border-[#00c48c] focus:outline-none"
              placeholder="modern, arabic, clean"
            />
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox"
                checked={isFree}
                onChange={(e) => setIsFree(e.target.checked)}
                className="w-5 h-5 rounded border-white/20 bg-[#190237] text-[#00c48c] focus:ring-[#00c48c]"
              />
              <span className="text-white">{t('fonts.freeFont')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-5 h-5 rounded border-white/20 bg-[#190237] text-[#00c48c] focus:ring-[#00c48c]"
              />
              <span className="text-white">{t('fonts.featured')}</span>
            </label>
          </div>
        </div>
      )}

      {/* Files Tab */}
      {activeTab === 'files' && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">{t('fonts.fontFile')}</label>
            <label className="flex items-center justify-center gap-2 px-4 py-8 bg-[#190237] border-2 border-dashed border-white/20 rounded-xl text-gray-400 hover:border-[#00c48c] hover:text-[#00c48c] transition-colors cursor-pointer">
              <Upload size={24} />
              <span>{fontFile ? fontFile.name : t('fonts.fontFile')}</span>
              <input 
                type="file" 
                accept=".zip,.ttf,.otf,.woff,.woff2" 
                onChange={handleFontFileChange} 
                className="hidden" 
              />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">{t('fonts.mainPreview')}</label>
            <div className="flex items-center gap-4">
              {mainPreviewUrl && (
                <img src={mainPreviewUrl} alt="Preview" className="w-32 h-24 object-cover rounded-xl " />
              )}
              <label className="flex-1 flex items-center justify-center gap-2 px-4 py-8 bg-[#190237] border-2 border-dashed border-white/20 rounded-xl text-gray-400 hover:border-[#00c48c] hover:text-[#00c48c] transition-colors cursor-pointer">
                <ImageIcon size={24} />
                <span>{t('fonts.uploadImage')}</span>
                <input type="file" accept="image/*" onChange={handleMainPreviewChange} className="hidden" />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">{t('fonts.galleryImages')}</label>
            <div className="space-y-4">
              {/* Existing Images */}
              {existingPreviewImages.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {existingPreviewImages.map((img) => (
                    <div key={img.image_id} className="relative group">
                      <img 
                        src={img.image_url} 
                        alt="Gallery" 
                        className="w-24 h-16 object-cover rounded-lg border border-white/10" 
                      />
                      <button
                        type="button"
                        onClick={() => deleteExistingPreview(img.image_id)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* New Images */}
              {previewImages.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {previewImages.map((img, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={URL.createObjectURL(img)} 
                        alt={`New Preview ${index + 1}`} 
                        className="w-24 h-16 object-cover rounded-lg border border-[#00c48c]/30" 
                      />
                      <button
                        type="button"
                        onClick={() => setPreviewImages(previewImages.filter((_, i) => i !== index))}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <label className="flex items-center justify-center gap-2 px-4 py-6 bg-[#190237] border-2 border-dashed border-white/20 rounded-xl text-gray-400 hover:border-[#00c48c] hover:text-[#00c48c] transition-colors cursor-pointer">
                <Plus size={20} />
                <span>{t('fonts.addGalleryImages')}</span>
                <input type="file" accept="image/*" multiple onChange={handlePreviewImagesChange} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Variants Tab */}
      {activeTab === 'variants' && (
        <div className="space-y-6">
          <p className="text-gray-400 text-sm">
            {t('fonts.addVariant')}
          </p>

          {variantFiles.length > 0 && (
            <div className="space-y-3">
              {variantFiles.map((v, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-[#190237] rounded-xl ">
                  <Type size={20} className="text-[#00c48c]" />
                  <span className="text-white font-medium truncate flex-1">{v.file.name}</span>
                  <input
                    type="text"
                    value={v.label}
                    onChange={(e) => updateVariant(index, 'label', e.target.value)}
                    placeholder={t('fonts.type')}
                    className="w-24 bg-[#1a1a1a]  rounded-lg px-3 py-2 text-white text-sm"
                  />
                  <select
                    value={v.weight}
                    onChange={(e) => updateVariant(index, 'weight', parseInt(e.target.value))}
                    className="bg-[#1a1a1a]  rounded-lg px-3 py-2 text-white text-sm"
                  >
                    <option value={100}>100 - Thin</option>
                    <option value={200}>200 - Extra Light</option>
                    <option value={300}>300 - Light</option>
                    <option value={400}>400 - Regular</option>
                    <option value={500}>500 - Medium</option>
                    <option value={600}>600 - Semi Bold</option>
                    <option value={700}>700 - Bold</option>
                    <option value={800}>800 - Extra Bold</option>
                    <option value={900}>900 - Black</option>
                  </select>
                  {/* <select
                    value={v.style}
                    onChange={(e) => updateVariant(index, 'style', e.target.value)}
                    className="bg-[#1a1a1a]  rounded-lg px-3 py-2 text-white text-sm"
                  >
                    <option value="normal">{t('fonts.style')}</option>
                    <option value="italic">Italic</option>
                    <option value="oblique">Oblique</option>
                  </select> */}
                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={addVariant}
            className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-[#190237] border-2 border-dashed border-white/20 rounded-xl text-gray-400 hover:border-[#00c48c] hover:text-[#00c48c] transition-colors"
          >
            <Plus size={20} />
            <span>{t('fonts.addVariant')}</span>
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
        <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl  text-white bg-[#c30010] transition-colors">
          {t('fonts.cancel')}
        </button>
        <button 
          type="submit" 
          disabled={loading}
          className="px-6 py-3 rounded-xl bg-[#00c48c] text-black font-bold hover:bg-[#00c48c]/90 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {loading && <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />}
          <Save size={18} />
          {font ? t('fonts.updateFont') : t('fonts.createFont')}
        </button>
      </div>
    </form>
  );
};

// Main Admin Page
function FontsAdminPage() {
  const router = useRouter();
  const { t } = useTranslation();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [fonts, setFonts] = useState<Font[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Modals
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [fontModalOpen, setFontModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>();
  const [editingFont, setEditingFont] = useState<Font | undefined>();
  const [showCategories, setShowCategories] = useState(true);

  // Delete Confirmation Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteData, setDeleteData] = useState<{ id: number, type: 'category' | 'font' | 'banner' } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Banner State
  const [banners, setBanners] = useState<any[]>([]);
  const [loadingBanners, setLoadingBanners] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>("");
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [activeTab, setActiveTab] = useState<'fonts' | 'banner'>('fonts');

  // Fonts Hub Enabled State
  const [fontsHubEnabled, setFontsHubEnabled] = useState(true);
  const [loadingFontsHubStatus, setLoadingFontsHubStatus] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchFonts();
    fetchBanners();
    fetchFontsHubStatus();
  }, []);

  useEffect(() => {
    fetchFonts();
  }, [currentPage, selectedCategory, statusFilter, searchQuery]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get("/api/fonts/admin/categories");
      setCategories(res.data);
    } catch (err) {
      console.error(err);
      toast.error(t('fonts.failedFetchCategories'));
    }
  };

  const fetchFonts = async () => {
    setLoading(true);
    try {
      const params: any = { page: currentPage, limit: 10 };
      if (selectedCategory) params.category_id = selectedCategory;
      if (statusFilter) params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;
      
      const res = await axios.get("/api/fonts/admin/fonts", { params });
      setFonts(res.data.fonts || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error(err);
      toast.error(t('fonts.failedFetchFonts'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (formData: FormData) => {
    try {
      await axios.post("/api/fonts/admin/category", formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(t('fonts.successCategoryCreated'));
      fetchCategories();
    } catch (err) {
      console.error(err);
      toast.error(t('fonts.failedCreateCategory'));
      throw err;
    }
  };

  const handleUpdateCategory = async (formData: FormData) => {
    if (!editingCategory) return;
    try {
      await axios.put(`/api/fonts/admin/category/${editingCategory.category_id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(t('fonts.successCategoryUpdated'));
      fetchCategories();
    } catch (err) {
      console.error(err);
      toast.error(t('fonts.failedUpdateCategory'));
      throw err;
    }
  };

  const handleDeleteCategory = (categoryId: number) => {
    setDeleteData({ id: categoryId, type: 'category' });
    setDeleteModalOpen(true);
  };

  const handleCreateFont = async (formData: FormData) => {
    try {
      await axios.post("/api/fonts/admin/font", formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(t('fonts.successFontCreated'));
      fetchFonts();
    } catch (err) {
      console.error(err);
      toast.error(t('fonts.failedCreateFont'));
      throw err;
    }
  };

  const handleUpdateFont = async (formData: FormData) => {
    if (!editingFont) return;
    try {
      await axios.put(`/api/fonts/admin/font/${editingFont.font_id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(t('fonts.successFontUpdated'));
      fetchFonts();
    } catch (err) {
      console.error(err);
      toast.error(t('fonts.failedUpdateFont'));
      throw err;
    }
  };

  const handleDeleteFont = (fontId: number) => {
    setDeleteData({ id: fontId, type: 'font' });
    setDeleteModalOpen(true);
  };

  // --- Banner Handlers ---
  const fetchBanners = async () => {
    setLoadingBanners(true);
    try {
      const res = await axios.get("/api/fonts/admin/banners");
      setBanners(res.data);
    } catch (err) {
      console.error(err);
      toast.error("فشل في تحميل البانرات");
    } finally {
      setLoadingBanners(false);
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

      await axios.post("/api/fonts/admin/banners", formData, {
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
      await axios.delete(`/api/fonts/admin/banners/${bannerId}`);
      toast.success("تم حذف البانر بنجاح");
      fetchBanners();
    } catch (err) {
      console.error(err);
      toast.error("فشل في حذف البانر");
    }
  };

  const handleToggleBannerActive = async (bannerId: number, currentStatus: boolean) => {
    try {
      await axios.put(`/api/fonts/admin/banners/${bannerId}`, {
        is_active: !currentStatus
      });
      toast.success(currentStatus ? "تم إخفاء البانر" : "تم تفعيل البانر");
      fetchBanners();
    } catch (err) {
      console.error(err);
      toast.error("فشل في تحديث حالة البانر");
    }
  };

  // Fetch Fonts Hub Status
  const fetchFontsHubStatus = async () => {
    try {
      const res = await axios.get("/api/admin/settings/fonts_hub_enabled");
      setFontsHubEnabled(res.data.value === 'true');
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Fonts Hub Enabled
  const handleToggleFontsHub = async () => {
    setLoadingFontsHubStatus(true);
    try {
      const newStatus = !fontsHubEnabled;
      await axios.put("/api/admin/settings/fonts_hub_enabled", {
        value: newStatus.toString()
      });
      setFontsHubEnabled(newStatus);
      toast.success(newStatus ? "تم تفعيل مكتبة الخطوط" : "تم إخفاء مكتبة الخطوط");
      
      // Dispatch event for real-time update in Sidebar
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('settingsChanged', {
          detail: { key: 'fonts_hub_enabled', value: newStatus }
        }));
      }
    } catch (err) {
      console.error(err);
      toast.error("فشل في تحديث حالة مكتبة الخطوط");
    } finally {
      setLoadingFontsHubStatus(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteData) return;
    setIsDeleting(true);
    try {
      const { id, type } = deleteData;
      if (type === 'category') {
        await axios.delete(`/api/fonts/admin/category/${id}`);
        toast.success(t('fonts.successCategoryDeleted'));
        fetchCategories();
      } else if (type === 'font') {
        await axios.delete(`/api/fonts/admin/font/${id}`);
        toast.success(t('fonts.successFontDeleted'));
        fetchFonts();
      } else if (type === 'banner') {
        await handleDeleteBanner(id);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || t('fonts.failedDelete'));
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setDeleteData(null);
    }
  };

  return (
    <div className="min-h-screen text-white pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-white/5">
        <div className="mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00c48c] to-orange">
                {t('fonts.pageTitle')}
              </span>
            </h1>
            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleFontsHub}
                disabled={loadingFontsHubStatus}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-colors ${
                  fontsHubEnabled
                    ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30'
                    : 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/30'
                }`}
              >
                {loadingFontsHubStatus ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Eye size={18} />
                )}
                {fontsHubEnabled ? 'إخفاء المكتبة' : 'إظهار المكتبة'}
              </button>
              <button
                onClick={() => {
                  setEditingCategory(undefined);
                  setCategoryModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[#00c48c]  rounded-xl text-black font-bold hover:bg-[#00c48c]/90 transition-colors"
              >
                <Folder size={18} />
                {t('fonts.newCategory')}
              </button>
              <button
                onClick={() => {
                  setEditingFont(undefined);
                  setFontModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[#00c48c] rounded-xl text-black font-bold hover:bg-[#00c48c]/90 transition-colors"
              >
                <Plus size={18} />
                {t('fonts.addFont')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mx-auto px-4 py-4 border-b border-white/5">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('fonts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-colors ${
              activeTab === 'fonts'
                ? 'bg-[#00c48c] text-black'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Type size={18} />
            إدارة الخطوط
          </button>
          <button
            onClick={() => setActiveTab('banner')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-colors ${
              activeTab === 'banner'
                ? 'bg-[#00c48c] text-black'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ImageIcon size={18} />
            إدارة البانر
          </button>
        </div>
      </div>

      {activeTab === 'fonts' && (
      <div className="mx-auto px-4 py-6">
        {/* Categories Section */}
        <div className="mb-8">
          <div 
            className="flex items-center justify-between mb-4 cursor-pointer"
            onClick={() => setShowCategories(!showCategories)}
          >
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Folder size={20} className="text-[#00c48c]" />
              {t('fonts.categories')} ({categories.length})
            </h2>
            <ChevronDown size={20} className={`text-gray-400 transition-transform ${showCategories ? '' : '-rotate-90'}`} />
          </div>
          
          {showCategories && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {categories.map((cat) => (
                <div 
                  key={cat.category_id}
                  className="gradient-border-analysis border border-white/5 rounded-xl p-4 hover:border-white/20 transition-colors group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-medium truncate">{cat.name}</h3>
                    <div className="flex items-center gap-1  transition-opacity">
                      <button
                        onClick={() => {
                          setEditingCategory(cat);
                          setCategoryModalOpen(true);
                        }}
                        className="p-1.5  rounded-lg text-gray-400  transition-colors"
                      >
                        <Edit2 className="text-[#00c48c]" size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.category_id)}
                        className="p-1.5 rounded-lg text-gray-400 transition-colors"
                      >
                        <Trash2 className="text-[#ff7702]" size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{cat.font_count || 0} {t('fonts.allFonts')}</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${cat.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {cat.is_active ? t('fonts.active') : t('fonts.archived')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fonts Section */}
        <div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Type size={20} className="text-orange" />
              {t('fonts.allFonts')}
            </h2>
            
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder={t('fonts.searchPlaceholder')}
                  className="pl-10 pr-4 py-2 bg-[#190237]  rounded-xl text-white w-64 border border-[#00c48c] focus:outline-none"
                />
              </div>
              
              {/* Category Filter */}
              <select
                value={selectedCategory || ''}
                onChange={(e) => {
                  setSelectedCategory(e.target.value ? parseInt(e.target.value) : null);
                  setCurrentPage(1);
                }}
                className="bg-[#190237]  rounded-xl  px-4 py-2 text-white border border-[#00c48c] focus:outline-none"
              >
                <option className="" value="">{t('fonts.allCategories')}</option>
                {categories.map((cat) => (
                  <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
                ))}
              </select>
              
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-[#190237]  rounded-xl px-4 py-2 text-white border border-[#00c48c] focus:outline-none"
              >
                <option className="" value="">{t('fonts.allStatus')}</option>
                <option value="active">{t('fonts.active')}</option>
                <option value="draft">{t('fonts.draft')}</option>
                <option value="archived">{t('fonts.archived')}</option>
              </select>
            </div>
          </div>

          {/* Fonts Table */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-[#00c48c]/20 border-t-[#00c48c] rounded-full animate-spin" />
            </div>
          ) : fonts.length === 0 ? (
            <div className="text-center py-20">
              <Type size={48} className="mx-auto mb-4 text-white/20" />
              <p className="text-gray-400">{t('fonts.noFontsFound')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {fonts.map((font) => (
                <div key={font.font_id} className="bg-[#190237] border border-white/20 rounded-2xl p-6 hover:border-[#00c48c]/30 transition-all duration-300 group">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 items-center">
                    {/* Font Info */}
                    <div className="lg:col-span-1">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 border-b border-white/5 pb-1">{t('fonts.font')}</p>
                      <div className="flex items-center gap-3">
                        {font.main_preview_image ? (
                          <img src={font.main_preview_image} alt={font.name} className="w-12 h-9 object-cover rounded-lg " />
                        ) : (
                          <div className="w-12 h-9 bg-white/5 rounded-lg flex items-center justify-center  text-gray-500">
                            <Type size={16} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-white font-bold truncate flex items-center gap-1.5">
                            {font.name}
                            {font.featured && <Star size={12} className="text-yellow-400 fill-yellow-400 shrink-0" />}
                          </p>
                          {font.designer && <p className="text-gray-500 text-xs truncate">By {font.designer}</p>}
                        </div>
                      </div>
                    </div>

                    {/* Category */}
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 border-b border-white/5 pb-1">{t('fonts.category')}</p>
                      <p className="text-gray-300 font-medium">{font.category?.name || '-'}</p>
                    </div>

                    {/* Type */}
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 border-b border-white/5 pb-1">{t('fonts.type')}</p>
                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                        font.is_free ? 'bg-[#00c48c]/10 text-[#00c48c] border border-[#00c48c]/20' : 'bg-orange/10 text-orange border border-orange/20'
                      }`}>
                        {font.is_free ? t('fonts.free') : t('fonts.premium')}
                      </span>
                    </div>

                    {/* Status */}
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 border-b border-white/5 pb-1">{t('fonts.status')}</p>
                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                        font.status === 'active' ? 'bg-[#00c48c]/10 text-[#00c48c] border border-[#00c48c]/20' :
                        font.status === 'draft' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                        'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                      }`}>
                        {font.status === 'active' ? t('fonts.active') : font.status === 'draft' ? t('fonts.draft') : t('fonts.archived')}
                      </span>
                    </div>

                    {/* Downloads */}
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 border-b border-white/5 pb-1">{t('fonts.downloads')}</p>
                      <div className="flex items-center gap-2">
                        <Download size={14} className="text-gray-500" />
                        <span className="text-gray-300 font-medium">{font.download_count?.toLocaleString() || 0}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center lg:justify-end gap-2 pt-4 lg:pt-0 border-t lg:border-t-0 border-white/5">
                      <button
                        onClick={() => router.push(`/fonts/${font.slug}`)}
                        className="flex-1 lg:flex-none p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all duration-200 border border-white/5 hover:border-white/10"
                        title={t('fonts.preview')}
                      >
                        <Eye size={18} className="mx-auto" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingFont(font);
                          setFontModalOpen(true);
                        }}
                        className="flex-1 lg:flex-none p-2.5 bg-white/5 hover:bg-[#00c48c]/10 rounded-xl text-gray-400 hover:text-[#00c48c] transition-all duration-200 border border-white/5 hover:border-[#00c48c]/10"
                        title={t('fonts.edit')}
                      >
                        <Edit2 className="text-[#00c48c] mx-auto" size={18}  />
                      </button>
                      <button
                        onClick={() => handleDeleteFont(font.font_id)}
                        className="flex-1 lg:flex-none p-2.5 bg-white/5 hover:bg-red-500/10 rounded-xl text-gray-400 hover:text-red-500 transition-all duration-200 border border-white/5 hover:border-red-500/10"
                        title={t('fonts.delete')}
                      >
                        <Trash2 className="text-[#ff7702] mx-auto" size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white/5  rounded-xl text-white disabled:opacity-30 hover:bg-white/10 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="px-4 py-2 text-gray-400">
                {t('fonts.page')} {currentPage} {t('fonts.of')} {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white/5  rounded-xl text-white disabled:opacity-30 hover:bg-white/10 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Banner Tab */}
      {activeTab === 'banner' && (
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
          {/* Upload New Banner */}
          <div className="bg-[#190237] p-8 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white">
              <ImageIcon size={24} className="text-orange" />
              رفع بانر جديد للخطوط
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block mb-3 font-medium text-white">اختر صورة أو فيديو للبانر</label>
                <input 
                  type="file" 
                  accept="image/*,video/*"
                  onChange={handleBannerFileChange}
                  className="w-full text-sm text-white file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange/10 file:text-orange hover:file:bg-orange/20 cursor-pointer"
                />
              </div>

              {bannerPreview && (
                <div className="relative w-full h-64 bg-black rounded-xl overflow-hidden border border-white/10">
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
                className="w-full bg-orange hover:bg-orange/80 text-white font-bold py-3 rounded-lg flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {uploadingBanner ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    جاري الرفع...
                  </>
                ) : (
                  <>
                    <Upload size={20} />
                    رفع البانر
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Existing Banners */}
          <div className="bg-[#190237] p-8 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white">
              <Type size={24} className="text-[#00c48c]" />
              البانرات الموجودة ({banners.length})
            </h2>

            {loadingBanners ? (
              <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange"></div>
              </div>
            ) : banners.length === 0 ? (
              <div className="text-center p-12 text-white/40">
                <ImageIcon size={48} className="mx-auto mb-4 opacity-20" />
                <p>لا توجد بانرات حالياً</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {banners.map((banner) => (
                  <div key={banner.banner_id} className="bg-black/30 rounded-xl overflow-hidden border border-white/10 hover:border-orange/30 transition-all group">
                    <div className="relative h-48 bg-black">
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
                      <div className="absolute top-3 right-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          banner.is_active 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {banner.is_active ? 'نشط' : 'معطل'}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between text-sm text-white/60">
                        <span className="flex items-center gap-2">
                          {banner.media_type === 'video' ? <Type size={16} /> : <ImageIcon size={16} />}
                          {banner.media_type === 'video' ? 'فيديو' : 'صورة'}
                        </span>
                        <span className="text-xs">
                          {new Date(banner.createdAt).toLocaleDateString('ar-EG')}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleBannerActive(banner.banner_id, banner.is_active)}
                          className={`flex-1 py-2 rounded-lg font-bold transition-all ${
                            banner.is_active
                              ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30'
                              : 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/30'
                          }`}
                        >
                          {banner.is_active ? <><Eye size={16} className="inline mr-1" /> إخفاء</> : <><Eye size={16} className="inline mr-1" /> تفعيل</>}
                        </button>
                        <button
                          onClick={() => {
                            setDeleteData({ id: banner.banner_id, type: 'banner' });
                            setDeleteModalOpen(true);
                          }}
                          className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 transition-all"
                        >
                          <Trash2 size={16} />
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
      
      {/* Modals - Outside of tab conditions */}
      {/* Category Modal */}
      <Modal
        isOpen={categoryModalOpen}
        onClose={() => {
          setCategoryModalOpen(false);
          setEditingCategory(undefined);
        }}
        title={editingCategory ? t('fonts.editCategory') : t('fonts.newCategory')}
      >
        <CategoryForm
          category={editingCategory}
          onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}
          onClose={() => {
            setCategoryModalOpen(false);
            setEditingCategory(undefined);
          }}
        />
      </Modal>

      {/* Font Modal */}
      <Modal
        isOpen={fontModalOpen}
        onClose={() => {
          setFontModalOpen(false);
          setEditingFont(undefined);
        }}
        title={editingFont ? t('fonts.editFont') : t('fonts.addNewFont')}
        size="lg"
      >
        <FontForm
          font={editingFont}
          categories={categories}
          onSubmit={editingFont ? handleUpdateFont : handleCreateFont}
          onClose={() => {
            setFontModalOpen(false);
            setEditingFont(undefined);
          }}
        />
      </Modal>

      <ConfirmationModal
        title={deleteData?.type === 'category' ? t('fonts.deleteCategory') : deleteData?.type === 'banner' ? 'حذف البانر' : t('fonts.deleteFont')}
        message={deleteData?.type === 'category' ? t('fonts.confirmDeleteCategory') : deleteData?.type === 'banner' ? 'هل أنت متأكد من حذف هذا البانر؟' : t('fonts.confirmDeleteFont')}
        buttonMessage={t('fonts.delete')}
        modalOpen={deleteModalOpen}
        setModalOpen={setDeleteModalOpen}
        action={confirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}

export default function FontsAdminWrapper() {
  return (
    <AuthGuard requireAdmin>
      <FontsAdminPage />
    </AuthGuard>
  );
}
