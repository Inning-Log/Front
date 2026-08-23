import { Button } from "../../../shared/ui/Button";
import { Input } from "../../../shared/ui/Input";
import type { ProfileSetupStepProps } from "../types/ProfileSetupStepProps";

export type ProfileNicknameProps = ProfileSetupStepProps & {
  feedbackMessage?: string;
  isSubmitting?: boolean;
  onChange: (value: string) => void;
  value: string;
};

export function ProfileNickname({
  feedbackMessage = "",
  isSubmitting = false,
  onChange,
  onNext,
  value,
}: ProfileNicknameProps) {
  const isNextEnabled = value.trim().length > 0 && !isSubmitting;
  const buttonLabel = isSubmitting ? "저장 중..." : "다음으로";

  const handleNext = () => {
    if (!isNextEnabled) {
      return;
    }

    onNext();
  };

  return (
    <section className="flex h-[calc(var(--app-height,100dvh)_-_74.5px)] flex-col overflow-hidden px-[33px] pb-[90px] pt-[52px] focus-within:pb-[10px]">
      <h1 className="text-title-2 whitespace-pre-line text-black">
        {"닉네임을\n입력해주세요"}
      </h1>

      <div className="mt-[35px]">
        <Input
          value={value}
          disabled={isSubmitting}
          onChange={(event) => onChange(event.target.value)}
          placeholder="닉네임 입력"
          aria-label="닉네임 입력"
          autoComplete="off"
          className="w-full"
        />

        {feedbackMessage && (
          <p
            aria-live="polite"
            className="mt-[8px] px-[2px] text-caption text-danger"
          >
            {feedbackMessage}
          </p>
        )}
      </div>

      <Button
        onClick={handleNext}
        disabled={!isNextEnabled}
        className={[
          "mt-auto",
          isNextEnabled ? "" : "opacity-60",
        ].join(" ")}
      >
        <span className="text-label-2 text-white">{buttonLabel}</span>
      </Button>
    </section>
  );
}
