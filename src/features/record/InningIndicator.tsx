type InningIndicatorProps = {
  currentInning: number;
};

export function InningIndicator({
  currentInning,
}: InningIndicatorProps) {
  return (
    <div
      className="grid w-full grid-cols-9 items-center"
      aria-label={`현재 ${currentInning}이닝`}
    >
      {Array.from({ length: 9 }, (_, index) => {
        const inning = index + 1;
        const isCurrent = inning === currentInning;
        const isPast = inning < currentInning;

        return (
          <div
            key={inning}
            aria-current={isCurrent ? "step" : undefined}
            className="flex h-[38px] items-center justify-center"
          >
            <span
              className={[
                "flex items-center justify-center font-akatab text-[14px] font-bold leading-none",
                isCurrent
                  ? "h-[38px] w-[38px] rounded-full bg-[#0E4824] text-white"
                  : isPast
                    ? "h-[26px] w-[27px] text-black"
                    : "h-[26px] w-[27px] text-[#8A908B]",
              ].join(" ")}
            >
              {inning}
            </span>
          </div>
        );
      })}
    </div>
  );
}