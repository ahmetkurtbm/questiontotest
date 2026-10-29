import { query } from "@/lib/db";
import { failure } from "@/lib/session";

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 8 * 1024 * 1024;

/**
 * Tek bir görseli veritabanına kaydeder ve kalıcı adresini döner. Görsel
 * ikili olarak gelir (base64 gövde %33 fazladan yer kaplardı); kırpılmış soru
 * görselleri genelde 150-400 KB olduğu için istek başına tek görsel taşınır.
 */
export async function POST(request) {
  const contentType = (request.headers.get("content-type") || "").split(";")[0].trim();
  if (!ALLOWED.includes(contentType)) {
    return Response.json({ error: "Yalnızca JPEG, PNG veya WebP yüklenebilir" }, { status: 400 });
  }
  if (Number(request.headers.get("content-length") || 0) > MAX_BYTES) {
    return Response.json({ error: "Görsel 8 MB'tan büyük olamaz" }, { status: 413 });
  }

  try {
    const body = Buffer.from(await request.arrayBuffer());
    if (body.byteLength === 0) return Response.json({ error: "Boş dosya" }, { status: 400 });
    if (body.byteLength > MAX_BYTES) return Response.json({ error: "Görsel 8 MB'tan büyük olamaz" }, { status: 413 });

    const { rows } = await query(
      "INSERT INTO images (content_type, data) VALUES ($1, $2) RETURNING id",
      [contentType, body]
    );
    return Response.json({ url: `/api/images/${rows[0].id}` });
  } catch (error) {
    return failure(error);
  }
}
