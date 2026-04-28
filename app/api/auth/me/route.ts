import { withErrorHandler } from "@/lib/withErrorHandler";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export const GET = withErrorHandler(async () => {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true, user: session });
});
