import { useEffect, useState } from 'react'
import Dialog from './Dialog'
import { api, formatDate, money, today, type Booking } from './client-api'
import { downloadReceipt } from './StayDetail'

export default function Reservations({ onClose, onChanged }: { onClose: () => void; onChanged: () => void }) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState('')
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true); setError('')
    api<{ bookings: Booking[] }>('/bookings', undefined, controller.signal).then(result => setBookings(result.bookings)).catch(error => { if (!controller.signal.aborted) setError(error.message) }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [retry])
  async function cancel(id: string) {
    setBusy(id); setError('')
    try {
      await api(`/bookings/${id}/cancel`, {})
      setBookings(previous => previous.map(booking => booking.id === id ? { ...booking, status: 'cancelled' } : booking))
      setConfirm(''); onChanged()
    } catch (error) { setError(error instanceof Error ? error.message : 'No se pudo cancelar.') }
    finally { setBusy('') }
  }
  return <Dialog title="Mis reservas" onClose={onClose} wide>
    <h2 className="dialog-heading">Tus próximas historias.</h2>
    <p className="muted mt-3 mb-6">Reservas simuladas durante esta visita. Se reinician al recargar la página.</p>
    {error && <div className="form-error" role="alert">{error} <button className="underline" onClick={() => setRetry(value => value + 1)}>Reintentar</button></div>}
    {loading ? <p role="status">Cargando reservas…</p> : bookings.length === 0 && !error ? <div className="empty-state"><h3>Aún no tienes una escapada.</h3><p>Elige una cabaña y reserva tus fechas favoritas.</p><button className="primary-button mt-5" onClick={onClose}>Explorar cabañas</button></div> : <div className="booking-list">{bookings.map(booking => <article key={booking.id} className="booking-card">
      <img src={booking.stay.image} alt="" />
      <div className="min-w-0 flex-1">
        <span className={`status-badge ${booking.status === 'cancelled' ? 'cancelled' : ''}`}>{booking.status === 'cancelled' ? 'Cancelada' : 'Confirmada · demo'}</span>
        <h3 className="font-display mt-3 text-2xl">{booking.stay.name}</h3>
        <p className="muted text-sm">{booking.stay.location}</p>
        <p className="mt-3 text-sm">{formatDate(booking.arrival)} → {formatDate(booking.departure)} · {booking.guests} huéspedes</p>
        <p className="mt-1 font-bold">{money(booking.total)} CLP</p>
        <p className="muted mt-2 text-xs break-all">Referencia: {booking.id}</p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <button className="text-sm underline underline-offset-4" onClick={() => downloadReceipt(booking)}>Descargar comprobante</button>
          {booking.status === 'confirmed' && booking.arrival >= today() && (confirm === booking.id ? <div className="summary-box text-sm"><p>¿Cancelar esta reserva y liberar las fechas?</p><div className="mt-3 flex gap-3"><button className="danger-button" disabled={busy === booking.id} onClick={() => cancel(booking.id)}>{busy === booking.id ? 'Cancelando…' : 'Sí, cancelar'}</button><button disabled={busy === booking.id} onClick={() => setConfirm('')}>Conservar reserva</button></div></div> : <button className="text-sm text-[#a3442d] underline underline-offset-4" onClick={() => setConfirm(booking.id)}>Cancelar reserva</button>)}
        </div>
      </div>
    </article>)}</div>}
  </Dialog>
}
