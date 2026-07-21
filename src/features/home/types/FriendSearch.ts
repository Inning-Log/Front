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
  selectedUserId: string;
  onSelectUser: (userId: string) => void;
};
