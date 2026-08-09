import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Toast } from "../../../shared/ui/Toast";

type TimelineShareModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSaveMyVideo: () => void;
  onSaveWithFriend: () => void;
};

export function TimelineShareModal({
  isOpen,
  onClose,
  //onSaveMyVideo,
  onSaveWithFriend,
}: TimelineShareModalProps) {
  const navigate = useNavigate();

  const [isSaving, setIsSaving] = useState(false);

  const [isToastOpen, setIsToastOpen] = useState(false);

  if (!isOpen) {
    return null;
  }

    const handleSaveMyVideo = () => {
    if (isSaving) {
    return;
    }

    setIsSaving(true);

    // TODO: 실제 영상 생성 및 저장 완료 시 false 처리
    // 현재는 임시 로딩 확인용
    setTimeout(() => {
    setIsSaving(false);
    setIsToastOpen(true);

    setTimeout(() => {
        onClose();
    }, 1000);
    }, 3000);
    };

  const handleSaveWithFriend = () => {
    onSaveWithFriend();
    navigate("/timeline/save/friend");
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex justify-center bg-black/50"
        onClick={isSaving ? undefined : onClose}
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
                onClick={handleSaveMyVideo}
                disabled={isSaving}
                className="text-label-2 flex h-[55px] w-full items-center justify-center rounded-[27.5px] bg-accent-primary text-white active:bg-accent-pressed disabled:pointer-events-none disabled:opacity-60"
              >
                내 영상만 저장
              </button>

              <button
                type="button"
                onClick={handleSaveWithFriend}
                disabled={isSaving}
                className="text-label-2 flex h-[55px] w-full items-center justify-center rounded-[27.5px] bg-accent-primary text-white active:bg-accent-pressed disabled:pointer-events-none disabled:opacity-60"
              >
                친구 영상과 함께 저장
              </button>
            </div>
          </section>
        </div>
      </div>

      {isSaving && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="flex flex-col items-center rounded-[20px] bg-white px-[40px] py-[32px]">
            <div className="size-[36px] animate-spin rounded-full border-[4px] border-surface-secondary border-t-accent-primary" />

            <p className="mt-[16px] text-label-3 text-black">
              영상 저장 중...
            </p>
          </div>
        </div>
      )}

      <Toast
        open={isToastOpen}
        message="영상이 저장되었습니다."
        onClose={() => setIsToastOpen(false)}
        />
    </>
  );
}