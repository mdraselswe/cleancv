import { neon } from '@neondatabase/serverless';
process.loadEnvFile('.env.local');
const sql = neon(process.env.DATABASE_URL);
const cmd = process.argv[2];
if (cmd === 'verify') {
  await sql`update "user" set email_verified = true where email = ${'live-check-delete-me@example.com'}`;
  console.log(await sql`select email, email_verified from "user"`);
} else if (cmd === 'token') {
  const rows = await sql`select identifier, value, expires_at from "verification" order by created_at desc limit 3`;
  console.log(JSON.stringify(rows, null, 1));
} else if (cmd === 'state') {
  console.log('users   :', await sql`select email, email_verified from "user"`);
  console.log('sessions:', (await sql`select count(*)::int n from "session"`)[0].n);
  console.log('accounts:', (await sql`select count(*)::int n from "account"`)[0].n);
} else if (cmd === 'cleanup') {
  await sql`delete from "verification" where identifier like ${'%live-check-delete-me@example.com%'}`;
  await sql`delete from "user" where email like ${'live-check%'}`;
  console.log('users left    :', await sql`select email from "user"`);
  console.log('sessions left :', (await sql`select count(*)::int n from "session"`)[0].n);
  console.log('accounts left :', (await sql`select count(*)::int n from "account"`)[0].n);
  console.log('verif. left   :', (await sql`select count(*)::int n from "verification"`)[0].n);
}
