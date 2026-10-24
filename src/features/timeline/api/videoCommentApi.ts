import {
  apiClient,
} from "../../../shared/api/apiClient";

import type {
  CreateVideoCommentRequest,
  UpdateVideoCommentRequest,
  VideoComment,
  VideoCommentListResponse,
} from "../types/videoComment";

export function getVideoComments(
  videoId: number,
  params?: {
    cursor?: string;
    size?: number;
  },
) {
  return apiClient<VideoCommentListResponse>(
    `/videos/${videoId}/comments`,
    {
      method: "GET",
      params: {
        cursor:
          params?.cursor,
        size:
          params?.size ?? 20,
      },
      fallbackErrorMessage:
        "댓글을 불러오지 못했습니다.",
    },
  );
}

export function getVideoComment(
  commentId: number,
) {
  return apiClient<VideoComment>(
    `/video-comments/${commentId}`,
    {
      method: "GET",
      fallbackErrorMessage:
        "댓글을 불러오지 못했습니다.",
    },
  );
}

export function createVideoComment(
  videoId: number,
  request: CreateVideoCommentRequest,
) {
  return apiClient<VideoComment>(
    `/videos/${videoId}/comments`,
    {
      method: "POST",
      body:
        request,
      fallbackErrorMessage:
        "댓글을 작성하지 못했습니다.",
    },
  );
}

export function updateVideoComment(
  commentId: number,
  request: UpdateVideoCommentRequest,
) {
  return apiClient<VideoComment>(
    `/video-comments/${commentId}`,
    {
      method: "PATCH",
      body:
        request,
      fallbackErrorMessage:
        "댓글을 수정하지 못했습니다.",
    },
  );
}

export function deleteVideoComment(
  commentId: number,
) {
  return apiClient<void>(
    `/video-comments/${commentId}`,
    {
      method: "DELETE",
      fallbackErrorMessage:
        "댓글을 삭제하지 못했습니다.",
    },
  );
}
