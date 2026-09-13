import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { db } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'taskflow_super_secret_jwt_key_2026';
export const TOKEN_COOKIE_NAME = 'taskflow_session';

export async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

export async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded || !decoded.userId) return null;

  try {
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
      },
    });
    return user;
  } catch (err) {
    return null;
  }
}

export async function requireAuth() {
  const user = await getSession();
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  return user;
}
