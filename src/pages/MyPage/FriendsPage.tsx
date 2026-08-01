import { useNavigate } from "react-router-dom";

import { PageHeader } from "../../app/layouts/PageHeader";
import addFriendIcon from "../../assets/icons/addfriend.svg";
import addFriendWhiteIcon from "../../assets/icons/addfriendwhite.svg";
import friendsIcon from "../../assets/icons/friends.svg";
import notificationIcon from "../../assets/icons/notification.svg";
import { FriendSearchItem } from "../../features/home/components/FriendSearchItem";
import type { FriendSearch } from "../../features/home/types/FriendSearch";

// 친구가 있는 화면 확인용
const friends: FriendSearch[] = [
  {
    id: "baseball_love",
    name: "야구팬",
  },
  {
    id: "inninglog_friend",
    name: "이닝로그 친구",
  },
];

// 친구가 없는 화면 확인용
//const friends: FriendSearch[] = [];

export function FriendsPage() {
  const navigate = useNavigate();

  const handleSelectFriend = (userId: string) => {
    navigate(`/timeline/${userId}`);
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
                onClick={() => navigate("/home/friends/add")}
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

      {friends.length === 0 ? (
        <main className="flex flex-1 items-center justify-center px-[16px]">
          <div className="flex -translate-y-[20px] flex-col items-center">
            <img
              src={friendsIcon}
              alt=""
              aria-hidden="true"
              className="size-[56px] object-contain"
            />

            <p className="mt-[11px] text-center text-label-2 leading-[150%] text-black">
              아직 친구가 없어요
            </p>

            <p className="mt-[7px] text-center text-caption leading-[150%] text-black">
              친구를 추가하고 직관 기록을 공유해보세요
            </p>

            <button
              type="button"
              onClick={() => navigate("/home/friends/add")}
              className="mt-[20px] flex h-[47px] w-[178px] items-center justify-center gap-[9px] rounded-full bg-accent-primary text-label-2 leading-[150%] text-white"
            >
              <img
                src={addFriendWhiteIcon}
                alt=""
                aria-hidden="true"
                className="size-[28px] object-contain"
              />

              <span>친구 찾기</span>
            </button>
          </div>
        </main>
      ) : (
        <main className="mt-[66px] min-h-0 flex-1 overflow-y-auto px-[29px]">
          <div className="border-t-[1.5px] border-surface-secondary">
            {friends.map((friend) => (
              <FriendSearchItem
                key={friend.id}
                user={friend}
                selected={false}
                onSelect={handleSelectFriend}
              />
            ))}
          </div>
        </main>
      )}
    </div>
  );
}