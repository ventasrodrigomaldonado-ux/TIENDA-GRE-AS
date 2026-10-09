
const CACHE_NAME = "tropic-district-v1";

const ARCHIVOS_BASE = [
  "./",
  "./index.html",
  "./manifest.webmanifest"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ARCHIVOS_BASE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((nombres) =>
      Promise.all(
        nombres
          .filter((nombre) =>
            nombre.startsWith("tropic-district-") &&
            nombre !== CACHE_NAME
          )
          .map((nombre) => caches.delete(nombre))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const solicitud = event.request;
  const url = new URL(solicitud.url);

  // Solo solicitudes GET del mismo sitio.
  // No interceptar Supabase ni las peticiones de la base de datos.
  if (
    solicitud.method !== "GET" ||
    url.origin !== self.location.origin
  ) {
    return;
  }

  // Para navegación, intentar cargar la versión actual
  // y usar la copia guardada si no hay conexión.
  if (solicitud.mode === "navigate") {
    event.respondWith(
      fetch(solicitud)
        .then((respuesta) => {
          if (respuesta.ok) {
            const copia = respuesta.clone();
            caches.open(CACHE_NAME)
              .then((cache) => cache.put("./index.html", copia));
          }
          return respuesta;
        })
        .catch(async () => {
          return (
            await caches.match(solicitud) ||
            await caches.match("./index.html") ||
            Response.error()
          );
        })
    );
  }
});
