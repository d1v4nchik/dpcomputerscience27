/* Offline support.
   1. On the live site: saves the notes on the device (service worker) so they open without
      internet, and lets the browser offer "Install app". Online, you always get the newest notes.
   2. In the downloaded single-file copy: checks once whether a newer copy has been published
      and, if so, shows a small banner with links to the live site and the new download. */
(function () {
  var SITE = 'https://d1v4nchik.github.io/dpcomputerscience27/';
  var DOWNLOAD = 'https://github.com/d1v4nchik/dpcomputerscience27/releases/download/offline/ib-cs-notes-offline.html';
  var RELEASE_API = 'https://api.github.com/repos/d1v4nchik/dpcomputerscience27/releases/tags/offline';

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  if (/^https?:$/.test(location.protocol) && 'serviceWorker' in navigator) {
    if (!document.querySelector('link[rel="manifest"]')) {
      var l = document.createElement('link'); l.rel = 'manifest'; l.href = 'manifest.webmanifest';
      document.head.appendChild(l);
    }
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
    return;
  }

  var built = window.CS_BUILD;
  if (!built || !window.fetch) return;

  function banner(newDate) {
    if (lsGet('csOfflineHide') === built + '>' + newDate) return;
    var dark = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches;
    var b = document.createElement('div');
    b.setAttribute('role', 'status');
    b.style.cssText = 'position:fixed;left:12px;right:12px;bottom:12px;z-index:9999;max-width:560px;margin:0 auto;' +
      'padding:12px 14px;border-radius:10px;font:15px/1.4 system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.25);' +
      (dark ? 'background:#22252D;color:#F1F2F4;border:1px solid #3A3E48;' : 'background:#FFF;color:#15171C;border:1px solid #D9DCE2;');
    var link = 'color:' + (dark ? '#8FB0FF' : '#2C5BDB') + ';font-weight:700;';
    b.innerHTML = '<b>Newer notes are out.</b> This downloaded copy doesn’t update itself. ' +
      '<a style="' + link + '" href="' + SITE + '" target="_blank" rel="noopener">Open the live site</a> or ' +
      '<a style="' + link + '" href="' + DOWNLOAD + '">download the new copy</a>. ' +
      '<button type="button" style="margin-left:6px;border:0;background:none;color:inherit;font:inherit;text-decoration:underline;cursor:pointer">Not now</button>';
    b.querySelector('button').onclick = function () { lsSet('csOfflineHide', built + '>' + newDate); b.remove(); };
    document.body.appendChild(b);
  }

  fetch(RELEASE_API, { headers: { Accept: 'application/vnd.github+json' } })
    .then(function (r) { if (!r.ok) throw r.status; return r.json(); })
    .then(function (rel) {
      var a = (rel.assets || []).filter(function (x) { return x.name === 'ib-cs-notes-offline.html'; })[0];
      if (a && a.label && a.label.indexOf(built) === -1) banner(a.updated_at || a.label);
    })
    .catch(function () { /* offline or rate limited: say nothing */ });
})();
