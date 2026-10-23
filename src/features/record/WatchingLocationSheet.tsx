export type WatchingLocation = "stadium" | "home";

type WatchingLocationSheetProps = {
  isOpen: boolean;
  isSubmitting?: boolean;
  feedbackMessage?: string;
  onClose: () => void;
  onRetry?: () => void;
  onSelect: (location: WatchingLocation) => void;
};

export function WatchingLocationSheet({
  isOpen,
  isSubmitting = false,
  feedbackMessage = "",
  onClose,
  onRetry,
  onSelect,
}: WatchingLocationSheetProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="관람 장소 선택 닫기"
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
      />

      <section className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-[390px] rounded-t-[30px] bg-bg-primary px-4 pb-[120px] pt-[12px]">
        <div className="mx-auto h-[5px] w-[44px] rounded-full bg-text-tertiary" />

        <h2 className="text-label-2 mt-[18px] text-center text-button-neutral">
          야구를 어디서 보고 있나요?
        </h2>

        <div className="mt-[20px] flex flex-col gap-[10px]">
          <button
            type="button"
            onClick={() => onSelect("stadium")}
            disabled={isSubmitting}
            className="button-text h-[54px] w-full rounded-full bg-accent-primary text-text-primary disabled:opacity-50"
          >
            직관
          </button>

          <button
            type="button"
            onClick={() => onSelect("home")}
            disabled={isSubmitting}
            className="button-text h-[54px] w-full rounded-full bg-accent-primary text-text-primary active:bg-accent-pressed disabled:opacity-50"
          >
            집관
          </button>
        </div>

        {isSubmitting && (
          <p role="status" className="mt-[12px] text-center text-caption text-text-tertiary">
            오늘 경기를 확인하고 있어요.
          </p>
        )}

        {!isSubmitting && feedbackMessage && (
          <div className="mt-[12px] text-center">
            <p role="alert" className="text-caption text-danger">
              {feedbackMessage}
            </p>

            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-[4px] text-caption text-accent-deep underline"
              >
                다시 시도
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
