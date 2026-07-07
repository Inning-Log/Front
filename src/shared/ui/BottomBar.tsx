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

export function BottomBar() {
  return (
    <nav className="fixed bottom-[21px] left-1/2 z-50 -translate-x-1/2">
      <div className="flex h-[59px] w-[232px] items-center justify-between rounded-[29.5px] bg-primary px-[7px] shadow-[0_1px_3.6px_0_rgba(0,0,0,0.25)]">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [
                "flex h-12 w-[79px] items-center justify-center rounded-[24px]",
                isActive ? "bg-surface-placeholder" : "",
              ].join(" ")
            }
          >
            <img src={item.iconSrc} alt="" className="h-[20.466px] w-[21px]" />
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
