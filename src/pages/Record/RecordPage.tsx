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

import { getCurrentUser } from "../../features/auth/api/authApi";

import { getGames } from "../../features/games/api/gamesApi";

import type { GameResponse } from "../../features/games/types/game";

import { CameraControls } from "../../features/record/CameraControls";

import type { CameraDirection } from "../../features/record/CameraControls";

import {
  CameraPreview,
  type CameraPreviewMode,
} from "../../features/record/CameraPreview";

import { InningIndicator } from "../../features/record/InningIndicator";

import {
  WatchingLocationSheet,
  type WatchingLocation,
} from "../../features/record/WatchingLocationSheet";

import { createInningRecord } from "../../features/record/api/inningRecordApi";

import { uploadInningRecordVideo } from "../../features/record/api/inningRecordVideoApi";

import { createUserGameLog } from "../../features/record/api/userGameLogApi";

import type { ViewingType } from "../../features/record/types/userGameLog";

import { getMyTimeline } from "../../features/timeline/api/timelineApi";

import { Toast } from "../../shared/ui/Toast";

type RecordLocationState = {
  inning?: number;
  gameId?: number;
};

function getTodayDate() {
  const today = new Date();

  const year =
    today.getFullYear();

  const month = String(
    today.getMonth() + 1,
  ).padStart(2, "0");

  const date = String(
    today.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${date}`;
}

function getWatchingLocationKey() {
  return `watching-location-${getTodayDate()}`;
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

function getCameraErrorMessage(
  error: unknown,
) {
  if (
    error instanceof DOMException
  ) {
    switch (error.name) {
      case "NotAllowedError":
        return "카메라 권한이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해주세요.";

      case "NotFoundError":
        return "사용 가능한 카메라를 찾을 수 없습니다.";

      case "NotReadableError":
        return "카메라를 사용할 수 없습니다. 다른 앱에서 카메라를 사용 중인지 확인해주세요.";

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

  const recordedChunksRef =
    useRef<BlobPart[]>([]);

  const recordingTimerRef =
    useRef<number | null>(
      null,
    );

  const clientRecordIdRef =
    useRef<string | null>(
      null,
    );

  const capturedAtRef =
    useRef<string | null>(
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
      "front",
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
    isRecording,
    setIsRecording,
  ] =
    useState(false);

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
  ] = useState(
    requestedInning ?? 1,
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

  const stopCamera =
    useCallback(() => {
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

      setIsCameraActive(
        false,
      );
    }, []);

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
                audio: false,
              },
            );

          cameraStreamRef.current =
            stream;

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
    if (
      previewMode !== "camera" ||
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

  const startRecording =
    useCallback(() => {
      const stream =
        cameraStreamRef.current;

      if (!stream) {
        setRecordErrorMessage(
          "카메라가 활성화되지 않았습니다.",
        );

        return;
      }

      if (
        typeof MediaRecorder ===
        "undefined"
      ) {
        setRecordErrorMessage(
          "현재 브라우저에서는 영상 녹화를 지원하지 않습니다.",
        );

        return;
      }

      try {
        const mimeType =
          getSupportedRecorderMimeType();

        const recorder =
          mimeType
            ? new MediaRecorder(
                stream,
                {
                  mimeType,
                },
              )
            : new MediaRecorder(
                stream,
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
              blob.size <= 0
            ) {
              setRecordErrorMessage(
                "촬영된 영상이 없습니다.",
              );

              return;
            }

            setRecordedVideo(
              blob,
            );

            stopCamera();

            setPreviewMode(
              "caption",
            );
          },
          {
            once: true,
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

            setIsRecording(
              false,
            );

            setRecordErrorMessage(
              "영상 녹화 중 오류가 발생했습니다.",
            );
          },
          {
            once: true,
          },
        );

        mediaRecorderRef.current =
          recorder;

        capturedAtRef.current =
          new Date().toISOString();

        clientRecordIdRef.current =
          crypto.randomUUID();

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

        /*
         * 정확히 2초 후 자동 종료
         */
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
        console.error(
          "영상 녹화 시작 실패:",
          error,
        );

        setRecordErrorMessage(
          "영상 녹화를 시작하지 못했습니다.",
        );
      }
    }, [
      stopCamera,
    ]);

  const handleCapture =
    () => {
      if (
        isRequestingCamera ||
        !isCameraActive ||
        isRecording
      ) {
        return;
      }

      startRecording();
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

      if (isRecording) {
        setRecordErrorMessage(
          "녹화 중에는 카메라를 전환할 수 없습니다.",
        );

        return;
      }

      stopCamera();

      setCameraDirection(
        direction,
      );
    };

  useEffect(() => {
    return () => {
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
  }, []);

  useEffect(() => {
    if (!recordedVideo) {
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

  const loadCurrentTimelineState =
    useCallback(
      async (
        gameId: number,
      ) => {
        const timeline =
          await getMyTimeline({
            gameId,
            limit: 1,
          });

        if (
          timeline.currentInning >
          0
        ) {
          setCurrentInning(
            requestedInning ??
              timeline.currentInning,
          );
        }

        return timeline;
      },
      [
        requestedInning,
      ],
    );

  const loadFavoriteTeamGame =
    useCallback(async () => {
      try {
        const [
          currentUser,
          gameList,
        ] = await Promise.all([
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
            await loadCurrentTimelineState(
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
          error instanceof Error
            ? error.message
            : "오늘 경기 정보를 불러오지 못했습니다.",
        );
      } finally {
        setIsLoadingGame(
          false,
        );
      }
    }, [
      loadCurrentTimelineState,
      requestedGameId,
    ]);

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

  const handleClose =
    () => {
      if (
        previewMode ===
        "caption"
      ) {
        setPreviewMode(
          "camera",
        );

        setCaption("");

        setRecordedVideo(
          null,
        );

        setIsLocationSheetOpen(
          false,
        );

        capturedAtRef.current =
          null;

        clientRecordIdRef.current =
          null;

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

      stopCamera();

      navigate("/home");
    };

  const submitInningRecord =
    async (
      game: GameResponse,
    ) => {
      if (
        isSubmittingRecord
      ) {
        return;
      }

      if (!recordedVideo) {
        setRecordErrorMessage(
          "촬영된 영상이 없습니다.",
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

        const timeline =
          await getMyTimeline({
            gameId:
              game.gameId,
            limit: 1,
          });

        const inning =
          requestedInning ??
          timeline.currentInning;

        const half =
          timeline.currentHalf;

        if (
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

        setCurrentInning(
          inning,
        );

        const clientRecordId =
          clientRecordIdRef
            .current ??
          crypto.randomUUID();

        clientRecordIdRef.current =
          clientRecordId;

        const recordedAt =
          capturedAtRef
            .current ??
          new Date().toISOString();

        const inningRecord =
          await createInningRecord(
            {
              gameId:
                game.gameId,

              clientRecordId,

              inning,

              half,

              recordedAt,

              text:
                caption,
            },
          );

        await uploadInningRecordVideo(
          inningRecord.id,
          recordedVideo,
        );

        clientRecordIdRef.current =
          null;

        capturedAtRef.current =
          null;

        setRecordedVideo(
          null,
        );

        navigate(
          `/timeline?gameId=${game.gameId}`,
          {
            replace: true,
          },
        );
      } catch (error) {
        console.error(
          "이닝 기록/영상 저장 실패:",
          error,
        );

        setRecordErrorMessage(
          error instanceof Error
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
      if (isLoadingGame) {
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
                favoriteTeamGame
                  .gameId,

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

        const updatedGame: GameResponse =
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
          error instanceof Error
            ? error.message
            : "관람 정보를 저장하지 못했습니다.",
        );
      } finally {
        setIsSubmittingLocation(
          false,
        );
      }
    };

  const handleFlashClick =
    () => {
      console.log(
        "플래시 설정",
      );
    };

  const handleTimerClick =
    () => {
      console.log(
        "타이머 설정",
      );
    };

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
            isRequestingCamera
          }
          isRecording={
            isRecording
          }
          onCaptionChange={
            setCaption
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
            onDirectionChange={
              handleCameraDirectionChange
            }
            onFlashClick={
              handleFlashClick
            }
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
  games: GameResponse[],
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

  if (registeredGame) {
    return registeredGame;
  }

  return (
    [...availableGames].sort(
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
  viewingType: string,
): WatchingLocation {
  return viewingType ===
    "STADIUM"
    ? "stadium"
    : "home";
}