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

import {
  getGames,
  getGameStateHistory,
} from "../../features/games/api/gamesApi";

import type {
  GameResponse,
  GameStateResponse,
} from "../../features/games/types/game";

import { CameraControls } from "../../features/record/CameraControls";

import type { CameraDirection } from "../../features/record/CameraControls";

import { CameraPreview } from "../../features/record/CameraPreview";

import type { CameraPreviewMode } from "../../features/record/CameraPreview";

import { InningIndicator } from "../../features/record/InningIndicator";

import { WatchingLocationSheet } from "../../features/record/WatchingLocationSheet";

import type { WatchingLocation } from "../../features/record/WatchingLocationSheet";

import { createInningRecord } from "../../features/record/api/inningRecordApi";

import { createUserGameLog } from "../../features/record/api/userGameLogApi";

import type { ViewingType } from "../../features/record/types/userGameLog";

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

function getLatestGameState(
  states: GameStateResponse[],
) {
  return states.at(-1);
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

  /**
   * 동일 요청 재시도 시 같은 UUID를 사용하기 위한 ref.
   *
   * Swagger:
   * clientRecordId(UUID)로 재시도를 구분
   */
  const clientRecordIdRef =
    useRef<string | null>(
      null,
    );

  /**
   * 촬영 버튼을 누른 실제 시각.
   *
   * 기록 저장 버튼을 누른 시간이 아니라
   * 촬영한 시간을 recordedAt으로 사용한다.
   */
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

  /**
   * 서버에서 현재 이닝 / 초·말 상태 조회
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
          latestState.inning > 0
        ) {
          setCurrentInning(
            requestedInning ??
              latestState.inning,
          );
        }

        return latestState;
      },
      [requestedInning],
    );

  /**
   * 오늘 경기 조회
   */
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

        /**
         * 타임라인의 + 버튼에서 넘어온 경우
         * state.gameId를 우선 사용.
         */
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

        /**
         * 이미 서버에 관람 등록이 있는 경우
         */
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
      loadCurrentGameState,
      requestedGameId,
    ]);

  useEffect(() => {
    const timerId =
      window.setTimeout(() => {
        void loadFavoriteTeamGame();
      }, 0);

    return () =>
      window.clearTimeout(
        timerId,
      );
  }, [loadFavoriteTeamGame]);

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

  useEffect(() => {
    if (
      previewMode !==
      "caption"
    ) {
      return;
    }

    captionInputRef.current?.focus();
  }, [previewMode]);

  /**
   * 촬영 화면 닫기
   */
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

        setIsLocationSheetOpen(
          false,
        );

        capturedAtRef.current =
          null;

        clientRecordIdRef.current =
          null;

        return;
      }

      navigate("/home");
    };

  /**
   * 촬영 완료
   */
  const handleCapture =
    () => {
      capturedAtRef.current =
        new Date().toISOString();

      clientRecordIdRef.current =
        crypto.randomUUID();

      setRecordErrorMessage(
        "",
      );

      setPreviewMode(
        "caption",
      );
    };

  /**
   * 실제 이닝 기록 생성
   */
  const submitInningRecord =
    async (
      game: GameResponse,
    ) => {
      if (
        isSubmittingRecord
      ) {
        return;
      }

      try {
        setIsSubmittingRecord(
          true,
        );

        setRecordErrorMessage(
          "",
        );

        /**
         * 저장 직전 서버 상태를 다시 조회한다.
         *
         * 기록 화면을 오래 열어둔 경우
         * 이닝/초·말이 변경될 수 있기 때문.
         */
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
          capturedAtRef.current ??
          new Date().toISOString();

        await createInningRecord({
          gameId:
            game.gameId,

          clientRecordId,

          inning,

          half,

          recordedAt,

          text: caption,
        });

        /**
         * 성공했으므로 다음 기록에서는
         * 새로운 UUID를 사용한다.
         */
        clientRecordIdRef.current =
          null;

        capturedAtRef.current =
          null;

        navigate(
          `/timeline?gameId=${game.gameId}`,
          {
            replace: true,
          },
        );
      } catch (error) {
        console.error(
          "이닝 기록 저장 실패:",
          error,
        );

        setRecordErrorMessage(
          error instanceof Error
            ? error.message
            : "이닝 기록을 저장하지 못했습니다.",
        );
      } finally {
        setIsSubmittingRecord(
          false,
        );
      }
    };

  /**
   * 문구 입력 후 위쪽 화살표 클릭
   */
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

      /**
       * 이미 서버에 관람 등록이 되어 있다면
       * 관람 선택 화면 없이 바로 기록 저장.
       */
      if (
        favoriteTeamGame.myViewing
      ) {
        void submitInningRecord(
          favoriteTeamGame,
        );

        return;
      }

      /**
       * 첫 기록일 경우
       * 관람 장소 등록 필요
       */
      setIsLocationSheetOpen(
        true,
      );
    };

  /**
   * 관람 장소 등록
   *
   * 관람 등록 완료 후 바로 이닝 기록까지 생성한다.
   */
  const handleLocationSelect =
    async (
      location:
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
        if (
          !gameFeedbackMessage
        ) {
          setGameFeedbackMessage(
            "오늘 응원팀 경기가 없습니다.",
          );
        }

        return;
      }

      setIsSubmittingLocation(
        true,
      );

      setGameFeedbackMessage(
        "",
      );

      try {
        const request = {
          cheeringTeamId:
            favoriteTeamId,

          gameId:
            favoriteTeamGame
              .gameId,

          viewingType:
            toViewingType(
              location,
            ),
        };

        const userGameLog =
          await createUserGameLog(
            request,
          );

        localStorage.setItem(
          getWatchingLocationKey(),
          location,
        );

        /**
         * 관람 등록 성공 상태를
         * 로컬 경기 상태에도 반영.
         */
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

        /**
         * 관람 등록 후 이닝 기록 생성
         */
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
              setCameraDirection
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
              기록 저장 중...
            </p>
          </div>
        </div>
      )}

      <Toast
        open={
          Boolean(
            recordErrorMessage,
          )
        }
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
  location:
    WatchingLocation,
): ViewingType {
  return location ===
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
