// Shared by the scripts and the server: where the SQLite file lives.
// Override with DATABASE_URL in .env, e.g. DATABASE_URL="file:/srv/ballon-td/app.db"
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function loadDotEnv() {
  const file = path.join(ROOT, '.env')
  if (!fs.existsSync(file)) return
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/)
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2]
  }
}
loadDotEnv()

export const DATABASE_URL = process.env.DATABASE_URL || 'file:./data/app.db'

/** Absolute path of the SQLite file (relative paths are resolved from the repo root). */
export function databaseFile() {
  const p = DATABASE_URL.replace(/^file:/, '')
  return path.isAbsolute(p) ? p : path.join(ROOT, p)
}
