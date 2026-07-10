type NotificationSettingItemProps = {
  title: string;
  description: string;
  isEnabled: boolean;
  onToggle: () => void;
};

export function NotificationSettingItem({
  title,
  description,
  isEnabled,
  onToggle,
}: NotificationSettingItemProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between pt-[17px] pb-[17px]">
        <div className="min-w-0 pr-[16px]">
          <h3 className="font-pretendard text-[16px] leading-[150%] font-semibold tracking-[0.32px] text-black">
            {title}
          </h3>

          <p className="mt-[4px] font-pretendard text-[12px] leading-[150%] font-medium tracking-[0.24px] text-[#515151]">
            {description}
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={isEnabled}
          aria-label={`${title} ${isEnabled ? "끄기" : "켜기"}`}
          onClick={onToggle}
          className={`relative h-[29px] w-[55px] shrink-0 rounded-[14px] transition-colors duration-200 ${
            isEnabled
              ? "bg-accent-primary"
              : "bg-surface-placeholder"
          }`}
        >
          <span
            className={`absolute top-[3px] h-[23px] w-[23px] rounded-full bg-white transition-[left] duration-200 ${
              isEnabled ? "left-[29px]" : "left-[3px]"
            }`}
          />
        </button>
      </div>

      <div className="h-[1.5px] w-full bg-[#EFEFEF]" />
    </div>
  );
}