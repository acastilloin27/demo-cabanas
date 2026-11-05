export type Stay = {
  id: number; image: string; location: string; name: string; tag: string;
  category: string; region: string; rating: string | null; reviews: number;
  guests: number; beds: number; price: number; description: string; amenities: string[]
}
export type Booking = {
  id: string; stay_id: number; arrival: string; departure: string; guests: number;
  name: string; email: string; total: number; status: 'confirmed' | 'cancelled'; created_at: string; stay: Stay
}
export type Filters = { destination: string; arrival: string; departure: string; guests: number }
export async function api<T>(path: string, data?: unknown, signal?: AbortSignal): Promise<T> {
  let response: Response
  try {
    response = await fetch(`/api${path}`, {
      method: data === undefined ? 'GET' : 'POST', credentials: 'same-origin', signal,
      ...(data === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    })
  } catch (error) {
    if (signal?.aborted) throw error
    throw new Error('No pudimos conectar con el servidor. Comprueba que la demo esté iniciada e intenta nuevamente.')
  }
  const result = await response.json().catch(() => { throw new Error('El servidor no está disponible. Ejecuta npm run dev.') })
  if (!response.ok) throw new Error(result.error || 'No pudimos completar la operación.')
  return result
}
export const money = (value: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value)
export const formatDate = (value: string) => new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(value + 'T12:00:00Z'))
export function today() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
  return ['year', 'month', 'day'].map(key => parts.find(p => p.type === key)!.value).join('-')
}
export function nextDay(value: string) {
  const date = new Date(value + 'T12:00:00Z'); date.setUTCDate(date.getUTCDate() + 1)
  return date.toISOString().slice(0, 10)
}
export function dateError(arrival: string, departure: string) {
  if (!arrival || !departure) return 'Selecciona llegada y salida.'
  if (arrival < today()) return 'La llegada no puede ser anterior a hoy.'
  const nights = (Date.parse(departure) - Date.parse(arrival)) / 86400000
  if (!Number.isFinite(nights) || nights < 1 || nights > 30) return 'Elige una estadía de 1 a 30 noches.'
  return ''
}
