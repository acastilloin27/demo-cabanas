import { DatabaseSync } from 'node:sqlite'
import { randomUUID } from 'node:crypto'
import { createServer } from 'node:http'
import { mkdirSync, readFileSync, existsSync, statSync } from 'node:fs'
import { dirname, resolve, extname, sep } from 'node:path'
import { seedStays } from './seed.mjs'

export function today() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
  return ['year', 'month', 'day'].map(key => parts.find(p => p.type === key).value).join('-')
}
const fail = (message, status = 400) => { throw Object.assign(new Error(message), { status }) }
function text(value, label, min = 2, max = 200) {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) fail(`${label}: ingresa entre ${min} y ${max} caracteres.`)
  return value.trim()
}
function integer(value, label, min, max) {
  if (!Number.isInteger(value) || value < min || value > max) fail(`${label}: el valor debe estar entre ${min} y ${max}.`)
  return value
}
function dates(arrival, departure) {
  for (const date of [arrival, departure]) {
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) fail('Ingresa fechas válidas.')
  }
  const nights = (Date.parse(departure) - Date.parse(arrival)) / 86400000
  if (arrival < today()) fail('La llegada no puede ser anterior a hoy.')
  if (nights < 1 || nights > 30) fail('La estadía debe ser de 1 a 30 noches.')
  return nights
}
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export function createApp({ filename = ':memory:', staticDir = resolve('dist') } = {}) {
  if (filename !== ':memory:') mkdirSync(dirname(resolve(filename)), { recursive: true })
  const db = new DatabaseSync(filename)
  db.exec(`PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS stays (id INTEGER PRIMARY KEY, owner TEXT, content TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY, session TEXT NOT NULL, stay_id INTEGER NOT NULL REFERENCES stays(id),
      arrival TEXT NOT NULL, departure TEXT NOT NULL, guests INTEGER NOT NULL,
      name TEXT NOT NULL, email TEXT NOT NULL, total INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'confirmed', created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS booking_dates ON bookings(stay_id, status, arrival, departure);`)
  const seed = db.prepare('INSERT OR IGNORE INTO stays (id, content) VALUES (?, ?)')
  for (const stay of seedStays) seed.run(stay.id, JSON.stringify(stay))
  const getStay = id => {
    const row = db.prepare('SELECT content FROM stays WHERE id = ?').get(id)
    if (!row) fail('No encontramos esa cabaña.', 404)
    return JSON.parse(row.content)
  }
  const occupied = (id, arrival, departure) => Boolean(db.prepare("SELECT id FROM bookings WHERE stay_id = ? AND status = 'confirmed' AND arrival < ? AND departure > ? LIMIT 1").get(id, departure, arrival))
  const send = (res, status, body) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' })
    res.end(JSON.stringify(body))
  }
  async function body(req) {
    if (!req.headers['content-type']?.startsWith('application/json')) fail('Se requiere JSON.', 415)
    let raw = ''
    for await (const chunk of req) {
      raw += chunk
      if (Buffer.byteLength(raw) > 32000) fail('El formulario es demasiado grande.', 413)
    }
    try {
      const parsed = JSON.parse(raw)
      if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') fail('Formulario inválido.')
      return parsed
    } catch { fail('Formulario inválido.') }
  }
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`)
      if (!url.pathname.startsWith('/api/')) {
        if (!['GET', 'HEAD'].includes(req.method)) fail('Método no permitido.', 405)
        let file = resolve(staticDir, '.' + decodeURIComponent(url.pathname))
        if (file !== staticDir && !file.startsWith(staticDir + sep)) fail('Ruta inválida.', 403)
        if (!existsSync(file) || !statSync(file).isFile()) {
          if (extname(url.pathname)) fail('Archivo no encontrado.', 404)
          file = resolve(staticDir, 'index.html')
        }
        if (!existsSync(file)) fail('Primero ejecuta npm run build o usa npm run dev.', 404)
        const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' }
        res.writeHead(200, { 'Content-Type': mime[extname(file)] ?? 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' })
        res.end(req.method === 'HEAD' ? undefined : readFileSync(file))
        return
      }
      if (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) fail('Origen no permitido.', 403)
      let session = req.headers.cookie?.split(';').map(c => c.trim()).find(c => c.startsWith('refugios_session='))?.slice(17)
      if (!session || !/^[0-9a-f-]{36}$/.test(session)) {
        session = randomUUID()
        res.setHeader('Set-Cookie', `refugios_session=${session}; HttpOnly; SameSite=Strict; Path=/; Max-Age=31536000${req.socket.encrypted ? '; Secure' : ''}`)
      }
      if (req.method === 'GET' && url.pathname === '/api/stays') {
        const arrival = url.searchParams.get('arrival'), departure = url.searchParams.get('departure')
        if (arrival || departure) dates(arrival, departure)
        const guests = Number(url.searchParams.get('guests') || 1)
        integer(guests, 'Huéspedes', 1, 12)
        const query = normalize(url.searchParams.get('destination')?.trim() || '')
        const category = url.searchParams.get('category') || 'Todos'
        const stays = db.prepare('SELECT content FROM stays ORDER BY id').all().map(row => JSON.parse(row.content)).filter(stay =>
          stay.guests >= guests && (category === 'Todos' || stay.category === category) &&
          normalize(`${stay.name} ${stay.location} ${stay.region} ${stay.category} ${stay.category === 'Bosque' ? 'Bosques nativos' : ''}`).includes(query) &&
          (!arrival || !occupied(stay.id, arrival, departure)))
        return send(res, 200, { stays })
      }
      if (req.method === 'GET' && url.pathname === '/api/bookings') {
        const bookings = db.prepare('SELECT id, stay_id, arrival, departure, guests, name, email, total, status, created_at FROM bookings WHERE session = ? ORDER BY created_at DESC').all(session)
        return send(res, 200, { bookings: bookings.map(b => ({ ...b, stay: getStay(b.stay_id) })) })
      }
      if (req.method === 'POST' && url.pathname === '/api/bookings') {
        const data = await body(req)
        const stay = getStay(integer(data.stayId, 'Cabaña', 1, Number.MAX_SAFE_INTEGER))
        const nights = dates(data.arrival, data.departure)
        const guests = integer(data.guests, 'Huéspedes', 1, stay.guests)
        const name = text(data.name, 'Nombre', 2, 100)
        const email = text(data.email, 'Correo', 5, 160).toLowerCase()
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('Ingresa un correo válido.')
        db.exec('BEGIN IMMEDIATE')
        try {
          if (occupied(stay.id, data.arrival, data.departure)) fail('Esta cabaña ya está reservada para esas fechas. Elige otras fechas.', 409)
          const booking = { id: randomUUID(), stay_id: stay.id, arrival: data.arrival, departure: data.departure, guests, name, email, total: nights * stay.price, status: 'confirmed', created_at: new Date().toISOString(), stay }
          db.prepare('INSERT INTO bookings (id, session, stay_id, arrival, departure, guests, name, email, total, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(booking.id, session, stay.id, booking.arrival, booking.departure, guests, name, email, booking.total, booking.created_at)
          db.exec('COMMIT')
          return send(res, 201, { booking })
        } catch (error) { db.exec('ROLLBACK'); throw error }
      }
      const cancel = url.pathname.match(/^\/api\/bookings\/([0-9a-f-]{36})\/cancel$/)
      if (req.method === 'POST' && cancel) {
        await body(req)
        const booking = db.prepare('SELECT * FROM bookings WHERE id = ? AND session = ?').get(cancel[1], session)
        if (!booking) fail('Reserva no encontrada en este navegador.', 404)
        if (booking.arrival < today()) fail('Una estadía ya iniciada no se puede cancelar.')
        db.prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?").run(booking.id)
        return send(res, 200, { ok: true })
      }
      if (req.method === 'POST' && url.pathname === '/api/stays') {
        const data = await body(req)
        const name = text(data.name, 'Nombre de la cabaña', 3, 80)
        const location = text(data.location, 'Ubicación', 3, 100)
        const description = text(data.description, 'Descripción', 20, 1500)
        const guests = integer(data.guests, 'Capacidad', 1, 12)
        const beds = integer(data.beds, 'Camas', 1, 12)
        const price = integer(data.price, 'Precio por noche', 1000, 2000000)
        if (!['Bosque', 'Montaña', 'Lago'].includes(data.category)) fail('Selecciona un paisaje válido.')
        if (!['Sur de Chile', 'Cordillera', 'Otro destino'].includes(data.region)) fail('Selecciona una zona válida.')
        let image
        try { image = new URL(data.image) } catch { fail('Ingresa una URL válida para la fotografía.') }
        if (image.protocol !== 'https:' || image.username || image.password || image.href.length > 2000) fail('La fotografía debe usar una URL HTTPS pública.')
        const stay = { name, location, description, guests, beds, price, category: data.category, region: data.region, image: image.href, tag: 'Nuevo refugio', rating: null, reviews: 0, amenities: ['Servicios a coordinar con el anfitrión'] }
        db.exec('BEGIN IMMEDIATE')
        try {
          const result = db.prepare('INSERT INTO stays (owner, content) VALUES (?, ?)').run(session, JSON.stringify(stay))
          stay.id = Number(result.lastInsertRowid)
          db.prepare('UPDATE stays SET content = ? WHERE id = ?').run(JSON.stringify(stay), stay.id)
          db.exec('COMMIT')
        } catch (error) { db.exec('ROLLBACK'); throw error }
        return send(res, 201, { stay })
      }
      fail('Ruta no encontrada.', 404)
    } catch (error) {
      if (!error.status) console.error(error)
      if (!res.headersSent) send(res, error.status || 500, { error: error.status ? error.message : 'No pudimos completar la operación. Intenta nuevamente.' })
      else res.end()
    }
  })
  server.on('close', () => db.close())
  return server
}
