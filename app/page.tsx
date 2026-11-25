import { RoofwattShell } from "@/components/RoofwattShell";
import { isDemoModeEnabled } from "@/lib/airnodehub";

export default function HomePage() {
  const demoMode = isDemoModeEnabled();
  return <RoofwattShell initialDemoMode={demoMode} />;
}
