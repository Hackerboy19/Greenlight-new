import { randomBytes } from 'node:crypto';
import { pool } from '../src/config/database.js';
import { hashPassword } from '../src/modules/auth/auth.service.js';
import { slugify } from '../src/lib/slugify.js';

const CATEGORIES = [
  { name: 'Top Stories', sortOrder: 10, icon: 'newspaper', colorHex: '#1a73e8' },
  { name: 'India', sortOrder: 20, icon: 'map-pin', colorHex: '#188038' },
  { name: 'World', sortOrder: 30, icon: 'globe', colorHex: '#1967d2' },
  { name: 'Business', sortOrder: 40, icon: 'trending-up', colorHex: '#b06000' },
  { name: 'Technology', sortOrder: 50, icon: 'cpu', colorHex: '#8430ce' },
  { name: 'Sports', sortOrder: 60, icon: 'trophy', colorHex: '#c5221f' },
  { name: 'Health', sortOrder: 70, icon: 'heart-pulse', colorHex: '#137333' },
];

async function seed() {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@fsia.in';
  const fullName = process.env.SEED_ADMIN_NAME ?? 'Site Admin';

  // No default password in source. If none is supplied, generate one and print
  // it exactly once — a committed default is a permanent open door.
  const generated = !process.env.SEED_ADMIN_PASSWORD;
  const password = process.env.SEED_ADMIN_PASSWORD ?? randomBytes(18).toString('base64url');

  const [existing] = await pool.query<any[]>('SELECT id FROM users WHERE email = ? LIMIT 1', [
    email,
  ]);

  let userId: number;
  if (existing.length > 0) {
    userId = Number(existing[0].id);
    console.log(`admin already exists (id ${userId}) — password unchanged`);
  } else {
    const [res] = await pool.execute<any>(
      'INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
      [email, await hashPassword(password), fullName, 'admin'],
    );
    userId = res.insertId;
    console.log(`created admin ${email}`);
    if (generated) {
      console.log('\n  ONE-TIME PASSWORD (not stored anywhere else):');
      console.log(`  ${password}\n  Change it after first login.\n`);
    }
  }

  await pool.execute(
    `INSERT INTO authors (user_id, slug, display_name, job_title, bio)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE display_name = VALUES(display_name)`,
    [userId, slugify(fullName), fullName, 'Editor in Chief', 'Founding editor.'],
  );

  for (const c of CATEGORIES) {
    await pool.execute(
      `INSERT INTO categories (slug, name, sort_order, icon, color_hex)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), sort_order = VALUES(sort_order)`,
      [slugify(c.name), c.name, c.sortOrder, c.icon, c.colorHex],
    );
  }
  console.log(`seeded ${CATEGORIES.length} categories`);

  const propertyUri = process.env.GSC_PROPERTY_URI;
  if (propertyUri) {
    await pool.execute(
      `INSERT INTO gsc_properties (property_uri, property_type, display_name, primary_host)
       VALUES (?, 'domain', ?, ?)
       ON DUPLICATE KEY UPDATE primary_host = VALUES(primary_host)`,
      [propertyUri, 'Greenlight', process.env.GSC_PRIMARY_HOST ?? 'greenlight.fsia.in'],
    );
    console.log(`registered GSC property ${propertyUri}`);
  }

  await pool.end();
}

seed().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
