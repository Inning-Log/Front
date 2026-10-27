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

/**
 * 촬영 버튼을 누른 시점의 기록 정보.
 *
 * 촬영 이후 서버 경기 상태가 변경되어도
 * 이 값은 절대 변경하지 않는다.
 */
type CapturedRecordContext = {
  gameId: number;
  inning: number;
  half: string;
  recordedAt: string;
  clientRecordId: string;
};

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
    useRef<BlobPart[]>(
      [],
    );

  const recordingTimerRef =
    useRef<number | null>(
      null,
    );

  /**
   * 촬영 시점 정보.
   *
   * caption 화면에서 저장을 늦게 눌러도
   * 이 값은 다시 계산하지 않는다.
   */
  const capturedRecordContextRef =
    useRef<CapturedRecordContext | null>(
      null,
    );

  /**
   * createInningRecord가 성공한 뒤의 recordId.
   *
   * 영상 업로드가 실패해 저장 버튼을 다시 눌러도
   * 동일한 이닝 기록을 사용한다.
   */
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

  /**
   * 촬영 직전 서버의 현재 이닝/초말을
   * 조회하는 동안 중복 촬영 방지.
   */
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

                audio:
                  false,
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

  /**
   * 실제 MediaRecorder 시작.
   *
   * context는 촬영 전에 이미 확정된 값을 받는다.
   */
  const startRecording =
    useCallback(
      (
        context:
          CapturedRecordContext,
      ) => {
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
                event.data
                  .size > 0
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
                blob.size <=
                0
              ) {
                capturedRecordContextRef.current =
                  null;

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

              mediaRecorderRef.current =
                null;

              capturedRecordContextRef.current =
                null;

              createdRecordIdRef.current =
                null;

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

          /*
           * 이 시점부터 해당 영상의 서버 기록 정보는
           * 변경하지 않는다.
           */
          capturedRecordContextRef.current =
            context;

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

          /*
           * 정확히 2초 후 자동 종료.
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
          capturedRecordContextRef.current =
            null;

          createdRecordIdRef.current =
            null;

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
        stopCamera,
      ],
    );

  /**
   * 촬영 버튼 클릭.
   *
   * 서버의 현재 이닝/초말 상태를 먼저 확인한 뒤
   * 해당 값을 촬영 컨텍스트로 고정한다.
   */
  const handleCapture =
    async () => {
      if (
        isRequestingCamera ||
        isPreparingCapture ||
        !isCameraActive ||
        isRecording
      ) {
        return;
      }

      const game =
        favoriteTeamGame;

      if (!game) {
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

        /*
         * 네트워크 조회가 완료된 바로 이 시점의
         * 게임 상태를 이번 촬영의 값으로 확정한다.
         */
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
        isPreparingCapture
      ) {
        setRecordErrorMessage(
          "촬영 중에는 카메라를 전환할 수 없습니다.",
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

  /**
   * 현재 이닝 표시를 위한 서버 상태 조회.
   *
   * 이 함수에서 가져온 값은 화면 표시용이고,
   * 실제 저장 값은 촬영 시 capturedRecordContext에
   * 별도로 고정한다.
   */
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
                game.homeTeam
                  .id ===
                  nextFavoriteTeamId ||
                game.awayTeam
                  .id ===
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
              gameList
                .scheduleData
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
                nextGame
                  .myViewing
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

  const resetCapturedRecord =
    () => {
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

      createdRecordIdRef.current =
        null;
    };

  const handleClose =
    () => {
      if (
        previewMode ===
        "caption"
      ) {
        resetCapturedRecord();

        setPreviewMode(
          "camera",
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

      stopCamera();

      navigate(
        "/home",
      );
    };

  /**
   * 이닝 기록 + 영상 저장.
   *
   * 중요:
   * 여기에서는 경기 상태를 다시 조회하지 않는다.
   *
   * 촬영 당시 저장된
   * capturedRecordContext만 사용한다.
   */
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

      const capturedContext =
        capturedRecordContextRef.current;

      if (
        !capturedContext
      ) {
        setRecordErrorMessage(
          "촬영 정보를 확인할 수 없습니다. 다시 촬영해주세요.",
        );

        return;
      }

      if (
        capturedContext.gameId !==
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
          capturedContext.inning,
        );

        /*
         * 이미 기록 생성이 성공했다면
         * 영상 재시도에서는 기록을 다시 만들지 않는다.
         */
        let recordId =
          createdRecordIdRef.current;

        if (
          recordId ===
          null
        ) {
          const inningRecord =
            await createInningRecord(
              {
                gameId:
                  capturedContext.gameId,

                clientRecordId:
                  capturedContext.clientRecordId,

                inning:
                  capturedContext.inning,

                half:
                  capturedContext.half,

                recordedAt:
                  capturedContext.recordedAt,

                text:
                  caption,
              },
            );

          recordId =
            inningRecord.id;

          /*
           * 이 값을 성공 직후 바로 저장해야
           * 이후 영상 업로드 실패 때 동일 record를 사용한다.
           */
          createdRecordIdRef.current =
            inningRecord.id;
        }

        await uploadInningRecordVideo(
          recordId,
          recordedVideo,
        );

        /*
         * 기록과 영상 모두 완료된 경우에만
         * 촬영 컨텍스트를 초기화한다.
         */
        capturedRecordContextRef.current =
          null;

        createdRecordIdRef.current =
          null;

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

        /*
         * 여기서 capturedRecordContext와
         * createdRecordId를 지우지 않는다.
         *
         * 사용자가 저장 버튼을 다시 누르면
         * 동일한 기록/동일한 영상을 가지고
         * 업로드만 이어서 재시도할 수 있다.
         */
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
            isRequestingCamera ||
            isPreparingCapture
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
          onCapture={() => {
            void handleCapture();
          }}
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
  viewingType: string,
): WatchingLocation {
  return viewingType ===
    "STADIUM"
    ? "stadium"
    : "home";
}