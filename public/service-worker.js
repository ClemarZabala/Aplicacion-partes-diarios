// Simple SW: cache-first para assets estáticos, nunca cachea Firestore
const CACHE = "control-partes-v5";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js?v=13",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", e=>{
  const url = e.request.url;
  if (url.includes("firestore.googleapis.com") || url.includes("firebase") || url.includes("gstatic.com")) return;
  e.respondWith(
    caches.match(e.request).then(r=> r || fetch(e.request)).catch(()=> caches.match("./index.html"))
  );
});
