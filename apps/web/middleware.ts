import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const COOKIE_NAME = "incidentlens_session";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return redirectToLogin(request);
  const serviceToken = process.env.BACKEND_API_TOKEN;
  if (!serviceToken) return redirectToLogin(request);
  try {
    const response = await fetch(`${API_URL}/api/auth/session`, {
      headers: { Authorization: `Bearer ${serviceToken}`, "X-IncidentLens-Session": token },
      cache: "no-store",
    });
    if (response.ok) return NextResponse.next();
  } catch {
    return redirectToLogin(request);
  }
  return redirectToLogin(request);
}

function redirectToLogin(request: NextRequest) {
  const target = new URL("/login", request.url);
  target.searchParams.set("next", request.nextUrl.pathname);
  const response = NextResponse.redirect(target);
  response.cookies.delete(COOKIE_NAME);
  return response;
}

export const config = { matcher: ["/dashboard/:path*", "/incidents/:path*", "/evidence/:path*", "/evals/:path*", "/settings/:path*"] };
