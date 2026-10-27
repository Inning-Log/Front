import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  getCurrentUser,
} from "../../features/auth/api/authApi";

import {
  getGames,
  getGameStateHistory,
} from "../../features/games/api/gamesApi";

import type {
  GameResponse,
  GameStateResponse,
} from "../../features/games/types/game";

import {
  CameraControls,
} from "../../features/record/CameraControls";

import type {
  CameraDirection,
} from "../../features/record/CameraControls";

import {
  CameraPreview,
  type CameraPreviewMode,
} from "../../features/record/CameraPreview";

import {
  InningIndicator,
} from "../../features/record/InningIndicator";

import {
  WatchingLocationSheet,
  type WatchingLocation,
} from "../../features/record/WatchingLocationSheet";

import {
  createInningRecord,
} from "../../features/record/api/inningRecordApi";

import {
  uploadInningRecordVideo,
} from "../../features/record/api/inningRecordVideoApi";

import {
  clearRecordDraft,
  getRecordDraft,
  saveRecordDraft,
  type CapturedRecordContext,
} from "../../features/record/storage/recordDraftStorage";

import type {
  CreateInningRecordRequest,
} from "../../features/record/types/inningRecord";

import {
  createUserGameLog,
} from "../../features/record/api/userGameLogApi";

import type {
  ViewingType,
} from "../../features/record/types/userGameLog";

import {
  Toast,
} from "../../shared/ui/Toast";

type RecordLocationState = {
  inning?: number;
  gameId?: number;
};

type TorchCapabilities =
  MediaTrackCapabilities & {
    torch?: boolean;
  };

type TorchConstraint =
  MediaTrackConstraintSet & {
    torch?: boolean;
  };

const RECORD_OPERATION_KEY =
  "inninglog-record-operation-active";

const CAMERA_DIRECTION_STORAGE_KEY =
  "inninglog-camera-direction";

function getStoredCameraDirection():
  CameraDirection {
  const stored =
    localStorage.getItem(
      CAMERA_DIRECTION_STORAGE_KEY,
    );

  return stored === "rear"
    ? "rear"
    : "front";
}

function setRecordOperationActive(
  active: boolean,
) {
  if (active) {
    sessionStorage.setItem(
      RECORD_OPERATION_KEY,
      "1",
    );

    return;
  }

  sessionStorage.removeItem(
    RECORD_OPERATION_KEY,
  );
}

function getTodayDate() {
  const today =
    new Date();

  const year =
    today.getFullYear();

  const month =
    String(
      today.getMonth() + 1,
    ).padStart(
      2,
      "0",
    );

  const date =
    String(
      today.getDate(),
    ).padStart(
      2,
      "0",
    );

  return `${year}-${month}-${date}`;
}

function getWatchingLocationKey() {
  return `watching-location-${getTodayDate()}`;
}

function getLatestGameState(
  states:
    GameStateResponse[],
) {
  return states.at(
    -1,
  );
}

function getSupportedRecorderMimeType() {
  if (
    typeof MediaRecorder ===
    "undefined"
  ) {
    return "";
  }

  const candidates = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
    "video/mp4",
  ];

  return (
    candidates.find(
      (type) =>
        MediaRecorder.isTypeSupported(
          type,
        ),
    ) ?? ""
  );
}

async function getCameraPermissionState():
  Promise<
    PermissionState | null
  > {
  if (
    !navigator.permissions
      ?.query
  ) {
    return null;
  }

  try {
    const permission =
      await navigator.permissions.query(
        {
          name:
            "camera" as
              PermissionName,
        },
      );

    return permission.state;
  } catch {
    /*
     * Safari 등 일부 브라우저는
     * Permissions API의 camera 조회를
     * 지원하지 않는다.
     *
     * 이 경우 getUserMedia가 직접
     * 권한 상태를 처리하도록 둔다.
     */
    return null;
  }
}

function getCameraErrorMessage(
  error: unknown,
) {
  if (
    error instanceof
    DOMException
  ) {
    switch (
      error.name
    ) {
      case "NotAllowedError":
        return "카메라 또는 마이크 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요.";

      case "NotFoundError":
        return "사용 가능한 카메라 또는 마이크를 찾을 수 없습니다.";

      case "NotReadableError":
        return "카메라 또는 마이크를 사용할 수 없습니다. 다른 앱에서 사용 중인지 확인해주세요.";

      case "OverconstrainedError":
        return "선택한 카메라를 사용할 수 없습니다.";

      case "SecurityError":
        return "현재 환경에서는 카메라를 사용할 수 없습니다.";

      default:
        break;
    }
  }

  return "카메라를 실행하지 못했습니다.";
}

