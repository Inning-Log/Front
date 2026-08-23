import doosanBearsMascot from "../../../assets/icons/teammascot/doosanbears.svg";
import hanwhaEaglesMascot from "../../../assets/icons/teammascot/hanwhaeagles.svg";
import kiaTigersMascot from "../../../assets/icons/teammascot/kiatigers.svg";
import kiwoomHeroesMascot from "../../../assets/icons/teammascot/kiwoomheros.svg";
import ktWizMascot from "../../../assets/icons/teammascot/ktwiz.svg";
import lgTwinsMascot from "../../../assets/icons/teammascot/lgtwins.svg";
import lotteGiantsMascot from "../../../assets/icons/teammascot/lottegiants.svg";
import ncDinosMascot from "../../../assets/icons/teammascot/ncdinos.svg";
import samsungLionsMascot from "../../../assets/icons/teammascot/samsunglions.svg";
import ssgLandersMascot from "../../../assets/icons/teammascot/ssglanders.svg";
import { Button } from "../../../shared/ui/Button";
import type { TeamSummaryResponse } from "../../../shared/types/team";
import type { ProfileSetupStepProps } from "../types/ProfileSetupStepProps";
import { TeamCard } from "./TeamCard";

const TEAM_MASCOTS_BY_NAME: Record<string, string> = {
  "DOOSAN": doosanBearsMascot,
  "두산": doosanBearsMascot,
  "두산 베어스": doosanBearsMascot,
  "HANWHA": hanwhaEaglesMascot,
  "한화": hanwhaEaglesMascot,
  "한화 이글스": hanwhaEaglesMascot,
  "KIA": kiaTigersMascot,
  "KIA 타이거즈": kiaTigersMascot,
  "KIWOOM": kiwoomHeroesMascot,
  "키움": kiwoomHeroesMascot,
  "키움 히어로즈": kiwoomHeroesMascot,
  "KT": ktWizMascot,
  "KT 위즈": ktWizMascot,
  "LG": lgTwinsMascot,
  "LG 트윈스": lgTwinsMascot,
  "LOTTE": lotteGiantsMascot,
  "롯데": lotteGiantsMascot,
  "롯데 자이언츠": lotteGiantsMascot,
  "NC": ncDinosMascot,
  "NC 다이노스": ncDinosMascot,
  "SAMSUNG": samsungLionsMascot,
  "삼성": samsungLionsMascot,
  "삼성 라이온즈": samsungLionsMascot,
  "SSG": ssgLandersMascot,
  "SSG 랜더스": ssgLandersMascot,
};

export type ProfileTeamProps = ProfileSetupStepProps & {
  feedbackMessage?: string;
  isLoading?: boolean;
  isSubmitting?: boolean;
  onRetryLoadTeams: () => void;
  onSelectTeam: (teamId: number) => void;
  selectedTeamId: number | null;
  teams: TeamSummaryResponse[];
};

export function ProfileTeam({
  feedbackMessage = "",
  isLoading = false,
  isSubmitting = false,
  onNext,
  onRetryLoadTeams,
  onSelectTeam,
  selectedTeamId,
  teams,
}: ProfileTeamProps) {
  const isNextEnabled =
    selectedTeamId !== null && !isLoading && !isSubmitting;
  const buttonLabel = isSubmitting
    ? "저장 중..."
    : isLoading
      ? "불러오는 중..."
      : "다음으로";

  const handleNext = () => {
    if (!isNextEnabled) {
      return;
    }

    onNext();
  };

  return (
    <section className="flex h-[calc(var(--app-height,100dvh)_-_74.5px)] flex-col overflow-hidden px-[16px] pb-[30px] pt-[30px]">
      <h1 className="text-title-2 ml-[7px] whitespace-pre-line text-black">
        {"응원하는 팀을\n골라주세요"}
      </h1>

      <div className="mt-[10px] grid w-full grid-cols-3 gap-x-[8px] gap-y-[3px]">
        {isLoading ? (
          <p className="col-span-3 mt-[72px] text-center text-caption text-text-secondary">
            구단 목록을 불러오는 중...
          </p>
        ) : (
          teams.map((team) => (
            <TeamCard
              key={team.id}
              name={team.name}
              mascotSrc={getTeamMascotSrc(team)}
              selected={selectedTeamId === team.id}
              onSelect={() => onSelectTeam(team.id)}
            />
          ))
        )}
      </div>

      {feedbackMessage && (
        <div className="mt-[10px] px-[7px] text-center">
          <p aria-live="polite" className="text-caption text-danger">
            {feedbackMessage}
          </p>

          {!isLoading && teams.length === 0 && (
            <button
              type="button"
              onClick={onRetryLoadTeams}
              className="mt-[8px] text-caption text-accent-primary"
            >
              다시 불러오기
            </button>
          )}
        </div>
      )}

      <Button
        onClick={handleNext}
        disabled={!isNextEnabled}
        className={[
          "mt-auto",
          isNextEnabled ? "" : "opacity-60",
        ].join(" ")}
      >
        <span className="text-label-2 text-white">{buttonLabel}</span>
      </Button>
    </section>
  );
}

function getTeamMascotSrc(team: TeamSummaryResponse) {
  return (
    TEAM_MASCOTS_BY_NAME[team.teamCode] ??
    TEAM_MASCOTS_BY_NAME[team.shortName] ??
    TEAM_MASCOTS_BY_NAME[team.name] ??
    team.logoUrl ??
    lgTwinsMascot
  );
}
