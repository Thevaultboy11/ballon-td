// Generates the Prisma client into server/generated/prisma.
// `prisma generate` does not need Prisma's native schema engine, but the CLI tries to
// download it anyway. Pointing PRISMA_SCHEMA_ENGINE_BINARY at an existing file stops the
// download, so this works on a server without internet access.
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { ROOT } from './env.mjs'

const env = { ...process.env }
if (!env.PRISMA_SCHEMA_ENGINE_BINARY) env.PRISMA_SCHEMA_ENGINE_BINARY = fileURLToPath(import.meta.url)
const r = spawnSync('npx', ['prisma', 'generate'], { cwd: ROOT, env, stdio: 'inherit', shell: process.platform === 'win32' })
process.exit(r.status ?? 1)
