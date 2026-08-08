import { useNavigate } from "react-router-dom";

type TimelineShareModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSaveMyVideo: () => void;
  onSaveWithFriend: () => void;
};

export function TimelineShareModal({
  isOpen,
  onClose,
  onSaveMyVideo,
  onSaveWithFriend,
}: TimelineShareModalProps) {
  const navigate = useNavigate();

  if (!isOpen) {
    return null;
  }

  const handleSaveWithFriend = () => {
    onSaveWithFriend();
    navigate("/timeline/save/friend");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center bg-black/50"
      onClick={onClose}
    >
      <div className="flex min-h-dvh w-full max-w-[430px] items-end">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="timeline-share-title"
          onClick={(event) => event.stopPropagation()}
          className="h-[367px] w-full rounded-t-[27.5px] bg-white pt-[14px]"
        >
          <div className="mx-auto h-[4px] w-[40px] rounded-full bg-text-tertiary" />

          <h2
            id="timeline-share-title"
            className="text-title mt-[18px] text-center text-black"
          >
            영상 저장하기
          </h2>

          <div className="mt-[24px] flex flex-col gap-[8px] px-[16px]">
            <button
              type="button"
              onClick={onSaveMyVideo}
              className="text-label-2 flex h-[55px] w-full items-center justify-center rounded-[27.5px] bg-accent-primary text-white active:bg-accent-pressed"
            >
              내 영상만 저장
            </button>

            <button
              type="button"
              onClick={handleSaveWithFriend}
              className="text-label-2 flex h-[55px] w-full items-center justify-center rounded-[27.5px] bg-accent-primary text-white active:bg-accent-pressed"
            >
              친구 영상과 함께 저장
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}