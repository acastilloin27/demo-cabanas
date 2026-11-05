import { useState, type FormEvent } from 'react'
import Dialog from './Dialog'
import { api, dateError, formatDate, money, nextDay, today, type Booking, type Filters, type Stay } from './client-api'

export function downloadReceipt(booking: Booking) {
  const receipt = `REFUGIOS · COMPROBANTE DE DEMOSTRACIÓN\n\nReferencia: ${booking.id}\nCabaña: ${booking.stay.name}\nDestino: ${booking.stay.location}\nTitular: ${booking.name}\nLlegada: ${formatDate(booking.arrival)} · desde las 15:00\nSalida: ${formatDate(booking.departure)} · hasta las 11:00\nHuéspedes: ${booking.guests}\nTotal: ${money(booking.total)} CLP\nEstado: ${booking.status === 'confirmed' ? 'Confirmada en la demo' : 'Cancelada'}\n\nEsta reserva pertenece a una demostración local. No se ha realizado ningún cobro ni enviado correos.\n`
  const url = URL.createObjectURL(new Blob([receipt], { type: 'text/plain;charset=utf-8' }))
  const link = document.createElement('a'); link.href = url; link.download = `refugios-${booking.id.slice(0, 8)}.txt`; link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function StayDetail({ stay, filters, onClose, onBooked }: { stay: Stay; filters: Filters; onClose: () => void; onBooked: () => void }) {
  const [arrival, setArrival] = useState(filters.arrival)
  const [departure, setDeparture] = useState(filters.departure)
  const [guests, setGuests] = useState(Math.min(filters.guests, stay.guests))
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [booking, setBooking] = useState<Booking | null>(null)
  const validDates = !dateError(arrival, departure)
  const nights = validDates ? (Date.parse(departure) - Date.parse(arrival)) / 86400000 : 0
  async function reserve(event: FormEvent) {
    event.preventDefault()
    const message = dateError(arrival, departure)
    if (message) { setError(message); return }
    setError(''); setBusy(true)
    try {
      const result = await api<{ booking: Booking }>('/bookings', { stayId: stay.id, arrival, departure, guests, name, email })
      setBooking(result.booking); onBooked()
    } catch (error) { setError(error instanceof Error ? error.message : 'No se pudo reservar. Intenta nuevamente.') }
    finally { setBusy(false) }
  }
  if (booking) return <Dialog title="Reserva confirmada" onClose={onClose}>
    <div className="confirmation-icon" aria-hidden="true">✓</div>
    <h2 className="dialog-heading" tabIndex={-1}>Tu escapada está lista.</h2>
    <p className="muted mt-3">Simulaste una reserva. Puedes verla y cancelarla en «Mis reservas» durante esta visita.</p>
    <div className="summary-box my-6">
      <strong>{stay.name}</strong><p className="muted">{stay.location}</p>
      <p className="mt-3">{formatDate(booking.arrival)} → {formatDate(booking.departure)}</p>
      <p>{booking.guests} huéspedes · {money(booking.total)} CLP</p>
      <p className="mt-3 text-sm break-all">Referencia: {booking.id}</p>
    </div>
    <p className="demo-note mb-5">No hay cobros ni correos reales. Esta simulación se reinicia al recargar la página.</p>
    <div className="flex flex-wrap gap-3"><button className="primary-button" onClick={() => downloadReceipt(booking)}>Descargar comprobante</button><button className="secondary-button" onClick={onClose}>Seguir explorando</button></div>
  </Dialog>

  return <Dialog title="Tu próxima escapada" onClose={onClose} wide>
    <div className="detail-layout">
      <div>
        <img className="detail-image" src={stay.image} alt={stay.name} />
        <p className="eyebrow mt-6">{stay.location}</p>
        <h2 className="dialog-heading mt-3">{stay.name}</h2>
        <p className="muted mt-3">Hasta {stay.guests} huéspedes · {stay.beds} {stay.beds === 1 ? 'cama' : 'camas'} · {stay.category}</p>
        <p className="mt-5 leading-relaxed">{stay.description}</p>
        <h3 className="mt-6 font-bold">Lo que encontrarás</h3>
        <ul className="amenities">{stay.amenities.map(item => <li key={item}><span aria-hidden="true">✓</span> {item}</li>)}</ul>
        <div className="summary-box mt-6 text-sm"><strong>Tu estadía</strong><p className="mt-2">Llegada desde las 15:00 · Salida hasta las 11:00.</p><p className="mt-2">En esta demo puedes cancelar sin costo hasta el día de llegada.</p></div>
      </div>
      <form className="reservation-form" onSubmit={reserve}>
        <p><strong className="text-3xl">{money(stay.price)}</strong> <span className="muted">CLP / noche</span></p>
        <p className="demo-note mt-3 mb-5">Reserva de demostración · No se realizará ningún cobro.</p>
        <div className="form-grid">
          <label>Llegada<input type="date" required min={today()} value={arrival} onChange={event => { const value = event.target.value; setArrival(value); if (departure && departure <= value) setDeparture(nextDay(value)) }} /></label>
          <label>Salida<input type="date" required min={arrival ? nextDay(arrival) : nextDay(today())} value={departure} onChange={event => setDeparture(event.target.value)} /></label>
        </div>
        <label>Huéspedes<select value={guests} onChange={event => setGuests(Number(event.target.value))}>{Array.from({ length: stay.guests }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? 'huésped' : 'huéspedes'}</option>)}</select></label>
        <label>Nombre completo<input required autoComplete="name" minLength={2} maxLength={100} value={name} onChange={event => setName(event.target.value)} placeholder="Tu nombre" /></label>
        <label>Correo electrónico<input required type="email" autoComplete="email" maxLength={160} value={email} onChange={event => setEmail(event.target.value)} placeholder="nombre@correo.cl" /></label>
        {nights > 0 && <div className="price-breakdown" aria-live="polite"><div><span>{money(stay.price)} × {nights} {nights === 1 ? 'noche' : 'noches'}</span><span>{money(nights * stay.price)}</span></div><div><span>Cargos adicionales</span><span>$0</span></div><div className="total"><strong>Total CLP</strong><strong>{money(nights * stay.price)}</strong></div></div>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button w-full" disabled={busy}>{busy ? 'Confirmando…' : 'Confirmar reserva de demo'}</button>
        <p className="muted mt-3 text-xs">La disponibilidad es simulada. La reserva se mantiene solo hasta que recargues la página.</p>
      </form>
    </div>
  </Dialog>
}
