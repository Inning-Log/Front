type TeamCardProps = {
  name: string;
  mascotSrc: string;
  selected: boolean;
  onSelect: () => void;
};

export function TeamCard({
  name,
  mascotSrc,
  selected,
  onSelect,
}: TeamCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={[
        "relative mx-auto flex aspect-[5/4] w-[100%] items-center justify-center rounded-[17px] bg-[#f1f2f1]",
        "border-4 transition-colors",
        selected ? "border-accent-primary bg-white" : "border-transparent",
      ].join(" ")}
    >
      <img
        src={mascotSrc}
        alt=""
        className="h-[100px] w-[100px] max-h-[70%] max-w-[70%] -translate-y-[8px]"
      />
      <span className="absolute bottom-[0px] max-w-[65px] truncate text-center font-pretendard text-[12px] font-semibold leading-[150%] tracking-[-0.24px] text-black">
        {name}
      </span>
    </button>
  );
}
