import { type NextRequest, NextResponse } from "next/server";

const MOCK_SERVER_URL =
  "https://device-mock-server.aws.ldg-ps-default.ldg-tech.com";

/**
 * Catch-all proxy for the Device Mock Server.
 *
 * Next.js `rewrites` can silently drop POST bodies in some configurations.
 * This route handler gives us full control: method, headers, and body are
 * forwarded verbatim, and the response (including binary blobs like
 * screenshots) is streamed back.
 */
async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  const { path } = await params;
  const target = `${MOCK_SERVER_URL}/${path.join("/")}${req.nextUrl.search}`;

  const headers = new Headers();
  for (const key of ["authorization", "content-type"]) {
    const value = req.headers.get(key);
    if (value) headers.set(key, value);
  }

  let body: ArrayBuffer | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await req.arrayBuffer();
  }

  const upstream = await fetch(target, {
    method: req.method,
    headers,
    body,
  });

  const upstreamBody = await upstream.arrayBuffer();

  return new NextResponse(upstreamBody, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: {
      "content-type":
        upstream.headers.get("content-type") ?? "application/json",
    },
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
