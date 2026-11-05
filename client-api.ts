import { createDemoStore, today } from './demo/store.mjs'
export { today } from './demo/store.mjs'

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
const demo = createDemoStore()
export async function api<T>(path: string, data?: unknown, signal?: AbortSignal): Promise<T> {
  await Promise.resolve()
  signal?.throwIfAborted()
  return demo.request(path, data) as T
}
export const money = (value: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value)
export const formatDate = (value: string) => new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(value + 'T12:00:00Z'))
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
