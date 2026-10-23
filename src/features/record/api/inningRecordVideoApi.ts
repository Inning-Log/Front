import { apiClient } from "../../../shared/api/apiClient";

import type {
  CreateVideoUploadUrlRequest,
  InningRecordVideoResponse,
  VideoUploadUrlResponse,
} from "../types/inningRecordVideo";

/**
 * 이닝 기록 영상 조회
 *
 * GET /api/inning-records/{recordId}/video
 */
export function getInningRecordVideo(
  recordId: number,
) {
  return apiClient<InningRecordVideoResponse>(
    `/inning-records/${recordId}/video`,
    {
      method: "GET",
      fallbackErrorMessage:
        "영상을 불러오지 못했습니다.",
    },
  );
}

/**
 * 이닝 기록 영상 삭제
 *
 * DELETE /api/inning-records/{recordId}/video
 *
 * 성공: 204
 */
export function deleteInningRecordVideo(
  recordId: number,
) {
  return apiClient<void>(
    `/inning-records/${recordId}/video`,
    {
      method: "DELETE",
      fallbackErrorMessage:
        "영상을 삭제하지 못했습니다.",
    },
  );
}

/**
 * Presigned Upload URL 발급
 *
 * POST /api/inning-records/{recordId}/video/upload-url
 */
export function createInningRecordVideoUploadUrl(
  recordId: number,
  request: CreateVideoUploadUrlRequest,
) {
  return apiClient<VideoUploadUrlResponse>(
    `/inning-records/${recordId}/video/upload-url`,
    {
      method: "POST",
      body: request,
      fallbackErrorMessage:
        "영상 업로드 URL을 발급하지 못했습니다.",
    },
  );
}

/**
 * 영상 업로드 완료 처리
 *
 * POST /api/inning-records/{recordId}/video/complete
 */
export function completeInningRecordVideo(
  recordId: number,
) {
  return apiClient<InningRecordVideoResponse>(
    `/inning-records/${recordId}/video/complete`,
    {
      method: "POST",
      fallbackErrorMessage:
        "영상 업로드 완료 처리에 실패했습니다.",
    },
  );
}

/**
 * Presigned URL을 이용해 S3에 직접 업로드.
 *
 * Swagger 설명대로 서버가 반환한
 * method와 headers를 그대로 사용한다.
 */
export async function uploadVideoToPresignedUrl(
  uploadInfo: VideoUploadUrlResponse,
  video: Blob,
) {
  const response = await fetch(
    uploadInfo.uploadUrl,
    {
      method: uploadInfo.method,
      headers: uploadInfo.headers,
      body: video,
    },
  );

  if (!response.ok) {
    throw new Error(
      "영상 파일 업로드에 실패했습니다.",
    );
  }
}

/**
 * 영상 업로드 전체 과정
 *
 * 1. URL 발급
 * 2. S3 PUT
 * 3. complete
 */
export async function uploadInningRecordVideo(
  recordId: number,
  video: Blob,
) {
  /*
   * MediaRecorder의 type은
   * video/webm;codecs=vp8 형태일 수 있으므로
   * 서버 요청에는 기본 MIME type만 전달.
   */
  const contentType =
    video.type.split(";")[0] ||
    "video/webm";

  const uploadInfo =
    await createInningRecordVideoUploadUrl(
      recordId,
      {
        contentType,
        contentLength: video.size,
      },
    );

  await uploadVideoToPresignedUrl(
    uploadInfo,
    video,
  );

  return completeInningRecordVideo(
    recordId,
  );
}