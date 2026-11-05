import Dialog from './Dialog'

export default function Help({ onClose }: { onClose: () => void }) {
  return <Dialog title="Ayuda" onClose={onClose}>
    <h2 className="dialog-heading">Un viaje sin dudas.</h2>
    <div className="faq-list">
      <details open><summary>¿Cómo reservo?</summary><p>Busca por destino, fechas y cantidad de huéspedes. Abre una cabaña, completa tus datos y confirma. La disponibilidad se comprueba al reservar y el total corresponde al precio por noche multiplicado por las noches.</p></details>
      <details><summary>¿Esta reserva es real?</summary><p>Es una demostración interactiva. Los alojamientos y las opiniones iniciales son ilustrativos. No hay cobros, pagos ni correos reales. Todo se simula en esta página y se reinicia al recargar.</p></details>
      <details><summary>¿Cómo cancelo?</summary><p>Abre «Mis reservas», elige la reserva y confirma su cancelación hasta el día de llegada. Las fechas quedarán libres de nuevo. Solo puedes gestionar las reservas realizadas en este navegador.</p></details>
      <details><summary>¿Se guardan mis datos?</summary><p>No. Las reservas, las cabañas que publiques y tus favoritos solo existen mientras esta página está abierta. Se reinician al recargar y no se envían a ningún servidor.</p></details>
      <details><summary>¿Puedo publicar una cabaña?</summary><p>Sí. Usa «Publica tu cabaña» y completa sus datos. Aparecerá en tu catálogo de prueba y podrás simular una reserva. Solo la verás tú y desaparecerá al recargar.</p></details>
    </div>
  </Dialog>
}
