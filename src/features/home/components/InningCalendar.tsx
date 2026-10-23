import {
  DayPicker,
  type DayProps,
  type WeekdayProps,
  type NextMonthButtonProps,
  type PreviousMonthButtonProps,
  UI,
} from "@daypicker/react";
import { useMemo } from "react";

import rightArrowIcon from "../../../assets/icons/rightarrow.svg";
import { getTeamByName } from "../../../shared/constants/teams";
import { TeamMascot } from "../../../shared/ui/TeamMascot";

type GameResult = "win" | "lose" | "draw";

export type CalendarRecord = {
  date: string;
  gameId?: number;
  result?: GameResult;
  emphasized?: boolean;
  highlighted?: boolean;
  opponentTeamName?: string;
  opponentTeamLogoUrl?: string | null;
};

type InningCalendarProps = {
  month: Date;
  records: CalendarRecord[];
  onMonthChange: (month: Date) => void;
  onRecordClick?: (record: CalendarRecord) => void;
};

const resultLabels: Record<GameResult, string> = {
  win: "승",
  lose: "패",
  draw: "무",
};

const resultTextColors: Record<GameResult, string> = {
  win: "text-accent-primary",
  lose: "text-danger",
  draw: "text-text-tertiary",
};

const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"];

export function InningCalendar({
  month,
  records,
  onMonthChange,
  onRecordClick,
}: InningCalendarProps) {
  const recordsByDate = useMemo(() => {
    return records.reduce<Record<string, CalendarRecord[]>>(
      (result, record) => {
        result[record.date] = [
          ...(result[record.date] ?? []),
          record,
        ];
        return result;
      },
      {},
    );
  }, [records]);

  const renderDay = (props: DayProps) => {
    const {
      day,
      modifiers,
      className,
      children,
      ...cellProps
    } = props;

    const date = day.date;
    const dayRecords = recordsByDate[toDateKey(date)] ?? [];
    const record =
      dayRecords.find((candidate) => candidate.emphasized) ??
      dayRecords[0];
    const gameCount = dayRecords.filter(
      (candidate) => candidate.gameId !== undefined,
    ).length;

    const isOutside = modifiers.outside;
    const isSunday = date.getDay() === 0;

    const dayNumberColor = isOutside
      ? "text-text-tertiary"
      : isSunday
        ? "text-danger"
        : "text-black";

    const canOpenRecord = Boolean(
      record?.gameId !== undefined && onRecordClick,
    );

    const handleRecordClick = () => {
      if (!record) {
        return;
      }

      onRecordClick?.(record);
    };

    if (record?.emphasized) {
      return (
        <td {...cellProps} className={className}>
          <button
            type="button"
            onClick={handleRecordClick}
            disabled={!canOpenRecord}
            aria-label={`${toDateKey(date)} 경기 기록 보기`}
            className={[
              "relative mx-auto flex h-[80px] w-[82%] max-w-[42px] flex-col items-center rounded-[21px] bg-accent-deep pt-[4px]",
              canOpenRecord
                ? "cursor-pointer"
                : "cursor-default",
            ].join(" ")}
          >
            <span className="text-number mt-[4px] flex h-[13px] min-w-[13px] items-center justify-center text-white">
              {date.getDate()}
            </span>

            <CalendarTeamIcon record={record} />

            {record.result && (
              <span
                className={[
                  "mt-[4px] text-caption",
                  resultTextColors[record.result],
                ].join(" ")}
              >
                {resultLabels[record.result]}
              </span>
            )}

            {gameCount > 1 && (
              <span className="absolute right-[-2px] top-[27px] rounded-full bg-white px-[3px] text-[8px] leading-[12px] text-accent-deep">
                +{gameCount - 1}
              </span>
            )}

            <span className="sr-only">{children}</span>
          </button>
        </td>
      );
    }

    return (
      <td {...cellProps} className={className}>
        <button
          type="button"
          onClick={handleRecordClick}
          disabled={!canOpenRecord}
          aria-label={
            record
              ? `${toDateKey(date)} 경기 기록 보기`
              : undefined
          }
          className={[
            "relative mx-auto flex h-[80px] w-[82%] max-w-[42px] flex-col items-center pt-[4px]",
            canOpenRecord
              ? "cursor-pointer"
              : "cursor-default",
          ].join(" ")}
        >
          <span
            className={[
              "relative mt-[1px] flex h-[20px] min-w-[20px] items-center justify-center rounded-full",
              "text-number",
              record?.highlighted
                ? "bg-accent-primary text-white"
                : dayNumberColor,
            ].join(" ")}
          >
            {date.getDate()}
          </span>

          {record?.gameId !== undefined && (
            <>
              <CalendarTeamIcon record={record} />

              {record.result && (
                <span
                  className={[
                    "mt-[4px] text-caption",
                    resultTextColors[record.result],
                  ].join(" ")}
                >
                  {resultLabels[record.result]}
                </span>
              )}

              {gameCount > 1 && (
                <span className="absolute right-[-2px] top-[27px] rounded-full bg-accent-deep px-[3px] text-[8px] leading-[12px] text-white">
                  +{gameCount - 1}
                </span>
              )}
            </>
          )}

          <span className="sr-only">{children}</span>
        </button>
      </td>
    );
  };

  return (
    <DayPicker
      month={month}
      onMonthChange={onMonthChange}
      weekStartsOn={1}
      showOutsideDays
      hideNavigation
      components={{
        Day: renderDay,
        Weekday,
        PreviousMonthButton,
        NextMonthButton,
      }}
      formatters={{
        formatCaption: (captionMonth) =>
          formatMonthLabel(captionMonth),
        formatWeekdayName: (weekday) =>
          weekdayLabels[weekday.getDay()],
      }}
      classNames={{
        [UI.Root]: "text-number w-full",
        [UI.Months]: "w-full",
        [UI.Month]: "w-full",
        [UI.MonthCaption]: "hidden",
        [UI.MonthGrid]: "w-full table-fixed border-collapse",
        [UI.Weekdays]: "h-[21px]",
        [UI.Weekday]: "text-label-4 pb-[5px] text-center",
        [UI.Weeks]: "w-full",
        [UI.Week]: "h-[85px]",
        [UI.Day]: "h-[85px] w-[14.285%] p-0 align-top",
        [UI.DayButton]: "outline-none",
      }}
    />
  );
}

