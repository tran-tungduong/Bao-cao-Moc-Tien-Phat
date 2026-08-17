// Push-only Service Worker. It intentionally does not intercept fetch requests,
// so application files always come from the network/browser HTTP cache and an
// old worker can never trap an iPhone on stale code.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', event => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch (_) { /* ignore */ }
  const title = payload.title || 'Mộc Tiên Phát';
  const options = {
    body: payload.body || 'Bạn có một cập nhật mới.',
    icon: './icons/icon-192.png',
    badge: './icons/icon-192.png',
    tag: payload.tag || 'mtp-update',
    renotify: true,
    data: { url: payload.url || './index.html' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data && event.notification.data.url
    ? event.notification.data.url
    : './index.html', self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
    for (const client of clients) {
      if (client.url.startsWith(self.location.origin) && 'focus' in client) {
        client.navigate(targetUrl);
        return client.focus();
      }
    }
    return self.clients.openWindow ? self.clients.openWindow(targetUrl) : null;
  }));
});
