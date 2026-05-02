import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/auth";
import { randomUUID } from "crypto";
import { withErrorHandler } from "@/lib/withErrorHandler";
import { authRepository } from "@/modules/auth/auth.repository";
import { AppError } from "@/lib/errors";

export const POST = withErrorHandler(async (req: NextRequest) => {
  // Verify the freshly issued session cookie
  const session = req.cookies.get("session")?.value;
  if (!session) {
    throw new AppError("Unauthorized", 401);
  }

  let payload: any;
  try {
    payload = await decrypt(session);
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { deviceFingerprint, deviceLabel } = await req.json();
  const deviceToken = randomUUID();

  await authRepository.addTrustedDevice({
    userId: Number(payload.id || payload.sub),
    deviceFingerprint,
    deviceToken,
    deviceLabel: deviceLabel ?? null,
    lastUsedAt: new Date(),
  });

  // Set device_token as httpOnly cookie (1 year)
  const response = NextResponse.json({ success: true });
  response.cookies.set("device_token", deviceToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: "/",
  });
  return response;
});
