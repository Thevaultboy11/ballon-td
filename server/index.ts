// Ballon TD server: the API under /api and the built app (dist/) for everything else.
//   PORT (default 3000) and HOST (default 0.0.0.0, i.e. reachable from the VPN) can be set in .env
import fs from 'node:fs'
import path from 'node:path'
import express, { type NextFunction, type Request, type Response } from 'express'
import { ROOT } from '../scripts/env.mjs'
import { prisma, prepareDatabase, dbFile } from './db.ts'
import { syncCounters } from './lib/ids.ts'
import { crudRouter } from './lib/crud.ts'
import { HttpError, explainPrismaError } from './lib/validate.ts'
import { appRouter } from './routes.ts'

const PORT = Number(process.env.PORT || 3000)
const HOST = process.env.HOST || '0.0.0.0'

await prepareDatabase()
await syncCounters()
if ((await prisma.lookupValue.count()) === 0) console.warn('The library is empty. Run: npm run db:seed')

const app = express()
app.disable('x-powered-by')
app.use(express.json({ limit: '5mb' }))

app.get('/api/health', async (_req, res) => {
  res.json({ ok: true, database: path.basename(dbFile), employees: await prisma.employee.count() })
})
app.use('/api', appRouter())
app.use('/api', crudRouter())
app.use('/api', (_req, res) => { res.status(404).json({ error: 'Not found' }) })

// The built React app
const dist = path.join(ROOT, 'dist')
if (fs.existsSync(path.join(dist, 'index.html'))) {
  app.use(express.static(dist, { index: false, maxAge: '1h' }))
  app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')))
} else {
  app.get('/', (_req, res) => res.type('text').send('The app is not built yet. Run "npm run build", or use "npm run dev" while developing.'))
}

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const e = err instanceof HttpError ? err : explainPrismaError(err)
  if (e) return res.status(e.status).json({ error: e.message })
  console.error(err)
  res.status(500).json({ error: 'Something went wrong on the server. The details are in the server log.' })
})

app.listen(PORT, HOST, () => {
  console.log(`Ballon TD running on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}  (database: ${dbFile})`)
})
