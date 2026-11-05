import Dialog from './Dialog'

export default function Help({ onClose }: { onClose: () => void }) {
  return <Dialog title="Ayuda" onClose={onClose}>
    <h2 className="dialog-heading">Un viaje sin dudas.</h2>
    <div className="faq-list">
      <details open><summary>¿Cómo reservo?</summary><p>Busca por destino, fechas y cantidad de huéspedes. Abre una cabaña, completa tus datos y confirma. La disponibilidad se comprueba al reservar y el total corresponde al precio por noche multiplicado por las noches.</p></details>
      <details><summary>¿Esta reserva es real?</summary><p>Es una demostración local. Los alojamientos y las opiniones iniciales son ilustrativos. No hay cobros, pagos ni correos reales. Las reservas se guardan en una base de datos de este servidor.</p></details>
      <details><summary>¿Cómo cancelo?</summary><p>Abre «Mis reservas», elige la reserva y confirma su cancelación hasta el día de llegada. Las fechas quedarán libres de nuevo. Solo puedes gestionar las reservas realizadas en este navegador.</p></details>
      <details><summary>¿Dónde se guardan mis favoritos?</summary><p>En el almacenamiento local de tu navegador. Se conservan al recargar, pero no se comparten con otros dispositivos. Las reservas usan una cookie: si la borras, perderás el acceso a ellas desde esta demo.</p></details>
      <details><summary>¿Puedo publicar una cabaña?</summary><p>Sí. Usa «Publica tu cabaña» y completa sus datos. Aparecerá en el catálogo local y podrá reservarse. Esta demo no verifica anfitriones ni publica anuncios en servicios externos.</p></details>
    </div>
  </Dialog>
}
