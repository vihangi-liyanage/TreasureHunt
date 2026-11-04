import { WorldMap } from "@/components/worlds/world-map";
import { WORLD_CONFIGS } from "@/game/config/worlds";

export default function WorldsPage() {
  return <WorldMap worlds={WORLD_CONFIGS} />;
}
