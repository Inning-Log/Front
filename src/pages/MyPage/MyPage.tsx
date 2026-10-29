import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  BottomBar,
} from "../../app/layouts/BottomBar";

import {
  PageHeader,
} from "../../app/layouts/PageHeader";

import cameraIcon from "../../assets/icons/camera.svg";
import defaultProfileIcon from "../../assets/icons/defaultprofile.svg";

import {
  logout,
} from "../../features/auth/api/authApi";

import {
  checkUsernameAvailability,
  getMyPage,
  updateFavoriteTeam,
  updateMyProfile,
  uploadProfileImage,
} from "../../features/mypage/api/mypage";

import {
  ApiError,
} from "../../shared/api/apiClient";

import {
  clearAuthSession,
} from "../../shared/auth/clearAuthSession";

import {
  KBO_TEAMS,
} from "../../shared/constants/teams";

import {
  getPushInstallationId,
} from "../../shared/firebase/pushInstallationStorage";

import {
  TeamMascot,
} from "../../shared/ui/TeamMascot";

type ProfileForm = {
  nickname: string;
  userId: string;
  email: string;
  favoriteTeamId:
    number | null;
  profileImage: string;
};

type ProfileInputProps = {
  label: string;
  value: string;
  disabled?: boolean;
  message?: string;
  messageType?:
    | "success"
    | "error";
  onChange?: (
    value: string,
  ) => void;
};

type ProfileItemProps = {
  label: string;
  value: string;
};

type UserIdStatus =
  | "idle"
  | "checking"
  | "success"
  | "error";

const USERNAME_PATTERN =
  /^[a-zA-Z0-9._]+$/;

const MAX_PROFILE_IMAGE_SIZE =
  10 * 1024 * 1024;

const ALLOWED_PROFILE_IMAGE_TYPES =
  new Set([
    "image/jpeg",
    "image/png",
  ]);

const emptyProfile:
  ProfileForm = {
    nickname: "",
    userId: "",
    email: "",
    favoriteTeamId:
      null,
    profileImage:
      defaultProfileIcon,
  };

function getUsernameValidationMessage(
  username: string,
) {
  if (!username) {
    return "아이디를 입력해주세요.";
  }

  if (
    username.length >
    30
  ) {
    return "아이디는 30자 이내로 입력해주세요.";
  }

  if (
    !USERNAME_PATTERN.test(
      username,
    )
  ) {
    return "영문, 숫자, 마침표, 밑줄만 사용할 수 있어요.";
  }

  return "";
}

function ProfileInput({
  label,
  value,
  disabled = false,
  message,
  messageType,
  onChange,
}: ProfileInputProps) {
  return (
    <div>
      <label className="block pt-[16px] text-label-3 text-black">
        {label}

        <input
          type="text"
          value={
            value
          }
          disabled={
            disabled
          }
          onChange={(
            event,
          ) =>
            onChange?.(
              event.target
                .value,
            )
          }
          className={[
            "mt-[14px] block w-full bg-transparent px-[10px]",
            "pb-[6px] text-label-3 font-medium leading-none outline-none",
            disabled
              ? "cursor-not-allowed text-surface-secondary"
              : "text-text-secondary",
            message
              ? messageType ===
                "error"
                ? "border-b-[1.5px] border-danger"
                : "border-b-[1.5px] border-accent-primary"
              : "border-b-[1.5px] border-surface-secondary",
          ].join(
            " ",
          )}
        />
      </label>

      {message && (
        <p
          className={[
            "mt-[4px] px-[10px] text-caption",
            messageType ===
            "error"
              ? "text-danger"
              : "text-accent-primary",
          ].join(
            " ",
          )}
        >
          {
            message
          }
        </p>
      )}
    </div>
  );
}

function ProfileItem({
  label,
  value,
}: ProfileItemProps) {
  return (
    <div className="border-b-[1.5px] border-surface-secondary pt-[16px]">
      <p className="text-label-3 text-black">
        {label}
      </p>

      <div className="mt-[18px] px-[16px] pb-[6px]">
        <span className="text-label-3 font-medium leading-none text-text-secondary">
          {value}
        </span>
      </div>
    </div>
  );
}

