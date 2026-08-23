import { PageHeader } from "../../app/layouts/PageHeader";
import { ProfileComplete } from "../../features/auth/components/ProfileComplete";
import { ProfileId } from "../../features/auth/components/ProfileId";
import { ProfileNickname } from "../../features/auth/components/ProfileNickname";
import { ProfileTeam } from "../../features/auth/components/ProfileTeam";
import { useProfileSetup } from "../../features/auth/hooks/useProfileSetup";
import { KeyboardFixedScreen } from "../../shared/ui/KeyboardFixedScreen";

export function ProfileSetupPage() {
  const profileSetup = useProfileSetup();

  return (
    <KeyboardFixedScreen className="pt-[28.5px]">
      <PageHeader />

      <main data-step={profileSetup.step}>
        {profileSetup.step === 1 && (
          <ProfileId {...profileSetup.usernameStepProps} />
        )}

        {profileSetup.step === 2 && (
          <ProfileNickname {...profileSetup.nicknameStepProps} />
        )}

        {profileSetup.step === 3 && (
          <ProfileTeam {...profileSetup.teamStepProps} />
        )}

        {profileSetup.step === 4 && (
          <ProfileComplete onNext={profileSetup.completeProfileSetup} />
        )}
      </main>
    </KeyboardFixedScreen>
  );
}
