export type WatchingLocation = "stadium" | "home";

type WatchingLocationSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (location: WatchingLocation) => void;
};

export function WatchingLocationSheet({
  isOpen,
  onClose,
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
            className="button-text h-[54px] w-full rounded-full bg-accent-primary text-text-primary"
          >
            직관
          </button>

          <button
            type="button"
            onClick={() => onSelect("home")}
            className="button-text h-[54px] w-full rounded-full bg-text-tertiary text-text-primary"
          >
            집관
          </button>
        </div>
      </section>
    </div>
  );
}