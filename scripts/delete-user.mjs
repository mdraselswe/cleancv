/**
 * Deletes one account, and everything that hangs off it, from the database.
 *
 *   node scripts/delete-user.mjs someone@example.com          # dry run: only counts
 *   node scripts/delete-user.mjs someone@example.com --yes    # actually deletes
 *
 * What goes: the `user` row, which cascades to its sessions, linked accounts
 * (Google / password) and synced CV documents, plus any outstanding
 * verification or reset tokens for that address. Nothing else is touched —
 * not other users, not the rate-limit counters, not anyone's local CVs.
 *
 * It reads DATABASE_URL from `.env.local` (or the environment), prints which
 * database host it is about to act on, and refuses without `--yes`. It also
 * refuses the ADMIN_EMAIL account, so the dashboard owner cannot be removed by
 * a typo.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { neon } from '@neondatabase/serverless';

const args = process.argv.slice(2);
const email = args.find((arg) => !arg.startsWith('--'))?.trim().toLowerCase();
const confirmed = args.includes('--yes');

if (!email || !email.includes('@')) {
  console.error('Usage: node scripts/delete-user.mjs <email> [--yes]');
  process.exit(1);
}

const readEnvFile = () => {
  try {
    return readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
  } catch {
    return '';
  }
};

const fromFile = (name) => {
  const match = new RegExp(`^${name}=(.*)$`, 'm').exec(readEnvFile());

  return match ? match[1].trim().replace(/^["']|["']$/g, '') : '';
};

const setting = (name) => process.env[name] || fromFile(name);

const url = setting('DATABASE_URL');
if (!url) {
  console.error('DATABASE_URL is not set in the environment or .env.local.');
  process.exit(1);
}

if (setting('ADMIN_EMAIL').toLowerCase() === email) {
  console.error(`${email} is the ADMIN_EMAIL account. Refusing to delete it.`);
  process.exit(1);
}

const sql = neon(url);
const host = new URL(url).host;

console.log(`Database: ${host}`);
console.log(`Account:  ${email}`);

const users = await sql`select id, name, email_verified, created_at from "user" where lower(email) = ${email}`;

if (users.length === 0) {
  console.log('No such user. Nothing to do.');
  process.exit(0);
}

if (users.length > 1) {
  console.error(`Expected one user, found ${users.length}. Refusing.`);
  process.exit(1);
}

const [target] = users;
const [sessions] = await sql`select count(*)::int as n from session where user_id = ${target.id}`;
const [accounts] = await sql`select count(*)::int as n from account where user_id = ${target.id}`;
const [documents] = await sql`select count(*)::int as n from cv_document where user_id = ${target.id}`;
const [tokens] = await sql`select count(*)::int as n from verification where lower(identifier) = ${email}`;

console.log('');
console.log(`  name:            ${target.name}`);
console.log(`  email verified:  ${target.email_verified}`);
console.log(`  created:         ${new Date(target.created_at).toISOString()}`);
console.log(`  sessions:        ${sessions.n}`);
console.log(`  linked accounts: ${accounts.n}`);
console.log(`  synced CVs:      ${documents.n}`);
console.log(`  open tokens:     ${tokens.n}`);
console.log('');

if (!confirmed) {
  console.log('Dry run. Nothing was deleted. Add --yes to delete the account above.');
  process.exit(0);
}

await sql`delete from verification where lower(identifier) = ${email}`;
await sql`delete from "user" where id = ${target.id}`;

const [left] = await sql`select count(*)::int as n from "user" where id = ${target.id}`;

console.log(left.n === 0 ? 'Deleted.' : 'Something went wrong: the user row is still there.');
process.exit(left.n === 0 ? 0 : 1);
