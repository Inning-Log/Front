import { PageHeader } from "../../app/layouts/PageHeader";
import { ProfileComplete } from "../../features/auth/components/ProfileComplete";
import { ProfileId } from "../../features/auth/components/ProfileId";
import { ProfileNickname } from "../../features/auth/components/ProfileNickname";
import { ProfileSetupStatus } from "../../features/auth/components/ProfileSetupStatus";
import { ProfileTeam } from "../../features/auth/components/ProfileTeam";
import { useProfileSetup } from "../../features/auth/hooks/useProfileSetup";
import { KeyboardFixedScreen } from "../../shared/ui/KeyboardFixedScreen";

export function ProfileSetupPage() {
  const profileSetup = useProfileSetup();
  const canRenderStep =
    !profileSetup.isSyncingStatus &&
    profileSetup.statusFeedbackMessage.length === 0;

  return (
    <KeyboardFixedScreen className="pt-[28.5px]">
      <PageHeader />

      <main data-step={profileSetup.step}>
        {profileSetup.isSyncingStatus && (
          <ProfileSetupStatus message="프로필 설정 정보를 불러오는 중..." />
        )}

        {!profileSetup.isSyncingStatus &&
          profileSetup.statusFeedbackMessage && (
            <ProfileSetupStatus
              message={profileSetup.statusFeedbackMessage}
              actionLabel="다시 시도"
              onAction={profileSetup.syncOnboardingStatus}
            />
          )}

        {canRenderStep && profileSetup.step === 1 && (
          <ProfileId {...profileSetup.usernameStepProps} />
        )}

        {canRenderStep && profileSetup.step === 2 && (
          <ProfileNickname {...profileSetup.nicknameStepProps} />
        )}

        {canRenderStep && profileSetup.step === 3 && (
          <ProfileTeam {...profileSetup.teamStepProps} />
        )}

        {canRenderStep && profileSetup.step === 4 && (
          <ProfileComplete onNext={profileSetup.completeProfileSetup} />
        )}
      </main>
    </KeyboardFixedScreen>
  );
}
