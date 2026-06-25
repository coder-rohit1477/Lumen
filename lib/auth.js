import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'

const secret = () => {
  const raw = process.env.JWT_SECRET
  if (raw) return new TextEncoder().encode(raw)
  if (process.env.NODE_ENV !== 'production') {
    return new TextEncoder().encode('dev_secret')
  }
  throw new Error('JWT_SECRET is required in production')
}

export async function hashPassword(pw) {
  return bcrypt.hash(pw, 10)
}
export async function verifyPassword(pw, hash) {
  return bcrypt.compare(pw, hash)
}
export async function signToken(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret())
}
export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, secret())
    return payload
  } catch (_e) {
    return null
  }
}
export async function getUserFromRequest(request) {
  const auth = request.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return null
  return await verifyToken(token)
}