function Weekday(props: WeekdayProps) {
  const isSunday = props.children === "일";

  return (
    <th
      {...props}
      className={[
        props.className ?? "",
        isSunday ? "text-danger" : "text-accent-deep",
      ].join(" ")}
    />
  );
}

function PreviousMonthButton(
  props: PreviousMonthButtonProps,
) {
  return (
    <button {...props} type="button" aria-label="이전 달">
      <img
        src={rightArrowIcon}
        alt=""
        className="h-[17px] w-[17px] rotate-180"
      />
    </button>
  );
}

function NextMonthButton(props: NextMonthButtonProps) {
  return (
    <button {...props} type="button" aria-label="다음 달">
      <img
        src={rightArrowIcon}
        alt=""
        className="h-[17px] w-[12px]"
      />
    </button>
  );
}

function formatMonthLabel(date: Date) {
  return `${date.getFullYear()}년 ${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}월`;
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}-${String(date.getDate()).padStart(
    2,
    "0",
  )}`;
}

function CalendarTeamIcon({ record }: { record: CalendarRecord }) {
  const team = record.opponentTeamName
    ? getTeamByName(record.opponentTeamName)
    : undefined;

  if (team) {
    return (
      <TeamMascot
        team={team}
        containerSize={24}
        className="mt-[5px]"
        decorative
      />
    );
  }

  if (record.opponentTeamLogoUrl) {
    return (
      <img
        src={record.opponentTeamLogoUrl}
        alt=""
        className="mt-[5px] h-[24px] w-[24px] object-contain"
      />
    );
  }

  return (
    <span className="mt-[5px] h-[24px] w-[24px] rounded-full bg-surface-placeholder" />
  );
}
