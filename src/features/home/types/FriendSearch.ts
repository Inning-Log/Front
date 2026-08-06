export type FriendSearch = {
  id: string;
  name: string;
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
