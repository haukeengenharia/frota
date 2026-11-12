// Service worker do Frota Hauke: guarda o app no celular para abrir sem internet.
// Ao publicar uma versão nova, troque o número abaixo.
const VERSAO = 'frota-v4';
const ARQUIVOS = ['./', 'index.html', 'config.js', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                       // envios para o Google passam direto
  const url = new URL(req.url);

  // Fontes do Google: usa a cópia guardada
  if (url.hostname.endsWith('fonts.googleapis.com') || url.hostname.endsWith('fonts.gstatic.com')) {
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => {
      const copia = res.clone(); caches.open(VERSAO).then(c => c.put(req, copia)); return res;
    })));
    return;
  }

  // Arquivos do próprio app: tenta a internet primeiro (pega atualizações), senão usa a cópia
  if (url.origin === self.location.origin) {
    e.respondWith(fetch(req).then(res => {
      const copia = res.clone(); caches.open(VERSAO).then(c => c.put(req, copia)); return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('index.html'))));
  }
});
