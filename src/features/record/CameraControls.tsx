import flashIcon from "../../assets/icons/flash.svg";
import timerIcon from "../../assets/icons/timer.svg";

export type CameraDirection = "front" | "rear";

type CameraControlsProps = {
  direction: CameraDirection;
  onDirectionChange: (direction: CameraDirection) => void;
  onFlashClick?: () => void;
  onTimerClick?: () => void;
};

export function CameraControls({
  direction,
  onDirectionChange,
  onFlashClick,
  onTimerClick,
}: CameraControlsProps) {
  return (
    <div className="flex w-full items-center justify-center gap-[22px]">
      <button
        type="button"
        onClick={onFlashClick}
        aria-label="플래시 설정"
        className="flex h-[47px] w-[47px] shrink-0 items-center justify-center rounded-full bg-white shadow-[0_1px_3.6px_rgba(0,0,0,0.25)]"
      >
        <img
          src={flashIcon}
          alt=""
          className="h-[24px] w-[14px]"
        />
      </button>

        <div className="grid h-[50px] w-[157px] grid-cols-2 items-center rounded-[25px] bg-white p-1 shadow-[0_1px_3.6px_rgba(0,0,0,0.25)]">
        <button
            type="button"
            onClick={() => onDirectionChange("front")}
            aria-pressed={direction === "front"}
            className={[
            "flex h-[42px] w-full items-center justify-center rounded-[21px]",
            "font-pretendard text-[16px] font-medium leading-none tracking-[0.32px]",
            direction === "front"
                ? "bg-[#D9D9D9] text-black"
                : "bg-transparent text-[#5A5A5A]",
            ].join(" ")}
        >
            전면
        </button>

        <button
            type="button"
            onClick={() => onDirectionChange("rear")}
            aria-pressed={direction === "rear"}
            className={[
            "flex h-[42px] w-full items-center justify-center rounded-[21px]",
            "font-pretendard text-[16px] font-medium leading-none tracking-[0.32px]",
            direction === "rear"
                ? "bg-[#D9D9D9] text-black"
                : "bg-transparent text-[#5A5A5A]",
            ].join(" ")}
        >
            후면
        </button>
        </div>

      <button
        type="button"
        onClick={onTimerClick}
        aria-label="타이머 설정"
        className="flex h-[47px] w-[47px] shrink-0 items-center justify-center rounded-full bg-white shadow-[0_1px_3.6px_rgba(0,0,0,0.25)]"
      >
        <img
          src={timerIcon}
          alt=""
          className="h-[18px] w-[18px]"
        />
      </button>
    </div>
  );
}