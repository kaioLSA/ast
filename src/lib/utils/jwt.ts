import { SignJWT, jwtVerify, type JWTPayload } from 'jose'

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set')
}

const secret = new TextEncoder().encode(process.env.JWT_SECRET)

const ALG = 'HS256'

export interface SessionPayload extends JWTPayload {
  userId: string
}

export interface FpcPayload extends JWTPayload {
  userId: string
  purpose: 'fpc'
}

export async function signSessionToken(userId: string): Promise<string> {
  return new SignJWT({ userId } as SessionPayload)
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    if (typeof (payload as SessionPayload).userId !== 'string') return null
    return payload as SessionPayload
  } catch {
    return null
  }
}

export async function signFpcToken(userId: string): Promise<string> {
  return new SignJWT({ userId, purpose: 'fpc' } as FpcPayload)
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(secret)
}

export async function verifyFpcToken(token: string): Promise<FpcPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    const p = payload as FpcPayload
    if (p.purpose !== 'fpc' || typeof p.userId !== 'string') return null
    return p
  } catch {
    return null
  }
}
