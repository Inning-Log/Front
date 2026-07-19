import deleteIcon from "../../../assets/icons/delete.svg";
import profileMockIcon from "../../../assets/icons/profilemock.svg";
import selectedCheckIcon from "../../../assets/icons/selected_check.svg";

type NotificationItemProps = {
  userId: string;
  userName: string;
  profileImage?: string;
  onAccept?: () => void;
  onDelete?: () => void;
};

export function NotificationItem({
  userId,
  userName,
  profileImage = profileMockIcon,
  onAccept,
  onDelete,
}: NotificationItemProps) {
  return (
    <article className="flex h-[66px] w-[calc(100%_-_32px)] max-w-[398px] items-center rounded-[37.5px] bg-white px-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
      <img
        src={profileImage}
        alt=""
        className="h-[44px] w-[44px] shrink-0 rounded-full object-cover"
      />

      <div className="ml-[14px] flex min-w-0 flex-1 -translate-y-[1px] flex-col justify-center">
        <p className="text-label-2 truncate text-black">
          {userId}
        </p>

        <p className="text-caption truncate text-text-secondary">
          {userName}
        </p>
      </div>

      <div className="ml-3 flex shrink-0 items-center gap-[13px]">
        <button
          type="button"
          onClick={onAccept}
          aria-label={`${userId} 신청 수락`}
          className="flex h-[30px] w-[30px] items-center justify-center rounded-full"
        >
          <img
            src={selectedCheckIcon}
            alt=""
            className="h-full w-full"
          />
        </button>

        <button
          type="button"
          onClick={onDelete}
          aria-label={`${userId} 신청 거절`}
          className="flex h-[30px] w-[30px] items-center justify-center rounded-full"
        >
          <img
            src={deleteIcon}
            alt=""
            className="h-full w-full"
          />
        </button>
      </div>
    </article>
  );
}