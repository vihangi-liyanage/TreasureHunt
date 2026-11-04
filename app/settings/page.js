import { AuthFormShell } from "@/components/auth/auth-form-shell";
import { SettingsPanel } from "@/components/settings/settings-panel";

export default function SettingsPage() {
  return <AuthFormShell eyebrow="Expedition options" title="Settings" description="Tune the presentation for your journey. These local preview controls do not save yet."><SettingsPanel /></AuthFormShell>;
}
