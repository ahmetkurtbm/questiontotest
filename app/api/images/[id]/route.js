import { query } from "@/lib/db";
import { imageIdFromUrl } from "@/lib/images";
import { failure } from "@/lib/session";

export async function GET(_request, { params }) {
  const { id } = await params;
  if (!imageIdFromUrl(`/api/images/${id}`)) return new Response("Bulunamadı", { status: 404 });

  try {
    const { rows } = await query("SELECT content_type, data FROM images WHERE id = $1", [id]);
    if (rows.length === 0) return new Response("Bulunamadı", { status: 404 });

    return new Response(rows[0].data, {
      headers: {
        "Content-Type": rows[0].content_type,
        // Görsel içeriği değişmez; yeni görsel her zaman yeni kimlik alır.
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    return failure(error);
  }
}
