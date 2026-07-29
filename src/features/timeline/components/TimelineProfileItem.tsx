import plusIcon from "../../../assets/icons/plus.svg";
import profileBackArrowIcon from "../../../assets/icons/profilebackarrow.svg";
import profileMockIcon from "../../../assets/icons/profilemock.svg";

type TimelineProfileItemProps = {
  userId: string;
  profileImage?: string;
  isMe?: boolean;
  hasRecordedToday?: boolean;
  isViewingFriendTimeline?: boolean;
  onProfileClick?: () => void;
  onRecordClick?: () => void;
  onBackClick?: () => void;
};

export function TimelineProfileItem({
  userId,
  profileImage = profileMockIcon,
  isMe = false,
  hasRecordedToday = false,
  isViewingFriendTimeline = false,
  onProfileClick,
  onRecordClick,
  onBackClick,
}: TimelineProfileItemProps) {
  const showRecordedBorder = !isMe && hasRecordedToday;

  return (
    <div className="flex w-[64px] shrink-0 flex-col items-center">
      <div
        className={`relative flex size-[58px] items-center justify-center rounded-full ${
          showRecordedBorder
            ? "border-[2.5px] border-accent-text p-[3px]"
            : ""
        }`}
      >
        <button
          type="button"
          onClick={onProfileClick}
          disabled={!onProfileClick}
          aria-label={
            isMe
              ? `${userId} 내 프로필`
              : `${userId} 타임라인으로 이동`
          }
          className="size-full rounded-full disabled:cursor-default"
        >
          <img
            src={profileImage}
            alt={`${userId} 프로필`}
            className="size-full rounded-full object-cover"
          />
        </button>

        {isMe && (
          <button
            type="button"
            onClick={
              isViewingFriendTimeline ? onBackClick : onRecordClick
            }
            aria-label={
              isViewingFriendTimeline
                ? "내 타임라인으로 돌아가기"
                : "기록 화면으로 이동"
            }
            className="absolute bottom-0 right-[-2px] flex size-[22px] items-center justify-center rounded-full bg-accent-primary"
          >
            <img
              src={
                isViewingFriendTimeline
                  ? profileBackArrowIcon
                  : plusIcon
              }
              alt=""
              className="size-[12px]"
            />
          </button>
        )}
      </div>

      <span className="text-caption mt-[5px] block w-full truncate text-center text-button-neutral">
        {userId}
      </span>
    </div>
  );
}