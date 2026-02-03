
const CACHE_NAME = 'creative-urban-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@200..1000&family=Amiri:ital,wght@0,400;0,700;1,400;1,700&display=swap'
];

// تثبيت الـ Service Worker وحفظ الأصول الثابتة
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// استراتيجية Cache First للأصول الثابتة و Network First للبيانات الديناميكية
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // للأصول الثابتة المعروفة
  if (STATIC_ASSETS.includes(url.pathname) || url.origin === 'https://fonts.gstatic.com') {
    event.respondWith(
      caches.match(request).then((response) => {
        return response || fetch(request).then((fetchRes) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, fetchRes.clone());
            return fetchRes;
          });
        });
      })
    );
    return;
  }

  // الاستراتيجية الافتراضية
  event.respondWith(
    caches.match(request).then((response) => {
      return response || fetch(request).catch(() => {
        // إذا فشل الاتصال ولم يوجد كاش، يمكن إرجاع صفحة أوفلاين مخصصة هنا
      });
    })
  );
});

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
