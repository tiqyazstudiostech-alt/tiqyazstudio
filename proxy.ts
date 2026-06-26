import { auth } from "@/lib/auth";
import { type NextFetchEvent, type NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  const result = await (
    auth as unknown as (req: NextRequest, ev: NextFetchEvent) => Promise<Response | undefined>
  )(request, event);

  // Auth blocked or redirected — pass through unchanged
  if (result && result.status !== 200) return result;

  // Forward pathname in request headers so Server Component layouts can detect it
  const forwarded = NextResponse.next({
    request: {
      headers: new Headers([
        ...Array.from(request.headers.entries()),
        ["x-pathname", request.nextUrl.pathname],
      ]),
    },
  });

  // Carry over any auth cookies (e.g. session token refresh)
  result?.headers.forEach((val, key) => {
    if (key.toLowerCase() === "set-cookie") forwarded.headers.append("set-cookie", val);
  });

  return forwarded;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon\\.ico).*)"],
};
