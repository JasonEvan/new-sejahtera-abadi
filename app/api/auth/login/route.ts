import { NextRequest, NextResponse, after } from "next/server";
import bcrypt from "bcrypt";
import { encrypt } from "@/lib/auth";
import { sendApprovalEmail } from "@/lib/sendApprovalEmail";
import { randomUUID } from "crypto";
import { withErrorHandler } from "@/lib/withErrorHandler";
import { userRepository } from "@/modules/user/user.repository";
import { authRepository } from "@/modules/auth/auth.repository";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { email, password, deviceFingerprint, deviceLabel } = await req.json();

  // device_token is httpOnly — read server-side directly from cookie
  const deviceToken = req.cookies.get("device_token")?.value;

  // [1] Validate credentials
  const user = await userRepository.getUserByEmail(email);

  if (!user) {
    return NextResponse.json(
      { message: "Email atau password salah" },
      { status: 401 },
    );
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return NextResponse.json(
      { message: "Email atau password salah" },
      { status: 401 },
    );
  }

  // [2] Check trusted device (fingerprint OR cookie)
  const trusted = await authRepository.getTrustedDevice(
    user.id,
    deviceFingerprint,
    deviceToken,
  );

  if (trusted) {
    await authRepository.updateTrustedDeviceLastUsed(trusted.id);

    const session = await encrypt({
      id: user.id,
      email: user.email,
      role: user.role ?? "unknown",
      permissions: user.permissions,
    });

    const response = NextResponse.json({
      status: "success",
      user: { id: user.id, email: user.email, role: user.role },
    });
    response.cookies.set("session", session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 3, // 3 hours
      path: "/",
    });
    return response;
  }

  // [3] Deduplication — check for existing pending request
  const existingRequest = await authRepository.getPendingLoginRequest(user.id);

  if (existingRequest) {
    const response = NextResponse.json(
      { status: "pending", requestId: existingRequest.id },
      { status: 202 },
    );

    // Set cookie for automatic redirect from /login page
    response.cookies.set("pending_request_id", String(existingRequest.id), {
      httpOnly: false, // Must be accessible by client-side useEffect
      maxAge: 60 * 60, // 1 hour
      path: "/",
    });

    return response;
  }

  // [4] Create new login_request
  const approvalToken = randomUUID();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // +1 hour

  const newRequest = await authRepository.createLoginRequest({
    userId: user.id,
    deviceFingerprint,
    deviceLabel: deviceLabel ?? null,
    approvalToken,
    status: "pending",
    expiresAt,
  });

  // [5] Notify owner via email
  after(() => {
    sendApprovalEmail({
      approvalToken,
      userName: user.email,
      deviceLabel: deviceLabel ?? "Unknown Device",
    }).catch((error) => console.error("Email error:", error));
  });

  const response = NextResponse.json(
    { status: "pending", requestId: newRequest.id },
    { status: 202 },
  );

  // Set cookie for automatic redirect from /login page
  response.cookies.set("pending_request_id", String(newRequest.id), {
    httpOnly: false, // Must be accessible by client-side useEffect
    maxAge: 60 * 60, // 1 hour
    path: "/",
  });

  return response;
});
