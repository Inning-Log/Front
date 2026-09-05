import type { TeamSummaryResponse } from "../../../shared/types/team";

export type FriendshipStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED";

export type FriendRelationshipStatus =
  | "NONE"
  | "REQUEST_SENT"
  | "REQUEST_RECEIVED"
  | "FRIEND";

export type FriendUserResponse = {
  id: number;
  username: string;
  nickname: string;
  profileImageUrl: string | null;
  favoriteTeam: TeamSummaryResponse | null;
};

export type FriendshipResponse = {
  id: number;
  status: FriendshipStatus;
  friend: FriendUserResponse;
  requestedByMe: boolean;
  requestedAt: string;
  respondedAt: string | null;
};

export type UserSearchResponse = {
  user: FriendUserResponse;
  relationshipStatus: FriendRelationshipStatus;
  friendshipId: number | null;
};

export type FriendRequestCreateRequest = {
  receiverId: number;
};

export type FriendshipErrorResponse = {
  code?: string;
  message?: string;
  timestamp?: string;
};
