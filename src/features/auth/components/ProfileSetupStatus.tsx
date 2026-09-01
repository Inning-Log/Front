import { Button } from "../../../shared/ui/Button";

type ProfileSetupStatusProps = {
  actionLabel?: string;
  message: string;
  onAction?: () => void;
};

export function ProfileSetupStatus({
  actionLabel,
  message,
  onAction,
}: ProfileSetupStatusProps) {
  return (
    <section className="flex h-[calc(var(--app-height,100dvh)_-_74.5px)] flex-col items-center justify-center px-[33px] pb-[90px] pt-[52px]">
      <p
        aria-live="polite"
        className="whitespace-pre-line text-center text-caption text-text-secondary"
      >
        {message}
      </p>

      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-[24px]">
          <span className="text-label-2 text-white">{actionLabel}</span>
        </Button>
      )}
    </section>
  );
}
