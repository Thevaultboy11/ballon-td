// Creates or updates the database tables so they match prisma/schema.prisma.
// Same as `prisma db push`, but uses Prisma's WebAssembly schema engine, so it needs no
// download and works offline (e.g. on a server inside a VPN with no internet).
import fs from 'node:fs'
import path from 'node:path'
import { SchemaEngine } from '@prisma/schema-engine-wasm'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { bindMigrationAwareSqlAdapterFactory } from '@prisma/driver-adapter-utils'
import { ROOT, databaseFile } from './env.mjs'

process.removeAllListeners('warning') // hide "Importing WebAssembly module instances is experimental"
const force = process.argv.includes('--force')
const file = databaseFile()
fs.mkdirSync(path.dirname(file), { recursive: true })

const schemaPath = path.join(ROOT, 'prisma', 'schema.prisma')
const content = fs.readFileSync(schemaPath, 'utf8')
const files = [{ path: schemaPath, content }]
const adapter = bindMigrationAwareSqlAdapterFactory(new PrismaBetterSqlite3({ url: `file:${file}` }))
const engine = await SchemaEngine.new({ datamodels: [[schemaPath, content]] }, () => {}, adapter)
const filters = { externalTables: [], externalEnums: [] }

const result = await engine.schemaPush({ force, schema: { files }, filters })
if (result.unexecutable.length) {
  console.error('These changes cannot be applied to the existing data:\n - ' + result.unexecutable.join('\n - '))
  process.exit(1)
}
if (result.warnings.length && !force) {
  console.error('These changes would lose data:\n - ' + result.warnings.join('\n - ') +
    '\nBack up first (npm run db:backup), then run: npm run db:push -- --force')
  process.exit(1)
}
console.log(result.executedSteps ? `Database updated (${result.executedSteps} change${result.executedSteps === 1 ? '' : 's'}): ${file}` : `Database already up to date: ${file}`)
