import type { InningRecord } from "./InningCard";
import { TimelineGameScore } from "./TimelineGameScore";
import { TimelineVideoInningCard } from "./TimelineFriendVideoInningCard";

type TimelineVideoUser = {
  name: string;
  teamName: string;
  record?: InningRecord;
};

type TimelineFriendVideoTemplateProps = {
  inning: number;
  myRecord: TimelineVideoUser;
  friendRecord: TimelineVideoUser;
};

export function TimelineFriendVideoTemplate({
  inning,
  myRecord,
  friendRecord,
}: TimelineFriendVideoTemplateProps) {
  return (
    <div className="flex h-[844px] w-[390px] flex-col bg-white px-[14px] pb-[14px] pt-[40px]">
      <TimelineGameScore
        homeTeamName="두산 베어스"
        awayTeamName="LG 트윈스"
        homeScore={1}
        awayScore={0}
        gameDateTime="06.03 18:30"
        stadium="잠실 야구장"
      />

      <div className="mt-[14px] flex flex-col gap-[10px]">
        <TimelineVideoInningCard
          inning={inning}
          userName={myRecord.name}
          teamName={myRecord.teamName}
          record={myRecord.record}
        />

        <TimelineVideoInningCard
          inning={inning}
          userName={friendRecord.name}
          teamName={friendRecord.teamName}
          record={friendRecord.record}
        />
      </div>

      <p className="mt-[10px] text-center text-caption">
        이닝로그
      </p>
    </div>
  );
}