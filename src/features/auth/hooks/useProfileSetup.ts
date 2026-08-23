import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  checkUsernameAvailability,
  setupNickname,
  setupUsername,
} from "../api/onboardingApi";
import type { ProfileIdProps } from "../components/ProfileId";
import type { ProfileNicknameProps } from "../components/ProfileNickname";
import type { OnboardingStep } from "../types/onboarding";

type ProfileSetupStep = 1 | 2 | 3 | 4;
type UsernameAvailabilityStatus =
  | "idle"
  | "checking"
  | "available"
  | "unavailable"
  | "invalid"
  | "error";

const USERNAME_PATTERN = /^[a-zA-Z0-9._]+$/;

function getUsernameValidationMessage(username: string) {
  if (!username) {
    return "아이디를 입력해주세요.";
  }

  if (username.length > 30) {
    return "아이디는 30자 이내로 입력해주세요.";
  }

  if (!USERNAME_PATTERN.test(username)) {
    return "영문, 숫자, 마침표, 밑줄만 사용할 수 있어요.";
  }

  return "";
}

function getNicknameValidationMessage(nickname: string) {
  if (!nickname) {
    return "닉네임을 입력해주세요.";
  }

  if (nickname.length > 80) {
    return "닉네임은 80자 이내로 입력해주세요.";
  }

  return "";
}

function getProfileSetupStep(
  nextStep: Exclude<OnboardingStep, "COMPLETED">,
) {
  const nextProfileSetupStep: Record<
    Exclude<OnboardingStep, "COMPLETED">,
    ProfileSetupStep
  > = {
    USERNAME: 1,
    NICKNAME: 2,
    FAVORITE_TEAM: 3,
  };

  return nextProfileSetupStep[nextStep];
}

function getUsernameFeedbackTone(
  status: UsernameAvailabilityStatus,
): ProfileIdProps["feedbackTone"] {
  if (status === "available") {
    return "success";
  }

  if (status === "checking") {
    return "neutral";
  }

  return "error";
}

