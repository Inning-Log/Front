import type { InningRecord } from "./InningCard";
import { TimelineGameScore } from "./TimelineGameScore";
import { TimelineMyVideoInningCard } from "./TimelineMyVideoInningCard";

type TimelineMyVideoTemplateProps = {
  inning: number;
  userName: string;
  teamName: string;
  record: InningRecord;
};

export function TimelineMyVideoTemplate({
  inning,
  userName,
  teamName,
  record,
}: TimelineMyVideoTemplateProps) {
  return (
    <div className="flex h-[844px] w-[390px] flex-col bg-white px-[16px] pt-[40px]">
      <TimelineGameScore
        homeTeamName="두산 베어스"
        awayTeamName="LG 트윈스"
        homeScore={1}
        awayScore={0}
        gameDateTime="06.03 18:30"
        stadium="잠실 야구장"
      />

      <div className="mt-[14px] flex justify-center">
        <TimelineMyVideoInningCard
          inning={inning}
          record={record}
        />
      </div>

      <div className="mt-[10px] flex flex-col items-center">
        <p className="text-caption text-black">
          @{userName} · {teamName}
        </p>

        <p className="mt-[6px] text-caption text-black">
          이닝로그
        </p>
      </div>
    </div>
  );
}