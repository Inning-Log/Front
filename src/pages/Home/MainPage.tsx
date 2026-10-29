import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { BottomBar } from "../../app/layouts/BottomBar";
import { PageHeader } from "../../app/layouts/PageHeader";
import addFriendIcon from "../../assets/icons/addfriend.svg";
import notificationIcon from "../../assets/icons/notification.svg";
import rightArrowIcon from "../../assets/icons/rightarrow.svg";
import {
  getHomeCalendar,
  getHomeWinRate,
} from "../../features/home/api/homeApi";
import { getNotifications } from "../../features/home/api/notificationApi";
import {
  InningCalendar,
  type CalendarRecord,
} from "../../features/home/components/InningCalendar";
import type { HomeCalendarResponse } from "../../features/home/types/home";
import { KBO_TEAMS } from "../../shared/constants/teams";
import { Button } from "../../shared/ui/Button";
import { TeamMascot } from "../../shared/ui/TeamMascot";

export function MainPage() {
  const navigate = useNavigate();

  const [month, setMonth] = useState(() => {
    const today = new Date();

    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [winRate, setWinRate] = useState<number | null>();
  const [winRateError, setWinRateError] = useState("");
  const [favoriteTeamId, setFavoriteTeamId] = useState<number | null>(null);
  const [calendarRecords, setCalendarRecords] = useState<
    CalendarRecord[]
  >([]);
  const [isCalendarLoading, setIsCalendarLoading] = useState(true);
  const [calendarError, setCalendarError] = useState("");
  const [calendarReloadKey, setCalendarReloadKey] = useState(0);

  const [hasUnreadNotification, setHasUnreadNotification] =
    useState(false);

  useEffect(() => {
    let isCancelled = false;

    const fetchWinRate = async () => {
      try {
        const data = await getHomeWinRate();

        if (!isCancelled) {
          setWinRate(data.winRatePercent);
          setWinRateError("");
        }
      } catch (error) {
        if (!isCancelled) {
          setWinRate(null);
          setWinRateError(
            error instanceof Error
              ? error.message
              : "직관 승률을 불러오지 못했습니다.",
          );
        }
      }
    };

    void fetchWinRate();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const fetchCalendar = async () => {
      setIsCalendarLoading(true);
      setCalendarError("");

      try {
        const data = await getHomeCalendar(
          month.getFullYear(),
          month.getMonth() + 1,
        );

        if (!isCancelled) {
          setCalendarRecords(toCalendarRecords(data));
          setFavoriteTeamId(data.favoriteTeamId);
        }
      } catch (error) {
        if (!isCancelled) {
          setCalendarRecords([]);
          setCalendarError(
            error instanceof Error
              ? error.message
              : "월간 경기 일정을 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsCalendarLoading(false);
        }
      }
    };

    void fetchCalendar();

    return () => {
      isCancelled = true;
    };
  }, [calendarReloadKey, month]);

  useEffect(() => {
    const fetchUnreadNotificationStatus = async () => {
      try {
        const data = await getNotifications();

        setHasUnreadNotification(data.unreadCount > 0);
      } catch (error) {
        console.error("알림 미읽음 여부 조회 실패:", error);
      }
    };

    void fetchUnreadNotificationStatus();
  }, []);

  const goToPreviousMonth = () => {
    setMonth(
      (currentMonth) =>
        new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth() - 1,
          1,
        ),
    );
  };

  const goToNextMonth = () => {
    setMonth(
      (currentMonth) =>
        new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth() + 1,
          1,
        ),
    );
  };

  const handleRecordDateClick = (record: CalendarRecord) => {
    if (record.gameId === undefined) {
      return;
    }

    navigate(`/timeline/history/${record.gameId}`);
  };

  const favoriteTeam = KBO_TEAMS.find(
    (team) => team.id === favoriteTeamId,
  );

  return (
    <div className="relative h-dvh overflow-hidden bg-white">
      <main className="scrollbar-hide h-full overflow-y-auto px-[11px] pb-[72px] pt-[20px]">
        <PageHeader
          title={
            <>
              <span className="sr-only">홈</span>

              <TeamMascot
                team={favoriteTeam}
                containerSize={40}
                decorative
              />
            </>
          }
          showBackButton={false}
          leftContent={
            <HomeWinRateSummary
              winRate={winRate}
              errorMessage={winRateError}
            />
          }
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
                showBadge={hasUnreadNotification}
              />
            </div>
          }
        />

        <div className="mb-[20px] mt-[12px] flex h-[28px] items-center justify-between px-[5px]">
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
            <img
              src={rightArrowIcon}
              alt=""
              className="h-[17px] w-[12px]"
            />
          </button>
        </div>

        <div className="relative">
          <InningCalendar
            month={month}
            records={calendarRecords}
            onMonthChange={setMonth}
            onRecordClick={handleRecordDateClick}
          />

          {isCalendarLoading && (
            <div
              role="status"
              className="absolute inset-0 flex items-center justify-center bg-white/70 text-caption text-text-tertiary"
            >
              경기 일정을 불러오는 중...
            </div>
          )}
        </div>

        {calendarError && (
          <div className="mt-[8px] text-center">
            <p role="alert" className="text-caption text-danger">
              {calendarError}
            </p>
            <button
              type="button"
              onClick={() =>
                setCalendarReloadKey((current) => current + 1)
              }
              className="mt-[4px] text-caption text-accent-deep underline"
            >
              다시 시도
            </button>
          </div>
        )}

        <div className="mt-[40px] flex justify-center">
          <Button onClick={() => navigate("/home/record")}>
            <span className="text-label-2 text-white">
              기록하기
            </span>
          </Button>
        </div>
      </main>

      <BottomBar />
    </div>
  );
}

