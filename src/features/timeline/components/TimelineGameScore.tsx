import { TeamMascot } from "../../../shared/ui/TeamMascot";

type TimelineGameScoreProps = {
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  gameDateTime: string;
  stadium: string;
};

export function TimelineGameScore({
  homeTeamName,
  awayTeamName,
  homeScore,
  awayScore,
  gameDateTime,
  stadium,
}: TimelineGameScoreProps) {
  return (
    <section className="flex w-full items-center justify-center gap-[50px] py-[14px]">
      <TeamMascot
        teamName={homeTeamName}
        containerSize={50}
      />

      <div className="flex min-w-0 flex-col items-center text-center">
        <div className="text-title-2 flex items-center gap-[12px] text-button-neutral">
          <span>{homeScore}</span>
          <span className="text-text-tertiary">:</span>
          <span>{awayScore}</span>
        </div>

        <time className="text-caption mt-[2px] text-text-tertiary">
          {gameDateTime}
        </time>

        <p className="text-caption m-0 text-text-tertiary">
          {stadium}
        </p>
      </div>

      <TeamMascot
        teamName={awayTeamName}
        containerSize={50}
      />
    </section>
  );
}