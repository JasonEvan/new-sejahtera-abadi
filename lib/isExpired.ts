export function isExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt
}
