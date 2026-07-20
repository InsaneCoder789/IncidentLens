import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const COOKIE_NAME = "incidentlens_session";

async function backendAuth(path: string, init?: RequestInit) {
  const serviceToken = process.env.BACKEND_API_TOKEN;
  if (!serviceToken) return Response.json({ detail: "Backend authentication is not configured" }, { status: 503 });
  return fetch(`${API_URL}/api/auth/${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceToken}`, ...(init?.headers ?? {}) },
    cache: "no-store",
  });
}

export async function POST(request: NextRequest, context: { params: Promise<{ action: string }> }) {
  const { action } = await context.params;
  if (action === "logout") {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (token) await backendAuth("logout", { method: "POST", headers: { "X-IncidentLens-Session": token } });
    const response = NextResponse.json({ status: "signed_out" });
    response.cookies.delete(COOKIE_NAME);
    return response;
  }
  if (action !== "login" && action !== "signup") return Response.json({ detail: "Unknown authentication action" }, { status: 404 });
  const payload = await request.text();
  const upstream = await backendAuth(action, { method: "POST", body: payload });
  const data = await upstream.json().catch(() => ({ detail: "Authentication service returned an invalid response" }));
  if (!upstream.ok) return NextResponse.json(data, { status: upstream.status });

  const auth = data as { session_token: string; expires_at: string; user: unknown };
  const response = NextResponse.json({ user: auth.user });
  response.cookies.set(COOKIE_NAME, auth.session_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(auth.expires_at),
  });
  return response;
}

export async function GET(request: NextRequest, context: { params: Promise<{ action: string }> }) {
  const { action } = await context.params;
  if (action !== "session") return Response.json({ detail: "Unknown authentication action" }, { status: 404 });
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return Response.json({ detail: "Not authenticated" }, { status: 401 });
  const upstream = await backendAuth("session", { headers: { "X-IncidentLens-Session": token } });
  return new Response(upstream.body, { status: upstream.status, headers: { "Content-Type": "application/json" } });
}
