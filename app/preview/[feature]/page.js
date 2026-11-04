import { Construction } from "lucide-react";
import { AdventureShell } from "@/components/ui/adventure-shell";
import { SiteHeader } from "@/components/layout/site-header";
import { PreviewBadge } from "@/components/ui/preview-badge";
import { requireDevelopmentPreview } from "@/lib/ui/preview";

const supported = {
  leaderboard: { title: "Leaderboard", message: "Rankings will appear after completed runs can be verified and stored in Supabase." },
  profile: { title: "Explorer profile", message: "Identity, achievements, and progress will connect to the authenticated user in Phase 2." },
};

export default async function PreviewFeaturePage({ params }) {
  requireDevelopmentPreview();
  const { feature } = await params;
  const details = supported[feature] || { title: "Coming soon", message: "This feature is planned for a later phase." };
  return <AdventureShell><SiteHeader backHref="/menu" backLabel="Main menu" /><section className="relative z-10 mx-auto flex max-w-4xl px-5 py-12 sm:px-8"><div className="glass-panel w-full rounded-[1.7rem] p-7 text-center sm:p-12"><PreviewBadge /><Construction className="mx-auto mt-8 text-amber-300" size={42} /><h1 className="font-display mt-5 text-5xl">{details.title}</h1><p className="mx-auto mt-4 max-w-xl leading-7 text-stone-200/65">{details.message}</p></div></section></AdventureShell>;
}
