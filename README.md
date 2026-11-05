# Refugios · Demo funcional de cabañas

La interfaz original ahora incluye una aplicación React con API Node y base de datos SQLite. Requiere **Node 24.14 o superior dentro de la versión 24** y npm.

## Ejecutar en desarrollo

```sh
npm install
npm run dev
```

Abre **http://127.0.0.1:5175**. El comando inicia Vite y la API en el puerto 3015. Si alguno de esos puertos está ocupado, detén el otro proceso antes de iniciar.

## Funcionalidades

- Buscar por nombre, destino o zona, fechas disponibles y cantidad exacta de huéspedes; búsqueda sin distinción de acentos.
- Filtrar por paisaje, ordenar por precio y guardar favoritos entre recargas del navegador.
- Consultar el detalle del alojamiento, sus servicios, capacidad y precio.
- Reservar entre 1 y 30 noches con total calculado en el servidor y bloqueo de fechas superpuestas.
- Ver y cancelar las reservas de este navegador, y descargar su comprobante de demostración.
- Publicar nuevas cabañas en el catálogo local y reservarlas.
- Navegación móvil, estados de carga, errores y ayuda.

Los tres alojamientos iniciales, sus opiniones y testimonios son ilustrativos. **No se procesan pagos ni se envían correos reales.** Las nuevas publicaciones aparecen de inmediato, sin revisión. Esta versión está pensada para demostrar el flujo local, no para recibir reservas comerciales.

## Datos

La base se crea automáticamente en `data/refugios.sqlite`. Las reservas y publicaciones sobreviven al reinicio del servidor. No se debe subir esta carpeta a Git.

Las reservas se vinculan a una cookie HttpOnly de este navegador; no hay cuentas de usuario. Borrar cookies o cambiar de navegador impide consultar esas reservas. Los favoritos usan `localStorage`. Los bloqueos de fechas se comparten entre todos los navegadores conectados al mismo servidor.

Puedes copiar `.env.example` a `.env` para configurar `PORT`, `HOST` o `DATA_FILE`. El servidor de desarrollo usa los puertos fijos indicados arriba. Las imágenes y fuentes necesitan conexión a Internet.

## Compilar y ejecutar la versión compilada

```sh
npm run build
npm start
```

Abre **http://127.0.0.1:3015**. Un único servidor sirve la web compilada y la API. Para alojarla se requiere Node 24 con un disco persistente para SQLite; un hosting de archivos estáticos no ejecuta la API. No se ha desplegado esta demo.

```sh
npm test
```

Las pruebas usan bases aisladas y cubren búsqueda, validación, importes, colisiones de fechas, privacidad por sesión, cancelación, publicaciones y persistencia.

Para uso comercial faltaría integrar autenticación de viajeros y anfitriones, aprobación y gestión de anuncios, pagos, notificaciones y una configuración de producción con HTTPS, copias de seguridad y controles de acceso.
