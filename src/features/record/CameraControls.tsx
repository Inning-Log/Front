import flashIcon from "../../assets/icons/flash.svg";
import timerIcon from "../../assets/icons/timer.svg";

export type CameraDirection =
  | "front"
  | "rear";

type CameraControlsProps = {
  direction: CameraDirection;

  flashOn: boolean;
  timerEnabled: boolean;
  disabled?: boolean;

  onDirectionChange: (
    direction: CameraDirection,
  ) => void;

  onFlashClick?: () => void;
  onTimerClick?: () => void;
};

export function CameraControls({
  direction,
  flashOn,
  timerEnabled,
  disabled = false,
  onDirectionChange,
  onFlashClick,
  onTimerClick,
}: CameraControlsProps) {
  return (
    <div className="flex w-full items-center justify-center gap-[22px]">
      <button
        type="button"
        onClick={
          onFlashClick
        }
        disabled={
          disabled
        }
        aria-label={
          flashOn
            ? "플래시 끄기"
            : "플래시 켜기"
        }
        aria-pressed={
          flashOn
        }
        className={[
          "flex h-[47px] w-[47px] shrink-0 items-center justify-center rounded-full shadow-[0_1px_3.6px_rgba(0,0,0,0.25)] transition-colors",
          flashOn
            ? "bg-accent-primary"
            : "bg-white",
          disabled
            ? "opacity-50"
            : "",
        ].join(" ")}
      >
        <img
          src={flashIcon}
          alt=""
          className={[
            "h-[24px] w-[14px]",
            flashOn
              ? "brightness-0 invert"
              : "",
          ].join(" ")}
        />
      </button>

      <div className="grid h-[50px] w-[157px] grid-cols-2 items-center rounded-[25px] bg-white p-1 shadow-[0_1px_3.6px_rgba(0,0,0,0.25)]">
        <button
          type="button"
          disabled={
            disabled
          }
          onClick={() =>
            onDirectionChange(
              "front",
            )
          }
          aria-pressed={
            direction ===
            "front"
          }
          className={[
            "flex h-[42px] w-full items-center justify-center rounded-[21px]",
            "font-pretendard text-[16px] font-medium leading-none tracking-[0.32px]",
            direction ===
            "front"
              ? "bg-[#D9D9D9] text-black"
              : "bg-transparent text-[#5A5A5A]",
            disabled
              ? "opacity-50"
              : "",
          ].join(" ")}
        >
          전면
        </button>

        <button
          type="button"
          disabled={
            disabled
          }
          onClick={() =>
            onDirectionChange(
              "rear",
            )
          }
          aria-pressed={
            direction ===
            "rear"
          }
          className={[
            "flex h-[42px] w-full items-center justify-center rounded-[21px]",
            "font-pretendard text-[16px] font-medium leading-none tracking-[0.32px]",
            direction ===
            "rear"
              ? "bg-[#D9D9D9] text-black"
              : "bg-transparent text-[#5A5A5A]",
            disabled
              ? "opacity-50"
              : "",
          ].join(" ")}
        >
          후면
        </button>
      </div>

      <button
        type="button"
        onClick={
          onTimerClick
        }
        disabled={
          disabled
        }
        aria-label={
          timerEnabled
            ? "3초 타이머 끄기"
            : "3초 타이머 켜기"
        }
        aria-pressed={
          timerEnabled
        }
        className={[
          "flex h-[47px] w-[47px] shrink-0 items-center justify-center rounded-full shadow-[0_1px_3.6px_rgba(0,0,0,0.25)] transition-colors",
          timerEnabled
            ? "bg-accent-primary"
            : "bg-white",
          disabled
            ? "opacity-50"
            : "",
        ].join(" ")}
      >
        <img
          src={timerIcon}
          alt=""
          className={[
            "h-[18px] w-[18px]",
            timerEnabled
              ? "brightness-0 invert"
              : "",
          ].join(" ")}
        />
      </button>
    </div>
  );
}