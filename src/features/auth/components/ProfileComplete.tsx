import inningLogMascot from "../../../assets/icons/inninglogmascot.svg";
import { Button } from "../../../shared/ui/Button";
import type { ProfileSetupStepProps } from "../types/ProfileSetupStepProps";

export function ProfileComplete({ onNext }: ProfileSetupStepProps) {
  return (
    <section className="flex h-[calc(var(--app-height,100dvh)_-_74.5px)] flex-col items-center overflow-hidden px-[16px] pb-[30px] pt-[52px]">
      <div className="flex flex-1 -translate-y-[45px] flex-col items-center justify-center">
        <img
          src={inningLogMascot}
          alt=""
          className="aspect-square w-1/2 object-contain"
        />

        <p className="text-subtitle mt-[17px] whitespace-pre-line text-center text-black">
          {"이닝 로그와 함께\n짜릿한 순간을 기록해볼까요?"}
        </p>
      </div>

      <Button onClick={onNext}>
        <span className="text-label-2 text-white">이닝 로그 즐기러 가기</span>
      </Button>
    </section>
  );
}
