import { NavLink } from "react-router-dom";

import homeIcon from "../../assets/icons/home.svg";
import mypageIcon from "../../assets/icons/mypage.svg";
import timelineIcon from "../../assets/icons/timeline.svg";

type BottomBarItem = {
  to: string;
  iconSrc: string;
};

const items: BottomBarItem[] = [
  {
    to: "/home",
    iconSrc: homeIcon,
  },
  {
    to: "/timeline",
    iconSrc: timelineIcon,
  },
  {
    to: "/mypage",
    iconSrc: mypageIcon,
  },
];

type BottomBarProps = {
  position?: "fixed" | "static";
};

export function BottomBar({ position = "fixed" }: BottomBarProps) {
  const isFixed = position === "fixed";

  return (
    <nav
      className={
        isFixed
          ? "fixed bottom-[9px] left-1/2 z-50 -translate-x-1/2"
          : "mx-auto mt-[8px] w-fit"
      }
    >
      <div className="flex h-[42px] w-[158px] items-center justify-between rounded-[21px] bg-white px-[4px] shadow-[0_1px_3.6px_0_rgba(0,0,0,0.25)]">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [
                "flex h-[34px] w-[50px] items-center justify-center rounded-[17px]",
                isActive ? "bg-surface-placeholder" : "",
              ].join(" ")
            }
          >
            <img src={item.iconSrc} alt="" className="h-[20px] w-[21px]" />
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
