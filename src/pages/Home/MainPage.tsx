import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { BottomBar } from "../../app/layouts/BottomBar";
import { PageHeader } from "../../app/layouts/PageHeader";
import addFriendIcon from "../../assets/icons/addfriend.svg";
import notificationIcon from "../../assets/icons/notification.svg";
import rightArrowIcon from "../../assets/icons/rightarrow.svg";
import {
  InningCalendar,
  type CalendarRecord,
} from "../../features/home/components/InningCalendar";
import { Button } from "../../shared/ui/Button";

const sampleRecords: CalendarRecord[] = [
  { date: "2026-06-02", result: "win", emphasized: true },
  { date: "2026-06-03", result: "lose", emphasized: true },
  { date: "2026-06-10", result: "draw", emphasized: true },
  { date: "2026-06-11", result: "lose", emphasized: true },
  { date: "2026-06-12", result: "lose", emphasized: true },
  { date: "2026-06-17", result: "draw" },
  { date: "2026-06-20", highlighted: true },
];

export function MainPage() {
  const navigate = useNavigate();
  const [month, setMonth] = useState(() => new Date(2026, 5, 1));

  const goToPreviousMonth = () => {
    setMonth((currentMonth) => (
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    ));
  };

  const goToNextMonth = () => {
    setMonth((currentMonth) => (
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    ));
  };

  return (
    <div className="relative h-dvh overflow-hidden bg-white">
      <main className="h-full overflow-y-auto px-[11px] pb-[72px] pt-[50px]">
        <PageHeader
          title="홈"
          showBackButton={false}
          rightContent={
            <div className="flex items-center gap-[13px]">
              <HeaderIconLink
                to="/home/friends/add"
                iconSrc={addFriendIcon}
                label="친구 추가"
              />
              <HeaderIconLink
                to="/home/notifications"
                iconSrc={notificationIcon}
                label="알림"
              />
            </div>
          }
        />

        <section className="mt-[13px] text-center">
          <p className="text-body text-black">
            승률
          </p>
          <p className="-mt-[10px] flex items-baseline justify-center gap-[2px] text-center font-akatab text-[48px] font-extrabold leading-normal tracking-[-1.44px] text-accent-deep">
            54
            <span className="font-akatab text-[20px] font-black leading-normal tracking-[6.8px]">
              %
            </span>
          </p>
        </section>

        <div className="mb-[10px] -mt-[10px] flex h-[28px] items-center justify-between px-[5px]">
          <button
            type="button"
            onClick={goToPreviousMonth}
            aria-label="이전 달"
            className="flex h-7 w-7 items-center justify-center"
          >
            <img
              src={rightArrowIcon}
              alt=""
              className="h-[17px] w-[12px] rotate-180"
            />
          </button>

          <h1 className="text-label-3 text-black">
            {formatMonthLabel(month)}
          </h1>

          <button
            type="button"
            onClick={goToNextMonth}
            aria-label="다음 달"
            className="flex h-7 w-7 items-center justify-center"
          >
            <img src={rightArrowIcon} alt="" className="h-[17px] w-[12px]" />
          </button>
        </div>

        <InningCalendar
          month={month}
          records={sampleRecords}
          onMonthChange={setMonth}
        />

        <div className="mt-[18px] flex justify-center">
          <Button onClick={() => navigate("/home/record")}>
            <span className="text-label-2 text-white">기록하기</span>
          </Button>
        </div>
      </main>

      <BottomBar />
    </div>
  );
}

type HeaderIconLinkProps = {
  to: string;
  iconSrc: string;
  label: string;
};

function HeaderIconLink({ to, iconSrc, label }: HeaderIconLinkProps) {
  return (
    <Link to={to} aria-label={label} className="relative block">
      <img src={iconSrc} alt="" className="h-[22px] w-auto" />
      <span className="absolute right-[-2px] top-[-4px] h-[7px] w-[7px] rounded-full bg-danger" />
    </Link>
  );
}

function formatMonthLabel(date: Date) {
  return `${date.getFullYear()}년 ${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}월`;
}
