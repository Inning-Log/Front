import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getCurrentUser } from "../../features/auth/api/authApi";
import { getGames } from "../../features/games/api/gamesApi";
import type { GameResponse } from "../../features/games/types/game";
import { CameraControls } from "../../features/record/CameraControls";
import type { CameraDirection } from "../../features/record/CameraControls";
import { CameraPreview } from "../../features/record/CameraPreview";
import type { CameraPreviewMode } from "../../features/record/CameraPreview";
import { InningIndicator } from "../../features/record/InningIndicator";
import { WatchingLocationSheet } from "../../features/record/WatchingLocationSheet";
import type { WatchingLocation } from "../../features/record/WatchingLocationSheet";
import { createUserGameLog } from "../../features/record/api/userGameLogApi";
import type { ViewingType } from "../../features/record/types/userGameLog";

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const date = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${date}`;
}

function getWatchingLocationKey() {
  return `watching-location-${getTodayDate()}`;
}

export function RecordPage() {
  const navigate = useNavigate();
  const captionInputRef = useRef<HTMLTextAreaElement>(null);

  const [previewMode, setPreviewMode] =
    useState<CameraPreviewMode>("camera");

  const [cameraDirection, setCameraDirection] =
    useState<CameraDirection>("front");

  const [caption, setCaption] = useState("");
  const [isLocationSheetOpen, setIsLocationSheetOpen] = useState(false);
  const [favoriteTeamId, setFavoriteTeamId] = useState<number | null>(null);
  const [favoriteTeamGame, setFavoriteTeamGame] =
    useState<GameResponse | null>(null);
  const [isLoadingGame, setIsLoadingGame] = useState(true);
  const [isSubmittingLocation, setIsSubmittingLocation] = useState(false);
  const [gameFeedbackMessage, setGameFeedbackMessage] = useState("");

  /*
   * 임시값
   * 이후 경기 진행 정보나 서버 응답에서 받아오면 됨
   */
  const currentInning = 1;

  const loadFavoriteTeamGame = useCallback(async () => {
    try {
      const [currentUser, gameList] = await Promise.all([
        getCurrentUser(),
        getGames(getTodayDate()),
      ]);
      const nextFavoriteTeamId = currentUser.user?.favoriteTeamId;

      if (nextFavoriteTeamId === undefined) {
        setFavoriteTeamId(null);
        setFavoriteTeamGame(null);
        setGameFeedbackMessage(
          "응원팀 설정을 확인하지 못했습니다.",
        );
        return;
      }

      const favoriteTeamGames = gameList.games.filter(
        (game) =>
          game.homeTeam.id === nextFavoriteTeamId ||
          game.awayTeam.id === nextFavoriteTeamId,
      );
      const nextGame = selectCurrentGame(favoriteTeamGames);

      setFavoriteTeamId(nextFavoriteTeamId);
      setFavoriteTeamGame(nextGame);

      if (!nextGame) {
        setGameFeedbackMessage(
          gameList.scheduleData.state === "NOT_IMPORTED"
            ? "오늘 경기 일정이 아직 준비되지 않았습니다."
            : "오늘 응원팀 경기가 없습니다.",
        );
        return;
      }

      if (nextGame.myViewing?.viewingType) {
        localStorage.setItem(
          getWatchingLocationKey(),
          toWatchingLocation(nextGame.myViewing.viewingType),
        );
      }
    } catch (error) {
      setFavoriteTeamId(null);
      setFavoriteTeamGame(null);
      setGameFeedbackMessage(
        error instanceof Error
          ? error.message
          : "오늘 경기 정보를 불러오지 못했습니다.",
      );
    } finally {
      setIsLoadingGame(false);
    }
  }, []);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadFavoriteTeamGame();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [loadFavoriteTeamGame]);

  const handleGameRetry = () => {
    setIsLoadingGame(true);
    setGameFeedbackMessage("");
    void loadFavoriteTeamGame();
  };

  useEffect(() => {
    if (previewMode !== "caption") return;

    captionInputRef.current?.focus();
  }, [previewMode]);

  const handleClose = () => {
    if (previewMode === "caption") {
      setPreviewMode("camera");
      setCaption("");
      setIsLocationSheetOpen(false);
      return;
    }

    navigate("/home");
  };

  const handleCapture = () => {
    /*
     * 현재는 촬영이 완료됐다고 가정하고
     * 문구 입력 화면으로 전환
     */
    setPreviewMode("caption");
  };

  const handleLocationClick = () => {

    captionInputRef.current?.blur();

    const savedLocation = localStorage.getItem(
      getWatchingLocationKey(),
    );

    /*
     * 오늘 이미 관람 장소를 선택했다면
     * 바텀시트를 띄우지 않고 타임라인으로 이동
     */
    if (savedLocation) {
      navigate("/timeline", {
        state: {
          gameId: favoriteTeamGame?.gameId,
        },
      });
      return;
    }

    /*
     * 오늘의 첫 기록이라면 관람 장소 선택 표시
     */
    setIsLocationSheetOpen(true);
  };

  const handleLocationSelect = async (location: WatchingLocation) => {
    if (isLoadingGame) {
      setGameFeedbackMessage("오늘 경기를 확인하고 있습니다.");
      return;
    }

    if (!favoriteTeamGame || favoriteTeamId === null) {
      if (!gameFeedbackMessage) {
        setGameFeedbackMessage("오늘 응원팀 경기가 없습니다.");
      }
      return;
    }

    setIsSubmittingLocation(true);
    setGameFeedbackMessage("");

    try {
      const request = {
        cheeringTeamId: favoriteTeamId,
        gameId: favoriteTeamGame.gameId,
        viewingType: toViewingType(location),
      };
      const userGameLog = await createUserGameLog(request);

      localStorage.setItem(getWatchingLocationKey(), location);
      setIsLocationSheetOpen(false);
      navigate("/timeline", {
        state: {
          gameId: favoriteTeamGame.gameId,
          userGameLogId: userGameLog.id,
        },
      });
    } catch (error) {
      setGameFeedbackMessage(
        error instanceof Error
          ? error.message
          : "관람 정보를 저장하지 못했습니다.",
      );
    } finally {
      setIsSubmittingLocation(false);
    }
  };

  const handleFlashClick = () => {
    console.log("플래시 설정");
  };

  const handleTimerClick = () => {
    console.log("타이머 설정");
  };

  return (
    <main className="relative mx-auto min-h-dvh w-full max-w-[390px] overflow-hidden bg-bg-primary px-4 pb-[33px] pt-[79px]">
      <InningIndicator currentInning={currentInning} />

      <div className="mt-[8px]">
        <CameraPreview
          mode={previewMode}
          caption={caption}
          captionInputRef={captionInputRef}
          onCaptionChange={setCaption}
          onClose={handleClose}
          onCapture={handleCapture}
          onLocationClick={handleLocationClick}
        />
      </div>

      {previewMode === "camera" && (
        <div className="mt-[15px]">
          <CameraControls
            direction={cameraDirection}
            onDirectionChange={setCameraDirection}
            onFlashClick={handleFlashClick}
            onTimerClick={handleTimerClick}
          />
        </div>
      )}

      <WatchingLocationSheet
        isOpen={isLocationSheetOpen}
        isSubmitting={isLoadingGame || isSubmittingLocation}
        feedbackMessage={gameFeedbackMessage}
        onClose={() => setIsLocationSheetOpen(false)}
        onRetry={handleGameRetry}
        onSelect={handleLocationSelect}
      />
    </main>
  );
}

const GAME_STATUS_PRIORITY: Record<string, number> = {
  LIVE: 0,
  DELAYED: 1,
  SUSPENDED: 2,
  SCHEDULED: 3,
  FINISHED: 4,
  UNKNOWN: 5,
};

function selectCurrentGame(games: GameResponse[]) {
  const availableGames = games.filter(
    (game) =>
      game.status !== "CANCELED" && game.status !== "POSTPONED",
  );
  const registeredGame = availableGames.find((game) => game.myViewing);

  if (registeredGame) {
    return registeredGame;
  }

  return (
    [...availableGames].sort((first, second) => {
      const statusDifference =
        (GAME_STATUS_PRIORITY[first.status] ?? 6) -
        (GAME_STATUS_PRIORITY[second.status] ?? 6);

      if (statusDifference !== 0) {
        return statusDifference;
      }

      return (
        Math.abs(Date.parse(first.scheduledAt) - Date.now()) -
        Math.abs(Date.parse(second.scheduledAt) - Date.now())
      );
    })[0] ?? null
  );
}

function toViewingType(location: WatchingLocation): ViewingType {
  return location === "stadium" ? "STADIUM" : "HOME";
}

function toWatchingLocation(viewingType: string): WatchingLocation {
  return viewingType === "STADIUM" ? "stadium" : "home";
}
