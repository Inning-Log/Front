import { Button } from "../../../shared/ui/Button";
import { Input } from "../../../shared/ui/Input";
import type { ProfileSetupStepProps } from "../types/ProfileSetupStepProps";

type ProfileIdProps = ProfileSetupStepProps & {
  onChange: (value: string) => void;
  value: string;
};

export function ProfileId({ onChange, onNext, value }: ProfileIdProps) {
  const isNextEnabled = value.trim().length > 0;

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
          onChange={(event) => onChange(event.target.value)}
          placeholder="아이디 입력"
          aria-label="아이디 입력"
          autoComplete="off"
          className="w-full"
        />
      </div>

      <Button
        onClick={handleNext}
        disabled={!isNextEnabled}
        className={[
          "mt-auto",
          isNextEnabled ? "" : "opacity-60",
        ].join(" ")}
      >
        <span className="text-label-2 text-white">다음으로</span>
      </Button>
    </section>
  );
}
