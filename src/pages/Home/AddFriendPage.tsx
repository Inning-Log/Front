import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import { BottomSheet } from "../../app/layouts/BottomSheet";
import { FriendRequestCompleteModal } from "../../features/home/components/FriendRequestCompleteModal";
import { FriendSearchList } from "../../features/home/components/FriendSearchList";
import { useFriendSearch } from "../../features/home/hooks/useFriendSearch";
import { Search } from "../../shared/ui/Search";

export function AddFriendPage() {
  const navigate = useNavigate();
  const [isRequestNoticeVisible, setIsRequestNoticeVisible] = useState(false);
  const {
    keyword,
    setKeyword,
    selectedUserId,
    setSelectedUserId,
    searchedUsers,
    isFriendRequestEnabled,
  } = useFriendSearch();

  const closePage = () => {
    if (window.history.state?.idx > 0) {
      navigate(-1);
      return;
    }

    navigate("/home", { replace: true });
  };

  const closeRequestNotice = useCallback(() => {
    setIsRequestNoticeVisible(false);
  }, []);

  const showRequestNotice = () => {
    if (!isFriendRequestEnabled) {
      return;
    }

    setIsRequestNoticeVisible(true);
  };

  return (
    <>
      <BottomSheet
        title="친구 추가"
        onClose={closePage}
        closeLabel="친구 추가 닫기"
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <p className="mt-[25px] shrink-0 whitespace-pre-line px-[20px] text-body text-black">
            {"친구를 추가하여\n야구를 더 즐겁게 관람해보세요!"}
          </p>

          <section className="mt-[12px] flex min-h-0 flex-1 flex-col px-[10px]">
            <Search
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="아이디로 검색하기"
              aria-label="아이디로 검색하기"
              autoComplete="off"
              className="mt-[7px] shrink-0"
            />

            <FriendSearchList
              users={searchedUsers}
              selectedUserId={selectedUserId}
              onSelectUser={setSelectedUserId}
            />

            {searchedUsers.length > 0 && (
              <button
                type="button"
                disabled={!isFriendRequestEnabled}
                onClick={showRequestNotice}
                className={[
                  "mb-[14px] mt-[12px] flex h-[40px] shrink-0 appearance-none items-center justify-center rounded-[20px] border-0 p-0 text-label-3 text-white disabled:opacity-100",
                  isFriendRequestEnabled
                    ? "bg-accent-primary"
                    : "bg-surface-secondary",
                ].join(" ")}
              >
                친구 신청하기
              </button>
            )}
          </section>
        </div>
      </BottomSheet>

      <FriendRequestCompleteModal
        open={isRequestNoticeVisible}
        onClose={closeRequestNotice}
      />
    </>
  );
}
