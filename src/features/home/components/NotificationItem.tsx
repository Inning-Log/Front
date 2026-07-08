import deleteIcon from "../../../assets/icons/delete.svg";
import profileMockIcon from "../../../assets/icons/profilemock.svg";

type NotificationItemProps = {
  username: string;
  message: string;
  profileImage?: string;
  onDelete?: () => void;
};

export function NotificationItem({
  username,
  message,
  profileImage = profileMockIcon,
  onDelete,
}: NotificationItemProps) {
  return (
    <article className="flex h-[66px] w-full max-w-[358px] items-center rounded-[37.5px] px-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
      <img
        src={profileImage}
        alt=""
        className="h-[44px] w-[44px] shrink-0 rounded-full object-cover"
      />

      <div className="ml-[14px] flex min-w-0 flex-1 -translate-y-[1px] flex-col justify-center">
        <p className="truncate font-pretendard text-[18px] font-semibold leading-normal tracking-[-0.54px]">
          {username}
        </p>

        <p className="truncate font-pretendard text-[12px] font-semibold leading-normal tracking-[-0.36px] text-text-secondary">
          {message}
        </p>
      </div>

      <button
        type="button"
        onClick={onDelete}
        aria-label="?뚮┝ ??젣"
        className="ml-3 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full"
      >
        <img src={deleteIcon} alt="" className="h-full w-full" />
      </button>
    </article>
  );
}
