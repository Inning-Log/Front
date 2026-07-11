import deleteIcon from "../../../assets/icons/delete.svg";
import profileMockIcon from "../../../assets/icons/profilemock.svg";

type NotificationItemProps = {
  userId: string;
  userName: string;
  profileImage?: string;
  onDelete?: () => void;
};

export function NotificationItem({
  userId,
  userName,
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
        <p className="text-label-2 truncate text-black">
          {userId}
        </p>

        <p className="text-caption mt-[4px] truncate text-text-secondary">
          {userName}
        </p>
      </div>

      <button
        type="button"
        onClick={onDelete}
        className="ml-3 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full"
      >
        <img src={deleteIcon} alt="" className="h-full w-full" />
      </button>
    </article>
  );
}