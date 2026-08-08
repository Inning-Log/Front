import { GoogleLogin } from "@react-oauth/google";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { PageHeader } from "../../app/layouts/PageHeader";
import { loginWithGoogle } from "../../features/auth/api/authApi";

export function LoginPage() {
  const navigate = useNavigate();

  const [errorMessage, setErrorMessage] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleGoogleLogin = async (credential?: string) => {
    if (!credential) {
      setErrorMessage("Google 로그인 정보를 받아오지 못했습니다.");
      return;
    }

    setErrorMessage("");
    setIsLoggingIn(true);

    try {
      const loginResponse = await loginWithGoogle(credential);

      localStorage.setItem(
        "accessToken",
        loginResponse.accessToken,
      );

      localStorage.setItem(
        "tokenType",
        loginResponse.tokenType,
      );

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
  };

  return (
    <div className="flex min-h-dvh w-full flex-col bg-bg-primary pt-[28.5px]">
      <PageHeader />

      <main className="flex flex-1 flex-col px-[33px]">
        <h1 className="text-title-2 mt-[62px] whitespace-pre-line text-black">
          {"야구장에서의 순간들을\n기록해볼까요?"}
        </h1>

        <div className="mt-auto flex flex-col items-center">
          <div className="w-[300px]">
            <p className="mb-[12px] text-center text-caption text-black">
              Google 계정으로 간편하게 시작해보세요
            </p>

            <div
              className={[
                "flex w-full justify-center overflow-hidden rounded-full",
                "border-2 border-accent-deep bg-white",
                "shadow-[0_4px_12px_rgba(0,0,0,0.15)]",
                "transition-all duration-200",
                "hover:-translate-y-[1px]",
                "hover:shadow-[0_6px_16px_rgba(0,0,0,0.2)]",
                isLoggingIn
                  ? "pointer-events-none opacity-60"
                  : "",
              ].join(" ")}
            >
              <GoogleLogin
                onSuccess={(credentialResponse) => {
                  void handleGoogleLogin(
                    credentialResponse.credential,
                  );
                }}
                onError={() => {
                  setErrorMessage(
                    "Google 로그인에 실패했습니다.",
                  );
                }}
                theme="outline"
                size="large"
                shape="pill"
                text="continue_with"
                width="300"
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

          <p className="mt-[24px] pb-[49px] text-center text-caption text-black">
            로그인 오류 문의 inning@inning.net
          </p>
        </div>
      </main>
    </div>
  );
}