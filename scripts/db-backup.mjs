// Copies the database to backups/app-YYYY-MM-DDTHH-MM.db using SQLite's online backup
// (safe while the server is running). Schedule it with cron for nightly backups.
import fs from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'
import { ROOT, databaseFile } from './env.mjs'
const dir = process.env.BACKUP_DIR || path.join(ROOT, 'backups')
fs.mkdirSync(dir, { recursive: true })
const target = path.join(dir, `app-${new Date().toISOString().slice(0, 16).replace(/:/g, '-')}.db`)
const db = new Database(databaseFile(), { readonly: true })
await db.backup(target)
db.close()
console.log(`Backup written: ${target}`)