export function MyPage() {
  const navigate =
    useNavigate();

  const fileInputRef =
    useRef<HTMLInputElement>(
      null,
    );

  const previewImageUrlRef =
    useRef<
      string | null
    >(null);

  const usernameCheckRequestIdRef =
    useRef(0);

  const [
    profile,
    setProfile,
  ] =
    useState<ProfileForm>(
      emptyProfile,
    );

  const [
    form,
    setForm,
  ] =
    useState<ProfileForm>(
      emptyProfile,
    );

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(true);

  const [
    loadErrorMessage,
    setLoadErrorMessage,
  ] =
    useState("");

  const [
    isEditing,
    setIsEditing,
  ] =
    useState(false);

  const [
    isSelectingTeam,
    setIsSelectingTeam,
  ] =
    useState(false);

  const [
    isUpdating,
    setIsUpdating,
  ] =
    useState(false);

  const [
    updateErrorMessage,
    setUpdateErrorMessage,
  ] =
    useState("");

  const [
    selectedProfileImageFile,
    setSelectedProfileImageFile,
  ] =
    useState<
      File | null
    >(null);

  const [
    userIdStatus,
    setUserIdStatus,
  ] =
    useState<UserIdStatus>(
      "idle",
    );

  const [
    userIdFeedbackMessage,
    setUserIdFeedbackMessage,
  ] =
    useState("");

  const [
    isLoggingOut,
    setIsLoggingOut,
  ] =
    useState(false);

  const [
    logoutErrorMessage,
    setLogoutErrorMessage,
  ] =
    useState("");

  const redirectToLogin =
    useCallback(
      async () => {
        await clearAuthSession();

        navigate(
          "/login",
          {
            replace:
              true,
          },
        );
      },
      [
        navigate,
      ],
    );

  const clearPreviewImage =
    useCallback(
      () => {
        if (
          previewImageUrlRef.current
        ) {
          URL.revokeObjectURL(
            previewImageUrlRef.current,
          );

          previewImageUrlRef.current =
            null;
        }
      },
      [],
    );

  const loadMyPage =
    useCallback(
      async () => {
        setIsLoading(
          true,
        );

        setLoadErrorMessage(
          "",
        );

        try {
          const data =
            await getMyPage();

          const profileData:
            ProfileForm = {
              nickname:
                data.nickname,
              userId:
                data.username,
              email:
                data.email,
              favoriteTeamId:
                data.favoriteTeam
                  ?.id ??
                null,
              profileImage:
                data.profileImageUrl ||
                defaultProfileIcon,
            };

          setProfile(
            profileData,
          );

          setForm(
            profileData,
          );
        } catch (
          error
        ) {
          if (
            error instanceof
              ApiError &&
            error.status ===
              401
          ) {
            await redirectToLogin();
            return;
          }

          setLoadErrorMessage(
            error instanceof
                Error
              ? error.message
              : "마이페이지 정보를 불러오지 못했습니다.",
          );
        } finally {
          setIsLoading(
            false,
          );
        }
      },
      [
        redirectToLogin,
      ],
    );

  useEffect(() => {
    const timer =
      window.setTimeout(
        () => {
          void loadMyPage();
        },
        0,
      );

    return () =>
      window.clearTimeout(
        timer,
      );
  }, [
    loadMyPage,
  ]);

  useEffect(() => {
    return () => {
      clearPreviewImage();
    };
  }, [
    clearPreviewImage,
  ]);

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    const trimmedUserId =
      form.userId.trim();

    if (
      trimmedUserId ===
      profile.userId
    ) {
      return;
    }

    const validationMessage =
      getUsernameValidationMessage(
        trimmedUserId,
      );

    if (
      validationMessage
    ) {
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          const checkAvailability =
            async () => {
              const requestId =
                usernameCheckRequestIdRef
                  .current +
                1;

              usernameCheckRequestIdRef.current =
                requestId;

              setUserIdStatus(
                "checking",
              );

              try {
                const data =
                  await checkUsernameAvailability(
                    trimmedUserId,
                  );

                if (
                  requestId !==
                  usernameCheckRequestIdRef
                    .current
                ) {
                  return;
                }

                setUserIdStatus(
                  data.available
                    ? "success"
                    : "error",
                );

                setUserIdFeedbackMessage(
                  data.available
                    ? "사용 가능한 아이디입니다."
                    : "이미 사용 중인 아이디입니다.",
                );
              } catch (
                error
              ) {
                if (
                  requestId !==
                  usernameCheckRequestIdRef
                    .current
                ) {
                  return;
                }

                if (
                  error instanceof
                    ApiError &&
                  error.status ===
                    401
                ) {
                  await redirectToLogin();
                  return;
                }

                setUserIdStatus(
                  "error",
                );

                setUserIdFeedbackMessage(
                  error instanceof
                      Error
                    ? error.message
                    : "아이디 중복 확인에 실패했습니다.",
                );
              }
            };

          void checkAvailability();
        },
        400,
      );

    return () =>
      window.clearTimeout(
        timer,
      );
  }, [
    form.userId,
    isEditing,
    profile.userId,
    redirectToLogin,
  ]);

  const handleStartEditing =
    () => {
      clearPreviewImage();

      usernameCheckRequestIdRef.current +=
        1;

      setForm(
        profile,
      );

      setSelectedProfileImageFile(
        null,
      );

      setUserIdStatus(
        "idle",
      );

      setUserIdFeedbackMessage(
        "",
      );

      setUpdateErrorMessage(
        "",
      );

      setIsEditing(
        true,
      );
    };

  const handleCancelEditing =
    () => {
      clearPreviewImage();

      usernameCheckRequestIdRef.current +=
        1;

      setForm(
        profile,
      );

      setSelectedProfileImageFile(
        null,
      );

      setUserIdStatus(
        "idle",
      );

      setUserIdFeedbackMessage(
        "",
      );

      setUpdateErrorMessage(
        "",
      );

      setIsSelectingTeam(
        false,
      );

      setIsEditing(
        false,
      );
    };

  const handleUserIdChange =
    (
      userId: string,
    ) => {
      usernameCheckRequestIdRef.current +=
        1;

      setForm(
        (
          previous,
        ) => ({
          ...previous,
          userId,
        }),
      );

      const trimmedUserId =
        userId.trim();

      if (
        trimmedUserId ===
        profile.userId
      ) {
        setUserIdStatus(
          "idle",
        );

        setUserIdFeedbackMessage(
          "",
        );

        return;
      }

      const validationMessage =
        getUsernameValidationMessage(
          trimmedUserId,
        );

      if (
        validationMessage
      ) {
        setUserIdStatus(
          "error",
        );

        setUserIdFeedbackMessage(
          validationMessage,
        );

        return;
      }

      setUserIdStatus(
        "idle",
      );

      setUserIdFeedbackMessage(
        "",
      );
    };

  const handleProfileImageChange =
    (
      event:
        ChangeEvent<HTMLInputElement>,
    ) => {
      const imageFile =
        event.target.files?.[0];

      if (
        !imageFile
      ) {
        return;
      }

      setUpdateErrorMessage(
        "",
      );

      if (
        !ALLOWED_PROFILE_IMAGE_TYPES.has(
          imageFile.type,
        )
      ) {
        setUpdateErrorMessage(
          "프로필 이미지는 JPEG 또는 PNG 파일만 사용할 수 있습니다.",
        );

        event.target.value =
          "";

        return;
      }

      if (
        imageFile.size >
        MAX_PROFILE_IMAGE_SIZE
      ) {
        setUpdateErrorMessage(
          "프로필 이미지는 10MB 이하의 파일만 사용할 수 있습니다.",
        );

        event.target.value =
          "";

        return;
      }

      clearPreviewImage();

      const imageUrl =
        URL.createObjectURL(
          imageFile,
        );

      previewImageUrlRef.current =
        imageUrl;

      setSelectedProfileImageFile(
        imageFile,
      );

      setForm(
        (
          previous,
        ) => ({
          ...previous,
          profileImage:
            imageUrl,
        }),
      );

      event.target.value =
        "";
    };

  const handleSelectTeam =
    (
      teamId: number,
    ) => {
      setForm(
        (
          previous,
        ) => ({
          ...previous,
          favoriteTeamId:
            teamId,
        }),
      );
    };

  const handleCompleteEditing =
    async () => {
      const trimmedNickname =
        form.nickname.trim();

      const trimmedUserId =
        form.userId.trim();

      const isUserIdChanged =
        trimmedUserId !==
        profile.userId;

      const isNicknameChanged =
        trimmedNickname !==
        profile.nickname;

      const isFavoriteTeamChanged =
        form.favoriteTeamId !==
        profile.favoriteTeamId;

      const validationMessage =
        getUsernameValidationMessage(
          trimmedUserId,
        );

      if (
        !trimmedNickname ||
        validationMessage ||
        (
          isUserIdChanged &&
          userIdStatus !==
            "success"
        )
      ) {
        return;
      }

      try {
        setIsUpdating(
          true,
        );

        setUpdateErrorMessage(
          "",
        );

        let updatedProfile =
          null;

        if (
          isNicknameChanged ||
          isUserIdChanged
        ) {
          updatedProfile =
            await updateMyProfile(
              {
                username:
                  trimmedUserId,
                nickname:
                  trimmedNickname,
              },
            );
        }

        if (
          isFavoriteTeamChanged
        ) {
          if (
            form.favoriteTeamId ===
            null
          ) {
            throw new Error(
              "응원 팀을 선택해 주세요.",
            );
          }

          updatedProfile =
            await updateFavoriteTeam(
              form.favoriteTeamId,
            );
        }

        if (
          selectedProfileImageFile
        ) {
          updatedProfile =
            await uploadProfileImage(
              selectedProfileImageFile,
            );
        }

        if (
          !updatedProfile
        ) {
          setUserIdStatus(
            "idle",
          );

          setUserIdFeedbackMessage(
            "",
          );

          setIsSelectingTeam(
            false,
          );

          setIsEditing(
            false,
          );

          return;
        }

        const profileData:
          ProfileForm = {
            nickname:
              updatedProfile.nickname,
            userId:
              updatedProfile.username,
            email:
              updatedProfile.email,
            favoriteTeamId:
              updatedProfile
                .favoriteTeam
                ?.id ??
              form.favoriteTeamId,
            profileImage:
              updatedProfile
                .profileImageUrl ||
              defaultProfileIcon,
          };

        clearPreviewImage();

        setProfile(
          profileData,
        );

        setForm(
          profileData,
        );

        setSelectedProfileImageFile(
          null,
        );

        setUserIdStatus(
          "idle",
        );

        setUserIdFeedbackMessage(
          "",
        );

        setIsSelectingTeam(
          false,
        );

        setIsEditing(
          false,
        );
      } catch (
        error
      ) {
        if (
          error instanceof
            ApiError &&
          error.status ===
            401
        ) {
          await redirectToLogin();
          return;
        }

        setUpdateErrorMessage(
          error instanceof
              Error
            ? error.message
            : "프로필 수정에 실패했습니다.",
        );

        console.error(
          "프로필 수정 중 오류가 발생했습니다.",
          error,
        );
      } finally {
        setIsUpdating(
          false,
        );
      }
    };

  const handleLogout =
    async () => {
      if (
        isLoggingOut
      ) {
        return;
      }

      setIsLoggingOut(
        true,
      );

      setLogoutErrorMessage(
        "",
      );

      const installationId =
        getPushInstallationId();

      try {
        /*
         * 서버가 현재 installationId의 푸시 등록 해제와
         * 로그아웃을 한 요청에서 함께 처리한다.
         */
        await logout(
          installationId,
        );

        await clearAuthSession();

        navigate(
          "/login",
          {
            replace:
              true,
          },
        );
      } catch (
        error
      ) {
        if (
          error instanceof
            ApiError &&
          error.status ===
            401
        ) {
          await clearAuthSession();

          navigate(
            "/login",
            {
              replace:
                true,
            },
          );

          return;
        }

        setLogoutErrorMessage(
          error instanceof
              Error
            ? error.message
            : "로그아웃에 실패했습니다. 잠시 후 다시 시도해 주세요.",
        );

        console.error(
          "로그아웃 중 오류가 발생했습니다.",
          error,
        );
      } finally {
        setIsLoggingOut(
          false,
        );
      }
    };

  const isUserIdChanged =
    form.userId.trim() !==
    profile.userId;

  const selectedFormTeam =
    KBO_TEAMS.find(
      (team) =>
        team.id ===
        form.favoriteTeamId,
    );

  const selectedProfileTeam =
    KBO_TEAMS.find(
      (team) =>
        team.id ===
        profile.favoriteTeamId,
    );

  if (
    isLoading
  ) {
    return (
      <div className="flex min-h-dvh w-full items-center justify-center bg-[#F1F2F1]">
        <p className="text-label-3 text-text-secondary">
          프로필을 불러오는 중입니다.
        </p>
      </div>
    );
  }

  if (
    loadErrorMessage
  ) {
    return (
      <div className="flex min-h-dvh w-full flex-col bg-[#F1F2F1]">
        <div className="bg-[#F1F2F1] pt-[45px]">
          <PageHeader
            title="마이페이지"
          />
        </div>

        <main className="flex flex-1 flex-col items-center justify-center px-[16px]">
          <p className="text-center text-label-3 text-text-secondary">
            {
              loadErrorMessage
            }
          </p>

          <button
            type="button"
            onClick={() => {
              void loadMyPage();
            }}
            className="mt-[20px] rounded-[24px] bg-accent-primary px-[28px] py-[12px] text-label-3 text-white"
          >
            다시 시도
          </button>
        </main>

        <BottomBar />
      </div>
    );
  }

  if (
    isSelectingTeam
  ) {
    return (
      <div className="min-h-dvh w-full bg-[#F1F2F1] pb-[110px]">
        <div className="bg-[#F1F2F1] pt-[45px]">
          <PageHeader
            title="프로필 수정"
            onBack={() =>
              setIsSelectingTeam(
                false,
              )
            }
          />
        </div>

        <main className="px-[20px] pt-[16px]">
          <section className="rounded-[31px] bg-bg-primary pb-[24px] pt-[76px]">
            <div className="rounded-[35px] bg-surface-secondary px-[16px] py-[12px]">
              {KBO_TEAMS.map(
                (
                  team,
                ) => {
                  const isSelected =
                    form.favoriteTeamId ===
                    team.id;

                  return (
                    <button
                      key={
                        team.id
                      }
                      type="button"
                      onClick={() =>
                        handleSelectTeam(
                          team.id,
                        )
                      }
                      className={[
                        "flex h-[64px] w-full items-center rounded-[32px]",
                        "px-[18px] text-left text-label-1 text-black",
                        isSelected
                          ? "bg-bg-primary"
                          : "",
                      ].join(
                        " ",
                      )}
                    >
                      <TeamMascot
                        team={
                          team
                        }
                        containerSize={
                          52
                        }
                        className="mr-[16px]"
                        decorative
                      />

                      <span>
                        {
                          team.name
                        }
                      </span>
                    </button>
                  );
                },
              )}
            </div>
          </section>

          <button
            type="button"
            onClick={() =>
              setIsSelectingTeam(
                false,
              )
            }
            className="mt-[28px] h-[61px] w-full rounded-[31px] bg-accent-primary button-text text-white"
          >
            수정 완료
          </button>
        </main>

        <BottomBar />
      </div>
    );
  }

  const displayedProfile =
    isEditing
      ? form
      : profile;

  const isCompleteDisabled =
    isUpdating ||
    !form.nickname.trim() ||
    !form.userId.trim() ||
    (
      isUserIdChanged &&
      userIdStatus !==
        "success"
    );

  return (
    <div className="min-h-dvh w-full bg-[#F1F2F1] pb-[110px]">
      <div className="bg-[#F1F2F1] pt-[20px]">
        <PageHeader
          title={
            isEditing
              ? "프로필 수정"
              : "마이페이지"
          }
          rightText={
            isEditing
              ? ""
              : "수정"
          }
          onRightClick={
            isEditing
              ? undefined
              : handleStartEditing
          }
          onBack={
            isEditing
              ? handleCancelEditing
              : undefined
          }
        />
      </div>

      <main className="px-[16px] pt-[16px]">
        <section className="min-h-[508px] rounded-[25px] bg-bg-primary px-[16px] pb-[24px] shadow-[0_6px_16px_rgba(0,0,0,0.08)]">
          <div className="flex justify-center pb-[5px] pt-[21px]">
            <div className="relative size-[133px] shrink-0">
              <div className="size-full overflow-hidden rounded-full">
                <img
                  src={
                    displayedProfile
                      .profileImage
                  }
                  alt={`${displayedProfile.nickname} 프로필`}
                  onError={(
                    event,
                  ) => {
                    event.currentTarget.onerror =
                      null;

                    event.currentTarget.src =
                      defaultProfileIcon;
                  }}
                  className="block h-full w-full object-cover object-center"
                />
              </div>

              {isEditing && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    disabled={
                      isUpdating
                    }
                    aria-label="프로필 사진 변경"
                    className="absolute bottom-[3px] right-[3px] flex size-[28px] items-center justify-center rounded-full bg-text-secondary disabled:opacity-50"
                  >
                    <img
                      src={
                        cameraIcon
                      }
                      alt=""
                      aria-hidden="true"
                      className="h-[13px] w-[15px]"
                    />
                  </button>

                  <input
                    ref={
                      fileInputRef
                    }
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={
                      handleProfileImageChange
                    }
                    disabled={
                      isUpdating
                    }
                    className="hidden"
                  />
                </>
              )}
            </div>
          </div>

          {isEditing ? (
            <>
              <ProfileInput
                label="닉네임"
                value={
                  form.nickname
                }
                onChange={(
                  nickname,
                ) =>
                  setForm(
                    (
                      previous,
                    ) => ({
                      ...previous,
                      nickname,
                    }),
                  )
                }
              />

              <ProfileInput
                label="아이디"
                value={
                  form.userId
                }
                message={
                  userIdFeedbackMessage ||
                  undefined
                }
                messageType={
                  userIdStatus ===
                  "success"
                    ? "success"
                    : "error"
                }
                onChange={
                  handleUserIdChange
                }
              />

              <ProfileInput
                label="이메일"
                value={
                  form.email
                }
                disabled
              />

              <button
                type="button"
                onClick={() =>
                  setIsSelectingTeam(
                    true,
                  )
                }
                disabled={
                  isUpdating
                }
                className="w-full border-b-[1.5px] border-surface-secondary pt-[16px] text-left disabled:opacity-50"
              >
                <p className="text-label-3 text-black">
                  응원 팀
                </p>

                <div className="mt-[18px] flex items-center justify-between px-[10px] pb-[6px]">
                  <span className="text-label-3 font-medium leading-none text-text-secondary">
                    {selectedFormTeam
                      ?.name ??
                      "선택 안 함"}
                  </span>

                  <span
                    aria-hidden="true"
                    className="size-[9px] rotate-45 border-r-2 border-t-2 border-text-secondary"
                  />
                </div>
              </button>

              {updateErrorMessage && (
                <p className="mt-[16px] text-center text-caption text-danger">
                  {
                    updateErrorMessage
                  }
                </p>
              )}
            </>
          ) : (
            <>
              <ProfileItem
                label="닉네임"
                value={
                  profile.nickname
                }
              />

              <ProfileItem
                label="아이디"
                value={
                  profile.userId
                }
              />

              <ProfileItem
                label="이메일"
                value={
                  profile.email
                }
              />

              <ProfileItem
                label="응원 팀"
                value={
                  selectedProfileTeam
                    ?.name ??
                  "선택 안 함"
                }
              />
            </>
          )}
        </section>

        {isEditing ? (
          <button
            type="button"
            onClick={() => {
              void handleCompleteEditing();
            }}
            disabled={
              isCompleteDisabled
            }
            className="mt-[91px] h-[61px] w-full rounded-[31px] bg-accent-primary button-text text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUpdating
              ? "수정 중..."
              : "수정 완료"}
          </button>
        ) : (
          <section className="mt-[10px]">
            <h2 className="ml-[10px] text-label-3 font-medium text-text-tertiary">
              기타
            </h2>

            <div className="mt-[5px] min-h-[110px] rounded-[25px] bg-bg-primary px-[10px] shadow-[0_6px_16px_rgba(0,0,0,0.08)]">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/mypage/friends",
                  )
                }
                className="flex h-[58px] w-full items-center border-b-[1.5px] border-surface-secondary px-[16px] text-left text-label-3 text-black"
              >
                친구
              </button>

              <button
                type="button"
                onClick={() => {
                  void handleLogout();
                }}
                disabled={
                  isLoggingOut
                }
                className="flex h-[58px] w-full items-center px-[16px] text-left text-label-3 text-danger disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoggingOut
                  ? "로그아웃 중..."
                  : "로그아웃"}
              </button>
            </div>

            {logoutErrorMessage && (
              <p className="mt-[8px] px-[10px] text-caption text-danger">
                {
                  logoutErrorMessage
                }
              </p>
            )}
          </section>
        )}
      </main>

      <BottomBar />
    </div>
  );
}
