import { NextRequest, NextResponse, after } from "next/server";
import bcrypt from "bcrypt";
import { encrypt } from "@/lib/auth";
import { sendApprovalEmail } from "@/lib/sendApprovalEmail";
import { randomUUID } from "crypto";
import { userRepository } from "@/modules/user/user.repository";
import { authRepository } from "@/modules/auth/auth.repository";
import {
  createLoginReceipt,
  loginReceiptCookie,
  loginRequestLifetimeSeconds,
  withNoStore,
} from "@/modules/auth/login-receipt";

export const POST = withNoStore(async (req: NextRequest) => {
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

  // A fingerprint describes a device but does not prove possession.
  const trusted = deviceToken
    ? await authRepository.getTrustedDevice(user.id, deviceToken)
    : null;

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

  // Create a fresh request for this credential-validated browser.
  const approvalToken = randomUUID();
  const expiresAt = new Date(Date.now() + loginRequestLifetimeSeconds * 1000);

  const newRequest = await authRepository.createLoginRequest({
    userId: user.id,
    deviceFingerprint,
    deviceLabel: deviceLabel ?? null,
    approvalToken,
    status: "pending",
    expiresAt,
  });
  const receipt = await createLoginReceipt(newRequest.id, approvalToken);

  // Notify the owner only after the browser receipt has been signed.
  after(() => {
    return sendApprovalEmail({
      approvalToken,
      userName: user.email,
      deviceLabel: deviceLabel ?? "Unknown Device",
    }).catch((error) => console.error("Email error:", error));
  });

  const response = NextResponse.json(
    { status: "pending", requestId: newRequest.id },
    { status: 202 },
  );

  response.cookies.set(loginReceiptCookie, receipt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: loginRequestLifetimeSeconds,
    path: "/api/auth/login-request",
  });

  return response;
});
