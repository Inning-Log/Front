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
        "mx-auto grid aspect-[5/4] w-full self-start grid-rows-[minmax(0,1fr)_20px] overflow-hidden rounded-[17px] bg-[#f1f2f1] p-0",
        "box-border border-4 transition-colors",
        selected ? "border-accent-primary bg-white" : "border-transparent",
      ].join(" ")}
    >
      <span className="flex min-h-0 items-center justify-center overflow-hidden">
        <img
          src={mascotSrc}
          alt=""
          className="h-[100px] w-[100px] max-h-full max-w-[70%] shrink-0"
        />
      </span>

      <span className="flex h-[20px] min-w-0 items-center justify-center overflow-hidden px-[2px] text-center font-pretendard text-[12px] font-semibold leading-none tracking-[-0.24px] text-black">
        <span className="block max-w-full truncate">{name}</span>
      </span>
    </button>
  );
}
