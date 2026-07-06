import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import splash01 from "../../assets/splash/splash01.png";
import splash02 from "../../assets/splash/splash02.png";
import splash03 from "../../assets/splash/splash03.png";
import splash04 from "../../assets/splash/splash04.png";

const splashFrames = [
  splash01,
  splash02,
  splash03,
  splash04,
  splash03,
  splash02,
];

export function SplashPage() {
  const navigate = useNavigate();
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    const frameTimer = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % splashFrames.length);
    }, 220);

    const navigationTimer = setTimeout(() => {
      navigate("/login");
    }, 3000);

    return () => {
      clearInterval(frameTimer);
      clearTimeout(navigationTimer);
    };
  }, [navigate]);

  return (
    <main className="relative min-h-dvh w-full overflow-hidden bg-[#0B502B]">
      {/* 캐릭터 영역 */}
      <div
        className="
          absolute
          left-1/2
          top-[43%]
          -translate-x-1/2
          -translate-y-1/2
        "
      >
        <img
          src={splashFrames[frameIndex]}
          alt="이닝로그 스플래시 캐릭터"
          className="animate-splash-bounce w-[150px]"
        />
      </div>

      {/* 하단 로고 */}
      <p
        className="
          absolute
          bottom-[8%]
          left-1/2
          -translate-x-1/2
          text-2xl
          font-bold
          text-white
        "
      >
        inning
      </p>
    </main>
  );
}