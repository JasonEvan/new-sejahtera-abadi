export function requireJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret?.trim()) {
    throw new Error("JWT_SECRET must be set and must not be blank.");
  }
  return secret;
}
