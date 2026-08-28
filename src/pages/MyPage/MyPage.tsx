import {
  type ChangeEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import { BottomBar } from "../../app/layouts/BottomBar";
import { PageHeader } from "../../app/layouts/PageHeader";
import cameraIcon from "../../assets/icons/camera.svg";
import defaultProfileIcon from "../../assets/icons/defaultprofile.svg";
import {
  checkUsernameAvailability,
  getMyPage,
  updateMyProfile,
  updateProfileImage,
} from "../../features/mypage/api/mypage";
import {
  KBO_TEAMS,
  type TeamName,
} from "../../shared/constants/teams";
import { TeamMascot } from "../../shared/ui/TeamMascot";

type ProfileForm = {
  nickname: string;
  userId: string;
  email: string;
  favoriteTeam: TeamName;
  profileImage: string;
};

type ProfileInputProps = {
  label: string;
  value: string;
  disabled?: boolean;
  message?: string;
  messageType?: "success" | "error";
  onChange?: (value: string) => void;
};

type ProfileItemProps = {
  label: string;
  value: string;
};

const emptyProfile: ProfileForm = {
  nickname: "",
  userId: "",
  email: "",
  favoriteTeam: "KIA 타이거즈",
  profileImage: defaultProfileIcon,
};

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
          value={value}
          disabled={disabled}
          onChange={(event) =>
            onChange?.(event.target.value)
          }
          className={[
            "mt-[14px] block w-full bg-transparent px-[10px]",
            "pb-[6px] text-label-3 font-medium leading-none outline-none",
            disabled
              ? "cursor-not-allowed text-surface-secondary"
              : "text-text-secondary",
            message
              ? messageType === "error"
                ? "border-b-[1.5px] border-danger"
                : "border-b-[1.5px] border-accent-primary"
              : "border-b-[1.5px] border-surface-secondary",
          ].join(" ")}
        />
      </label>

      {message && (
        <p
          className={[
            "mt-[4px] px-[10px] text-caption",
            messageType === "error"
              ? "text-danger"
              : "text-accent-primary",
          ].join(" ")}
        >
          {message}
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
  const navigate = useNavigate();

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const previewImageUrlRef =
    useRef<string | null>(null);

  const [profile, setProfile] =
    useState<ProfileForm>(emptyProfile);

  const [form, setForm] =
    useState<ProfileForm>(emptyProfile);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isEditing, setIsEditing] =
    useState(false);

  const [isSelectingTeam, setIsSelectingTeam] =
    useState(false);

  const [isUpdating, setIsUpdating] =
    useState(false);

  const [
    updateErrorMessage,
    setUpdateErrorMessage,
  ] = useState("");

  const [selectedProfileImageFile, setSelectedProfileImageFile] =
    useState<File | null>(null);

  const [userIdStatus, setUserIdStatus] =
    useState<
      "idle" | "success" | "error"
    >("idle");

  useEffect(() => {
    const fetchMyPage = async () => {
      try {
        setIsLoading(true);

        const data = await getMyPage();

        const profileData: ProfileForm = {
          nickname: data.nickname,
          userId: data.username,
          email: data.email,
          favoriteTeam:
            (data.favoriteTeam?.name as TeamName) ??
            emptyProfile.favoriteTeam,
          profileImage:
            data.profileImageUrl ||
            defaultProfileIcon,
        };

        setProfile(profileData);
        setForm(profileData);
      } catch (error) {
        console.error(
          "마이페이지 조회 중 오류가 발생했습니다.",
          error,
        );
      } finally {
        setIsLoading(false);
      }
    };

    void fetchMyPage();
  }, []);

  useEffect(() => {
    return () => {
      if (previewImageUrlRef.current) {
        URL.revokeObjectURL(
          previewImageUrlRef.current,
        );
      }
    };
  }, []);

  useEffect(() => {
    const trimmedUserId =
      form.userId.trim();

    if (!isEditing) {
      setUserIdStatus("idle");
      return;
    }

    if (
      trimmedUserId === profile.userId
    ) {
      setUserIdStatus("idle");
      return;
    }

    if (
      !/^[a-zA-Z0-9._]{4,20}$/.test(
        trimmedUserId,
      )
    ) {
      setUserIdStatus("error");
      return;
    }

    setUserIdStatus("idle");

    const timer = window.setTimeout(() => {
      const checkAvailability =
        async () => {
          try {
            const data =
              await checkUsernameAvailability(
                trimmedUserId,
              );

            setUserIdStatus(
              data.available
                ? "success"
                : "error",
            );
          } catch (error) {
            console.error(
              "아이디 중복 확인 중 오류가 발생했습니다.",
              error,
            );

            setUserIdStatus("error");
          }
        };

      void checkAvailability();
    }, 400);

    return () =>
      window.clearTimeout(timer);
  }, [
    form.userId,
    isEditing,
    profile.userId,
  ]);

  const clearPreviewImage = () => {
    if (previewImageUrlRef.current) {
      URL.revokeObjectURL(
        previewImageUrlRef.current,
      );

      previewImageUrlRef.current = null;
    }
  };

  const handleStartEditing = () => {
    clearPreviewImage();

    setForm(profile);
    setSelectedProfileImageFile(null);
    setUserIdStatus("idle");
    setUpdateErrorMessage("");
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    clearPreviewImage();

    setForm(profile);
    setSelectedProfileImageFile(null);
    setUserIdStatus("idle");
    setUpdateErrorMessage("");
    setIsSelectingTeam(false);
    setIsEditing(false);
  };

  const handleCompleteEditing =
    async () => {
      const trimmedNickname =
        form.nickname.trim();

      const trimmedUserId =
        form.userId.trim();

      const isUserIdChanged =
        trimmedUserId !== profile.userId;

      if (
        !trimmedNickname ||
        !trimmedUserId ||
        (isUserIdChanged &&
          userIdStatus !== "success")
      ) {
        return;
      }

      try {
        setIsUpdating(true);
        setUpdateErrorMessage("");

        let updatedProfile =
          await updateMyProfile({
            username: trimmedUserId,
            nickname: trimmedNickname,
          });

        /*
         * PUT /api/mypage/profile-image는
         * 이미지 파일이 아닌 이미지 URL을 받는 API입니다.
         *
         * 현재 file input으로 선택한 파일은 blob: URL만 생성되므로
         * 서버에 저장할 수 없습니다.
         *
         * 별도의 이미지 업로드 API가 연결된 이후
         * 해당 API에서 반환받은 URL을 아래
         * updateProfileImage(imageUrl)에 전달하면 됩니다.
         */
        if (selectedProfileImageFile) {
          setUpdateErrorMessage(
            "이미지 파일 업로드 API 연동이 필요합니다.",
          );

          return;
        }

        const isProfileImageChanged =
          form.profileImage !==
          profile.profileImage;

        if (
          isProfileImageChanged &&
          !form.profileImage.startsWith("blob:")
        ) {
          updatedProfile =
            await updateProfileImage(
              form.profileImage ===
                defaultProfileIcon
                ? null
                : form.profileImage,
            );
        }

        const profileData: ProfileForm = {
          nickname:
            updatedProfile.nickname,
          userId:
            updatedProfile.username,
          email:
            updatedProfile.email,
          favoriteTeam:
            (updatedProfile.favoriteTeam
              ?.name as TeamName) ??
            profile.favoriteTeam,
          profileImage:
            updatedProfile.profileImageUrl ||
            profile.profileImage ||
            defaultProfileIcon,
        };

        clearPreviewImage();

        setProfile(profileData);
        setForm(profileData);
        setSelectedProfileImageFile(null);

        setUserIdStatus("idle");
        setIsSelectingTeam(false);
        setIsEditing(false);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "프로필 수정에 실패했습니다.";

        setUpdateErrorMessage(message);

        console.error(
          "프로필 수정 중 오류가 발생했습니다.",
          error,
        );
      } finally {
        setIsUpdating(false);
      }
    };

  const handleProfileImageChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const imageFile =
      event.target.files?.[0];

    if (!imageFile) {
      return;
    }

    clearPreviewImage();

    const imageUrl =
      URL.createObjectURL(imageFile);

    previewImageUrlRef.current =
      imageUrl;

    setSelectedProfileImageFile(
      imageFile,
    );

    setForm((previous) => ({
      ...previous,
      profileImage: imageUrl,
    }));

    event.target.value = "";
  };

  const handleSelectTeam = (
    teamName: TeamName,
  ) => {
    setForm((previous) => ({
      ...previous,
      favoriteTeam: teamName,
    }));
  };

  const isUserIdChanged =
    form.userId.trim() !==
    profile.userId;

  const idMessage =
    !isUserIdChanged
      ? undefined
      : userIdStatus === "error"
        ? "사용할 수 없는 아이디입니다."
        : userIdStatus === "success"
          ? "사용 가능한 아이디입니다."
          : undefined;

  if (isLoading) {
    return (
      <div className="flex min-h-dvh w-full items-center justify-center bg-[#F1F2F1]">
        <p className="text-label-3 text-text-secondary">
          프로필을 불러오는 중입니다.
        </p>
      </div>
    );
  }

  if (isSelectingTeam) {
    return (
      <div className="min-h-dvh w-full bg-[#F1F2F1] pb-[110px]">
        <div className="bg-[#F1F2F1] pt-[45px]">
          <PageHeader
            title="프로필 수정"
            onBack={() =>
              setIsSelectingTeam(false)
            }
          />
        </div>

        <main className="px-[20px] pt-[16px]">
          <section className="rounded-[31px] bg-bg-primary pb-[24px] pt-[76px]">
            <div className="rounded-[35px] bg-surface-secondary px-[16px] py-[12px]">
              {KBO_TEAMS.map(
                (team) => {
                  const isSelected =
                    form.favoriteTeam ===
                    team.name;

                  return (
                    <button
                      key={team.name}
                      type="button"
                      onClick={() =>
                        handleSelectTeam(
                          team.name,
                        )
                      }
                      className={[
                        "flex h-[64px] w-full items-center rounded-[32px]",
                        "px-[18px] text-left text-label-1 text-black",
                        isSelected
                          ? "bg-bg-primary"
                          : "",
                      ].join(" ")}
                    >
                      <TeamMascot
                        team={team}
                        containerSize={
                          52
                        }
                        className="mr-[16px]"
                        decorative
                      />

                      <span>
                        {team.name}
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
              setIsSelectingTeam(false)
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
    isEditing ? form : profile;

  const isCompleteDisabled =
    isUpdating ||
    !form.nickname.trim() ||
    !form.userId.trim() ||
    (isUserIdChanged &&
      userIdStatus !== "success");

  return (
    <div className="min-h-dvh w-full bg-[#F1F2F1] pb-[110px]">
      <div className="bg-[#F1F2F1] pt-[45px]">
        <PageHeader
          title={
            isEditing
              ? "프로필 수정"
              : "마이페이지"
          }
          rightText={
            isEditing ? "" : "수정"
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
                    displayedProfile.profileImage
                  }
                  alt={`${displayedProfile.nickname} 프로필`}
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
                    aria-label="프로필 사진 변경"
                    className="absolute bottom-[3px] right-[3px] flex size-[28px] items-center justify-center rounded-full bg-text-secondary"
                  >
                    <img
                      src={cameraIcon}
                      alt=""
                      aria-hidden="true"
                      className="h-[13px] w-[15px]"
                    />
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={
                      handleProfileImageChange
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
                value={form.nickname}
                onChange={(nickname) =>
                  setForm(
                    (previous) => ({
                      ...previous,
                      nickname,
                    }),
                  )
                }
              />

              <ProfileInput
                label="아이디"
                value={form.userId}
                message={idMessage}
                messageType={
                  userIdStatus ===
                  "success"
                    ? "success"
                    : "error"
                }
                onChange={(userId) =>
                  setForm(
                    (previous) => ({
                      ...previous,
                      userId,
                    }),
                  )
                }
              />

              <ProfileInput
                label="이메일"
                value={form.email}
                disabled
              />

              <button
                type="button"
                onClick={() =>
                  setIsSelectingTeam(true)
                }
                className="w-full border-b-[1.5px] border-surface-secondary pt-[16px] text-left"
              >
                <p className="text-label-3 text-black">
                  응원 팀
                </p>

                <div className="mt-[18px] flex items-center justify-between px-[10px] pb-[6px]">
                  <span className="text-label-3 font-medium leading-none text-text-secondary">
                    {
                      form.favoriteTeam
                    }
                  </span>

                  <span
                    aria-hidden="true"
                    className="size-[9px] rotate-45 border-r-2 border-t-2 border-text-secondary"
                  />
                </div>
              </button>

              {updateErrorMessage && (
                <p className="mt-[16px] text-center text-caption text-danger">
                  {updateErrorMessage}
                </p>
              )}
            </>
          ) : (
            <>
              <ProfileItem
                label="닉네임"
                value={profile.nickname}
              />

              <ProfileItem
                label="아이디"
                value={profile.userId}
              />

              <ProfileItem
                label="이메일"
                value={profile.email}
              />

              <ProfileItem
                label="응원 팀"
                value={
                  profile.favoriteTeam
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
            </div>
          </section>
        )}
      </main>

      <BottomBar />
    </div>
  );
}