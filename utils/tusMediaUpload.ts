"use client";

import axios from "@/utils/api";

interface FinalizeMainFileParams {
  uploadId: string;
  categoryId: string | number;
  title: string;
  description?: string;
  mainFileType: "video" | "image";
}

interface FinalizePreviewParams {
  uploadId: string;
  parentFileId: number;
}

interface FinalizeVariantParams {
  uploadId: string;
  parentFileId: number;
  variantType: "video" | "image" | "prores" | "png_sequence" | "archive";
  variantLabel: string;
}

interface FinalizeResponse {
  success: boolean;
  type: "main" | "preview" | "variant";
  fileId?: number;
  variantId?: number;
  parentFileId?: number;
  file?: any;
  variant?: any;
  upload?: {
    url: string;
    path: string;
    size: number;
    originalName: string;
    extension: string;
  };
}

/**
 * Finalize main file upload - creates MediaFile record
 */
export async function finalizeMainFile(
  params: FinalizeMainFileParams
): Promise<FinalizeResponse> {
  const response = await axios.post("/api/tus/finalize", {
    uploadId: params.uploadId,
    categoryId: params.categoryId,
    title: params.title,
    description: params.description || "",
    mainFileType: params.mainFileType,
    isMainFile: true,
  }, { timeout: 3600000 }); // 1 hour timeout for large file processing
  return response.data;
}

/**
 * Finalize preview video upload - updates MediaFile with preview URL
 */
export async function finalizePreviewVideo(
  params: FinalizePreviewParams
): Promise<FinalizeResponse> {
  const response = await axios.post("/api/tus/finalize", {
    uploadId: params.uploadId,
    parentFileId: params.parentFileId,
    isPreviewVideo: true,
  }, { timeout: 3600000 }); // 1 hour timeout
  return response.data;
}

/**
 * Finalize variant upload - creates MediaFileVariant record
 */
export async function finalizeVariant(
  params: FinalizeVariantParams
): Promise<FinalizeResponse> {
  const response = await axios.post("/api/tus/finalize", {
    uploadId: params.uploadId,
    parentFileId: params.parentFileId,
    isVariant: true,
    variantType: params.variantType,
    variantLabel: params.variantLabel,
  }, { timeout: 3600000 }); // 1 hour timeout
  return response.data;
}

/**
 * Get upload status
 */
export async function getUploadStatus(uploadId: string) {
  const response = await axios.get(`/api/tus/status/${uploadId}`);
  return response.data;
}

/**
 * Cancel an upload
 */
export async function cancelUpload(uploadId: string) {
  const response = await axios.delete(`/api/tus/${uploadId}`);
  return response.data;
}

export default {
  finalizeMainFile,
  finalizePreviewVideo,
  finalizeVariant,
  getUploadStatus,
  cancelUpload,
};
