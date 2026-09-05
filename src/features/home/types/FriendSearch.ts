import type { FriendRelationshipStatus } from "../../friends/types/friend";

export type FriendSearch = {
  id: string;
  name: string;
  friendshipId?: number | null;
  profileImageUrl?: string | null;
  relationshipStatus?: FriendRelationshipStatus;
  userId?: number;
};

export type FriendSearchResult = FriendSearch & {
  friendshipId: number | null;
  profileImageUrl: string | null;
  relationshipStatus: FriendRelationshipStatus;
  userId: number;
};

export type FriendSearchItemProps = {
  user: FriendSearch;
  selected: boolean;
  onSelect: (userId: string) => void;
};

export type FriendSearchListProps = {
  errorMessage?: string;
  hasKeyword: boolean;
  isLoading?: boolean;
  selectedUserId: string;
  onSelectUser: (userId: string) => void;
  users: FriendSearch[];
};
