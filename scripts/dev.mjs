// Runs the API server (with reload on change) and the Vite dev server together.
import { spawn } from 'node:child_process'
const shell = process.platform === 'win32'
const procs = [
  spawn('npx', ['tsx', 'watch', '--clear-screen=false', 'server/index.ts'], { stdio: 'inherit', shell }),
  spawn('npx', ['vite'], { stdio: 'inherit', shell }),
]
const stop = () => { for (const p of procs) p.kill(); process.exit() }
process.on('SIGINT', stop); process.on('SIGTERM', stop)
for (const p of procs) p.on('exit', (code) => { if (code) stop() })
