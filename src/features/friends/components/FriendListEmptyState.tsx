import addFriendWhiteIcon from "../../../assets/icons/addfriendwhite.svg";
import friendsIcon from "../../../assets/icons/friends.svg";

type FriendListEmptyStateProps = {
  onFindFriends: () => void;
};

export function FriendListEmptyState({
  onFindFriends,
}: FriendListEmptyStateProps) {
  return (
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
          onClick={onFindFriends}
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
  );
}
