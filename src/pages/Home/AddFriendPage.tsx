import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import { BottomSheet } from "../../app/layouts/BottomSheet";
import { sendFriendRequest } from "../../features/friends/api/friendsApi";
import { FriendSearchList } from "../../features/friends/components/FriendSearchList";
import { useFriendSearch } from "../../features/friends/hooks/useFriendSearch";
import { Search } from "../../shared/ui/Search";
import { Toast } from "../../shared/ui/Toast";

export function AddFriendPage() {
  const navigate = useNavigate();
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestErrorMessage, setRequestErrorMessage] = useState("");

  const {
    keyword,
    setKeyword,
    selectedUserId,
    setSelectedUserId,
    searchedUsers,
    isSearching,
    searchErrorMessage,
    selectedUser,
    isFriendRequestEnabled,
    markFriendRequestSent,
  } = useFriendSearch();

  const closePage = () => {
    if (window.history.state?.idx > 0) {
      navigate(-1);
      return;
    }

    navigate("/home", { replace: true });
  };

  const closeToast = useCallback(() => {
    setIsToastOpen(false);
  }, []);

  const handleKeywordChange = (nextKeyword: string) => {
    setKeyword(nextKeyword);
    setRequestErrorMessage("");
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
    setRequestErrorMessage("");
  };

  const handleFriendRequest = async () => {
    if (
      !isFriendRequestEnabled ||
      !selectedUser ||
      isRequesting
    ) {
      return;
    }

    try {
      setIsRequesting(true);
      setRequestErrorMessage("");

      const friendship = await sendFriendRequest(selectedUser.userId);

      markFriendRequestSent(selectedUser.id, friendship.id);
      setIsToastOpen(true);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "친구 신청에 실패했습니다.";

      setRequestErrorMessage(message);
    } finally {
      setIsRequesting(false);
    }
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
              onChange={(event) =>
                handleKeywordChange(event.target.value)
              }
              placeholder="아이디로 검색하기"
              aria-label="아이디로 검색하기"
              autoComplete="off"
              className="mt-[7px] shrink-0"
            />

            <FriendSearchList
              users={searchedUsers}
              hasKeyword={keyword.trim().length > 0}
              isLoading={isSearching}
              errorMessage={searchErrorMessage}
              selectedUserId={selectedUserId}
              onSelectUser={handleSelectUser}
            />

            {requestErrorMessage && (
              <p className="mt-[8px] shrink-0 px-[10px] text-center text-caption text-danger">
                {requestErrorMessage}
              </p>
            )}

            {searchedUsers.length > 0 && (
              <button
                type="button"
                disabled={
                  !isFriendRequestEnabled || isRequesting
                }
                onClick={() => {
                  void handleFriendRequest();
                }}
                className={[
                  "mb-[14px] mt-[12px] flex h-[40px] shrink-0 appearance-none items-center justify-center rounded-[20px] border-0 p-0 text-label-3 text-white disabled:opacity-100",
                  isFriendRequestEnabled && !isRequesting
                    ? "bg-accent-primary"
                    : "bg-surface-secondary",
                ].join(" ")}
              >
                {isRequesting ? "신청 중..." : "친구 신청하기"}
              </button>
            )}
          </section>
        </div>
      </BottomSheet>

      <Toast
        open={isToastOpen}
        message="신청이 완료되었습니다!"
        onClose={closeToast}
      />
    </>
  );
}
