/** İstek başlıklarından istemci IP'sini çıkarır (x-vercel-forwarded-for → x-real-ip → x-forwarded-for'un ilk değeri). */
export function clientIp(headers) {
  const vercel = headers.get("x-vercel-forwarded-for");
  if (vercel) return vercel.split(",")[0].trim();
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  return (headers.get("x-forwarded-for") || "").split(",")[0].trim() || "bilinmiyor";
}

/**
 * Bellek içi sabit pencereli hız sınırlayıcı. Harita sınırsız büyümesin diye
 * süresi dolan kayıtlar temizlenir; yine de `maxKeys` aşılırsa en eski kayıtlar atılır.
 * Sunucusuz ortamda her örnek kendi sayacını tutar; amaç kaba bir kötüye kullanım freni.
 */
export function createRateLimiter({ windowMs = 60 * 60 * 1000, maxKeys = 5000 } = {}) {
  const hits = new Map();

  return {
    size: () => hits.size,
    /** İstek izinliyse true döner ve sayacı artırır. */
    allow(key, limit, now = Date.now()) {
      if (hits.size >= maxKeys) {
        for (const [k, entry] of hits) if (entry.resetAt <= now) hits.delete(k);
        // Hâlâ doluysa en eski kayıtlar (Map ekleme sırasını korur) atılır.
        for (const k of hits.keys()) {
          if (hits.size < maxKeys) break;
          hits.delete(k);
        }
      }

      const entry = hits.get(key);
      if (!entry || entry.resetAt <= now) {
        hits.set(key, { count: 1, resetAt: now + windowMs });
        return true;
      }
      if (entry.count >= limit) return false;
      entry.count++;
      return true;
    },
  };
}
