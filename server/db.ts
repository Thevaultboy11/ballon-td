import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from './generated/prisma/client.ts'
import { DATABASE_URL, databaseFile } from '../scripts/env.mjs'

export const dbFile = databaseFile()
const adapter = new PrismaBetterSqlite3({ url: `file:${dbFile}` })
export const prisma = new PrismaClient({ adapter })

/** WAL lets several people read while one writes; foreign keys enforce the links. */
export async function prepareDatabase() {
  await prisma.$queryRawUnsafe('PRAGMA journal_mode = WAL')
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON')
  await prisma.$executeRawUnsafe('PRAGMA busy_timeout = 5000')
}

export { DATABASE_URL }
// The delegates are looked up by name from the shared entity list.
export const delegate = (model: string): any => (prisma as any)[model]