export function RecordPage() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const routeState =
    location.state as
      | RecordLocationState
      | null;

  const requestedGameId =
    routeState?.gameId;

  const requestedInning =
    routeState?.inning;

  const captionInputRef =
    useRef<HTMLTextAreaElement>(
      null,
    );

  const videoRef =
    useRef<HTMLVideoElement>(
      null,
    );

  const cameraStreamRef =
    useRef<MediaStream | null>(
      null,
    );

  const isStartingCameraRef =
    useRef(false);

  const mediaRecorderRef =
    useRef<MediaRecorder | null>(
      null,
    );

  const recordingCanvasCleanupRef =
    useRef<
      (() => void) | null
    >(null);

  const recordedChunksRef =
    useRef<BlobPart[]>(
      [],
    );

  const recordingTimerRef =
    useRef<number | null>(
      null,
    );

  const countdownTimerRef =
    useRef<number | null>(
      null,
    );

  const capturedRecordContextRef =
    useRef<CapturedRecordContext | null>(
      null,
    );

  const frozenCreateRequestRef =
    useRef<CreateInningRecordRequest | null>(
      null,
    );

  const createdRecordIdRef =
    useRef<number | null>(
      null,
    );

  const [
    previewMode,
    setPreviewMode,
  ] =
    useState<CameraPreviewMode>(
      "camera",
    );

  const [
    cameraDirection,
    setCameraDirection,
  ] =
    useState<CameraDirection>(
      getStoredCameraDirection,
    );

  const [
    isCameraActive,
    setIsCameraActive,
  ] =
    useState(false);

  const [
    isRequestingCamera,
    setIsRequestingCamera,
  ] =
    useState(false);

  const [
    isPreparingCapture,
    setIsPreparingCapture,
  ] =
    useState(false);

  const [
    isRecording,
    setIsRecording,
  ] =
    useState(false);

  const [
    isFlashOn,
    setIsFlashOn,
  ] =
    useState(false);

  const [
    isFlashSupported,
    setIsFlashSupported,
  ] =
    useState(false);

  const [
    isTimerEnabled,
    setIsTimerEnabled,
  ] =
    useState(false);

  const [
    countdown,
    setCountdown,
  ] =
    useState<number | null>(
      null,
    );

  const [
    recordedVideo,
    setRecordedVideo,
  ] =
    useState<Blob | null>(
      null,
    );

  const [
    recordedVideoUrl,
    setRecordedVideoUrl,
  ] =
    useState<string | null>(
      null,
    );

  const [
    caption,
    setCaption,
  ] =
    useState("");

  const [
    isLocationSheetOpen,
    setIsLocationSheetOpen,
  ] =
    useState(false);

  const [
    favoriteTeamId,
    setFavoriteTeamId,
  ] =
    useState<number | null>(
      null,
    );

  const [
    favoriteTeamGame,
    setFavoriteTeamGame,
  ] =
    useState<GameResponse | null>(
      null,
    );

  const [
    currentInning,
    setCurrentInning,
  ] =
    useState(
      requestedInning ??
        1,
    );

  const [
    isLoadingGame,
    setIsLoadingGame,
  ] =
    useState(true);

  const [
    isSubmittingLocation,
    setIsSubmittingLocation,
  ] =
    useState(false);

  const [
    isSubmittingRecord,
    setIsSubmittingRecord,
  ] =
    useState(false);

  const [
    gameFeedbackMessage,
    setGameFeedbackMessage,
  ] =
    useState("");

  const [
    recordErrorMessage,
    setRecordErrorMessage,
  ] =
    useState("");

  const clearCountdown =
    useCallback(
      () => {
        if (
          countdownTimerRef.current !==
          null
        ) {
          window.clearTimeout(
            countdownTimerRef.current,
          );

          countdownTimerRef.current =
            null;
        }

        setCountdown(
          null,
        );
      },
      [],
    );

  const stopCamera =
    useCallback(
      () => {
        cameraStreamRef.current
          ?.getTracks()
          .forEach(
            (track) =>
              track.stop(),
          );

        cameraStreamRef.current =
          null;

        if (
          videoRef.current
        ) {
          videoRef.current.srcObject =
            null;
        }

        setIsFlashOn(
          false,
        );

        setIsFlashSupported(
          false,
        );

        setIsCameraActive(
          false,
        );
      },
      [],
    );

  const startCamera =
    useCallback(
      async (
        direction:
          CameraDirection =
          cameraDirection,
      ) => {
        if (
          isStartingCameraRef.current
        ) {
          return false;
        }

        if (
          !navigator
            .mediaDevices
            ?.getUserMedia
        ) {
          setRecordErrorMessage(
            "현재 브라우저에서는 카메라를 사용할 수 없습니다. HTTPS 환경인지 확인해주세요.",
          );

          return false;
        }

        try {
          isStartingCameraRef.current =
            true;

          setIsRequestingCamera(
            true,
          );

          setRecordErrorMessage(
            "",
          );

          const permissionState =
            await getCameraPermissionState();

          if (
            permissionState ===
            "denied"
          ) {
            setRecordErrorMessage(
              "카메라 권한이 차단되어 있습니다. 브라우저 설정에서 카메라 권한을 허용해주세요.",
            );

            return false;
          }

          const currentStream =
            cameraStreamRef.current;

          if (
            currentStream &&
            currentStream.active
          ) {
            setIsCameraActive(
              true,
            );

            return true;
          }

          /*
           * video + audio를 한 번에 요청한다.
           *
           * 이미 권한을 허용한 브라우저에서는
           * 이후 다시 권한 팝업이 뜨지 않는다.
           */
          const stream =
            await navigator.mediaDevices.getUserMedia(
              {
                video: {
                  facingMode: {
                    ideal:
                      direction ===
                      "front"
                        ? "user"
                        : "environment",
                  },
                },

                audio:
                  true,
              },
            );

          cameraStreamRef.current =
            stream;

          const videoTrack =
            stream.getVideoTracks()[0];

          if (
            videoTrack &&
            typeof videoTrack.getCapabilities ===
              "function"
          ) {
            const capabilities =
              videoTrack.getCapabilities() as
                TorchCapabilities;

            setIsFlashSupported(
              direction ===
                "rear" &&
                capabilities.torch ===
                  true,
            );
          } else {
            setIsFlashSupported(
              false,
            );
          }

          setIsFlashOn(
            false,
          );

          const video =
            videoRef.current;

          if (!video) {
            stream
              .getTracks()
              .forEach(
                (track) =>
                  track.stop(),
              );

            cameraStreamRef.current =
              null;

            throw new Error(
              "카메라 미리보기 요소를 찾을 수 없습니다.",
            );
          }

          video.srcObject =
            stream;

          try {
            await video.play();
          } catch (
            playError
          ) {
            console.warn(
              "video.play() 자동재생 실패:",
              playError,
            );
          }

          setIsCameraActive(
            true,
          );

          return true;
        } catch (error) {
          console.error(
            "카메라 실행 실패:",
            error,
          );

          cameraStreamRef.current
            ?.getTracks()
            .forEach(
              (track) =>
                track.stop(),
            );

          cameraStreamRef.current =
            null;

          if (
            videoRef.current
          ) {
            videoRef.current.srcObject =
              null;
          }

          setIsFlashOn(
            false,
          );

          setIsFlashSupported(
            false,
          );

          setIsCameraActive(
            false,
          );

          setRecordErrorMessage(
            getCameraErrorMessage(
              error,
            ),
          );

          return false;
        } finally {
          isStartingCameraRef.current =
            false;

          setIsRequestingCamera(
            false,
          );
        }
      },
      [
        cameraDirection,
      ],
    );

  useEffect(() => {
    let cancelled =
      false;

    const restoreDraft =
      async () => {
        try {
          const draft =
            await getRecordDraft();

          if (
            cancelled ||
            !draft
          ) {
            return;
          }

          const updatedAt =
            Date.parse(
              draft.updatedAt,
            );

          if (
            Number.isNaN(
              updatedAt,
            ) ||
            Date.now() -
                updatedAt >
              24 *
                60 *
                60 *
                1000
          ) {
            await clearRecordDraft();

            setRecordOperationActive(
              false,
            );

            return;
          }

          capturedRecordContextRef.current =
            draft.context;

          frozenCreateRequestRef.current =
            draft.createRequest;

          createdRecordIdRef.current =
            draft.recordId;

          setRecordedVideo(
            draft.video,
          );

          setCaption(
            draft.caption,
          );

          setCurrentInning(
            draft.context.inning,
          );

          setRecordOperationActive(
            true,
          );

          stopCamera();

          setPreviewMode(
            "caption",
          );
        } catch (error) {
          console.error(
            "촬영 임시 데이터 복구 실패:",
            error,
          );
        }
      };

    void restoreDraft();

    return () => {
      cancelled =
        true;
    };
  }, [
    stopCamera,
  ]);

  useEffect(() => {
    if (
      previewMode !==
        "camera" ||
      isCameraActive ||
      isRequestingCamera
    ) {
      return;
    }

    void startCamera();
  }, [
    previewMode,
    isCameraActive,
    isRequestingCamera,
    startCamera,
  ]);

  const createRecordingStream =
    useCallback(
      (
        cameraStream:
          MediaStream,
      ) => {
        /*
        * 후면카메라는 원본 스트림 그대로 녹화.
        */
        if (
          cameraDirection ===
          "rear"
        ) {
          return {
            stream:
              cameraStream,

            cleanup:
              () => {},
          };
        }

        /*
        * 전면카메라는 프리뷰와 동일하게
        * 좌우반전된 영상을 실제 파일에도 저장한다.
        *
        * CSS transform은 화면만 뒤집고
        * MediaRecorder 결과에는 반영되지 않기 때문에
        * canvas에 반전된 프레임을 그린 뒤
        * canvas stream을 녹화한다.
        */
        const sourceVideo =
          videoRef.current;

        if (
          !sourceVideo
        ) {
          throw new Error(
            "카메라 미리보기 영상을 찾을 수 없습니다.",
          );
        }

        const width =
          sourceVideo.videoWidth;

        const height =
          sourceVideo.videoHeight;

        if (
          width <= 0 ||
          height <= 0
        ) {
          throw new Error(
            "카메라 영상 크기를 확인할 수 없습니다.",
          );
        }

        const canvas =
          document.createElement(
            "canvas",
          );

        canvas.width =
          width;

        canvas.height =
          height;

        const context =
          canvas.getContext(
            "2d",
          );

        if (
          !context
        ) {
          throw new Error(
            "영상 반전 처리를 시작할 수 없습니다.",
          );
        }

        let animationFrameId:
          number | null =
          null;

        const drawFrame =
          () => {
            context.save();

            /*
            * 화면의 오른쪽 끝으로 이동한 뒤
            * x축을 -1배 해서 좌우반전.
            */
            context.translate(
              canvas.width,
              0,
            );

            context.scale(
              -1,
              1,
            );

            context.drawImage(
              sourceVideo,
              0,
              0,
              canvas.width,
              canvas.height,
            );

            context.restore();

            animationFrameId =
              requestAnimationFrame(
                drawFrame,
              );
          };

        drawFrame();

        const canvasStream =
          canvas.captureStream(
            30,
          );

        /*
        * canvas stream에는 영상만 있으므로
        * 원본 카메라 stream의 마이크 트랙을 합친다.
        */
        const recordingStream =
          new MediaStream([
            ...canvasStream.getVideoTracks(),

            ...cameraStream.getAudioTracks(),
          ]);

        const cleanup =
          () => {
            if (
              animationFrameId !==
              null
            ) {
              cancelAnimationFrame(
                animationFrameId,
              );

              animationFrameId =
                null;
            }

            /*
            * canvas에서 생성한 video track만 종료.
            *
            * 원본 마이크 track은 cameraStream 소유라서
            * 여기서 끄지 않고 stopCamera가 처리한다.
            */
            canvasStream
              .getVideoTracks()
              .forEach(
                (
                  track,
                ) => {
                  track.stop();
                },
              );
          };

        return {
          stream:
            recordingStream,

          cleanup,
        };
      },
      [
        cameraDirection,
      ],
    );

  const startRecording =
    useCallback(
      (
        context:
          CapturedRecordContext,
      ) => {
        const cameraStream =
          cameraStreamRef.current;

        if (
          !cameraStream
        ) {
          setRecordOperationActive(
            false,
          );

          setRecordErrorMessage(
            "카메라가 활성화되지 않았습니다.",
          );

          return;
        }

        if (
          typeof MediaRecorder ===
          "undefined"
        ) {
          setRecordOperationActive(
            false,
          );

          setRecordErrorMessage(
            "현재 브라우저에서는 영상 녹화를 지원하지 않습니다.",
          );

          return;
        }

        try {
          const {
            stream:
              recordingStream,
            cleanup,
          } =
            createRecordingStream(
              cameraStream,
            );

          recordingCanvasCleanupRef.current =
            cleanup;

          const mimeType =
            getSupportedRecorderMimeType();

          const recorder =
            mimeType
              ? new MediaRecorder(
                  recordingStream,
                  {
                    mimeType,
                  },
                )
              : new MediaRecorder(
                  recordingStream,
                );

          recordedChunksRef.current =
            [];

          recorder.addEventListener(
            "dataavailable",
            (event) => {
              if (
                event.data.size >
                0
              ) {
                recordedChunksRef.current.push(
                  event.data,
                );
              }
            },
          );

          recorder.addEventListener(
            "stop",
            () => {
              const type =
                recorder.mimeType ||
                "video/webm";

              const blob =
                new Blob(
                  recordedChunksRef.current,
                  {
                    type,
                  },
                );

              recordingCanvasCleanupRef.current?.();

              recordingCanvasCleanupRef.current =
                null;

              mediaRecorderRef.current =
                null;

              recordedChunksRef.current =
                [];

              if (
                recordingTimerRef.current !==
                null
              ) {
                window.clearTimeout(
                  recordingTimerRef.current,
                );

                recordingTimerRef.current =
                  null;
              }

              setIsRecording(
                false,
              );

              if (
                blob.size <=
                0
              ) {
                capturedRecordContextRef.current =
                  null;

                frozenCreateRequestRef.current =
                  null;

                createdRecordIdRef.current =
                  null;

                setRecordOperationActive(
                  false,
                );

                setRecordErrorMessage(
                  "촬영된 영상이 없습니다.",
                );

                return;
              }

              capturedRecordContextRef.current =
                context;

              frozenCreateRequestRef.current =
                null;

              createdRecordIdRef.current =
                null;

              setRecordedVideo(
                blob,
              );

              void saveRecordDraft(
                {
                  context,

                  video:
                    blob,

                  caption:
                    "",

                  createRequest:
                    null,

                  recordId:
                    null,

                  updatedAt:
                    new Date().toISOString(),
                },
              ).catch(
                (error) => {
                  console.error(
                    "촬영 임시 데이터 저장 실패:",
                    error,
                  );
                },
              );

              stopCamera();

              setPreviewMode(
                "caption",
              );
            },
            {
              once:
                true,
            },
          );

          recorder.addEventListener(
            "error",
            () => {
              if (
                recordingTimerRef.current !==
                null
              ) {
                window.clearTimeout(
                  recordingTimerRef.current,
                );

                recordingTimerRef.current =
                  null;
              }

              recordingCanvasCleanupRef.current?.();

              recordingCanvasCleanupRef.current =
                null;

              mediaRecorderRef.current =
                null;

              capturedRecordContextRef.current =
                null;

              frozenCreateRequestRef.current =
                null;

              createdRecordIdRef.current =
                null;

              setRecordOperationActive(
                false,
              );

              setIsRecording(
                false,
              );

              setRecordErrorMessage(
                "영상 녹화 중 오류가 발생했습니다.",
              );
            },
            {
              once:
                true,
            },
          );

          mediaRecorderRef.current =
            recorder;

          capturedRecordContextRef.current =
            context;

          frozenCreateRequestRef.current =
            null;

          createdRecordIdRef.current =
            null;

          setCurrentInning(
            context.inning,
          );

          setRecordedVideo(
            null,
          );

          setRecordErrorMessage(
            "",
          );

          recorder.start(
            250,
          );

          setIsRecording(
            true,
          );

          recordingTimerRef.current =
            window.setTimeout(
              () => {
                const currentRecorder =
                  mediaRecorderRef.current;

                if (
                  currentRecorder &&
                  currentRecorder.state !==
                    "inactive"
                ) {
                  currentRecorder.stop();
                }
              },
              2000,
            );
        } catch (error) {
          recordingCanvasCleanupRef.current?.();

          recordingCanvasCleanupRef.current =
            null;

          capturedRecordContextRef.current =
            null;

          frozenCreateRequestRef.current =
            null;

          createdRecordIdRef.current =
            null;

          setRecordOperationActive(
            false,
          );

          console.error(
            "영상 녹화 시작 실패:",
            error,
          );

          setRecordErrorMessage(
            "영상 녹화를 시작하지 못했습니다.",
          );
        }
      },
      [
        createRecordingStream,
        stopCamera,
      ],
    );

  /*
   * 타이머가 끝난 실제 촬영 직전에
   * 경기 상태를 확인한다.
   *
   * 따라서 3초 타이머 사용 시에도
   * 버튼을 처음 누른 시점이 아니라
   * 실제 녹화 시작 시점의 이닝/초말이 저장된다.
   */
  const prepareAndStartRecording =
    useCallback(
      async () => {
        const game =
          favoriteTeamGame;

        if (!game) {
          setRecordOperationActive(
            false,
          );

          setRecordErrorMessage(
            gameFeedbackMessage ||
              "현재 경기 정보를 확인할 수 없습니다.",
          );

          return;
        }

        try {
          setIsPreparingCapture(
            true,
          );

          setRecordErrorMessage(
            "",
          );

          const stateHistory =
            await getGameStateHistory(
              game.gameId,
            );

          const latestState =
            getLatestGameState(
              stateHistory.states,
            );

          const inning =
            requestedInning ??
            latestState?.inning;

          const half =
            latestState?.half;

          if (
            typeof inning !==
              "number" ||
            !Number.isInteger(
              inning,
            ) ||
            inning <= 0
          ) {
            throw new Error(
              "현재 이닝 정보를 확인할 수 없습니다.",
            );
          }

          if (!half) {
            throw new Error(
              "현재 이닝의 초·말 정보를 확인할 수 없습니다.",
            );
          }

          const context:
            CapturedRecordContext =
            {
              gameId:
                game.gameId,

              inning,

              half,

              recordedAt:
                new Date().toISOString(),

              clientRecordId:
                crypto.randomUUID(),
            };

          startRecording(
            context,
          );
        } catch (error) {
          setRecordOperationActive(
            false,
          );

          console.error(
            "촬영 시점 경기 상태 조회 실패:",
            error,
          );

          setRecordErrorMessage(
            error instanceof
              Error
              ? error.message
              : "현재 경기 상태를 확인하지 못했습니다.",
          );
        } finally {
          setIsPreparingCapture(
            false,
          );
        }
      },
      [
        favoriteTeamGame,
        gameFeedbackMessage,
        requestedInning,
        startRecording,
      ],
    );

  const startThreeSecondCountdown =
    useCallback(
      () => {
        clearCountdown();

        setCountdown(
          3,
        );

        let remaining =
          3;

        const tick =
          () => {
            remaining -=
              1;

            if (
              remaining <=
              0
            ) {
              countdownTimerRef.current =
                null;

              setCountdown(
                null,
              );

              void prepareAndStartRecording();

              return;
            }

            setCountdown(
              remaining,
            );

            countdownTimerRef.current =
              window.setTimeout(
                tick,
                1000,
              );
          };

        countdownTimerRef.current =
          window.setTimeout(
            tick,
            1000,
          );
      },
      [
        clearCountdown,
        prepareAndStartRecording,
      ],
    );

  const handleCapture =
    () => {
      if (
        isRequestingCamera ||
        isPreparingCapture ||
        !isCameraActive ||
        isRecording ||
        countdown !==
          null
      ) {
        return;
      }

      if (
        !favoriteTeamGame
      ) {
        setRecordErrorMessage(
          gameFeedbackMessage ||
            "현재 경기 정보를 확인할 수 없습니다.",
        );

        return;
      }

      setRecordOperationActive(
        true,
      );

      if (
        isTimerEnabled
      ) {
        startThreeSecondCountdown();

        return;
      }

      void prepareAndStartRecording();
    };

  const handleFlashClick =
    async () => {
      if (
        isRecording ||
        countdown !==
          null ||
        isPreparingCapture
      ) {
        return;
      }

      /*
      * 직관 사용자는 경기장 내 플래시 사용 방지
      */
      if (
        favoriteTeamGame
          ?.myViewing
          ?.viewingType ===
        "STADIUM"
      ) {
        if (
          isFlashOn
        ) {
          const videoTrack =
            cameraStreamRef.current
              ?.getVideoTracks()[0];

          if (
            videoTrack
          ) {
            try {
              await videoTrack.applyConstraints(
                {
                  advanced: [
                    {
                      torch:
                        false,
                    } as TorchConstraint,
                  ],
                },
              );
            } catch (error) {
              console.error(
                "플래시 종료 실패:",
                error,
              );
            }
          }

          setIsFlashOn(
            false,
          );
        }

        setRecordErrorMessage(
          "야구장 관람 중에는 플래시를 사용할 수 없습니다.",
        );

        return;
      }

      if (
        cameraDirection !==
        "rear"
      ) {
        setRecordErrorMessage(
          "플래시는 후면 카메라에서만 사용할 수 있습니다.",
        );

        return;
      }

      if (
        !isFlashSupported
      ) {
        setRecordErrorMessage(
          "현재 기기 또는 브라우저에서는 플래시 기능을 지원하지 않습니다.",
        );

        return;
      }

      const videoTrack =
        cameraStreamRef.current
          ?.getVideoTracks()[0];

      if (
        !videoTrack
      ) {
        setRecordErrorMessage(
          "카메라를 확인할 수 없습니다.",
        );

        return;
      }

      const nextFlashOn =
        !isFlashOn;

      try {
        await videoTrack.applyConstraints(
          {
            advanced: [
              {
                torch:
                  nextFlashOn,
              } as TorchConstraint,
            ],
          },
        );

        setIsFlashOn(
          nextFlashOn,
        );

        setRecordErrorMessage(
          "",
        );
      } catch (error) {
        console.error(
          "플래시 설정 실패:",
          error,
        );

        setIsFlashOn(
          false,
        );

        setRecordErrorMessage(
          "플래시를 사용할 수 없습니다.",
        );
      }
    };

  const handleTimerClick =
    () => {
      if (
        isRecording ||
        countdown !==
          null ||
        isPreparingCapture
      ) {
        return;
      }

      setIsTimerEnabled(
        (
          previous,
        ) =>
          !previous,
      );
    };

  const handleCameraDirectionChange =
    (
      direction:
        CameraDirection,
    ) => {
      if (
        direction ===
        cameraDirection
      ) {
        return;
      }

      if (
        isRecording ||
        countdown !==
          null ||
        isPreparingCapture
      ) {
        setRecordErrorMessage(
          "촬영 중에는 카메라를 전환할 수 없습니다.",
        );

        return;
      }

      localStorage.setItem(
        CAMERA_DIRECTION_STORAGE_KEY,
        direction,
      );

      stopCamera();

      setCameraDirection(
        direction,
      );
    };

  useEffect(() => {
    return () => {
      clearCountdown();

      recordingCanvasCleanupRef.current?.();

      recordingCanvasCleanupRef.current =
        null;

      if (
        recordingTimerRef.current !==
        null
      ) {
        window.clearTimeout(
          recordingTimerRef.current,
        );
      }

      const recorder =
        mediaRecorderRef.current;

      if (
        recorder &&
        recorder.state !==
          "inactive"
      ) {
        recorder.stop();
      }

      cameraStreamRef.current
        ?.getTracks()
        .forEach(
          (track) =>
            track.stop(),
        );
    };
  }, [
    clearCountdown,
  ]);

  useEffect(() => {
    if (
      !recordedVideo
    ) {
      setRecordedVideoUrl(
        null,
      );

      return;
    }

    const url =
      URL.createObjectURL(
        recordedVideo,
      );

    setRecordedVideoUrl(
      url,
    );

    return () => {
      URL.revokeObjectURL(
        url,
      );
    };
  }, [
    recordedVideo,
  ]);

  const loadCurrentGameState =
    useCallback(
      async (
        gameId: number,
      ) => {
        const stateHistory =
          await getGameStateHistory(
            gameId,
          );

        const latestState =
          getLatestGameState(
            stateHistory.states,
          );

        if (
          latestState &&
          latestState.inning >
            0
        ) {
          setCurrentInning(
            requestedInning ??
              latestState.inning,
          );
        }

        return latestState;
      },
      [
        requestedInning,
      ],
    );

  const loadFavoriteTeamGame =
    useCallback(
      async () => {
        try {
          const [
            currentUser,
            gameList,
          ] =
            await Promise.all([
              getCurrentUser(),

              getGames(
                getTodayDate(),
              ),
            ]);

          const nextFavoriteTeamId =
            currentUser.user
              ?.favoriteTeamId;

          if (
            nextFavoriteTeamId ===
            undefined
          ) {
            setFavoriteTeamId(
              null,
            );

            setFavoriteTeamGame(
              null,
            );

            setGameFeedbackMessage(
              "응원팀 설정을 확인하지 못했습니다.",
            );

            return;
          }

          setFavoriteTeamId(
            nextFavoriteTeamId,
          );

          const requestedGame =
            requestedGameId !==
            undefined
              ? gameList.games.find(
                  (game) =>
                    game.gameId ===
                    requestedGameId,
                )
              : undefined;

          const favoriteTeamGames =
            gameList.games.filter(
              (game) =>
                game.homeTeam.id ===
                  nextFavoriteTeamId ||
                game.awayTeam.id ===
                  nextFavoriteTeamId,
            );

          const nextGame =
            requestedGame ??
            selectCurrentGame(
              favoriteTeamGames,
            );

          setFavoriteTeamGame(
            nextGame,
          );

          if (!nextGame) {
            setGameFeedbackMessage(
              gameList.scheduleData
                .state ===
                "NOT_IMPORTED"
                ? "오늘 경기 일정이 아직 준비되지 않았습니다."
                : "오늘 응원팀 경기가 없습니다.",
            );

            return;
          }

          if (
            nextGame.myViewing
              ?.viewingType
          ) {
            localStorage.setItem(
              getWatchingLocationKey(),

              toWatchingLocation(
                nextGame.myViewing
                  .viewingType,
              ),
            );

            try {
              await loadCurrentGameState(
                nextGame.gameId,
              );
            } catch (error) {
              console.error(
                "현재 이닝 조회 실패:",
                error,
              );
            }
          }
        } catch (error) {
          setFavoriteTeamId(
            null,
          );

          setFavoriteTeamGame(
            null,
          );

          setGameFeedbackMessage(
            error instanceof
              Error
              ? error.message
              : "오늘 경기 정보를 불러오지 못했습니다.",
          );
        } finally {
          setIsLoadingGame(
            false,
          );
        }
      },
      [
        loadCurrentGameState,
        requestedGameId,
      ],
    );

  useEffect(() => {
    const timerId =
      window.setTimeout(
        () => {
          void loadFavoriteTeamGame();
        },
        0,
      );

    return () =>
      window.clearTimeout(
        timerId,
      );
  }, [
    loadFavoriteTeamGame,
  ]);

  useEffect(() => {
    if (
      previewMode !==
      "caption"
    ) {
      return;
    }

    captionInputRef.current?.focus();
  }, [
    previewMode,
  ]);

  const handleGameRetry =
    () => {
      setIsLoadingGame(
        true,
      );

      setGameFeedbackMessage(
        "",
      );

      void loadFavoriteTeamGame();
    };

  const handleCaptionChange =
    (
      value: string,
    ) => {
      if (
        frozenCreateRequestRef.current
      ) {
        return;
      }

      setCaption(
        value,
      );

      const context =
        capturedRecordContextRef.current;

      if (
        !context ||
        !recordedVideo
      ) {
        return;
      }

      void saveRecordDraft(
        {
          context,

          video:
            recordedVideo,

          caption:
            value,

          createRequest:
            null,

          recordId:
            createdRecordIdRef.current,

          updatedAt:
            new Date().toISOString(),
        },
      ).catch(
        (error) => {
          console.error(
            "캡션 임시 저장 실패:",
            error,
          );
        },
      );
    };

  const resetCapturedRecord =
    async () => {
      clearCountdown();

      setCaption(
        "",
      );

      setRecordedVideo(
        null,
      );

      setIsLocationSheetOpen(
        false,
      );

      capturedRecordContextRef.current =
        null;

      frozenCreateRequestRef.current =
        null;

      createdRecordIdRef.current =
        null;

      setRecordOperationActive(
        false,
      );

      try {
        await clearRecordDraft();
      } catch (error) {
        console.error(
          "촬영 임시 데이터 삭제 실패:",
          error,
        );
      }
    };

  const handleClose =
    () => {
      if (
        previewMode ===
        "caption"
      ) {
        void resetCapturedRecord();

        setPreviewMode(
          "camera",
        );

        return;
      }

      if (
        countdown !==
        null
      ) {
        clearCountdown();

        setRecordOperationActive(
          false,
        );

        return;
      }

      if (
        recordingTimerRef.current !==
        null
      ) {
        window.clearTimeout(
          recordingTimerRef.current,
        );

        recordingTimerRef.current =
          null;
      }

      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current
          .state !==
          "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }

      setRecordOperationActive(
        false,
      );

      stopCamera();

      navigate(
        "/home",
      );
    };

  const submitInningRecord =
    async (
      game:
        GameResponse,
    ) => {
      if (
        isSubmittingRecord
      ) {
        return;
      }

      if (
        !recordedVideo
      ) {
        setRecordErrorMessage(
          "촬영된 영상이 없습니다.",
        );

        return;
      }

      const context =
        capturedRecordContextRef.current;

      if (!context) {
        setRecordErrorMessage(
          "촬영 정보를 확인할 수 없습니다. 다시 촬영해주세요.",
        );

        return;
      }

      if (
        context.gameId !==
        game.gameId
      ) {
        setRecordErrorMessage(
          "촬영한 경기와 현재 경기 정보가 일치하지 않습니다. 다시 촬영해주세요.",
        );

        return;
      }

      try {
        setIsSubmittingRecord(
          true,
        );

        setRecordErrorMessage(
          "",
        );

        setCurrentInning(
          context.inning,
        );

        let createRequest =
          frozenCreateRequestRef.current;

        if (
          !createRequest
        ) {
          createRequest = {
            gameId:
              context.gameId,

            clientRecordId:
              context.clientRecordId,

            inning:
              context.inning,

            half:
              context.half,

            recordedAt:
              context.recordedAt,

            text:
              caption,
          };

          frozenCreateRequestRef.current =
            createRequest;

          await saveRecordDraft(
            {
              context,

              video:
                recordedVideo,

              caption:
                createRequest.text,

              createRequest,

              recordId:
                createdRecordIdRef.current,

              updatedAt:
                new Date().toISOString(),
            },
          );

          setCaption(
            createRequest.text,
          );
        }

        let recordId =
          createdRecordIdRef.current;

        if (
          recordId ===
          null
        ) {
          const inningRecord =
            await createInningRecord(
              createRequest,
            );

          recordId =
            inningRecord.id;

          createdRecordIdRef.current =
            recordId;

          await saveRecordDraft(
            {
              context,

              video:
                recordedVideo,

              caption:
                createRequest.text,

              createRequest,

              recordId,

              updatedAt:
                new Date().toISOString(),
            },
          );
        }

        await uploadInningRecordVideo(
          recordId,
          recordedVideo,
        );

        await clearRecordDraft();

        capturedRecordContextRef.current =
          null;

        frozenCreateRequestRef.current =
          null;

        createdRecordIdRef.current =
          null;

        setRecordOperationActive(
          false,
        );

        setRecordedVideo(
          null,
        );

        navigate(
          `/timeline?gameId=${game.gameId}`,
          {
            replace:
              true,
          },
        );
      } catch (error) {
        console.error(
          "이닝 기록/영상 저장 실패:",
          error,
        );

        setRecordErrorMessage(
          error instanceof
            Error
            ? error.message
            : "기록을 저장하지 못했습니다.",
        );
      } finally {
        setIsSubmittingRecord(
          false,
        );
      }
    };

  const handleLocationClick =
    () => {
      captionInputRef.current?.blur();

      if (
        isLoadingGame ||
        isSubmittingRecord
      ) {
        return;
      }

      if (
        !favoriteTeamGame
      ) {
        setRecordErrorMessage(
          gameFeedbackMessage ||
            "오늘 경기 정보를 확인할 수 없습니다.",
        );

        return;
      }

      if (
        favoriteTeamGame.myViewing
      ) {
        void submitInningRecord(
          favoriteTeamGame,
        );

        return;
      }

      setIsLocationSheetOpen(
        true,
      );
    };

  const handleLocationSelect =
    async (
      watchingLocation:
        WatchingLocation,
    ) => {
      if (
        isLoadingGame
      ) {
        setGameFeedbackMessage(
          "오늘 경기를 확인하고 있습니다.",
        );

        return;
      }

      if (
        !favoriteTeamGame ||
        favoriteTeamId ===
          null
      ) {
        setGameFeedbackMessage(
          "오늘 응원팀 경기가 없습니다.",
        );

        return;
      }

      setIsSubmittingLocation(
        true,
      );

      setGameFeedbackMessage(
        "",
      );

      try {
        const userGameLog =
          await createUserGameLog(
            {
              cheeringTeamId:
                favoriteTeamId,

              gameId:
                favoriteTeamGame.gameId,

              viewingType:
                toViewingType(
                  watchingLocation,
                ),
            },
          );

        localStorage.setItem(
          getWatchingLocationKey(),

          watchingLocation,
        );

        const updatedGame:
          GameResponse =
          {
            ...favoriteTeamGame,

            myViewing: {
              id:
                userGameLog.id,

              viewingType:
                userGameLog.viewingType,

              cheeringTeamId:
                userGameLog.cheeringTeamId,
            },
          };

        setFavoriteTeamGame(
          updatedGame,
        );

        setIsLocationSheetOpen(
          false,
        );

        await submitInningRecord(
          updatedGame,
        );
      } catch (error) {
        console.error(
          "관람 정보 저장 실패:",
          error,
        );

        setGameFeedbackMessage(
          error instanceof
            Error
            ? error.message
            : "관람 정보를 저장하지 못했습니다.",
        );
      } finally {
        setIsSubmittingLocation(
          false,
        );
      }
    };

  const cameraControlsDisabled =
    isRecording ||
    countdown !==
      null ||
    isPreparingCapture ||
    isRequestingCamera;

  return (
    <main className="relative mx-auto min-h-dvh w-full max-w-[390px] overflow-hidden bg-bg-primary px-4 pb-[33px] pt-[79px]">
      <InningIndicator
        currentInning={
          currentInning
        }
      />

      <div className="mt-[8px]">
        <CameraPreview
          mode={
            previewMode
          }
          caption={
            caption
          }
          cameraDirection={
            cameraDirection
          }
          countdown={
            countdown
          }
          captionInputRef={
            captionInputRef
          }
          videoRef={
            videoRef
          }
          recordedVideoUrl={
            recordedVideoUrl
          }
          isCameraActive={
            isCameraActive
          }
          isRequestingCamera={
            isRequestingCamera ||
            isPreparingCapture
          }
          isRecording={
            isRecording
          }
          onCaptionChange={
            handleCaptionChange
          }
          onClose={
            handleClose
          }
          onCapture={
            handleCapture
          }
          onLocationClick={
            handleLocationClick
          }
        />
      </div>

      {previewMode ===
        "camera" && (
        <div className="mt-[15px]">
          <CameraControls
            direction={
              cameraDirection
            }
            flashOn={
              isFlashOn
            }
            timerEnabled={
              isTimerEnabled
            }
            disabled={
              cameraControlsDisabled
            }
            onDirectionChange={
              handleCameraDirectionChange
            }
            onFlashClick={() => {
              void handleFlashClick();
            }}
            onTimerClick={
              handleTimerClick
            }
          />
        </div>
      )}

      <WatchingLocationSheet
        isOpen={
          isLocationSheetOpen
        }
        isSubmitting={
          isLoadingGame ||
          isSubmittingLocation ||
          isSubmittingRecord
        }
        feedbackMessage={
          gameFeedbackMessage
        }
        onClose={() =>
          setIsLocationSheetOpen(
            false,
          )
        }
        onRetry={
          handleGameRetry
        }
        onSelect={
          handleLocationSelect
        }
      />

      {isSubmittingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="flex flex-col items-center rounded-[20px] bg-white px-[40px] py-[32px]">
            <div className="size-[36px] animate-spin rounded-full border-[4px] border-surface-secondary border-t-accent-primary" />

            <p className="mt-[16px] text-label-3 text-black">
              기록과 영상을 저장하는 중...
            </p>
          </div>
        </div>
      )}

      <Toast
        open={Boolean(
          recordErrorMessage,
        )}
        message={
          recordErrorMessage
        }
        onClose={() =>
          setRecordErrorMessage(
            "",
          )
        }
      />
    </main>
  );
}

