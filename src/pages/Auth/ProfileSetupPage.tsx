import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { PageHeader } from "../../app/layouts/PageHeader";
import { ProfileComplete } from "../../features/auth/components/ProfileComplete";
import { ProfileId } from "../../features/auth/components/ProfileId";
import { ProfileNickname } from "../../features/auth/components/ProfileNickname";
import { ProfileTeam } from "../../features/auth/components/ProfileTeam";
import { KeyboardFixedScreen } from "../../shared/ui/KeyboardFixedScreen";

type ProfileSetupStep = 1 | 2 | 3 | 4;

export function ProfileSetupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<ProfileSetupStep>(1);
  const [username, setUsername] = useState("");
  const [nickname, setNickname] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState("");

  const completeProfileSetup = () => {
    navigate("/home", { replace: true });
  };

  return (
    <KeyboardFixedScreen className="pt-[28.5px]">
      <PageHeader />

      <main data-step={step}>
        {step === 1 && (
          <ProfileId
            value={username}
            onChange={setUsername}
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <ProfileNickname
            value={nickname}
            onChange={setNickname}
            onNext={() => setStep(3)}
          />
        )}

        {step === 3 && (
          <ProfileTeam
            selectedTeamId={selectedTeamId}
            onSelectTeam={setSelectedTeamId}
            onNext={() => setStep(4)}
          />
        )}

        {step === 4 && <ProfileComplete onNext={completeProfileSetup} />}
      </main>
    </KeyboardFixedScreen>
  );
}
