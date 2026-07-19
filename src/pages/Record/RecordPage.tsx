import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { CameraControls } from "../../features/record/CameraControls";
import type { CameraDirection } from "../../features/record/CameraControls";
import { CameraPreview } from "../../features/record/CameraPreview";
import { InningIndicator } from "../../features/record/InningIndicator";

export function RecordPage() {
  const navigate = useNavigate();

  const [cameraDirection, setCameraDirection] =
    useState<CameraDirection>("front");

  /*
   * 임시값
   * 이후 경기 진행 정보나 서버 응답에서 받아오면 됨
   */
  const currentInning = 1;

  const handleClose = () => {
    navigate(-1);
  };

  const handleCapture = () => {
    console.log(`${currentInning}이닝 촬영 시작`);
  };

  const handleFlashClick = () => {
    console.log("플래시 설정");
  };

  const handleTimerClick = () => {
    console.log("타이머 설정");
  };

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[390px] bg-[#F5F5F5] px-4 pb-[33px] pt-[79px]">
      <InningIndicator currentInning={currentInning} />

      <div className="mt-[8px]">
        <CameraPreview
          onClose={handleClose}
          onCapture={handleCapture}
        />
      </div>

      <div className="mt-[15px]">
        <CameraControls
          direction={cameraDirection}
          onDirectionChange={setCameraDirection}
          onFlashClick={handleFlashClick}
          onTimerClick={handleTimerClick}
        />
      </div>
    </main>
  );
}