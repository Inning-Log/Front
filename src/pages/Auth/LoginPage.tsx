import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { PageHeader } from "../../app/layouts/PageHeader";
import { loginWithGoogle } from "../../features/auth/api/authApi";
import {
  loadGoogleIdentityScript,
  renderGoogleLoginButton,
} from "../../features/auth/lib/googleIdentity";

export function LoginPage() {
  const navigate = useNavigate();
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const buttonContainer = googleButtonRef.current;

    if (!buttonContainer) {
      return;
    }

    let ignore = false;

    loadGoogleIdentityScript()
      .then(() => {
        if (ignore) {
          return;
        }

        renderGoogleLoginButton(buttonContainer, async (credential) => {
          setErrorMessage("");
          setIsLoggingIn(true);

          try {
            const loginResponse = await loginWithGoogle(credential);

            localStorage.setItem(
              "accessToken",
              loginResponse.accessToken,
            );
            localStorage.setItem("tokenType", loginResponse.tokenType);
            localStorage.setItem(
              "accessTokenExpiresAt",
              loginResponse.expiresAt,
            );

            const needsProfileSetup =
              loginResponse.isNewUser ||
              !loginResponse.user?.onboardingCompleted;

            navigate(needsProfileSetup ? "/profile-setup" : "/home", {
              replace: true,
            });
          } catch (error) {
            setErrorMessage(
              error instanceof Error
                ? error.message
                : "로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.",
            );
          } finally {
            setIsLoggingIn(false);
          }
        });
      })
      .catch(() => {
        setErrorMessage("Google 로그인 버튼을 불러오지 못했습니다.");
      });

    return () => {
      ignore = true;
    };
  }, [navigate]);

  return (
    <div className="flex min-h-dvh w-full flex-col bg-bg-primary pt-[28.5px]">
      <PageHeader />

      <main className="relative flex flex-1 flex-col px-[33px]">
        <h1 className="text-title-2 mt-[62px] whitespace-pre-line text-black">
          {"야구장에서의 순간들을\n기록해볼까요?"} 
        </h1>

      <div className="absolute left-1/2 top-1/2 w-[284px] -translate-x-1/2 -translate-y-1/2">
        <div
          className={[
            "flex rounded-full border-2 border-accent-deep bg-white",
            isLoggingIn ? "pointer-events-none opacity-60" : "",
          ].join(" ")}
        >
          <div
            ref={googleButtonRef}
            aria-disabled={isLoggingIn}
            className="flex w-full justify-center overflow-hidden rounded-full"
          />
        </div>

        {isLoggingIn && (
          <p className="mt-[12px] text-center text-caption text-black">
            로그인 중...
          </p>
        )}

        {errorMessage && (
          <p className="mt-[12px] text-center text-caption text-danger">
            {errorMessage}
          </p>
        )}
      </div>

        <p className="mt-auto pb-[49px] text-center text-caption text-black">
          로그인 오류 문의 inning@inning.net
        </p>
      </main>
    </div>
  );
}