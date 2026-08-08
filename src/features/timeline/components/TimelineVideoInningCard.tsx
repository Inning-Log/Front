import type { InningRecord } from "./InningCard";

type TimelineVideoInningCardProps = {
  inning: number;
  userName: string;
  teamName: string;
  record?: InningRecord;
};

export function TimelineVideoInningCard({
  inning,
  userName,
  teamName,
  record,
}: TimelineVideoInningCardProps) {
  return (
    <article className="relative h-[300px] w-[358px] shrink-0 rounded-[27.5px] bg-[#626262] text-white">
      <div className="absolute left-[14px] top-[14px] flex size-[30px] items-center justify-center rounded-full bg-white text-bg-dark">
        <span className="font-akatab text-[18px] font-bold leading-none">
          {inning}
        </span>
      </div>

      <p className="text-caption absolute left-1/2 top-[18px] -translate-x-1/2 whitespace-nowrap text-white">
        {userName} · {teamName}
      </p>

      {record ? (
        <>
          <div className="absolute left-1/2 top-1/2 flex w-[220px] -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center">
            <time
              dateTime={record.recordedAt}
              className="font-pretendard text-[24px] font-extrabold leading-[140%] tracking-[-0.24px] text-white"
            >
              {record.recordedAt}
            </time>

            <p className="mt-[-3px] w-full truncate text-label-3 text-white">
              {record.text}
            </p>
          </div>

          <p className="absolute right-[20px] top-1/2 -translate-y-1/2 text-label-4 text-white">
            {record.homeScore}:{record.awayScore}
          </p>
        </>
      ) : (
        <p className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-label-3 text-white">
          이 시간대 기록 없음
        </p>
      )}
    </article>
  );
}