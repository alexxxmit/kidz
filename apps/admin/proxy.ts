import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const challenge = () => new NextResponse("MIRA operations authentication required", {
  status: 401,
  headers: { "www-authenticate": 'Basic realm="MIRA Operations", charset="UTF-8"' },
});

export function proxy(request: NextRequest) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return new NextResponse("MIRA operations access is not configured", { status: 503 });

  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Basic ")) return challenge();
  try {
    const decoded = atob(authorization.slice(6));
    const separator = decoded.indexOf(":");
    const username = decoded.slice(0, separator);
    const password = decoded.slice(separator + 1);
    if (separator > 0 && username === "mira" && password === expected) return NextResponse.next();
  } catch {
    return challenge();
  }
  return challenge();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
