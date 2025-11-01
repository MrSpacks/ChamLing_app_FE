const CACHE_NAME = 'chamling-v2';
const RUNTIME_CACHE = 'chamling-runtime-v1';

// Ресурсы для кеширования при установке
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js',
  '/logo192.png',
  '/logo512.png',
  '/manifest.json'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(urlsToCache.map(url => new Request(url, { cache: 'reload' })))
          .catch(err => {
            console.log('Service Worker: Some files failed to cache', err);
          });
      })
      .then(() => self.skipWaiting())
  );
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim())
  );
});

// Обработка запросов - стратегия Cache First для статических ресурсов
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Пропускаем запросы к API (они обрабатываются через IndexedDB)
  if (url.pathname.startsWith('/api/')) {
    // Для API используем Network First, но если офлайн - возвращаем ошибку
    // Фактическая офлайн работа обеспечивается через IndexedDB на клиенте
    event.respondWith(
      fetch(request)
        .catch(() => {
          // Офлайн - возвращаем ответ с ошибкой, клиент обработает через IndexedDB
          return new Response(
            JSON.stringify({ offline: true, error: 'No internet connection' }),
            {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
    return;
  }

  // Для статических ресурсов используем Cache First
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        // Если нет в кеше, запрашиваем из сети и кешируем
        return fetch(request)
          .then((response) => {
            // Кешируем только успешные GET запросы
            if (request.method === 'GET' && response.status === 200) {
              const responseToCache = response.clone();
              caches.open(RUNTIME_CACHE)
                .then((cache) => {
                  cache.put(request, responseToCache);
                });
            }
            return response;
          })
          .catch(() => {
            // Если офлайн и нет в кеше, возвращаем заглушку для HTML
            if (request.destination === 'document') {
              return caches.match('/');
            }
          });
      })
  );
});

// Обработка push-уведомлений
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Время учить слова! 📚',
    icon: '/logo192.png',
    badge: '/logo192.png',
    vibrate: [200, 100, 200],
    tag: 'chamling-notification',
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: 'Открыть приложение'
      },
      {
        action: 'close',
        title: 'Закрыть'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('ChamLing', options)
  );
});

// Обработка кликов по уведомлениям
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/dashboard/my-dict')
    );
  }
});

// Обработка scheduled notifications (планируемых уведомлений)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
    const { time, message } = event.data;
    
    // Используем setTimeout для простого планирования
    // В реальном приложении лучше использовать более надежные методы
    const now = Date.now();
    const scheduledTime = new Date(time).getTime();
    const delay = scheduledTime - now;

    if (delay > 0) {
      setTimeout(() => {
        self.registration.showNotification('ChamLing', {
          body: message || 'Время учить слова! 📚',
          icon: '/logo192.png',
          badge: '/logo192.png',
          vibrate: [200, 100, 200],
          tag: 'chamling-notification',
          requireInteraction: false
        });
      }, delay);
    }
  }
});

