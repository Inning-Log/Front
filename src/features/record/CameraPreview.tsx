import type {
  RefObject,
} from "react";

import cameraDeleteIcon from "../../assets/icons/camera_delete.svg";
import upArrowIcon from "../../assets/icons/uparrow.svg";

export type CameraPreviewMode =
  | "camera"
  | "caption";

type CameraPreviewProps = {
  mode: CameraPreviewMode;

  caption: string;

  captionInputRef:
    RefObject<HTMLTextAreaElement | null>;

  videoRef:
    RefObject<HTMLVideoElement | null>;

  recordedVideoUrl:
    string | null;

  isCameraActive: boolean;
  isRequestingCamera: boolean;
  isRecording: boolean;

  onCaptionChange: (
    value: string,
  ) => void;

  onClose?: () => void;
  onCapture?: () => void;
  onLocationClick?: () => void;
};

export function CameraPreview({
  mode,
  caption,
  captionInputRef,
  videoRef,
  recordedVideoUrl,
  isCameraActive,
  isRequestingCamera,
  isRecording,
  onCaptionChange,
  onClose,
  onCapture,
  onLocationClick,
}: CameraPreviewProps) {
  const isCaptionMode =
    mode === "caption";

  return (
    <section
      className={`relative w-full overflow-hidden rounded-[25px] border-[3px] border-accent-primary bg-black transition-[height] duration-300 ${
        isCaptionMode
          ? "h-[200px]"
          : "h-[642px]"
      }`}
    >
      {!isCaptionMode && (
        <>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />

          {isRecording && (
            <div className="absolute left-[18px] top-[18px] z-20 flex items-center gap-[7px] rounded-full bg-black/50 px-[11px] py-[7px]">
              <span className="size-[8px] rounded-full bg-red-500" />

              <span className="text-caption text-white">
                REC
              </span>
            </div>
          )}
        </>
      )}

      {isCaptionMode &&
        recordedVideoUrl && (
          <>
            <video
              src={
                recordedVideoUrl
              }
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 h-full w-full object-cover"
            />

            {/* 글자가 영상 위에서도 잘 보이도록 살짝 어둡게 */}
            <div className="absolute inset-0 bg-black/30" />
          </>
        )}

      <button
        type="button"
        onClick={
          onClose
        }
        aria-label={
          isCaptionMode
            ? "촬영 결과 취소"
            : "촬영 화면 닫기"
        }
        className={`absolute top-[18px] z-30 flex h-[28px] w-[28px] items-center justify-center ${
          isCaptionMode
            ? "left-[18px]"
            : "right-[18px]"
        }`}
      >
        <img
          src={
            cameraDeleteIcon
          }
          alt=""
          className="h-[16px] w-[18px]"
        />
      </button>

      {isCaptionMode ? (
        <>
          <textarea
            ref={
              captionInputRef
            }
            value={
              caption
            }
            onChange={(
              event,
            ) =>
              onCaptionChange(
                event.target
                  .value,
              )
            }
            placeholder="문구를 입력해주세요"
            maxLength={
              100
            }
            aria-label="영상 문구"
            className="text-body absolute inset-0 z-20 h-full w-full resize-none bg-transparent px-[45px] pb-[35px] pt-[70px] text-center text-white outline-none placeholder:text-white/60"
          />

          <button
            type="button"
            onClick={
              onLocationClick
            }
            aria-label="기록 저장"
            className="absolute right-[18px] top-[14px] z-30 flex h-[31px] w-[31px] items-center justify-center rounded-full bg-accent-primary"
          >
            <img
              src={
                upArrowIcon
              }
              alt=""
              className="h-[15px] w-[15px]"
            />
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={
            onCapture
          }
          disabled={
            isRequestingCamera ||
            isRecording ||
            !isCameraActive
          }
          aria-label={
            isRecording
              ? "영상 촬영 중"
              : "영상 촬영 시작"
          }
          className={[
            "absolute bottom-[35px] left-1/2 z-30 h-[71px] w-[71px] -translate-x-1/2 rounded-full border-[5px] border-accent-primary",
            isRecording
              ? "bg-red-500"
              : "bg-bg-primary",
            isRequestingCamera ||
            isRecording ||
            !isCameraActive
              ? "opacity-70"
              : "",
          ].join(" ")}
        />
      )}
    </section>
  );
}