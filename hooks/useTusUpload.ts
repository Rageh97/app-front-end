"use client";

import { useState, useCallback, useRef } from "react";
import * as tus from "tus-js-client";

interface UploadProgress {
  bytesUploaded: number;
  bytesTotal: number;
  percentage: number;
}

interface TusUploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  onSuccess?: (uploadId: string) => void;
  onError?: (error: Error) => void;
  metadata?: Record<string, string>;
}

interface UploadState {
  isUploading: boolean;
  progress: UploadProgress;
  error: Error | null;
  uploadId: string | null;
  isPaused: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export function useTusUpload() {
  const [state, setState] = useState<UploadState>({
    isUploading: false,
    progress: { bytesUploaded: 0, bytesTotal: 0, percentage: 0 },
    error: null,
    uploadId: null,
    isPaused: false,
  });

  const uploadRef = useRef<tus.Upload | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Start or resume a TUS upload
   */
  const startUpload = useCallback(
    (file: File, options: TusUploadOptions = {}) => {
      return new Promise<string>((resolve, reject) => {
        // Get auth headers
        const token = localStorage.getItem("a") || "";
        const clientId =
          (typeof window !== "undefined" && (window as any).clientId1328) ||
          localStorage.getItem("clientId1328") ||
          "";

        // Create abort controller for cancellation
        abortControllerRef.current = new AbortController();

        const upload = new tus.Upload(file, {
          endpoint: `${API_URL}/api/tus/`,
          retryDelays: [0, 1000, 3000, 5000, 10000, 30000], // Retry delays in ms
          chunkSize: 10 * 1024 * 1024, // 10MB chunks for optimal speed/reliability balance
          metadata: {
            filename: file.name,
            filetype: file.type || "application/octet-stream",
            filesize: String(file.size),
            ...options.metadata,
          },
          headers: {
            Authorization: token,
            "User-Client": clientId,
          },
          // Store upload URL for resumption
          storeFingerprintForResuming: true,
          removeFingerprintOnSuccess: true,

          onError: (error) => {
            console.error("[TUS] Upload error:", error);
            setState((prev) => ({
              ...prev,
              isUploading: false,
              error: error as Error,
            }));
            options.onError?.(error as Error);
            reject(error);
          },

          onProgress: (bytesUploaded, bytesTotal) => {
            const percentage = Math.round((bytesUploaded / bytesTotal) * 100);
            const progress = { bytesUploaded, bytesTotal, percentage };

            setState((prev) => ({
              ...prev,
              progress,
            }));
            options.onProgress?.(progress);
          },

          onSuccess: () => {
            // Extract upload ID from URL
            const uploadUrl = upload.url || "";
            const uploadId = uploadUrl.split("/").pop() || "";

            console.log("[TUS] Upload complete:", uploadId);

            setState((prev) => ({
              ...prev,
              isUploading: false,
              uploadId,
              progress: { ...prev.progress, percentage: 100 },
            }));

            options.onSuccess?.(uploadId);
            resolve(uploadId);
          },

          onShouldRetry: (err, retryAttempt, options) => {
            console.log(`[TUS] Retry attempt ${retryAttempt}:`, err);
            // Retry on network errors
            const status = (err as any)?.originalResponse?.getStatus?.();
            if (status === 401 || status === 403) {
              return false; // Don't retry auth errors
            }
            return true;
          },

          onAfterResponse: (req, res) => {
            // Log response for debugging
            const status = res.getStatus();
            if (status >= 400) {
              console.warn(`[TUS] Response status: ${status}`);
            }
          },
        });

        uploadRef.current = upload;

        setState({
          isUploading: true,
          progress: { bytesUploaded: 0, bytesTotal: file.size, percentage: 0 },
          error: null,
          uploadId: null,
          isPaused: false,
        });

        // Check for previous uploads to resume
        upload.findPreviousUploads().then((previousUploads) => {
          if (previousUploads.length > 0) {
            console.log("[TUS] Resuming previous upload");
            upload.resumeFromPreviousUpload(previousUploads[0]);
          }
          upload.start();
        });
      });
    },
    []
  );

  /**
   * Pause the current upload
   */
  const pauseUpload = useCallback(() => {
    if (uploadRef.current) {
      uploadRef.current.abort();
      setState((prev) => ({ ...prev, isPaused: true, isUploading: false }));
    }
  }, []);

  /**
   * Resume a paused upload
   */
  const resumeUpload = useCallback(() => {
    if (uploadRef.current) {
      uploadRef.current.start();
      setState((prev) => ({ ...prev, isPaused: false, isUploading: true }));
    }
  }, []);

  /**
   * Cancel and abort the upload
   */
  const cancelUpload = useCallback(() => {
    if (uploadRef.current) {
      uploadRef.current.abort();
      uploadRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState({
      isUploading: false,
      progress: { bytesUploaded: 0, bytesTotal: 0, percentage: 0 },
      error: null,
      uploadId: null,
      isPaused: false,
    });
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    uploadRef.current = null;
    setState({
      isUploading: false,
      progress: { bytesUploaded: 0, bytesTotal: 0, percentage: 0 },
      error: null,
      uploadId: null,
      isPaused: false,
    });
  }, []);

  return {
    ...state,
    startUpload,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    reset,
  };
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * Calculate estimated time remaining
 */
export function calculateETA(
  bytesUploaded: number,
  bytesTotal: number,
  startTime: number
): string {
  if (bytesUploaded === 0) return "Calculating...";

  const elapsed = (Date.now() - startTime) / 1000; // seconds
  const speed = bytesUploaded / elapsed; // bytes per second
  const remaining = bytesTotal - bytesUploaded;
  const eta = remaining / speed; // seconds

  if (eta < 60) return `${Math.round(eta)}s remaining`;
  if (eta < 3600) return `${Math.round(eta / 60)}m remaining`;
  return `${Math.round(eta / 3600)}h remaining`;
}

export default useTusUpload;
