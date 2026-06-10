/* Service Worker — รองรับใช้งาน offline (cache app shell + ข้อมูล)
 * - หน้าเว็บ (navigation): network-first → ออนไลน์ได้ของใหม่เสมอ, ออฟไลน์ใช้ cache
 * - ไฟล์อื่น (JS/CSS/JSON/รูป): stale-while-revalidate → เร็ว + อัปเดตเบื้องหลัง
 */
const CACHE = "wynns-cache-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // หน้าเว็บ: network-first
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        try {
          const res = await fetch(req);
          cache.put(req, res.clone());
          return res;
        } catch {
          return (await cache.match(req)) || (await cache.match("./")) || Response.error();
        }
      })()
    );
    return;
  }

  // ไฟล์อื่น: stale-while-revalidate
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req);
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200) cache.put(req, res.clone());
          return res;
        })
        .catch(() => null);
      return cached || (await network) || Response.error();
    })()
  );
});
