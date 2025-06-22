// Define un nombre y versión para el caché
const CACHE_NAME = 'reportes-pro-cache-v1';

// Lista de URLs que se van a cachear.
// Incluimos la página principal y TODOS los recursos externos.
const URLS_TO_CACHE = [
  '/',
  'index.html',
  'manifest.json',
  'IMAGEN1.png',
  'IMAGEN1.png',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2' // Nota: Google Fonts puede cargar otros archivos, este es un ejemplo. El Service Worker los cacheará dinámicamente.
];

// Evento 'install': se dispara cuando el Service Worker se instala.
// Aquí es donde abrimos el caché y guardamos nuestros archivos.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierto, guardando archivos...');
        return cache.addAll(URLS_TO_CACHE);
      })
      .catch(err => {
        console.error('Falló el cacheo inicial de archivos:', err);
      })
  );
});

// Evento 'fetch': se dispara cada vez que la app pide un recurso (una imagen, un script, etc.).
// Aquí interceptamos la petición y decidimos si la servimos desde el caché o desde la red.
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si la respuesta está en el caché, la devolvemos.
        if (response) {
          return response;
        }

        // Si no, la pedimos a la red, la devolvemos y la guardamos en el caché para la próxima vez.
        return fetch(event.request).then(
          networkResponse => {
            // Verificamos que sea una respuesta válida
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
              return networkResponse;
            }

            // Clonamos la respuesta porque solo se puede consumir una vez.
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        );
      })
      .catch(error => {
        // Si todo falla (estás offline y no está en caché), puedes devolver una página de fallback.
        // Por ahora, solo registramos el error.
        console.error('Error en fetch:', error);
        // Opcional: Devolver una página offline de fallback
        // return caches.match('offline.html');
      })
  );
});

// Evento 'activate': se dispara cuando un nuevo Service Worker se activa.
// Aquí se limpian los cachés antiguos para no ocupar espacio innecesario.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});