const GAME_STATUS_PRIORITY: Record<
  string,
  number
> = {
  LIVE: 0,
  DELAYED: 1,
  SUSPENDED: 2,
  SCHEDULED: 3,
  FINISHED: 4,
  UNKNOWN: 5,
};

function selectCurrentGame(
  games:
    GameResponse[],
) {
  const availableGames =
    games.filter(
      (game) =>
        game.status !==
          "CANCELED" &&
        game.status !==
          "POSTPONED",
    );

  const registeredGame =
    availableGames.find(
      (game) =>
        game.myViewing,
    );

  if (
    registeredGame
  ) {
    return registeredGame;
  }

  return (
    [
      ...availableGames,
    ].sort(
      (
        first,
        second,
      ) => {
        const statusDifference =
          (GAME_STATUS_PRIORITY[
            first.status
          ] ?? 6) -
          (GAME_STATUS_PRIORITY[
            second.status
          ] ?? 6);

        if (
          statusDifference !==
          0
        ) {
          return statusDifference;
        }

        return (
          Math.abs(
            Date.parse(
              first.scheduledAt,
            ) -
              Date.now(),
          ) -
          Math.abs(
            Date.parse(
              second.scheduledAt,
            ) -
              Date.now(),
          )
        );
      },
    )[0] ?? null
  );
}

function toViewingType(
  watchingLocation:
    WatchingLocation,
): ViewingType {
  return watchingLocation ===
    "stadium"
    ? "STADIUM"
    : "HOME";
}

function toWatchingLocation(
  viewingType:
    string,
): WatchingLocation {
  return viewingType ===
    "STADIUM"
    ? "stadium"
    : "home";
}