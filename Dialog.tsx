import { useEffect, useRef, type ReactNode } from 'react'

export default function Dialog({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current!
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.showModal()
    return () => { dialog.close(); document.body.style.overflow = previous }
  }, [])
  return <dialog ref={ref} className={`refugios-dialog ${wide ? 'dialog-wide' : ''}`}
    aria-label={title} onCancel={event => { event.preventDefault(); onClose() }}
    onClick={event => { if (event.target === event.currentTarget) { const bounds = event.currentTarget.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose() } }}>
    <div className="dialog-top"><span className="eyebrow">refugios. / {title}</span><button type="button" className="close-button" onClick={onClose} aria-label="Cerrar ventana">✕</button></div>
    {children}
  </dialog>
}
