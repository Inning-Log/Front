import doosanBearsMascot from "../../assets/icons/teammascot/doosanbears.svg";
import lgTwinsMascot from "../../assets/icons/teammascot/lgtwins.svg";
import { PageHeader } from "../../app/layouts/PageHeader";
import { InningCard } from "../../features/timeline/components/InningCard";
import { TimelineGameScore } from "../../features/timeline/components/TimelineGameScore";
import { TimelineProfileList } from "../../features/timeline/components/TimelineProfileList";

const innings = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export function TimelinePage() {
  return (
    <div className="min-h-dvh w-full pt-[45px]">
      <PageHeader title="타임라인" />

      <TimelineProfileList />

      <TimelineGameScore
        homeTeamName="두산 베어스"
        homeTeamLogo={doosanBearsMascot}
        awayTeamName="LG 트윈스"
        awayTeamLogo={lgTwinsMascot}
        homeScore={1}
        awayScore={0}
        gameDateTime="07.29 18:30"
        stadium="잠실 야구장"
      />

      <main className="flex flex-col items-center gap-[12px] px-[16px] pt-[20px]">
        {innings.map((inning) => (
          <InningCard key={inning} inning={inning} />
        ))}
      </main>
    </div>
  );
}