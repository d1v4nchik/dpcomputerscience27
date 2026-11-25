/* Service worker: keeps a copy of the notes on this device so the site still opens offline.
   It always tries the network first, so anyone online gets the newest notes automatically,
   and only falls back to the saved copy when there is no connection. */
var CACHE = 'cs-notes-v1';

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    // Save the page shell, then every local file it links to, plus the notes themselves.
    return fetch('./', { cache: 'no-cache' }).then(function (r) {
      var copy = r.clone();
      return r.text().then(function (html) {
        var urls = ['assets/pages.html', 'favicon.svg'], m, re = /(?:src|href)="((?:assets\/|favicon)[^"]+)"/g;
        while ((m = re.exec(html))) urls.push(m[1]);
        return c.put('./', copy).then(function () {
          return Promise.all(urls.map(function (u) { return c.add(u).catch(function () {}); }));
        });
      });
    });
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  var local = url.origin === self.location.origin;
  var fonts = /^fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!local && !fonts) return;
  e.respondWith(fetch(req).then(function (r) {
    if (r && (r.ok || r.type === 'opaque')) {
      var copy = r.clone();
      caches.open(CACHE).then(function (c) { c.put(req, copy); });
    }
    return r;
  }).catch(function () {
    return caches.match(req, { ignoreSearch: local }).then(function (hit) {
      return hit || (req.mode === 'navigate' ? caches.match('./') : Response.error());
    });
  }));
});
