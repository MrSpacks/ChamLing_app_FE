const CACHE_NAME = 'chamling-v1';
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Обработка запросов
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Возвращаем из кеша или делаем запрос
        return response || fetch(event.request);
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

