import { defineConfig } from 'drizzle-kit'

const databaseUrl = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/stylora'

export default defineConfig({
  out: './drizzle',
  schema: './src/*schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
  strict: true,
  verbose: true,
})
