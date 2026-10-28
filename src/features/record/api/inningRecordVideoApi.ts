import {
  ApiError,
  apiClient,
} from "../../../shared/api/apiClient";

import type {
  CreateVideoUploadUrlRequest,
  InningRecordVideoResponse,
  VideoUploadUrlResponse,
} from "../types/inningRecordVideo";

/**
 * Presigned URL을 이용한 S3 업로드 실패.
 *
 * S3 요청은 apiClient를 거치지 않으므로
 * 별도 에러 타입으로 구분한다.
 */
class PresignedVideoUploadError extends Error {
  status: number;

  constructor(status: number) {
    super(
      "영상 파일 업로드에 실패했습니다.",
    );

    this.name =
      "PresignedVideoUploadError";

    this.status =
      status;
  }
}

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
 */
export function deleteInningRecordVideo(
  recordId: number,
) {
  return apiClient<void>(
    `/inning-records/${recordId}/video`,
    {
      method:
        "DELETE",

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
  request:
    CreateVideoUploadUrlRequest,
) {
  return apiClient<VideoUploadUrlResponse>(
    `/inning-records/${recordId}/video/upload-url`,
    {
      method:
        "POST",

      body:
        request,

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
      method:
        "POST",

      fallbackErrorMessage:
        "영상 업로드 완료 처리에 실패했습니다.",
    },
  );
}

/**
 * Presigned URL을 이용해
 * S3에 직접 업로드한다.
 */
export async function uploadVideoToPresignedUrl(
  uploadInfo:
    VideoUploadUrlResponse,
  video: Blob,
) {
  const response =
    await fetch(
      uploadInfo.uploadUrl,
      {
        method:
          uploadInfo.method,

        headers:
          uploadInfo.headers,

        body:
          video,
      },
    );

  if (!response.ok) {
    throw new PresignedVideoUploadError(
      response.status,
    );
  }
}

/**
 * 영상이 이미 생성되어 있는지 조회한다.
 *
 * 404는 아직 영상 리소스가 없는 정상적인
 * 초기 상태로 취급한다.
 */
async function getExistingVideo(
  recordId: number,
) {
  try {
    return await getInningRecordVideo(
      recordId,
    );
  } catch (error) {
    if (
      error instanceof
        ApiError &&
      error.status === 404
    ) {
      return null;
    }

    throw error;
  }
}

/**
 * 오류 발생 후 서버 상태 확인용.
 *
 * 원래 오류를 상태 확인 오류로
 * 덮어쓰지 않기 위해 조회 실패는 null 처리한다.
 */
async function checkExistingVideoAfterError(
  recordId: number,
) {
  try {
    return await getExistingVideo(
      recordId,
    );
  } catch (error) {
    console.warn(
      "영상 업로드 실패 후 상태 조회 실패:",
      error,
    );

    return null;
  }
}

function isReadyVideo(
  video:
    InningRecordVideoResponse | null,
) {
  return (
    video?.status ===
    "READY"
  );
}

/**
 * 새 Presigned URL을 발급받아
 * S3 업로드 → complete까지 수행한다.
 */
async function uploadVideoOnce(
  recordId: number,
  video: Blob,
) {
  /*
   * MediaRecorder의 type은
   * video/webm;codecs=vp8 형태일 수 있으므로
   * 서버에는 기본 MIME type만 보낸다.
   */
  const contentType =
    video.type
      .split(";")[0] ||
    "video/webm";

  const uploadInfo =
    await createInningRecordVideoUploadUrl(
      recordId,
      {
        contentType,

        contentLength:
          video.size,
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

/**
 * 새 Presigned URL을 발급해야 하는 오류인지 확인한다.
 */
function shouldRetryWithNewUploadUrl(
  error: unknown,
) {
  /*
   * Presigned URL 자체가 만료되었거나
   * S3 업로드가 거절된 경우.
   */
  if (
    error instanceof
    PresignedVideoUploadError
  ) {
    return true;
  }

  /*
   * 서버에서 명시적으로
   * 업로드 URL 만료를 응답한 경우.
   */
  if (
    error instanceof
      ApiError &&
    error.code ===
      "VIDEO_UPLOAD_EXPIRED"
  ) {
    return true;
  }

  return false;
}

/**
 * 영상 업로드 전체 과정.
 *
 * 1. 기존 영상 상태 조회
 * 2. 이미 READY면 업로드 생략
 * 3. upload-url 발급
 * 4. S3 업로드
 * 5. complete
 *
 * 실패 시:
 *
 * - complete 응답 유실 가능성을 고려해
 *   서버 상태를 다시 조회
 *
 * - 이미 READY면 성공으로 간주
 *
 * - Presigned URL 만료 또는 S3 업로드 실패라면
 *   새 upload-url을 발급하여 1회 재시도
 */
export async function uploadInningRecordVideo(
  recordId: number,
  video: Blob,
) {
  const existingVideo =
    await getExistingVideo(
      recordId,
    );

  if (
    isReadyVideo(
      existingVideo,
    )
  ) {
    return existingVideo;
  }

  try {
    return await uploadVideoOnce(
      recordId,
      video,
    );
  } catch (error) {
    /*
     * complete는 실제로 성공했지만
     * 응답만 유실됐을 가능성이 있다.
     */
    const videoAfterError =
      await checkExistingVideoAfterError(
        recordId,
      );

    if (
      isReadyVideo(
        videoAfterError,
      )
    ) {
      return videoAfterError;
    }

    /*
     * URL 만료/S3 업로드 실패가 아니라면
     * 자동으로 다시 업로드하지 않는다.
     *
     * 사용자가 저장을 다시 누르면
     * 동일 recordId로 다시 진입하면서
     * 위의 상태 조회부터 다시 수행한다.
     */
    if (
      !shouldRetryWithNewUploadUrl(
        error,
      )
    ) {
      throw error;
    }

    console.warn(
      "영상 업로드 URL을 새로 발급하여 재시도합니다.",
    );
  }

  /*
   * Presigned URL 관련 오류일 경우
   * 새 URL로 딱 한 번 자동 재시도한다.
   */
  try {
    return await uploadVideoOnce(
      recordId,
      video,
    );
  } catch (retryError) {
    /*
     * 두 번째 complete에서도
     * 응답만 유실됐을 가능성 확인.
     */
    const videoAfterRetry =
      await checkExistingVideoAfterError(
        recordId,
      );

    if (
      isReadyVideo(
        videoAfterRetry,
      )
    ) {
      return videoAfterRetry;
    }

    throw retryError;
  }
}