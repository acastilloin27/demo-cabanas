# Refugios · Demo funcional de cabañas

Demo interactiva en React y Vite, preparada para alojamiento estático en Vercel. No necesita API, base de datos, variables de entorno ni servicios externos para las interacciones. Usa Node 24 y npm para desarrollar y compilar.

## Ejecutar en desarrollo

```sh
npm install
npm run dev
```

Abre **http://127.0.0.1:5175**.

## Funcionalidades

- Buscar por nombre, destino o zona, fechas disponibles y cantidad exacta de huéspedes; búsqueda sin distinción de acentos.
- Filtrar por paisaje, ordenar por precio y marcar favoritos durante la visita.
- Consultar el detalle del alojamiento, sus servicios, capacidad y precio.
- Simular reservas entre 1 y 30 noches con cálculo del total y bloqueo de fechas superpuestas en esta visita.
- Ver y cancelar las reservas de este navegador, y descargar su comprobante de demostración.
- Probar la publicación de cabañas y reservarlas en el catálogo de esta visita.
- Navegación móvil, estados de carga, errores y ayuda.

Los alojamientos, las opiniones y los testimonios son ilustrativos. **No se procesan pagos ni se envían correos reales.** Esta versión permite mostrar los flujos de la web sin recibir reservas comerciales.

## Datos

Los favoritos, las reservas y las publicaciones existen únicamente en la memoria de la página. **Todo se reinicia al recargar.** No se usan cookies, almacenamiento local ni base de datos. Cada visitante tiene su propia simulación y los datos de los formularios no se envían a un servidor.

Las fotografías y fuentes se cargan de Unsplash y Google Fonts y requieren conexión a Internet. El comprobante solo se descarga si lo solicitas.

## Compilar y ejecutar la versión compilada

```sh
npm run build
npm start
```

Abre **http://127.0.0.1:3015** para previsualizar la carpeta `dist`.

## Vercel

Sitio: **https://demo-cabanas-inky.vercel.app/**.

Conecta el repositorio `acastilloin27/demo-cabanas`, rama `main`, con preset **Vite**, comando de compilación `npm run build` y salida `dist`. `vercel.json` declara esa configuración. No necesitas configurar Supabase ni rutas `/api`.

## Pruebas

```sh
npm test
```

Las pruebas cubren búsqueda, validación, cálculo del total, colisiones de fechas, cancelación, publicaciones y reinicio de la simulación.

Es una demo de presentación. Para convertirla en un servicio de reservas se necesitaría un backend con persistencia y servicios reales.
