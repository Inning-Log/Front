import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { CameraControls } from "../../features/record/CameraControls";
import type { CameraDirection } from "../../features/record/CameraControls";
import { CameraPreview } from "../../features/record/CameraPreview";
import type { CameraPreviewMode } from "../../features/record/CameraPreview";
import { InningIndicator } from "../../features/record/InningIndicator";
import { WatchingLocationSheet } from "../../features/record/WatchingLocationSheet";
import type { WatchingLocation } from "../../features/record/WatchingLocationSheet";

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

  /*
   * 임시값
   * 이후 경기 진행 정보나 서버 응답에서 받아오면 됨
   */
  const currentInning = 1;

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
      navigate("/timeline");
      return;
    }

    /*
     * 오늘의 첫 기록이라면 관람 장소 선택 표시
     */
    setIsLocationSheetOpen(true);
  };

  const handleLocationSelect = (location: WatchingLocation) => {
    /*
     * 선택한 관람 장소를 오늘 날짜 기준으로 저장
     */
    localStorage.setItem(getWatchingLocationKey(), location);

    setIsLocationSheetOpen(false);
    navigate("/timeline");

    /*
     * API 연동 후에는 타임라인 이동 전에
     * 촬영 영상, 문구, 관람 장소를 서버에 전달하면 됨
     */
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
        onClose={() => setIsLocationSheetOpen(false)}
        onSelect={handleLocationSelect}
      />
    </main>
  );
}