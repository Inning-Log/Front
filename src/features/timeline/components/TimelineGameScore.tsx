type TimelineGameScoreProps = {
  homeTeamName: string;
  homeTeamLogo: string;
  awayTeamName: string;
  awayTeamLogo: string;
  homeScore: number;
  awayScore: number;
  gameDateTime: string;
  stadium: string;
};

export function TimelineGameScore({
  homeTeamName,
  homeTeamLogo,
  awayTeamName,
  awayTeamLogo,
  homeScore,
  awayScore,
  gameDateTime,
  stadium,
}: TimelineGameScoreProps) {
  return (
    <section className="flex w-full items-center justify-center gap-[50px] py-[14px]">
      <div className="flex size-[50px] shrink-0 items-center justify-center">
        <img
          src={homeTeamLogo}
          alt={`${homeTeamName} 로고`}
          className="size-full object-contain"
        />
      </div>

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

      <div className="flex size-[50px] shrink-0 items-center justify-center">
        <img
          src={awayTeamLogo}
          alt={`${awayTeamName} 로고`}
          className="size-full object-contain"
        />
      </div>
    </section>
  );
}