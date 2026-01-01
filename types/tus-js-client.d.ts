declare module "tus-js-client" {
  export interface UploadOptions {
    endpoint: string;
    retryDelays?: number[];
    chunkSize?: number;
    metadata?: Record<string, string>;
    headers?: Record<string, string>;
    storeFingerprintForResuming?: boolean;
    removeFingerprintOnSuccess?: boolean;
    onError?: (error: Error) => void;
    onProgress?: (bytesUploaded: number, bytesTotal: number) => void;
    onSuccess?: () => void;
    onShouldRetry?: (
      err: Error,
      retryAttempt: number,
      options: UploadOptions
    ) => boolean;
    onAfterResponse?: (req: any, res: any) => void;
  }

  export interface PreviousUpload {
    uploadUrl: string;
    urlStorageKey: string;
  }

  export class Upload {
    constructor(file: File | Blob, options: UploadOptions);
    url: string | null;
    file: File | Blob;
    options: UploadOptions;
    start(): void;
    abort(): void;
    findPreviousUploads(): Promise<PreviousUpload[]>;
    resumeFromPreviousUpload(previousUpload: PreviousUpload): void;
  }

  export function isSupported(): boolean;
  export function canStoreURLs(): boolean;
}
