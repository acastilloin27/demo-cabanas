import { spawn } from 'node:child_process'
const processes = [
  spawn(process.execPath, ['--watch', 'server/index.mjs'], { stdio: 'inherit', env: { ...process.env, PORT: '3015', HOST: '127.0.0.1' } }),
  spawn(process.execPath, ['node_modules/vite/bin/vite.js'], { stdio: 'inherit' }),
]
let stopping = false
function stop(code = 0) {
  if (stopping) return
  stopping = true
  for (const child of processes) child.kill()
  process.exitCode = code
}
for (const child of processes) {
  child.on('error', (error) => { console.error(error); stop(1) })
  child.on('exit', (code) => stop(code ?? 0))
}
process.on('SIGINT', () => stop())
process.on('SIGTERM', () => stop())
