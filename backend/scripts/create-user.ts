/**
 * Creates a CMS user in the MySQL users table, or updates an existing one.
 *
 *   npm run db:create-user -- --email you@example.com --name "Your Name" --role admin
 *
 * Roles: admin, editor, author. The password is read from the terminal (or
 * stdin) rather than argv so it does not end up in shell history. Run
 * `npm run db:migrate` first.
 */
import readline from 'node:readline';
import { parseArgs } from 'node:util';
import mysql from 'mysql2/promise';
import { env } from '../src/config/env.js';
import { hashPassword } from '../src/modules/auth/password.js';

const ROLES = ['admin', 'editor', 'author'];

async function readPassword(): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stderr, terminal: process.stdin.isTTY });
  if (process.stdin.isTTY) {
    // Hide typed characters.
    (rl as any)._writeToOutput = (s: string) => {
      if (s.includes('Password')) process.stderr.write(s);
    };
  }
  const answer = await new Promise<string>((resolve) => rl.question('Password: ', resolve));
  rl.close();
  if (process.stdin.isTTY) process.stderr.write('\n');
  return answer;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

const { values } = parseArgs({
  options: {
    email: { type: 'string' },
    name: { type: 'string' },
    role: { type: 'string', default: 'author' }
  }
});

const email = String(values.email || '').trim().toLowerCase();
const name = String(values.name || '').trim();
const role = String(values.role || '').trim().toLowerCase();

if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) fail('Give a valid --email.');
if (!name) fail('Give the person\'s --name.');
if (!ROLES.includes(role)) fail(`--role must be one of: ${ROLES.join(', ')}.`);

const password = await readPassword();
if (password.length < 12) fail('Use a password of at least 12 characters.');
const passwordHash = await hashPassword(password);

const cx = await mysql.createConnection({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME
});

try {
  await cx.beginTransaction();
  const [existing] = await cx.execute<mysql.RowDataPacket[]>('SELECT id FROM users WHERE email = ?', [email]);
  let userId: number;
  if (existing.length) {
    userId = Number(existing[0].id);
    await cx.execute(
      'UPDATE users SET full_name = ?, role = ?, password_hash = ?, is_active = 1 WHERE id = ?',
      [name, role, passwordHash, userId]
    );
  } else {
    const [result] = await cx.execute<mysql.ResultSetHeader>(
      'INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
      [email, passwordHash, name, role]
    );
    userId = result.insertId;
  }

  // Every CMS user gets a byline for the articles they write.
  const [profile] = await cx.execute<mysql.RowDataPacket[]>('SELECT id FROM authors WHERE user_id = ?', [userId]);
  if (!profile.length) {
    const base = slugify(name) || `user-${userId}`;
    const [taken] = await cx.execute<mysql.RowDataPacket[]>('SELECT id FROM authors WHERE slug = ?', [base]);
    await cx.execute(
      'INSERT INTO authors (user_id, slug, display_name, email_public) VALUES (?, ?, ?, ?)',
      [userId, taken.length ? `${base}-${userId}` : base, name, email]
    );
  }
  await cx.commit();
  console.log(`${existing.length ? 'Updated' : 'Created'} ${role} ${email} (user ${userId}).`);
} catch (err) {
  await cx.rollback();
  fail(err instanceof Error ? err.message : String(err));
} finally {
  await cx.end();
}