export function useProfileSetup() {
  const navigate = useNavigate();
  const usernameCheckRequestIdRef = useRef(0);
  const [step, setStep] = useState<ProfileSetupStep>(1);
  const [username, setUsername] = useState("");
  const [nickname, setNickname] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [usernameAvailabilityStatus, setUsernameAvailabilityStatus] =
    useState<UsernameAvailabilityStatus>("idle");
  const [usernameFeedbackMessage, setUsernameFeedbackMessage] =
    useState("");
  const [lastCheckedUsername, setLastCheckedUsername] = useState("");
  const [isSubmittingUsername, setIsSubmittingUsername] =
    useState(false);
  const [nicknameFeedbackMessage, setNicknameFeedbackMessage] =
    useState("");
  const [isSubmittingNickname, setIsSubmittingNickname] =
    useState(false);

  const completeProfileSetup = () => {
    navigate("/home", { replace: true });
  };

  const moveToOnboardingStep = (nextStep: OnboardingStep) => {
    if (nextStep === "COMPLETED") {
      completeProfileSetup();
      return;
    }

    setStep(getProfileSetupStep(nextStep));
  };

  const handleUsernameChange = (nextUsername: string) => {
    usernameCheckRequestIdRef.current += 1;
    setUsername(nextUsername);

    if (!nextUsername.trim()) {
      setUsernameAvailabilityStatus("idle");
      setUsernameFeedbackMessage("");
      setLastCheckedUsername("");
      return;
    }

    if (nextUsername.trim() !== lastCheckedUsername) {
      setUsernameAvailabilityStatus("idle");
      setUsernameFeedbackMessage("");
    }
  };

  const checkCurrentUsernameAvailability = async (
    usernameToCheck: string,
  ) => {
    const trimmedUsername = usernameToCheck.trim();
    const validationMessage =
      getUsernameValidationMessage(trimmedUsername);

    if (!trimmedUsername) {
      setUsernameAvailabilityStatus("idle");
      setUsernameFeedbackMessage("");
      setLastCheckedUsername("");
      return null;
    }

    if (validationMessage) {
      setUsernameAvailabilityStatus("invalid");
      setUsernameFeedbackMessage(validationMessage);
      setLastCheckedUsername("");
      return null;
    }

    const requestId = usernameCheckRequestIdRef.current + 1;
    usernameCheckRequestIdRef.current = requestId;

    setUsernameAvailabilityStatus("checking");
    setUsernameFeedbackMessage("아이디 중복을 확인하고 있어요.");

    try {
      const response =
        await checkUsernameAvailability(trimmedUsername);

      if (requestId !== usernameCheckRequestIdRef.current) {
        return null;
      }

      const checkedUsername = response.username || trimmedUsername;
      setUsername(checkedUsername);
      setLastCheckedUsername(checkedUsername);

      if (!response.available) {
        setUsernameAvailabilityStatus("unavailable");
        setUsernameFeedbackMessage("이미 사용 중인 아이디예요.");
        return null;
      }

      setUsernameAvailabilityStatus("available");
      setUsernameFeedbackMessage("사용 가능한 아이디예요.");
      return checkedUsername;
    } catch (error) {
      if (requestId !== usernameCheckRequestIdRef.current) {
        return null;
      }

      setUsernameAvailabilityStatus("error");
      setUsernameFeedbackMessage(
        error instanceof Error
          ? error.message
          : "아이디 중복 확인에 실패했습니다.",
      );
      setLastCheckedUsername("");
      return null;
    }
  };

  const handleUsernameBlur = () => {
    if (isSubmittingUsername) {
      return;
    }

    void checkCurrentUsernameAvailability(username);
  };

  const handleUsernameNext = async () => {
    const trimmedUsername = username.trim();
    const validationMessage =
      getUsernameValidationMessage(trimmedUsername);

    if (validationMessage) {
      setUsernameAvailabilityStatus("invalid");
      setUsernameFeedbackMessage(validationMessage);
      setLastCheckedUsername("");
      return;
    }

    setIsSubmittingUsername(true);

    try {
      const checkedUsername =
        usernameAvailabilityStatus === "available" &&
        lastCheckedUsername === trimmedUsername
          ? trimmedUsername
          : await checkCurrentUsernameAvailability(trimmedUsername);

      if (!checkedUsername) {
        return;
      }

      const response = await setupUsername(checkedUsername);
      setUsername(response.user?.username ?? checkedUsername);
      moveToOnboardingStep(response.nextStep);
    } catch (error) {
      setUsernameAvailabilityStatus("error");
      setUsernameFeedbackMessage(
        error instanceof Error
          ? error.message
          : "아이디를 저장하지 못했습니다.",
      );
    } finally {
      setIsSubmittingUsername(false);
    }
  };

  const handleNicknameChange = (nextNickname: string) => {
    setNickname(nextNickname);

    if (nicknameFeedbackMessage) {
      setNicknameFeedbackMessage("");
    }
  };

  const handleNicknameNext = async () => {
    const trimmedNickname = nickname.trim();
    const validationMessage =
      getNicknameValidationMessage(trimmedNickname);

    if (validationMessage) {
      setNicknameFeedbackMessage(validationMessage);
      return;
    }

    setIsSubmittingNickname(true);
    setNicknameFeedbackMessage("");

    try {
      const response = await setupNickname(trimmedNickname);
      setNickname(response.user?.nickname ?? trimmedNickname);
      moveToOnboardingStep(response.nextStep);
    } catch (error) {
      setNicknameFeedbackMessage(
        error instanceof Error
          ? error.message
          : "닉네임을 저장하지 못했습니다.",
      );
    } finally {
      setIsSubmittingNickname(false);
    }
  };

  return {
    completeProfileSetup,
    nicknameStepProps: {
      feedbackMessage: nicknameFeedbackMessage,
      isSubmitting: isSubmittingNickname,
      onChange: handleNicknameChange,
      onNext: handleNicknameNext,
      value: nickname,
    } satisfies ProfileNicknameProps,
    step,
    teamStepProps: {
      onNext: () => setStep(4),
      onSelectTeam: setSelectedTeamId,
      selectedTeamId,
    },
    usernameStepProps: {
      feedbackMessage: usernameFeedbackMessage,
      feedbackTone: getUsernameFeedbackTone(
        usernameAvailabilityStatus,
      ),
      isChecking: usernameAvailabilityStatus === "checking",
      isSubmitting: isSubmittingUsername,
      onBlur: handleUsernameBlur,
      onChange: handleUsernameChange,
      onNext: handleUsernameNext,
      value: username,
    } satisfies ProfileIdProps,
  };
}
