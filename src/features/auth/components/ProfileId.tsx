import { Button } from "../../../shared/ui/Button";
import { Input } from "../../../shared/ui/Input";
import type { ProfileSetupStepProps } from "../types/ProfileSetupStepProps";

export type ProfileIdProps = ProfileSetupStepProps & {
  feedbackMessage?: string;
  feedbackTone?: "error" | "neutral" | "success";
  isChecking?: boolean;
  isSubmitting?: boolean;
  onBlur?: () => void;
  onChange: (value: string) => void;
  value: string;
};

export function ProfileId({
  feedbackMessage = "",
  feedbackTone = "neutral",
  isChecking = false,
  isSubmitting = false,
  onBlur,
  onChange,
  onNext,
  value,
}: ProfileIdProps) {
  const isBusy = isChecking || isSubmitting;
  const isNextEnabled = value.trim().length > 0 && !isBusy;
  const buttonLabel = isSubmitting
    ? "저장 중..."
    : isChecking
      ? "확인 중..."
      : "다음으로";

  const handleNext = () => {
    if (!isNextEnabled) {
      return;
    }

    onNext();
  };

  return (
    <section className="flex h-[calc(var(--app-height,100dvh)_-_74.5px)] flex-col overflow-hidden px-[33px] pb-[90px] pt-[52px] focus-within:pb-[10px]">
      <h1 className="text-title-2 whitespace-pre-line text-black">
        {"아이디를\n입력해주세요"}
      </h1>

      <div className="mt-[35px]">
        <Input
          value={value}
          disabled={isSubmitting}
          onBlur={onBlur}
          onChange={(event) => onChange(event.target.value)}
          placeholder="아이디 입력"
          aria-label="아이디 입력"
          autoComplete="off"
          className="w-full"
        />

        {feedbackMessage && (
          <p
            aria-live="polite"
            className={[
              "mt-[8px] px-[2px] text-caption",
              feedbackTone === "success"
                ? "text-accent-primary"
                : feedbackTone === "error"
                  ? "text-danger"
                  : "text-text-secondary",
            ].join(" ")}
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
