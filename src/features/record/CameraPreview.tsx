import type {
  RefObject,
} from "react";

import cameraDeleteIcon from "../../assets/icons/camera_delete.svg";
import upArrowIcon from "../../assets/icons/uparrow.svg";

import type {
  CameraDirection,
} from "./CameraControls";

export type CameraPreviewMode =
  | "camera"
  | "caption";

export type CameraZoom =
  | 0.5
  | 1
  | 2
  | 3;

type CameraPreviewProps = {
  mode:
    CameraPreviewMode;

  caption:
    string;

  cameraDirection:
    CameraDirection;

  cameraZoom:
    CameraZoom;

  supportedZooms:
    CameraZoom[];

  countdown:
    number | null;

  captionInputRef:
    RefObject<HTMLTextAreaElement | null>;

  videoRef:
    RefObject<HTMLVideoElement | null>;

  recordedVideoUrl:
    string | null;

  isCameraActive:
    boolean;

  isRequestingCamera:
    boolean;

  isRecording:
    boolean;

  onCaptionChange: (
    value: string,
  ) => void;

  onZoomChange?: (
    zoom: CameraZoom,
  ) => void;

  onClose?: () => void;
  onCapture?: () => void;
  onLocationClick?: () => void;
};

const CAMERA_ZOOMS:
  CameraZoom[] = [
    0.5,
    1,
    2,
    3,
  ];

function getZoomLabel(
  zoom: CameraZoom,
) {
  if (
    zoom === 1
  ) {
    return "1x";
  }

  return String(
    zoom,
  );
}

export function CameraPreview({
  mode,
  caption,
  cameraDirection,
  cameraZoom,
  supportedZooms,
  countdown,
  captionInputRef,
  videoRef,
  recordedVideoUrl,
  isCameraActive,
  isRequestingCamera,
  isRecording,
  onCaptionChange,
  onZoomChange,
  onClose,
  onCapture,
  onLocationClick,
}: CameraPreviewProps) {
  const isCaptionMode =
    mode ===
    "caption";

  const isCountingDown =
    countdown !==
    null;

  const zoomControlsDisabled =
    isRecording ||
    isCountingDown ||
    isRequestingCamera ||
    !isCameraActive;

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
            ref={
              videoRef
            }
            autoPlay
            muted
            playsInline
            className={[
              "absolute inset-0 h-full w-full object-cover",

              /*
               * 전면카메라는 미리보기만
               * 거울처럼 보여준다.
               *
               * MediaRecorder 원본에는
               * 이 CSS가 적용되지 않는다.
               */
              cameraDirection ===
              "front"
                ? "scale-x-[-1]"
                : "",
            ].join(
              " ",
            )}
          />

          {isRecording && (
            <div className="absolute left-[18px] top-[18px] z-20 flex items-center gap-[7px] rounded-full bg-black/50 px-[11px] py-[7px]">
              <span className="size-[8px] rounded-full bg-red-500" />

              <span className="text-caption text-white">
                REC
              </span>
            </div>
          )}

          {isCountingDown && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/20">
              <span className="font-pretendard text-[96px] font-bold leading-none text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                {
                  countdown
                }
              </span>
            </div>
          )}

          {cameraDirection ===
            "rear" && (
            <div className="absolute bottom-[125px] left-1/2 z-30 flex -translate-x-1/2 items-center gap-[6px] rounded-full bg-black/35 px-[8px] py-[6px] backdrop-blur-sm">
              {CAMERA_ZOOMS.map(
                (
                  zoom,
                ) => {
                  const isSupported =
                    supportedZooms.includes(
                      zoom,
                    );

                  const isSelected =
                    cameraZoom ===
                    zoom;

                  const disabled =
                    zoomControlsDisabled ||
                    !isSupported;

                  return (
                    <button
                      key={
                        zoom
                      }
                      type="button"
                      disabled={
                        disabled
                      }
                      aria-label={`${zoom}배 카메라`}
                      aria-pressed={
                        isSelected
                      }
                      onClick={() => {
                        if (
                          disabled
                        ) {
                          return;
                        }

                        onZoomChange?.(
                          zoom,
                        );
                      }}
                      className={[
                        "flex h-[38px] min-w-[38px] items-center justify-center rounded-full px-[8px]",
                        "font-pretendard text-[14px] font-semibold leading-none transition-all",
                        isSelected
                          ? "bg-white text-black"
                          : "bg-black/40 text-white",
                        !isSupported
                          ? "cursor-not-allowed opacity-30"
                          : "",
                        zoomControlsDisabled &&
                        isSupported
                          ? "opacity-50"
                          : "",
                      ].join(
                        " ",
                      )}
                    >
                      {
                        getZoomLabel(
                          zoom,
                        )
                      }
                    </button>
                  );
                },
              )}
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
              loop
              playsInline
              muted={
                false
              }
              className="absolute inset-0 h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-black/30" />
          </>
        )}

      <button
        type="button"
        onClick={
          onClose
        }
        disabled={
          isCountingDown ||
          isRecording
        }
        aria-label={
          isCaptionMode
            ? "촬영 결과 취소"
            : "촬영 화면 닫기"
        }
        className={[
          "absolute top-[18px] z-50 flex h-[28px] w-[28px] items-center justify-center",
          isCaptionMode
            ? "left-[18px]"
            : "right-[18px]",
          isCountingDown ||
          isRecording
            ? "opacity-50"
            : "",
        ].join(
          " ",
        )}
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
            isCountingDown ||
            !isCameraActive
          }
          aria-label={
            isCountingDown
              ? "촬영 타이머 진행 중"
              : isRecording
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
            isCountingDown ||
            !isCameraActive
              ? "opacity-70"
              : "",
          ].join(
            " ",
          )}
        />
      )}
    </section>
  );
}