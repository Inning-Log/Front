import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { PageHeader } from "../../app/layouts/PageHeader";
import friendsIcon from "../../assets/icons/friends.svg";
import selectedCheckIcon from "../../assets/icons/selected_check.svg";
import { FriendSearchItem } from "../../features/home/components/FriendSearchItem";
import type { FriendSearch } from "../../features/home/types/FriendSearch";

// API 연동 전 임시 데이터
const friends: FriendSearch[] = [
  {
    id: "baseball_love",
    name: "야구팬",
  },
  {
    id: "inninglog_friend",
    name: "이닝로그 친구",
  },
  {
    id: "inninglog_1",
    name: "이닝로그",
  },
  {
    id: "inninglog_2",
    name: "이닝로그",
  },
  {
    id: "inninglog_3",
    name: "이닝로그",
  },
];

// 친구가 없는 화면 확인용
// const friends: FriendSearch[] = [];

export function TimelineFriendSelectPage() {
  const navigate = useNavigate();

  const [selectedFriendId, setSelectedFriendId] =
    useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  const handleSelectFriend = (userId: string) => {
    if (isSaving) {
      return;
    }

    setSelectedFriendId((current) =>
      current === userId ? null : userId,
    );
  };

  const handleSaveWithFriend = () => {
    if (!selectedFriendId || isSaving) {
      return;
    }

    setIsSaving(true);

    // TODO: 실제 영상 생성 및 저장 기능 연결
    console.log("선택된 친구:", selectedFriendId);

    // 임시 로딩 확인용
    setTimeout(() => {
      setIsSaving(false);
      navigate("/timeline");
    }, 3000);
  };

  return (
    <div className="relative flex min-h-dvh w-full flex-col bg-bg-primary pt-[45px]">
      <PageHeader title="친구" />

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
          </div>
        </main>
      ) : (
        <>
          <main className="mt-[66px] min-h-0 flex-1 overflow-y-auto px-[29px] pb-[100px]">
            <div className="border-t-[1.5px] border-surface-secondary">
              {friends.map((friend) => {
                const selected =
                  selectedFriendId === friend.id;

                return (
                  <div
                    key={friend.id}
                    className="relative"
                  >
                    <FriendSearchItem
                      user={friend}
                      selected={false}
                      onSelect={handleSelectFriend}
                    />

                    {selected && (
                      <img
                        src={selectedCheckIcon}
                        alt=""
                        aria-hidden="true"
                        className="pointer-events-none absolute right-[4px] top-1/2 size-[30px] -translate-y-1/2"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </main>

          {selectedFriendId && (
            <div className="fixed bottom-[32px] left-1/2 z-10 w-full max-w-[430px] -translate-x-1/2 px-[16px]">
              <button
                type="button"
                onClick={handleSaveWithFriend}
                disabled={isSaving}
                className="text-label-3 flex h-[55px] w-full items-center justify-center rounded-[27.5px] bg-accent-primary text-white active:bg-accent-pressed disabled:pointer-events-none disabled:opacity-60"
              >
                함께 저장하기
              </button>
            </div>
          )}
        </>
      )}

      {isSaving && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="flex flex-col items-center rounded-[20px] bg-white px-[40px] py-[32px]">
            <div className="size-[36px] animate-spin rounded-full border-[4px] border-surface-secondary border-t-accent-primary" />

            <p className="mt-[16px] text-label-3 text-black">
              영상 저장 중...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}