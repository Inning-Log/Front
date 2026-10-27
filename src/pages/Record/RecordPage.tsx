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

const RECORD_OPERATION_KEY =
  "inninglog-record-operation-active";

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

  const capturedRecordContextRef =
    useRef<CapturedRecordContext | null>(
      null,
    );

  /*
   * 첫 저장 버튼 클릭 시 생성한 요청을 고정한다.
   *
   * 저장 요청의 응답이 유실되더라도
   * 동일 clientRecordId + 동일 payload로
   * 다시 요청할 수 있다.
   */
  const frozenCreateRequestRef =
    useRef<CreateInningRecordRequest | null>(
      null,
    );

  /*
   * 기록 생성에 성공했다면
   * 영상 업로드 실패 이후에도 같은 recordId 사용.
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

  /*
   * 새로고침/배포 후 저장되지 않은 촬영본 복구.
   */
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

          /*
           * 지나치게 오래된 임시 촬영본은
           * 다음 경기에서 잘못 복구되지 않도록 삭제.
           */
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

  const startRecording =
    useCallback(
      (
        context:
          CapturedRecordContext,
      ) => {
        const stream =
          cameraStreamRef.current;

        if (!stream) {
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
        stopCamera,
      ],
    );

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

      setRecordOperationActive(
        true,
      );

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
    };

  const handleCaptionChange =
    (
      value: string,
    ) => {
      /*
       * 한 번 저장을 시도한 뒤에는
       * 동일 clientRecordId의 payload가
       * 달라지지 않도록 caption도 고정한다.
       */
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

  const resetCapturedRecord =
    async () => {
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

        /*
         * 첫 저장 시도 당시의 payload를 고정.
         */
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

          /*
           * API 호출 전에 반드시 IndexedDB에 저장.
           *
           * 서버에서는 생성됐는데 응답이 유실되고
           * 브라우저가 새로고침되어도 같은 payload로
           * 재시도할 수 있다.
           */
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
            handleCaptionChange
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