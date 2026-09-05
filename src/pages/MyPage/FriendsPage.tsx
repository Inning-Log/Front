import { useNavigate } from "react-router-dom";

import { PageHeader } from "../../app/layouts/PageHeader";
import addFriendIcon from "../../assets/icons/addfriend.svg";
import notificationIcon from "../../assets/icons/notification.svg";
import { FriendList } from "../../features/friends/components/FriendList";

export function FriendsPage() {
  const navigate = useNavigate();

  const handleSelectFriend = (userId: string) => {
    navigate(`/timeline/${userId}`);
  };

  const handleFindFriends = () => {
    navigate("/home/friends/add");
  };

  return (
    <div className="flex min-h-dvh w-full flex-col bg-bg-primary">
      <div className="pt-[45px]">
        <PageHeader
          title="친구"
          rightContent={
            <div className="flex items-center gap-[16px]">
              <button
                type="button"
                onClick={handleFindFriends}
                aria-label="친구 추가"
                className="flex size-[28px] items-center justify-center"
              >
                <img
                  src={addFriendIcon}
                  alt=""
                  aria-hidden="true"
                  className="size-[24px] object-contain"
                />
              </button>

              <button
                type="button"
                onClick={() => navigate("/home/notifications")}
                aria-label="알림 확인"
                className="flex size-[20px] items-center justify-center"
              >
                <img
                  src={notificationIcon}
                  alt=""
                  aria-hidden="true"
                  className="size-[24px] object-contain"
                />
              </button>
            </div>
          }
        />
      </div>

      <FriendList
        onFindFriends={handleFindFriends}
        onSelectFriend={handleSelectFriend}
      />
    </div>
  );
}
