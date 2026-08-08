import type { InningRecord } from "./InningCard";

type TimelineMyVideoInningCardProps = {
  inning: number;
  record: InningRecord;
};

export function TimelineMyVideoInningCard({
  inning,
  record,
}: TimelineMyVideoInningCardProps) {
  return (
    <article className="relative h-[608px] w-[358px] shrink-0 rounded-[27.5px] bg-[#626262] text-white">
      <div className="absolute left-[16px] top-[14px] flex size-[19px] items-center justify-center rounded-full bg-white text-bg-dark">
        <span className="font-akatab text-[16px] font-bold leading-none">
          {inning}
        </span>
      </div>

      <p className="absolute left-1/2 top-[19px] -translate-x-1/2 text-title-2 text-white">
        {record.homeScore}:{record.awayScore}
      </p>

      <div className="absolute left-1/2 top-1/2 flex w-[280px] -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center">
        <time
          dateTime={record.recordedAt}
          className="font-pretendard text-[36px] font-extrabold leading-[140%] tracking-[-0.36px] text-white"
        >
          {record.recordedAt}
        </time>

        <p className="mt-[-2px] w-full whitespace-pre-wrap break-words text-title-2 text-white">
          {record.text}
        </p>
      </div>
    </article>
  );
}