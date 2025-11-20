import * as jose from "jose"

const ALG = "HS256"

function getSecret(): Uint8Array {
  const secret = process.env.ADMIN_JWT_SECRET
  if (!secret) {
    throw new Error("ADMIN_JWT_SECRET is not set")
  }
  return new TextEncoder().encode(secret)
}

export async function signAdminJWT(payload: jose.JWTPayload, options?: { expiresIn?: string }) {
  const secret = getSecret()
  const exp = options?.expiresIn ?? "7d"
  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(secret)
}

export async function verifyAdminJWT(token: string): Promise<jose.JWTPayload | null> {
  try {
    const secret = getSecret()
    const { payload } = await jose.jwtVerify(token, secret, { algorithms: [ALG] })
    return payload
  } catch (e) {
    return null
  }
}
