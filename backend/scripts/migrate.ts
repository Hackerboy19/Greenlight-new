import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import mysql from 'mysql2/promise';
import { env } from '../src/config/env.js';

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), '../migrations');

/**
 * A dedicated connection with multipleStatements enabled: each migration file
 * holds several DDL statements and must run as one unit. The app pool never
 * gets this flag — it widens the blast radius of any injection bug.
 */
async function connect() {
  return mysql.createConnection({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    multipleStatements: true,
  });
}

async function ensureLedger(cx: mysql.Connection) {
  await cx.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name       VARCHAR(191) NOT NULL,
      checksum   CHAR(64)     NOT NULL,
      applied_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (name)
    ) ENGINE=InnoDB
  `);
}

async function applied(cx: mysql.Connection) {
  const [rows] = await cx.query<mysql.RowDataPacket[]>(
    'SELECT name, checksum FROM schema_migrations',
  );
  return new Map(rows.map((r) => [String(r.name), String(r.checksum)]));
}

async function up() {
  const cx = await connect();
  try {
    await ensureLedger(cx);
    const done = await applied(cx);
    const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort();

    for (const file of files) {
      const sql = await readFile(join(MIGRATIONS_DIR, file), 'utf8');
      const checksum = createHash('sha256').update(sql).digest('hex');
      const previous = done.get(file);

      if (previous) {
        // An edited migration means the DB and the repo disagree about what
        // shipped. Silently skipping would hide a schema drift bug for months.
        if (previous !== checksum) {
          throw new Error(
            `Migration ${file} was already applied but its contents changed. ` +
              `Write a new migration instead of editing an applied one.`,
          );
        }
        console.log(`  skip  ${file}`);
        continue;
      }

      console.log(`  apply ${file}`);
      // DDL in MySQL is not transactional: a failure part-way leaves the
      // earlier statements in place. The ledger row is written only on full
      // success, so a retry re-runs the file — keep each file idempotent-safe
      // by fixing forward, never by hand-patching the ledger.
      await cx.query(sql);
      await cx.execute('INSERT INTO schema_migrations (name, checksum) VALUES (?, ?)', [
        file,
        checksum,
      ]);
    }
    console.log('migrations up to date');
  } finally {
    await cx.end();
  }
}

async function status() {
  const cx = await connect();
  try {
    await ensureLedger(cx);
    const done = await applied(cx);
    const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort();
    for (const file of files) {
      console.log(`${done.has(file) ? '[applied]' : '[pending]'} ${file}`);
    }
  } finally {
    await cx.end();
  }
}

const command = process.argv[2] ?? 'up';
const run = command === 'status' ? status : up;

run().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
