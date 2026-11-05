import { resolve } from 'node:path'
import { createApp } from './app.mjs'
const port = Number(process.env.PORT || 3015)
const host = process.env.HOST || '127.0.0.1'
const server = createApp({ filename: process.env.DATA_FILE || resolve('data/refugios.sqlite') })
server.listen(port, host, () => console.log(`Refugios API: http://${host}:${port}`))
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close())
