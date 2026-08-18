import crypto from 'node:crypto';

export async function hashPassword(password: string): Promise<string> {
  return crypto.createHash('sha256').update(password).digest('hex');
}
