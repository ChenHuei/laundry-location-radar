import { NextResponse } from "next/server";
import { sameOrigin } from "@/lib/auth";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  const response = NextResponse.redirect(new URL("/login", request.url), 303);
  response.cookies.delete("radar_access");
  return response;
}
