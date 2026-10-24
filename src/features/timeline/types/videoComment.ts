export type VideoCommentAuthor = {
  userId: number;
  username: string;
  nickname: string;
  profileImageUrl: string | null;
};

export type VideoComment = {
  id: number;
  videoId: number;
  author: VideoCommentAuthor;
  content: string;
  createdAt: string;
  updatedAt: string;
  isMine: boolean;
  parentCommentId: number | null;
};

export type VideoCommentListResponse = {
  items: VideoComment[];
  totalCount: number;
  nextCursor: string | null;
  hasNext: boolean;
};

export type CreateVideoCommentRequest = {
  clientCommentId: string;
  content: string;
  parentCommentId?: number | null;
};

export type UpdateVideoCommentRequest = {
  content: string;
};
