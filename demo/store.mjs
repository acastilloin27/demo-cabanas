import { seedStays } from './seed.mjs'

export function today() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
  return ['year', 'month', 'day'].map(key => parts.find(part => part.type === key).value).join('-')
}
const fail = (message, status = 400) => { throw Object.assign(new Error(message), { status }) }
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
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

// Each page load gets its own sandbox. Nothing is written or sent to a server.
export function createDemoStore() {
  const stays = structuredClone(seedStays)
  const bookings = []
  const getStay = id => stays.find(stay => stay.id === id) || fail('No encontramos esa cabaña.', 404)
  const occupied = (id, arrival, departure) => bookings.some(booking => booking.stay_id === id && booking.status === 'confirmed' && booking.arrival < departure && booking.departure > arrival)

  function request(path, data) {
    const url = new URL(path, 'https://refugios.demo')
    if (data === undefined && url.pathname === '/stays') {
      const arrival = url.searchParams.get('arrival'), departure = url.searchParams.get('departure')
      if (arrival || departure) dates(arrival, departure)
      const guests = integer(Number(url.searchParams.get('guests') || 1), 'Huéspedes', 1, 12)
      const query = normalize(url.searchParams.get('destination')?.trim() || '')
      const category = url.searchParams.get('category') || 'Todos'
      return { stays: stays.filter(stay => stay.guests >= guests && (category === 'Todos' || stay.category === category) &&
        normalize(`${stay.name} ${stay.location} ${stay.region} ${stay.category} ${stay.category === 'Bosque' ? 'Bosques nativos' : ''}`).includes(query) &&
        (!arrival || !occupied(stay.id, arrival, departure))) }
    }
    if (data === undefined && url.pathname === '/bookings') return { bookings: [...bookings].reverse() }
    if (!data || Array.isArray(data) || typeof data !== 'object') fail('Formulario inválido.')
    if (url.pathname === '/bookings') {
      const stay = getStay(integer(data.stayId, 'Cabaña', 1, Number.MAX_SAFE_INTEGER))
      const nights = dates(data.arrival, data.departure)
      const guests = integer(data.guests, 'Huéspedes', 1, stay.guests)
      const name = text(data.name, 'Nombre', 2, 100)
      const email = text(data.email, 'Correo', 5, 160).toLowerCase()
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('Ingresa un correo válido.')
      if (occupied(stay.id, data.arrival, data.departure)) fail('Ya simulaste una reserva para esas fechas. Elige otras o cancela la anterior.', 409)
      const booking = { id: crypto.randomUUID(), stay_id: stay.id, arrival: data.arrival, departure: data.departure, guests, name, email, total: nights * stay.price, status: 'confirmed', created_at: new Date().toISOString(), stay }
      bookings.push(booking)
      return { booking }
    }
    const cancel = url.pathname.match(/^\/bookings\/([0-9a-f-]{36})\/cancel$/)
    if (cancel) {
      const booking = bookings.find(booking => booking.id === cancel[1])
      if (!booking) fail('Reserva no encontrada en esta visita.', 404)
      if (booking.arrival < today()) fail('Una estadía ya iniciada no se puede cancelar.')
      booking.status = 'cancelled'
      return { ok: true }
    }
    if (url.pathname === '/stays') {
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
      const stay = { id: Math.max(...stays.map(stay => stay.id)) + 1, name, location, description, guests, beds, price, category: data.category, region: data.region, image: image.href, tag: 'Nuevo refugio', rating: null, reviews: 0, amenities: ['Servicios a coordinar con el anfitrión'] }
      stays.push(stay)
      return { stay }
    }
    fail('Acción no encontrada.', 404)
  }
  return { request: (path, data) => structuredClone(request(path, data)) }
}
