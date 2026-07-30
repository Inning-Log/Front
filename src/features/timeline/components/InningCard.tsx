export type InningRecord = {
  id: string;
  inning: number;
  recordedAt: string;
  homeScore: number;
  awayScore: number;
  text: string;
};

type InningCardProps = {
  inning: number;
  record?: InningRecord;
  isAddCard?: boolean;
  onAdd?: () => void;
};

export function InningCard({
  inning,
  record,
  isAddCard = false,
  onAdd,
}: InningCardProps) {
  if (isAddCard) {
    return (
      <button
        type="button"
        onClick={onAdd}
        aria-label={`${inning}회 기록 추가`}
        className="relative h-[125px] w-[358px] shrink-0 snap-center rounded-[27.5px] bg-accent-primary"
      >
        <InningNumber inning={inning} />

        <span
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 text-[40px] font-light leading-none text-white -translate-x-1/2 -translate-y-1/2"
        >
          +
        </span>
      </button>
    );
  }

  if (!record) {
    return null;
  }

  return (
    <article className="relative h-[125px] w-[358px] shrink-0 snap-center rounded-[27.5px] bg-[#626262] text-white">
      <InningNumber inning={inning} />

      <div className="absolute left-1/2 top-[33px] flex w-[220px] -translate-x-1/2 flex-col items-center text-center">
        <time
          dateTime={record.recordedAt}
          className="text-title font-bold leading-[140%] text-white"
        >
          {record.recordedAt}
        </time>

        <p className="mt-[-2px] line-clamp-2 w-full text-label-3 font-medium leading-[150%] text-white">
          {record.text}
        </p>
      </div>

      <p className="absolute right-[25px] top-1/2 w-[50px] -translate-y-1/2 text-center text-[14px] font-medium leading-[140%] tracking-[0.28px] text-white">
        {record.homeScore}:{record.awayScore}
      </p>
    </article>
  );
}

function InningNumber({ inning }: { inning: number }) {
  return (
    <div className="absolute left-[21px] top-[15px] flex size-[19px] items-center justify-center rounded-full bg-bg-primary text-bg-dark">
      <span className="text-caption-number -translate-y-px">{inning}</span>
    </div>
  );
}