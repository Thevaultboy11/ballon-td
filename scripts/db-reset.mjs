// Deletes the database file (after keeping a backup copy next to it).
import fs from 'node:fs'
import { databaseFile } from './env.mjs'
const file = databaseFile()
if (fs.existsSync(file)) {
  const backup = `${file}.${new Date().toISOString().replace(/[:.]/g, '-')}.bak`
  fs.copyFileSync(file, backup)
  for (const f of [file, `${file}-wal`, `${file}-shm`]) if (fs.existsSync(f)) fs.rmSync(f)
  console.log(`Deleted ${file} (backup kept at ${backup})`)
}
