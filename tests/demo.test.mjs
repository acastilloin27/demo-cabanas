import test from 'node:test'
import assert from 'node:assert/strict'
import { createDemoStore, today } from '../demo/store.mjs'

function after(days) {
  const date = new Date(today() + 'T12:00:00Z')
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}
const reservation = (extra = {}) => ({ stayId: 1, arrival: after(14), departure: after(17), guests: 2, name: 'Persona de prueba', email: 'demo@example.com', ...extra })
const listing = { name: 'Refugio de prueba', location: 'Valdivia, Los Ríos', description: 'Una cabaña de prueba junto al bosque nativo.', guests: 6, beds: 3, price: 95000, category: 'Bosque', region: 'Sur de Chile', image: 'https://images.unsplash.com/photo-1570793005386-840846445fed' }

test('filtra el catálogo por destino sin acentos, paisaje y huéspedes', () => {
  const demo = createDemoStore()
  assert.equal(demo.request('/stays').stays.length, 3)
  assert.equal(demo.request('/stays?destination=pucon').stays[0].id, 1)
  assert.equal(demo.request('/stays?destination=Bosques%20nativos').stays.length, 1)
  assert.equal(demo.request('/stays?destination=Sur%20de%20Chile').stays.length, 2)
  assert.equal(demo.request('/stays?category=Lago&guests=3').stays.length, 0)
  assert.equal(demo.request('/stays?guests=5').stays[0].id, 2)
})

test('simula reservas, calcula importes y bloquea fechas superpuestas durante la visita', () => {
  const demo = createDemoStore()
  assert.equal(demo.request('/bookings', reservation({ total: 1 })).booking.total, 258000)
  assert.throws(() => demo.request('/bookings', reservation()), error => error.status === 409)
  assert.deepEqual(demo.request(`/stays?arrival=${after(14)}&departure=${after(17)}`).stays.map(stay => stay.id), [2, 3])
  assert.ok(demo.request('/bookings', reservation({ arrival: after(17), departure: after(18) })).booking.id)
  assert.ok(demo.request('/bookings', reservation({ arrival: after(13), departure: after(14) })).booking.id)
})

test('cancelar libera las fechas de la reserva simulada', () => {
  const demo = createDemoStore()
  const { booking } = demo.request('/bookings', reservation())
  assert.equal(demo.request('/bookings').bookings.length, 1)
  demo.request(`/bookings/${booking.id}/cancel`, {})
  assert.equal(demo.request('/bookings').bookings[0].status, 'cancelled')
  assert.ok(demo.request('/bookings', reservation()).booking.id)
})

test('publica una cabaña de prueba que se puede buscar y reservar', () => {
  const demo = createDemoStore()
  const { stay } = demo.request('/stays', listing)
  assert.equal(stay.id, 4)
  assert.equal(demo.request('/stays?destination=Valdivia').stays[0].id, stay.id)
  assert.equal(demo.request('/bookings', reservation({ stayId: stay.id, guests: 6 })).booking.total, 285000)
})

test('una nueva visita reinicia los datos y las respuestas no alteran el catálogo', () => {
  const first = createDemoStore()
  first.request('/bookings', reservation())
  first.request('/stays', listing)
  const result = first.request('/stays')
  result.stays[0].name = 'Cambio externo'
  assert.notEqual(first.request('/stays').stays[0].name, 'Cambio externo')
  const reloaded = createDemoStore()
  assert.equal(reloaded.request('/stays').stays.length, 3)
  assert.equal(reloaded.request('/bookings').bookings.length, 0)
})

test('valida formularios antes de simular las acciones', () => {
  const demo = createDemoStore()
  for (const extra of [{ arrival: after(-1) }, { departure: after(14) }, { departure: after(46) }, { arrival: '2027-02-30' }, { guests: 5 }, { guests: 1.5 }, { email: 'sin-correo' }, { name: ' ' }]) {
    assert.throws(() => demo.request('/bookings', reservation(extra)), error => error.status === 400)
  }
  for (const extra of [{ price: -1 }, { guests: 13 }, { image: 'javascript:alert(1)' }, { category: 'Otro' }, { description: 'corta' }]) {
    assert.throws(() => demo.request('/stays', { ...listing, ...extra }), error => error.status === 400)
  }
  assert.throws(() => demo.request('/stays?arrival=' + after(14)), error => error.status === 400)
  assert.equal(demo.request('/bookings').bookings.length, 0)
  assert.equal(demo.request('/stays').stays.length, 3)
})
