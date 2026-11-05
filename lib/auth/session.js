export async function getVerifiedIdentity(supabase) {
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return null;
  return Object.freeze({
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : "",
  });
}
