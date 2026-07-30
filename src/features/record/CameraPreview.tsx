import type { RefObject } from "react";

import cameraDeleteIcon from "../../assets/icons/camera_delete.svg";
import upArrowIcon from "../../assets/icons/uparrow.svg";

export type CameraPreviewMode = "camera" | "caption";

type CameraPreviewProps = {
  mode: CameraPreviewMode;
  caption: string;
  captionInputRef: RefObject<HTMLTextAreaElement | null>;
  onCaptionChange: (value: string) => void;
  onClose?: () => void;
  onCapture?: () => void;
  onLocationClick?: () => void;
};

export function CameraPreview({
  mode,
  caption,
  captionInputRef,
  onCaptionChange,
  onClose,
  onCapture,
  onLocationClick,
}: CameraPreviewProps) {
  const isCaptionMode = mode === "caption";

  return (
    <section
      className={`relative w-full overflow-hidden rounded-[25px] border-[3px] border-accent-primary bg-text-secondary transition-[height] duration-300 ${
        isCaptionMode ? "h-[200px]" : "h-[642px]"
      }`}
    >
      {/* 이후 이 위치에 실제 카메라 video 태그가 들어감 */}

      <button
        type="button"
        onClick={onClose}
        aria-label={isCaptionMode ? "촬영 결과 취소" : "촬영 화면 닫기"}
        className={`absolute top-[18px] z-20 flex h-[28px] w-[28px] items-center justify-center ${
          isCaptionMode ? "left-[18px]" : "right-[18px]"
        }`}
      >
        <img
          src={cameraDeleteIcon}
          alt=""
          className="h-[16px] w-[18px]"
        />
      </button>

      {isCaptionMode ? (
        <>
          <textarea
            ref={captionInputRef}
            value={caption}
            onChange={(event) => onCaptionChange(event.target.value)}
            placeholder="문구를 입력해주세요"
            maxLength={100}
            aria-label="영상 문구"
            className="text-body absolute inset-0 h-full w-full resize-none bg-transparent px-[45px] pb-[35px] pt-[70px] text-center text-text-primary outline-none placeholder:text-text-placeholder"
          />

          <button
            type="button"
            onClick={onLocationClick}
            aria-label="관람 장소 선택"
            className="absolute right-[18px] top-[14px] z-20 flex h-[31px] w-[31px] items-center justify-center rounded-full bg-accent-primary"
          >
            <img
              src={upArrowIcon}
              alt=""
              className="h-[15px] w-[15px]"
            />
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={onCapture}
          aria-label="영상 촬영 시작"
          className="absolute bottom-[35px] left-1/2 h-[71px] w-[71px] -translate-x-1/2 rounded-full border-[5px] border-accent-primary bg-bg-primary"
        />
      )}
    </section>
  );
}