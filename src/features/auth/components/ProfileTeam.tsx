import { useState } from "react";

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
import type { ProfileSetupStepProps } from "../types/ProfileSetupStepProps";
import { TeamCard } from "./TeamCard";

type Team = {
  id: string;
  name: string;
  mascotSrc: string;
};

const TEAMS: Team[] = [
  {
    id: "lg-twins",
    name: "LG 트윈스",
    mascotSrc: lgTwinsMascot,
  },
  {
    id: "hanwha-eagles",
    name: "한화 이글스",
    mascotSrc: hanwhaEaglesMascot,
  },
  {
    id: "ssg-landers",
    name: "SSG 랜더스",
    mascotSrc: ssgLandersMascot,
  },
  {
    id: "samsung-lions",
    name: "삼성 라이온즈",
    mascotSrc: samsungLionsMascot,
  },
  {
    id: "nc-dinos",
    name: "NC 다이노스",
    mascotSrc: ncDinosMascot,
  },
  {
    id: "kt-wiz",
    name: "KT 위즈",
    mascotSrc: ktWizMascot,
  },
  {
    id: "lotte-giants",
    name: "롯데 자이언츠",
    mascotSrc: lotteGiantsMascot,
  },
  {
    id: "kia-tigers",
    name: "KIA 타이거즈",
    mascotSrc: kiaTigersMascot,
  },
  {
    id: "doosan-bears",
    name: "두산 베어스",
    mascotSrc: doosanBearsMascot,
  },
  {
    id: "kiwoom-heroes",
    name: "키움 히어로즈",
    mascotSrc: kiwoomHeroesMascot,
  },
];

export function ProfileTeam({ onNext }: ProfileSetupStepProps) {
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const isNextEnabled = selectedTeamId.length > 0;

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
        {TEAMS.map((team) => (
          <TeamCard
            key={team.id}
            name={team.name}
            mascotSrc={team.mascotSrc}
            selected={selectedTeamId === team.id}
            onSelect={() => setSelectedTeamId(team.id)}
          />
        ))}
      </div>

      <Button
        onClick={handleNext}
        disabled={!isNextEnabled}
        className={[
          "mt-auto",
          isNextEnabled ? "" : "opacity-60",
        ].join(" ")}
      >
        <span className="text-label-2 text-white">다음으로</span>
      </Button>
    </section>
  );
}
