import type { FriendRelationshipStatus } from "../../friends/types/friend";

export type FriendSearch = {
  id: string;
  name: string;
};

export type FriendSearchResult = FriendSearch & {
  userId: number;
  profileImageUrl: string | null;
  relationshipStatus: FriendRelationshipStatus;
  friendshipId: number | null;
};

export type FriendSearchItemProps = {
  user: FriendSearch;
  selected: boolean;
  onSelect: (userId: string) => void;
};

export type FriendSearchListProps = {
  users: FriendSearch[];
  hasKeyword: boolean;
  selectedUserId: string;
  onSelectUser: (userId: string) => void;
};
