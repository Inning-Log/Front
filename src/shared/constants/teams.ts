import doosanBearsIcon from "../../assets/icons/teammascot/doosanbears.svg";
import hanwhaEaglesIcon from "../../assets/icons/teammascot/hanwhaeagles.svg";
import kiaTigersIcon from "../../assets/icons/teammascot/kiatigers.svg";
import kiwoomHeroesIcon from "../../assets/icons/teammascot/kiwoomheros.svg";
import ktWizIcon from "../../assets/icons/teammascot/ktwiz.svg";
import lgTwinsIcon from "../../assets/icons/teammascot/lgtwins.svg";
import lotteGiantsIcon from "../../assets/icons/teammascot/lottegiants.svg";
import ncDinosIcon from "../../assets/icons/teammascot/ncdinos.svg";
import samsungLionsIcon from "../../assets/icons/teammascot/samsunglions.svg";
import ssgLandersIcon from "../../assets/icons/teammascot/ssglanders.svg";

export type TeamName =
  | "LG 트윈스"
  | "한화 이글스"
  | "SSG 랜더스"
  | "삼성 라이온즈"
  | "NC 다이노스"
  | "KT 위즈"
  | "롯데 자이언츠"
  | "KIA 타이거즈"
  | "두산 베어스"
  | "키움 히어로즈";

export type Team = {
  name: TeamName;
  icon: string;
  mascotSize: {
    width: number;
    height: number;
  };
};

export const KBO_TEAMS: Team[] = [
  {
    name: "LG 트윈스",
    icon: lgTwinsIcon,
    mascotSize: {
      width: 43,
      height: 43,
    },
  },
  {
    name: "한화 이글스",
    icon: hanwhaEaglesIcon,
    mascotSize: {
      width: 43,
      height: 43,
    },
  },
  {
    name: "SSG 랜더스",
    icon: ssgLandersIcon,
    mascotSize: {
      width: 43,
      height: 46,
    },
  },
  {
    name: "삼성 라이온즈",
    icon: samsungLionsIcon,
    mascotSize: {
      width: 54,
      height: 35.52,
    },
  },
  {
    name: "NC 다이노스",
    icon: ncDinosIcon,
    mascotSize: {
      width: 43,
      height: 46,
    },
  },
  {
    name: "KT 위즈",
    icon: ktWizIcon,
    mascotSize: {
      width: 43,
      height: 43,
    },
  },
  {
    name: "롯데 자이언츠",
    icon: lotteGiantsIcon,
    mascotSize: {
      width: 43,
      height: 40,
    },
  },
  {
    name: "KIA 타이거즈",
    icon: kiaTigersIcon,
    mascotSize: {
      width: 43,
      height: 38,
    },
  },
  {
    name: "두산 베어스",
    icon: doosanBearsIcon,
    mascotSize: {
      width: 42,
      height: 38,
    },
  },
  {
    name: "키움 히어로즈",
    icon: kiwoomHeroesIcon,
    mascotSize: {
      width: 40,
      height: 40,
    },
  },
];

export function getTeamByName(teamName: string) {
  return KBO_TEAMS.find((team) => team.name === teamName);
}