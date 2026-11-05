import test from 'node:test'
import assert from 'node:assert/strict'
import { once } from 'node:events'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createApp, today } from '../app.mjs'

function dateAfter(days) {
  const date = new Date(today() + 'T12:00:00Z')
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}
const reservation = (extra = {}) => ({ stayId: 1, arrival: dateAfter(14), departure: dateAfter(17), guests: 2, name: 'Persona de prueba', email: 'demo@example.com', ...extra })
async function fixture(t, options) {
  const server = createApp(options)
  server.listen(0, '127.0.0.1'); await once(server, 'listening')
  t.after(() => new Promise(resolve => server.close(resolve)))
  const base = `http://127.0.0.1:${server.address().port}`
  function client() {
    let cookie = ''
    return async (path, data, headers = {}) => {
      const response = await fetch(base + '/api' + path, { method: data === undefined ? 'GET' : 'POST', headers: { ...(cookie ? { Cookie: cookie } : {}), ...(data === undefined ? {} : { 'Content-Type': 'application/json' }), ...headers }, ...(data === undefined ? {} : { body: JSON.stringify(data) }) })
      if (response.headers.get('set-cookie')) cookie = response.headers.get('set-cookie').split(';')[0]
      return { status: response.status, body: await response.json() }
    }
  }
  return { server, client }
}

test('busca por destino sin acentos, paisaje y capacidad', async t => {
  const { client } = await fixture(t); const request = client()
  const all = await request('/stays'); assert.equal(all.body.stays.length, 3)
  const pucon = await request('/stays?destination=pucon'); assert.equal(pucon.body.stays[0].id, 1)
  assert.equal((await request('/stays?destination=Bosques%20nativos')).body.stays.length, 1)
  assert.equal((await request('/stays?destination=Sur%20de%20Chile')).body.stays.length, 2)
  assert.equal((await request('/stays?category=Lago&guests=3')).body.stays.length, 0)
  assert.equal((await request('/stays?guests=5')).body.stays[0].id, 2)
  assert.equal((await request('/stays?destination=SinCoincidencias')).body.stays.length, 0)
})

test('valida fechas, capacidad y datos de contacto en el servidor', async t => {
  const { client } = await fixture(t); const request = client()
  for (const data of [
    { arrival: dateAfter(-1) }, { departure: dateAfter(14) }, { departure: dateAfter(46) },
    { arrival: '2027-02-30' }, { guests: 5 }, { guests: 1.5 }, { email: 'sin-correo' }, { name: ' ' }, { stayId: '1' },
  ]) assert.equal((await request('/bookings', reservation(data))).status, 400, JSON.stringify(data))
  assert.equal((await request('/stays?arrival=' + dateAfter(14))).status, 400)
  assert.equal((await request('/stays?guests=abc')).status, 400)
})

test('calcula el precio en el servidor e impide reservas superpuestas concurrentes', async t => {
  const { client } = await fixture(t); const request = client(); await request('/stays')
  const results = await Promise.all([request('/bookings', reservation({ total: 1 })), request('/bookings', reservation({ total: 0 }))])
  assert.deepEqual(results.map(r => r.status).sort(), [201, 409])
  const booking = results.find(r => r.status === 201).body.booking
  assert.equal(booking.total, 258000)
  const availability = await request(`/stays?arrival=${dateAfter(14)}&departure=${dateAfter(17)}`)
  assert.deepEqual(availability.body.stays.map(s => s.id), [2, 3])
  assert.equal((await request('/bookings', reservation({ arrival: dateAfter(17), departure: dateAfter(18) }))).status, 201)
  assert.equal((await request('/bookings', reservation({ arrival: dateAfter(13), departure: dateAfter(14) }))).status, 201)
})

test('aísla reservas por navegador y cancelar libera disponibilidad', async t => {
  const { client } = await fixture(t); const first = client(), other = client()
  const created = await first('/bookings', reservation()); const id = created.body.booking.id
  assert.equal((await first('/bookings')).body.bookings.length, 1)
  assert.equal((await other('/bookings')).body.bookings.length, 0)
  assert.equal((await other(`/bookings/${id}/cancel`, {})).status, 404)
  assert.equal((await first(`/bookings/${id}/cancel`, {})).status, 200)
  assert.equal((await first(`/bookings/${id}/cancel`, {})).status, 200)
  assert.equal((await first('/bookings')).body.bookings[0].status, 'cancelled')
  assert.equal((await other('/bookings', reservation())).status, 201)
})

test('publica cabañas validadas y permite reservarlas', async t => {
  const { client } = await fixture(t); const request = client()
  const stay = { name: 'Refugio de prueba', location: 'Valdivia, Los Ríos', description: 'Una cabaña de prueba junto al bosque nativo.', guests: 6, beds: 3, price: 95000, category: 'Bosque', region: 'Sur de Chile', image: 'https://images.unsplash.com/photo-1570793005386-840846445fed' }
  for (const data of [{ price: -1 }, { guests: 13 }, { image: 'javascript:alert(1)' }, { category: 'Otro' }, { region: 'Inválida' }, { description: 'corta' }]) assert.equal((await request('/stays', { ...stay, ...data })).status, 400)
  const created = await request('/stays', stay)
  assert.equal(created.status, 201); assert.equal(created.body.stay.id, 4); assert.equal(created.body.stay.rating, null)
  const results = await request('/stays?destination=Valdivia'); assert.equal(results.body.stays[0].id, 4)
  assert.equal((await request('/bookings', reservation({ stayId: 4, guests: 6 }))).body.booking.total, 285000)
})

test('rechaza formularios y orígenes inválidos sin exponer reservas', async t => {
  const { client } = await fixture(t); const request = client()
  assert.equal((await request('/bookings', reservation(), { Origin: 'https://otro.example' })).status, 403)
  assert.equal((await request('/bookings', reservation(), { 'Content-Type': 'text/plain' })).status, 415)
  assert.equal((await request('/bookings', null)).status, 400)
  assert.equal((await request('/inexistente')).status, 404)
  assert.equal((await request('/bookings', reservation({ stayId: 999 }))).status, 404)
})

test('SQLite conserva reservas al reiniciar el servidor', async t => {
  const directory = mkdtempSync(join(tmpdir(), 'refugios-test-'))
  const filename = join(directory, 'test.sqlite')
  const first = createApp({ filename }); first.listen(0, '127.0.0.1'); await once(first, 'listening')
  let cookie, id
  try {
    const response = await fetch(`http://127.0.0.1:${first.address().port}/api/bookings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(reservation()) })
    cookie = response.headers.get('set-cookie').split(';')[0]; id = (await response.json()).booking.id
  } finally { await new Promise(resolve => first.close(resolve)) }
  const second = createApp({ filename }); second.listen(0, '127.0.0.1'); await once(second, 'listening')
  try {
    const response = await fetch(`http://127.0.0.1:${second.address().port}/api/bookings`, { headers: { Cookie: cookie } })
    assert.equal((await response.json()).bookings[0].id, id)
  } finally { await new Promise(resolve => second.close(resolve)); rmSync(directory, { recursive: true, force: true }) }
})
