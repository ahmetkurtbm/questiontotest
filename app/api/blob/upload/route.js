import { put } from "@vercel/blob";
import { auth } from "@/auth";

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 8 * 1024 * 1024;

/**
 * Tek bir gorseli Blob'a yukler ve kalici URL'i doner.
 *
 * Neden istemciden dogrudan yukleme degil: @vercel/blob'un istemci-yukleme
 * akisi tarayiciya verilecek token'i imzalamak icin BLOB_READ_WRITE_TOKEN'a
 * ihtiyac duyuyor. Vercel yeni Blob store'lari OIDC ile baglayip statik token
 * uretmedigi icin o yol kullanilamiyor. Sunucu tarafi put() ise OIDC +
 * BLOB_STORE_ID ile calisiyor.
 *
 * Istek basina tek gorsel tasindigi icin (~150-400 KB) fonksiyon govde siniri
 * sorun olmuyor; toplu aktarimda gorseller sirayla yukleniyor.
 */
export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });
  }

  const contentType = (request.headers.get("content-type") || "").split(";")[0].trim();
  if (!ALLOWED.includes(contentType)) {
    return Response.json({ error: "Yalnızca JPEG, PNG veya WebP yüklenebilir" }, { status: 400 });
  }

  const declaredSize = Number(request.headers.get("content-length") || 0);
  if (declaredSize > MAX_BYTES) {
    return Response.json({ error: "Görsel 8 MB'tan büyük olamaz" }, { status: 413 });
  }

  const url = new URL(request.url);
  const prefix = (url.searchParams.get("prefix") || "soru").replace(/[^a-z0-9-]/gi, "");
  const extension = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";

  try {
    const body = await request.arrayBuffer();
    if (body.byteLength === 0) {
      return Response.json({ error: "Boş dosya" }, { status: 400 });
    }

    const blob = await put(`${prefix || "soru"}/${Date.now()}.${extension}`, body, {
      access: "public",
      contentType,
      addRandomSuffix: true,
    });

    return Response.json({ url: blob.url });
  } catch (error) {
    console.error("Blob yükleme hatası:", error);

    // Store private olarak olusturulmussa public yazma reddediliyor.
    if (/private store|private access/i.test(error.message || "")) {
      return Response.json(
        {
          error:
            "Blob store 'private' olarak oluşturulmuş. Görseller doğrudan URL ile gösterildiği için 'public' erişimli bir store gerekiyor: Vercel → Storage → mevcut store'u silin, Access: Public ile yenisini oluşturup projeye bağlayın.",
        },
        { status: 503 }
      );
    }

    // Kimlik bilgisi eksikse ne yapilmasi gerektigini soyle.
    if (/credential|token|storeId|BLOB_STORE_ID/i.test(error.message || "")) {
      return Response.json(
        {
          error:
            "Görsel deposuna erişilemedi. Vercel → Storage → Blob store'un bu projeye bağlı olduğundan emin olun, sonra yeniden deploy edin.",
        },
        { status: 503 }
      );
    }

    return Response.json({ error: "Görsel yüklenemedi" }, { status: 500 });
  }
}
