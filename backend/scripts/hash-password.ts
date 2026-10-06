/**
 * Prints a password hash for ADMIN_PASSWORD_HASH or a users.password_hash row.
 *
 *   npx tsx backend/scripts/hash-password.ts
 *
 * The password is read from the terminal (or stdin) rather than argv so it
 * does not end up in shell history.
 */
import readline from 'node:readline';
import { hashPassword } from '../src/modules/auth/auth.service.js';

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

const password = await readPassword();
if (password.length < 12) {
  console.error('Use a password of at least 12 characters.');
  process.exit(1);
}
console.log(await hashPassword(password));
