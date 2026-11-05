import { useEffect, useMemo, useState } from "react"
import { api, dateError, money, nextDay, today, type Filters, type Stay } from './client-api'
import StayDetail from './StayDetail'
import Reservations from './Reservations'
import HostForm from './HostForm'
import Help from './Help'

type IconName = "arrow" | "calendar" | "check" | "chevron" | "heart" | "leaf" | "map" | "menu" | "mountain" | "search" | "shield" | "spark" | "star" | "users" | "x"

function Icon({
  name,
  className = "h-5 w-5",
}: {
  name: IconName
  className?: string
}) {
  const paths: Record<IconName, React.ReactNode> = {
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
    calendar: (
      <>
        <rect width="18" height="16" x="3" y="5" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    heart: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5a5.5 5.5 0 0 0 1-8.9Z" />
    ),
    leaf: (
      <>
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 19 2 20 2c0 1-1.8 17.5-9 18Z" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6.94 2.02-.99 4.03-1.5 5.92-1.56" />
      </>
    ),
    map: (
      <>
        <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" />
        <path d="M9 3v15M15 6v15" />
      </>
    ),
    menu: (
      <>
        <path d="M4 7h16M4 12h16M4 17h16" />
      </>
    ),
    mountain: (
      <>
        <path d="m3 20 7-12 4 6 2-3 5 9H3Z" />
        <path d="m8.5 10.6 1.5 1.9 1.3-1.7" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    spark: (
      <>
        <path d="m12 3-1.2 3.3L7.5 7.5l3.3 1.2L12 12l1.2-3.3 3.3-1.2-3.3-1.2L12 3Z" />
        <path d="m5 14-.8 2.2L2 17l2.2.8L5 20l.8-2.2L8 17l-2.2-.8L5 14ZM19 13l-.6 1.4L17 15l1.4.6L19 17l.6-1.4L21 15l-1.4-.6L19 13Z" />
      </>
    ),
    star: (
      <path d="m12 2 3 6.2 6.8 1-4.9 4.8 1.2 6.8-6.1-3.2-6.1 3.2 1.2-6.8-4.9-4.8 6.8-1L12 2Z" />
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    x: (
      <>
        <path d="m6 6 12 12M18 6 6 18" />
      </>
    ),
  }

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

const destinations = [
  {
    name: "Sur de Chile",
    image:
      "https://images.unsplash.com/photo-1585337932042-d0522a03aecc?auto=format&fit=crop&w=800&q=85",
  },
  {
    name: "Cordillera",
    image:
      "https://images.unsplash.com/photo-1790534844755-0c6527d4e022?auto=format&fit=crop&w=800&q=85",
  },
  {
    name: "Bosques nativos",
    image:
      "https://images.unsplash.com/photo-1655880397426-405271e82b63?auto=format&fit=crop&w=800&q=85",
  },
]

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [favorites, setFavorites] = useState<number[]>(() => {
    try { const saved = JSON.parse(localStorage.getItem('refugios-favorites') || '[]'); return Array.isArray(saved) ? saved.filter(Number.isInteger) : [] } catch { return [] }
  })
  const [destination, setDestination] = useState("")
  const [guests, setGuests] = useState(1)
  const [arrival, setArrival] = useState('')
  const [departure, setDeparture] = useState('')
  const [filters, setFilters] = useState<Filters>({ destination: '', arrival: '', departure: '', guests: 1 })
  const [category, setCategory] = useState("Todos")
  const [stays, setStays] = useState<Stay[]>([])
  const [catalog, setCatalog] = useState<Stay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchError, setSearchError] = useState('')
  const [notice, setNotice] = useState('')
  const [savedOnly, setSavedOnly] = useState(false)
  const [sort, setSort] = useState('recommended')
  const [revision, setRevision] = useState(0)
  const [selectedStay, setSelectedStay] = useState<Stay | null>(null)
  const [panel, setPanel] = useState<'reservations' | 'host' | 'help' | null>(null)
  const categories = ["Todos", "Bosque", "Montaña", "Lago"]

  useEffect(() => {
    try { localStorage.setItem('refugios-favorites', JSON.stringify(favorites)) } catch { setNotice('Tu navegador no permite guardar favoritos de forma permanente.') }
  }, [favorites])

  useEffect(() => {
    const controller = new AbortController()
    api<{ stays: Stay[] }>('/stays', undefined, controller.signal).then(result => setCatalog(result.stays)).catch(() => {})
    return () => controller.abort()
  }, [revision])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true); setError('')
    const params = new URLSearchParams({ ...filters, guests: String(filters.guests), category })
    api<{ stays: Stay[] }>(`/stays?${params}`, undefined, controller.signal).then(result => setStays(result.stays)).catch(error => { if (!controller.signal.aborted) setError(error.message) }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [filters, category, revision])

  const filteredStays = useMemo(() => {
    const result = stays.filter(stay => !savedOnly || favorites.includes(stay.id))
    if (sort !== 'recommended') result.sort((a, b) => sort === 'price-asc' ? a.price - b.price : b.price - a.price)
    return result
  }, [stays, savedOnly, favorites, sort])

  function scrollToStays() {
    setMenuOpen(false)
    document.querySelector('#alojamientos')?.scrollIntoView({ behavior: 'smooth' })
  }

  function resetFilters() {
    setDestination(''); setArrival(''); setDeparture(''); setGuests(1); setCategory('Todos'); setSavedOnly(false); setSort('recommended'); setSearchError('')
    setFilters({ destination: '', arrival: '', departure: '', guests: 1 })
  }

  function chooseDestination(value: string) {
    setDestination(value); setArrival(''); setDeparture(''); setGuests(1); setCategory('Todos'); setSavedOnly(false); setSearchError('')
    setFilters({ destination: value, arrival: '', departure: '', guests: 1 }); scrollToStays()
  }

  function search(event: React.FormEvent) {
    event.preventDefault()
    const message = (arrival || departure) ? dateError(arrival, departure) : ''
    if (message) { setSearchError(message); return }
    setSearchError(''); setSavedOnly(false)
    setFilters({ destination: destination.trim(), arrival, departure, guests })
    scrollToStays()
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f6f3eb] text-[#17352b]">
      <a href="#alojamientos" className="skip-link">Ir a los alojamientos</a>
      <header className="absolute inset-x-0 top-0 z-40">
        <div className="mx-auto flex h-24 max-w-[1380px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <a
            href="#"
            className="flex items-center gap-3 text-white"
            aria-label="Refugios inicio"
          >
            <span className="grid h-10 w-10 place-items-center rounded-full border border-white/40 bg-white/10 backdrop-blur-sm">
              <Icon name="mountain" />
            </span>
            <span className="font-display text-2xl font-semibold tracking-tight">
              refugios.
            </span>
          </a>
          <nav aria-label="Navegación principal" className="hidden items-center gap-5 text-sm font-medium text-white/90 lg:flex">
            <a href="#alojamientos" className="transition hover:text-white">
              Alojamientos
            </a>
            <a href="#destinos" className="transition hover:text-white">
              Destinos
            </a>
            <a href="#experiencia" className="transition hover:text-white">
              La experiencia
            </a>
          </nav>
          <div className="hidden items-center gap-4 lg:flex">
            <button onClick={() => setPanel('host')} className="text-sm font-medium text-white">
              Publica tu cabaña
            </button>
            <button
              onClick={() => setPanel('reservations')}
              className="rounded-full bg-[#f3c969] px-6 py-3 text-sm font-semibold text-[#17352b] transition hover:bg-[#ffda7e]"
            >
              Mis reservas
            </button>
          </div>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="grid h-11 w-11 place-items-center rounded-full bg-white text-[#17352b] lg:hidden"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            <Icon name={menuOpen ? "x" : "menu"} />
          </button>
        </div>
        {menuOpen && (
          <div id="mobile-menu" className="mx-5 rounded-3xl bg-[#f6f3eb] p-6 shadow-2xl lg:hidden">
            <nav className="flex flex-col gap-5 text-lg font-semibold">
              <a onClick={() => setMenuOpen(false)} href="#alojamientos">
                Alojamientos
              </a>
              <a onClick={() => setMenuOpen(false)} href="#destinos">
                Destinos
              </a>
              <a onClick={() => setMenuOpen(false)} href="#experiencia">
                La experiencia
              </a>
              <button onClick={() => { setMenuOpen(false); setPanel('reservations') }} className="text-left">Mis reservas</button>
              <button onClick={() => { setMenuOpen(false); setPanel('host') }} className="mt-2 rounded-full bg-[#17352b] px-5 py-3 text-left text-white">
                Publica tu cabaña
              </button>
            </nav>
          </div>
        )}
      </header>

      <section className="relative min-h-[780px] bg-[#17352b]">
        <img
          src="https://images.unsplash.com/photo-1619688136991-7be90847f19e?auto=format&fit=crop&w=2000&q=90"
          alt="Cabaña de madera rodeada de naturaleza"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="hero-overlay absolute inset-0" />
        <div className="relative z-10 mx-auto flex min-h-[780px] max-w-[1380px] flex-col justify-end px-5 pb-16 pt-36 sm:px-8 lg:px-12 lg:pb-24">
          <div className="mb-8 max-w-3xl">
            <div className="mb-5 flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#f3c969]">
              <span className="h-px w-10 bg-[#f3c969]" /> Escapadas que se
              sienten
            </div>
            <h1 className="font-display text-[clamp(3.5rem,8vw,7.8rem)] leading-[0.86] font-medium tracking-[-0.055em] text-white">
              Vuelve a lo
              <br />
              <em className="font-normal text-[#f3c969]">esencial.</em>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
              Cabañas únicas, paisajes inmensos y tiempo para ti. Descubre
              alojamientos con alma en los rincones más bellos.
            </p>
          </div>

          <form
            onSubmit={search}
            className="grid w-full gap-1 rounded-[28px] bg-white p-2 shadow-[0_20px_60px_rgba(0,0,0,.22)] sm:grid-cols-2 lg:grid-cols-[1.35fr_1fr_1fr_.8fr_auto] lg:rounded-full"
          >
            <label className="flex min-w-0 items-center gap-3 rounded-full px-5 py-3 focus-within:bg-[#f6f3eb]">
              <Icon name="search" className="h-5 w-5 shrink-0 text-[#d16d4f]" />
              <span className="min-w-0">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[#17352b]/55">
                  Destino
                </span>
                <input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-[#17352b]"
                  placeholder="¿A dónde quieres ir?"
                  maxLength={100}
                  list="destination-options"
                />
              </span>
            </label>
            <label className="flex items-center gap-3 rounded-full border-[#17352b]/10 px-5 py-3 sm:border-l">
              <Icon
                name="calendar"
                className="h-5 w-5 shrink-0 text-[#d16d4f]"
              />
              <span className="min-w-0">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[#17352b]/55">
                  Llegada
                </span>
                <input
                  type="date"
                  aria-label="Fecha de llegada"
                  min={today()}
                  value={arrival}
                  onChange={event => { const value = event.target.value; setArrival(value); if (departure && departure <= value) setDeparture(nextDay(value)) }}
                  className="w-full bg-transparent text-sm font-semibold outline-none"
                />
              </span>
            </label>
            <label className="flex items-center gap-3 rounded-full border-[#17352b]/10 px-5 py-3 lg:border-l">
              <Icon
                name="calendar"
                className="h-5 w-5 shrink-0 text-[#d16d4f]"
              />
              <span className="min-w-0">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[#17352b]/55">
                  Salida
                </span>
                <input
                  type="date"
                  aria-label="Fecha de salida"
                  min={arrival ? nextDay(arrival) : nextDay(today())}
                  value={departure}
                  onChange={event => setDeparture(event.target.value)}
                  className="w-full bg-transparent text-sm font-semibold outline-none"
                />
              </span>
            </label>
            <label className="flex items-center gap-3 rounded-full border-[#17352b]/10 px-5 py-3 sm:border-l">
              <Icon name="users" className="h-5 w-5 shrink-0 text-[#d16d4f]" />
              <span>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[#17352b]/55">
                  Viajeros
                </span>
                <select
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="bg-transparent text-sm font-semibold outline-none"
                >
                  {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? 'huésped' : 'huéspedes'}</option>)}
                </select>
              </span>
            </label>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-full bg-[#d16d4f] px-7 py-4 text-sm font-bold text-white transition hover:bg-[#bd5a3e]"
            >
              Buscar <Icon name="arrow" className="h-4 w-4" />
            </button>
          </form>
          <datalist id="destination-options">{['Pucón', 'Cajón del Maipo', 'Frutillar', 'Sur de Chile', 'Cordillera', 'Bosques nativos'].map(value => <option key={value} value={value} />)}</datalist>
          {searchError && <p role="alert" className="mt-3 rounded-2xl bg-white px-5 py-3 text-sm text-[#a3442d]">{searchError}</p>}
          <p className="mt-4 text-xs text-white/80">Demo funcional · Alojamientos ilustrativos · Reservas sin cobros reales</p>
        </div>
      </section>

      <section
        id="alojamientos"
        className="mx-auto max-w-[1380px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28"
      >
        <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <span className="eyebrow">Selección especial</span>
            <h2 className="font-display mt-3 max-w-2xl text-4xl leading-tight font-medium tracking-tight sm:text-6xl">
              Lugares para bajar el ritmo
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                aria-pressed={category === item}
                className={`rounded-full border px-5 py-2.5 text-sm font-semibold transition ${
                  category === item
                    ? "border-[#17352b] bg-[#17352b] text-white"
                    : "border-[#17352b]/15 hover:border-[#17352b]"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="results-toolbar">
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => setSavedOnly(value => !value)} className={`secondary-button inline-flex items-center gap-2 ${savedOnly ? 'active-filter' : ''}`} aria-pressed={savedOnly}><Icon name="heart" className="h-4 w-4" /> Favoritos ({favorites.length})</button>
            <span className="muted text-sm" role="status">{loading ? 'Buscando refugios…' : `${filteredStays.length} ${filteredStays.length === 1 ? 'alojamiento' : 'alojamientos'}`}</span>
          </div>
          <label className="sort-label">Ordenar por<select value={sort} onChange={event => setSort(event.target.value)}><option value="recommended">Recomendados</option><option value="price-asc">Menor precio</option><option value="price-desc">Mayor precio</option></select></label>
        </div>
        {(filters.destination || filters.arrival || filters.guests > 1 || category !== 'Todos' || savedOnly) && <div className="mb-7 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#e6ebdf] px-5 py-4 text-sm">
          <span>{filters.destination || 'Todos los destinos'}{filters.arrival && ` · ${filters.arrival} → ${filters.departure}`}{filters.guests > 1 && ` · ${filters.guests} huéspedes`}{category !== 'Todos' && ` · ${category}`}{savedOnly && ' · Tus favoritos'}</span>
          <button onClick={resetFilters} className="font-bold underline underline-offset-4">Limpiar filtros</button>
        </div>}
        {error && <div role="alert" className="form-error mb-6">{error} <button onClick={() => setRevision(value => value + 1)} className="font-bold underline">Reintentar</button></div>}
        {!loading && !error && <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filteredStays.map((stay, index) => (
            <article key={stay.id} className="group">
              <div className="relative aspect-[1.15] overflow-hidden rounded-[26px] bg-[#dfe4d8]">
                <button onClick={() => setSelectedStay(stay)} className="h-full w-full" aria-label={`Ver detalles de ${stay.name}`}><img
                  src={stay.image}
                  alt={stay.name}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                /></button>
                <span className="pointer-events-none absolute left-4 top-4 rounded-full bg-[#f6f3eb]/95 px-4 py-2 text-xs font-bold text-[#17352b]">
                  {stay.tag}
                </span>
                <button
                  onClick={() =>
                    setFavorites((prev) =>
                      prev.includes(stay.id)
                        ? prev.filter((id) => id !== stay.id)
                        : [...prev, stay.id],
                    )
                  }
                  className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/95 text-[#17352b] transition hover:scale-105"
                  aria-label={`${favorites.includes(stay.id) ? 'Quitar' : 'Guardar'} ${stay.name} ${favorites.includes(stay.id) ? 'de' : 'en'} favoritos`}
                  aria-pressed={favorites.includes(stay.id)}
                >
                  <Icon
                    name="heart"
                    className={`h-5 w-5 ${
                      favorites.includes(stay.id)
                        ? "fill-[#d16d4f] text-[#d16d4f]"
                        : ""
                    }`}
                  />
                </button>
                <span className="pointer-events-none absolute bottom-4 left-4 rounded-full bg-[#17352b] px-3 py-1.5 text-[11px] font-bold text-white">
                  0{index + 1}
                </span>
              </div>
              <div className="px-1 pt-5">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#d16d4f]">
                    {stay.location}
                  </span>
                  {stay.rating ? <span className="flex items-center gap-1 text-sm font-bold" aria-label={`${stay.rating} de 5, ${stay.reviews} opiniones ilustrativas`}>
                    <Icon
                      name="star"
                      className="h-4 w-4 fill-[#f3c969] text-[#f3c969]"
                    />{" "}
                    {stay.rating}{" "}
                    <span className="font-normal text-[#17352b]/50">
                      ({stay.reviews})
                    </span>
                  </span> : <span className="text-xs font-semibold">Nuevo</span>}
                </div>
                <h3 className="font-display text-2xl font-semibold">
                  <button className="text-left hover:underline underline-offset-4" onClick={() => setSelectedStay(stay)}>{stay.name}</button>
                </h3>
                <div className="mt-3 flex items-end justify-between gap-3 border-t border-[#17352b]/10 pt-4">
                  <span className="text-sm text-[#17352b]/65">
                    {stay.guests} huéspedes · {stay.beds}{" "}
                    {stay.beds === 1 ? "cama" : "camas"}
                  </span>
                  <span className="text-right">
                    <strong className="text-lg">{money(stay.price)}</strong>
                    <small className="block text-[#17352b]/50">por noche</small>
                  </span>
                </div>
                <button onClick={() => setSelectedStay(stay)} className="secondary-button mt-4 w-full inline-flex items-center justify-center gap-2">Ver cabaña y reservar <Icon name="arrow" className="h-4 w-4" /></button>
              </div>
            </article>
          ))}
        </div>}
        {loading && <div role="status" className="empty-state">Consultando alojamientos y disponibilidad…</div>}
        {!loading && !error && filteredStays.length === 0 && (
          <div className="rounded-3xl border border-dashed border-[#17352b]/25 py-16 text-center">
            <h3 className="font-display text-3xl">No encontramos refugios con estos filtros.</h3>
            <p className="muted mt-3 px-4">Prueba otro destino, cambia las fechas o guarda una cabaña en tus favoritos.</p>
            <button onClick={resetFilters} className="primary-button mt-6">Ver todos los alojamientos</button>
          </div>
        )}
      </section>

      <section
        id="experiencia"
        className="bg-[#17352b] px-5 py-20 text-white sm:px-8 lg:py-28"
      >
        <div className="mx-auto grid max-w-[1284px] items-center gap-14 lg:grid-cols-[1.05fr_.95fr]">
          <div className="relative mx-auto w-full max-w-xl">
            <div className="aspect-[4/5] overflow-hidden rounded-[36px]">
              <img
                src="https://images.unsplash.com/photo-1655880397426-405271e82b63?auto=format&fit=crop&w=1100&q=90"
                alt="Cabaña tranquila en medio del bosque"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-3 max-w-[230px] rounded-[24px] bg-[#f3c969] p-6 text-[#17352b] shadow-xl sm:right-[-35px]">
              <Icon name="spark" className="mb-5 h-7 w-7" />
              <p className="font-display text-xl font-semibold leading-snug">
                “El mejor lugar para volver a escucharnos.”
              </p>
              <p className="mt-3 text-xs font-bold uppercase tracking-wider opacity-60">
                Camila & Tomás
              </p>
            </div>
          </div>
          <div className="lg:pl-14">
            <span className="eyebrow text-[#f3c969] before:bg-[#f3c969]">
              Nuestra promesa
            </span>
            <h2 className="font-display mt-5 text-4xl leading-[1.05] font-medium tracking-tight sm:text-6xl">
              Menos ruido.
              <br />
              <em className="font-normal text-[#f3c969]">Más historias.</em>
            </h2>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-white/65">
              Elegimos cada alojamiento por su belleza, su entorno y la calidez
              de quienes reciben. Sin sorpresas, solo lugares que vale la pena
              recordar.
            </p>
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {[
                {
                  icon: "check" as IconName,
                  title: "Selección cuidada",
                  text: "Descubre el entorno y los servicios de cada refugio.",
                },
                {
                  icon: "shield" as IconName,
                  title: "Reserva sencilla",
                  text: "Fechas disponibles y precio total antes de confirmar.",
                },
                {
                  icon: "leaf" as IconName,
                  title: "Turismo consciente",
                  text: "Anfitriones que cuidan su entorno.",
                },
                {
                  icon: "map" as IconName,
                  title: "Rincones únicos",
                  text: "Paisajes fuera de las rutas habituales.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex gap-4 border-t border-white/15 pt-5"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 text-[#f3c969]">
                    <Icon name={item.icon} className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-bold">{item.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-white/55">
                      {item.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        id="destinos"
        className="mx-auto max-w-[1380px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28"
      >
        <div className="mb-10 flex items-end justify-between">
          <div>
            <span className="eyebrow">Explora sin prisa</span>
            <h2 className="font-display mt-3 text-4xl font-medium tracking-tight sm:text-6xl">
              Elige tu paisaje
            </h2>
          </div>
          <button onClick={() => { resetFilters(); scrollToStays() }} className="hidden items-center gap-2 border-b border-[#17352b] pb-1 text-sm font-bold sm:flex">
            Ver todos <Icon name="arrow" className="h-4 w-4" />
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {destinations.map((item, index) => (
            <button
              key={item.name}
              onClick={() => chooseDestination(item.name)}
              className={`group relative overflow-hidden rounded-[28px] text-left ${
                index === 1 ? "md:mt-12" : ""
              }`}
            >
              <div className="aspect-[.82]">
                <img
                  src={item.image}
                  alt=""
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
              </div>
              <div className="card-overlay absolute inset-0" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-6 text-white">
                <div>
                  <p className="font-display text-3xl font-semibold">
                    {item.name}
                  </p>
                  <p className="mt-1 text-sm text-white/70">{catalog.filter(stay => item.name === 'Bosques nativos' ? stay.category === 'Bosque' : stay.region === item.name).length} alojamientos en la demo</p>
                </div>
                <span className="grid h-11 w-11 place-items-center rounded-full bg-[#f3c969] text-[#17352b] transition group-hover:translate-x-1">
                  <Icon name="arrow" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="mx-5 mb-8 overflow-hidden rounded-[32px] bg-[#d16d4f] px-6 py-16 text-center text-white sm:mx-8 sm:px-12 lg:mx-12 lg:py-20">
        <Icon
          name="mountain"
          className="mx-auto mb-5 h-11 w-11 text-[#f3c969]"
        />
        <h2 className="font-display mx-auto max-w-3xl text-4xl font-medium tracking-tight sm:text-6xl">
          Tu próxima historia empieza aquí.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-white/75">
          Encuentra ese lugar que llevas tiempo imaginando. La naturaleza ya
          está esperando.
        </p>
        <button
          onClick={() =>
            document
              .querySelector("#alojamientos")
              ?.scrollIntoView({ behavior: "smooth" })
          }
          className="mt-8 rounded-full bg-[#f3c969] px-8 py-4 text-sm font-bold text-[#17352b] transition hover:bg-white"
        >
          Descubrir alojamientos
        </button>
      </section>

      <footer className="px-5 py-12 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1284px] flex-col justify-between gap-8 border-b border-[#17352b]/15 pb-10 md:flex-row md:items-center">
          <a href="#" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#17352b] text-white">
              <Icon name="mountain" />
            </span>
            <span className="font-display text-2xl font-semibold">
              refugios.
            </span>
          </a>
          <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-semibold">
            <a href="#alojamientos">Alojamientos</a>
            <a href="#destinos">Destinos</a>
            <a href="#experiencia">Quiénes somos</a>
            <button onClick={() => setPanel('help')}>Ayuda</button>
            <button onClick={() => setPanel('reservations')}>Mis reservas</button>
          </div>
        </div>
        <div className="mx-auto flex max-w-[1284px] flex-col justify-between gap-3 pt-6 text-xs text-[#17352b]/55 sm:flex-row">
          <p>© {new Date().getFullYear()} Refugios. Viajar para volver.</p>
          <p>Hecho para quienes aman estar afuera.</p>
        </div>
      </footer>
      {notice && <div role="status" className="toast"><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Cerrar aviso">✕</button></div>}
      {selectedStay && <StayDetail stay={selectedStay} filters={filters} onClose={() => setSelectedStay(null)} onBooked={() => setRevision(value => value + 1)} />}
      {panel === 'reservations' && <Reservations onClose={() => setPanel(null)} onChanged={() => setRevision(value => value + 1)} />}
      {panel === 'host' && <HostForm onClose={() => setPanel(null)} onCreated={() => { resetFilters(); setRevision(value => value + 1); scrollToStays() }} />}
      {panel === 'help' && <Help onClose={() => setPanel(null)} />}
    </main>
  )
}
