/**
 * Kirpilmis base64 gorseli /api/images uzerinden veritabanina yukler ve
 * kalici URL'i dondurur. Gorsel ikili olarak gonderilir; base64 govdede
 * tasinsa %33 fazladan yer kaplardi.
 */
export async function uploadDataUrl(dataUrl) {
  const blob = await (await fetch(dataUrl)).blob();
  const contentType = blob.type || "image/jpeg";

  const response = await fetch("/api/images", {
    method: "POST",
    headers: { "Content-Type": contentType },
    body: blob,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error((data && data.error) || "Görsel yüklenemedi");
  }

  return data.url;
}

/** Birden fazla gorseli sirayla yukler; ilerleme geri bildirimi verir. */
export async function uploadMany(entries, onProgress) {
  const urls = [];

  for (let i = 0; i < entries.length; i++) {
    const { dataUrl } = entries[i];
    urls.push(dataUrl ? await uploadDataUrl(dataUrl) : null);
    if (onProgress) onProgress(i + 1, entries.length);
  }

  return urls;
}
