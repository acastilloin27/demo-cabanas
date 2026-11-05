import { useState, type FormEvent } from 'react'
import Dialog from './Dialog'
import { api, type Stay } from './client-api'

export default function HostForm({ onClose, onCreated }: { onClose: () => void; onCreated: (stay: Stay) => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState<Stay | null>(null)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const data = Object.fromEntries(form)
    setBusy(true); setError('')
    try {
      const result = await api<{ stay: Stay }>('/stays', { ...data, guests: Number(data.guests), beds: Number(data.beds), price: Number(data.price) })
      setCreated(result.stay); onCreated(result.stay)
    } catch (error) { setError(error instanceof Error ? error.message : 'No se pudo publicar.') }
    finally { setBusy(false) }
  }
  return <Dialog title="Publica tu cabaña" onClose={onClose}>
    {created ? <><div className="confirmation-icon" aria-hidden="true">✓</div><h2 className="dialog-heading">Tu refugio ya está aquí.</h2><p className="muted my-5">«{created.name}» está publicado en el catálogo de esta demo y disponible para reservas.</p><button className="primary-button" onClick={onClose}>Ver alojamientos</button></> : <>
      <h2 className="dialog-heading">Comparte tu rincón favorito.</h2>
      <p className="demo-note mt-3 mb-6">Publicación de demostración, visible en este servidor local. No se envía a una plataforma real.</p>
      <form className="stacked-form" onSubmit={submit}>
        <label>Nombre de la cabaña<input name="name" required minLength={3} maxLength={80} placeholder="Ej. Refugio del lago" /></label>
        <label>Ciudad y región<input name="location" required minLength={3} maxLength={100} placeholder="Ej. Villarrica, Araucanía" /></label>
        <div className="form-grid"><label>Paisaje<select name="category"><option>Bosque</option><option>Montaña</option><option>Lago</option></select></label><label>Zona<select name="region"><option>Sur de Chile</option><option>Cordillera</option><option>Otro destino</option></select></label></div>
        <div className="form-grid"><label>Capacidad<input name="guests" type="number" required min={1} max={12} defaultValue={2} /></label><label>Camas<input name="beds" type="number" required min={1} max={12} defaultValue={1} /></label></div>
        <label>Precio por noche en CLP<input name="price" type="number" required min={1000} max={2000000} step={1} placeholder="85000" /></label>
        <label>URL de la fotografía<input name="image" type="url" pattern="https://.*" title="Usa una dirección HTTPS pública" required maxLength={2000} placeholder="https://…" /><span className="field-hint">Usa el enlace directo a una imagen pública.</span></label>
        <label>Cuéntanos sobre tu cabaña<textarea name="description" required minLength={20} maxLength={1500} rows={4} placeholder="Describe el entorno y los servicios del alojamiento…" /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button disabled={busy} className="primary-button">{busy ? 'Publicando…' : 'Publicar en la demo'}</button>
      </form>
    </>}
  </Dialog>
}
