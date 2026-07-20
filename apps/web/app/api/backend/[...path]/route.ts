import type { NextRequest } from "next/server";

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const token = process.env.BACKEND_API_TOKEN;
  if (!token) {
    return Response.json({ detail: "Backend authentication is not configured" }, { status: 503 });
  }
  const sessionToken = request.cookies.get("incidentlens_session")?.value;
  if (!sessionToken) return Response.json({ detail: "Operator session required" }, { status: 401 });
  const sessionCheck = await fetch(`${API_URL}/api/auth/session`, {
    headers: { authorization: `Bearer ${token}`, "x-incidentlens-session": sessionToken },
    cache: "no-store",
  });
  if (!sessionCheck.ok) return Response.json({ detail: "Operator session is invalid or expired" }, { status: 401 });

  const { path } = await context.params;
  const target = new URL(`/${path.join("/")}`, API_URL);
  target.search = request.nextUrl.search;
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  const accept = request.headers.get("accept");
  if (accept) headers.set("accept", accept);
  headers.set("authorization", `Bearer ${token}`);

  const response = await fetch(target, {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
    cache: "no-store",
  });
  const responseHeaders = new Headers();
  for (const header of ["content-type", "content-disposition", "content-length"]) {
    const value = response.headers.get(header);
    if (value) responseHeaders.set(header, value);
  }
  return new Response(response.body, { status: response.status, headers: responseHeaders });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
