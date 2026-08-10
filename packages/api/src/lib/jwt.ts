import { SignJWT, jwtVerify } from 'jose';

export interface JwtPayload {
  uid: number;
  role: 'user' | 'technician';
}

export async function signToken(
  secret: string,
  payload: JwtPayload,
  expiresIn = '7d',
): Promise<string> {
  return new SignJWT({ uid: payload.uid, role: payload.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(new TextEncoder().encode(secret));
}

export async function verifyToken(secret: string, token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    const uid = payload.uid as number;
    const role = payload.role as 'user' | 'technician';
    if (typeof uid !== 'number' || (role !== 'user' && role !== 'technician')) return null;
    return { uid, role };
  } catch {
    return null;
  }
}
