import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";
import { User } from "@/modules/user/user.types";

import { userRepository } from "@/modules/user/user.repository";
import { requireJwtSecret } from "./jwt-secret";

let signingKey: { secret: string; bytes: Uint8Array } | undefined;

function getSigningKey() {
  const secret = requireJwtSecret();
  if (signingKey?.secret !== secret) {
    signingKey = { secret, bytes: new TextEncoder().encode(secret) };
  }
  return signingKey.bytes;
}

export async function encrypt(payload: JWTPayload) {
  const key = getSigningKey();
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("3h")
    .sign(key);
}

export async function decrypt(input: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(input, getSigningKey(), {
    algorithms: ["HS256"],
  });
  return payload;
}

export async function login(payload: JWTPayload) {
  // Create the session
  const session = await encrypt(payload);

  // Save the session in a cookie
  (await cookies()).set("session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 3 * 60 * 60, // 3 hours
    path: "/",
    sameSite: "lax",
  });
}

export async function logout() {
  // Destroy the session
  (await cookies()).set("session", "", { expires: new Date(0) });
}

export async function getSession(): Promise<User | null> {
  const session = (await cookies()).get("session")?.value;
  if (!session) return null;

  try {
    const decoded = (await decrypt(session)) as any;
    const userId = decoded.id || decoded.userId;
    if (!userId) return null;

    // Fetch fresh user data from DB to ensure permissions are up to date
    const user = await userRepository.getUserById(Number(userId));
    return user as User | null;
  } catch (error) {
    console.error("Session decryption failed:", error);
    return null;
  }
}
