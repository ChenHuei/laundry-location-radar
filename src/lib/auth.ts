import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "./supabase";

export async function isOwner() {
  const db = getSupabaseAdmin();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!db || !email) return false;
  const token = (await cookies()).get("radar_access")?.value;
  if (!token) return false;
  const { data, error } = await db.auth.getUser(token);
  return !error && data.user?.email?.toLowerCase() === email;
}
export async function requirePrivateRead() {
  if (getSupabaseAdmin() && !await isOwner()) redirect("/login");
}
export function sameOrigin(request: Request) {
  return request.headers.get("origin") === new URL(request.url).origin;
}