type HomeWinRateSummaryProps = {
  winRate: number | null | undefined;
  errorMessage: string;
};

function HomeWinRateSummary({
  winRate,
  errorMessage,
}: HomeWinRateSummaryProps) {
  const formattedWinRate = formatWinRate(winRate);

  return (
    <div
      className="ml-[8px] flex min-w-[40px] items-baseline"
      aria-label={`직관 승률 ${formattedWinRate}${typeof winRate === "number" ? "%" : ""}`}
    >
      <span className="mr-[5px] font-akatab text-[15px] font-bold leading-none text-accent-deep">
        승률
      </span>

      <span className="flex items-baseline font-akatab text-[20px] font-extrabold leading-none text-accent-deep">
        {formattedWinRate}

        {typeof winRate === "number" && (
          <span className="ml-[1px] text-[16px] font-black">
            %
          </span>
        )}
      </span>

      {errorMessage && (
        <span role="alert" className="sr-only">
          {errorMessage}
        </span>
      )}
    </div>
  );
}

type HeaderIconLinkProps = {
  to: string;
  iconSrc: string;
  label: string;
  showBadge?: boolean;
};

function HeaderIconLink({
  to,
  iconSrc,
  label,
  showBadge = false,
}: HeaderIconLinkProps) {
  return (
    <Link
      to={to}
      aria-label={label}
      className="relative block"
    >
      <img
        src={iconSrc}
        alt=""
        className="h-[22px] w-auto"
      />

      {showBadge && (
        <span className="absolute right-[-2px] top-[-4px] h-[7px] w-[7px] rounded-full bg-danger" />
      )}
    </Link>
  );
}

function formatMonthLabel(date: Date) {
  return `${date.getFullYear()}년 ${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}월`;
}

function formatWinRate(winRate: number | null | undefined) {
  if (winRate === undefined) {
    return "···";
  }

  if (winRate === null) {
    return "-";
  }

  return Number.isInteger(winRate) ? String(winRate) : winRate.toFixed(1);
}

function toCalendarRecords(data: HomeCalendarResponse) {
  const records = data.days.flatMap<CalendarRecord>((day) =>
    day.games.map((game) => ({
      date: day.date,
      emphasized: Boolean(game.myViewing),
      gameId: game.gameId,
      highlighted: day.date === data.today,
      opponentTeamLogoUrl: game.opponentTeam?.logoUrl,
      opponentTeamName: game.opponentTeam?.name,
      result: toCalendarResult(game.displayResult),
    })),
  );

  const isTodayInRequestedMonth =
    data.today.startsWith(
      `${data.year}-${String(data.month).padStart(2, "0")}-`,
    );
  const hasTodayRecord = records.some(
    (record) => record.date === data.today,
  );

  if (isTodayInRequestedMonth && !hasTodayRecord) {
    records.push({
      date: data.today,
      highlighted: true,
    });
  }

  return records;
}

function toCalendarResult(result?: string | null) {
  switch (result) {
    case "WIN":
      return "win" as const;
    case "LOSS":
    case "LOSE":
      return "lose" as const;
    case "DRAW":
      return "draw" as const;
    default:
      return undefined;
  }
}
