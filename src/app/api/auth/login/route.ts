import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sameOrigin } from "@/lib/auth";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "來源不符" }, { status: 403 });
  const db = getSupabaseAdmin();
  const email = process.env.ADMIN_EMAIL;
  if (!db || !email) return NextResponse.json({ error: "尚未設定 Supabase 與管理者帳號" }, { status: 503 });
  const form = await request.formData();
  const password = form.get("password");
  if (typeof password !== "string" || password.length > 200) return NextResponse.json({ error: "登入失敗" }, { status: 400 });
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error || !data.session) return NextResponse.redirect(new URL("/login?error=1", request.url), 303);
  const response = NextResponse.redirect(new URL("/", request.url), 303);
  response.cookies.set("radar_access", data.session.access_token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: data.session.expires_in });
  return response;
}
