import "server-only";
import { isDemoMode, query } from "@/lib/db";

// Demo veritabanı sunucu belleğinde durur; yüklemeler sınırsız olsaydı süreç belleği tükenirdi.
export const DEMO_MAX_IMAGES = 300;
export const DEMO_MAX_BYTES = 150 * 1024 * 1024;

/**
 * Demo modunda yeni görselin kotayı aşıp aşmadığını söyler. Yerel Postgres'te
 * sınır yoktur. Aşılıyorsa kullanıcıya gösterilecek mesajı, aksi halde null döner.
 */
export async function demoQuotaError(incomingBytes, { maxImages = DEMO_MAX_IMAGES, maxBytes = DEMO_MAX_BYTES } = {}) {
  if (!isDemoMode()) return null;

  const { rows } = await query(
    "SELECT count(*)::int AS count, COALESCE(sum(octet_length(data)), 0)::bigint AS bytes FROM images"
  );
  const count = Number(rows[0].count);
  const bytes = Number(rows[0].bytes);

  if (count >= maxImages || bytes + incomingBytes > maxBytes) {
    return "Demo depolama kotası doldu. Demo sürümde en fazla 300 görsel / 150 MB saklanabilir; bazı soruları silip tekrar deneyin.";
  }
  return null;
}
