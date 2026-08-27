import { defineConfig } from 'drizzle-kit';

/*
 * Next loads `.env.local`; drizzle-kit is not Next and loads nothing. Node's
 * own loader covers the gap without a dependency, and stays quiet when the file
 * is absent — on a machine where `DATABASE_URL` is already exported, there is
 * nothing to load.
 */
for (const file of ['.env.local', '.env']) {
  try {
    process.loadEnvFile(file);
  } catch {
    // Not there, or already set. Either way the next line decides.
  }
}

/**
 * drizzle-kit reads this to diff `src/server/db/schema.ts` against the live
 * database. Only ever run by hand — `npm run db:push` for a dev database,
 * `db:generate` + `db:migrate` for anything with real rows in it.
 */
export default defineConfig({
  schema: './src/server/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
  casing: 'snake_case',
  strict: true,
  verbose: true,
});
