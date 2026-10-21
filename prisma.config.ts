// Used by the Prisma CLI (generate, studio). The app itself reads DATABASE_URL in server/db.ts.
import { defineConfig } from 'prisma/config'
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: { url: process.env.DATABASE_URL || 'file:./data/app.db' },
})
