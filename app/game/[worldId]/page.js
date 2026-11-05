import { notFound,redirect } from "next/navigation";
import { GameScreen } from "@/components/game/game-screen";
import { getWorldConfig } from "@/game/config/worlds";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { getVerifiedIdentity } from "@/lib/auth/session";
import { getPlayerProgress } from "@/lib/data/player-repository";
export default async function GamePage({params,searchParams}){const{worldId}=await params;const query=await searchParams;const world=getWorldConfig(worldId);if(!world||world.number!==1)notFound();if(query?.mode==="guest")return <GameScreen world={world} mode="guest"/>;if(!hasSupabaseConfig())redirect("/login");const supabase=await createClient();const identity=await getVerifiedIdentity(supabase);if(!identity)redirect("/login");let progress=null;try{progress=await getPlayerProgress(supabase,identity.id);}catch{/* Setup may still be incomplete. */}return <GameScreen world={world} mode="authenticated" alreadyCompleted={(progress?.completed_worlds||0)>=1}/>;}
