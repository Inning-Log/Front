export type InningRecordVideoResponse = {
  videoId: number;
  recordId: number;
  status: string;
  contentType: string;
  sizeBytes: number;
  downloadUrl: string;
  expiresAt: string;
  uploadedAt: string;
};

export type CreateVideoUploadUrlRequest = {
  contentType: string;
  contentLength: number;
};

export type VideoUploadUrlResponse = {
  videoId: number;
  recordId: number;
  uploadUrl: string;
  method: string;
  headers: Record<string, string>;
  expiresAt: string;
};