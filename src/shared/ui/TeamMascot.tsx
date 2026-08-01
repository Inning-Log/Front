import {
  getTeamByName,
  type Team,
  type TeamName,
} from "../constants/teams";

type TeamMascotProps = {
  team?: Team;
  teamName?: TeamName | string;
  containerSize?: number;
  className?: string;
  imageClassName?: string;
  decorative?: boolean;
};

const MASCOT_BASE_SIZE = 43;

export function TeamMascot({
  team,
  teamName,
  containerSize = MASCOT_BASE_SIZE,
  className = "",
  imageClassName = "",
  decorative = false,
}: TeamMascotProps) {
  const selectedTeam = team ?? (teamName ? getTeamByName(teamName) : undefined);

  if (!selectedTeam) {
    return (
      <span
        aria-hidden="true"
        className={`inline-flex shrink-0 ${className}`}
        style={{
          width: containerSize,
          height: containerSize,
        }}
      />
    );
  }

  const sizeRatio = containerSize / MASCOT_BASE_SIZE;

  const mascotWidth = selectedTeam.mascotSize.width * sizeRatio;
  const mascotHeight = selectedTeam.mascotSize.height * sizeRatio;

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${className}`}
      style={{
        width: containerSize,
        height: containerSize,
      }}
    >
      <img
        src={selectedTeam.icon}
        alt={decorative ? "" : `${selectedTeam.name} 마스코트`}
        aria-hidden={decorative}
        className={`object-contain ${imageClassName}`}
        style={{
          width: mascotWidth,
          height: mascotHeight,
        }}
      />
    </span>
  );
}