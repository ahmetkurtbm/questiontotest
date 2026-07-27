import { upload } from "@vercel/blob/client";

/**
 * Kirpilmis base64 gorseli tarayicidan dogrudan Vercel Blob'a yukler ve
 * kalici URL'i dondurur. API'ye artik base64 degil sadece bu URL gidiyor.
 */
export async function uploadDataUrl(dataUrl, prefix = "soru") {
  const blob = await (await fetch(dataUrl)).blob();

  const result = await upload(`${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`, blob, {
    access: "public",
    contentType: blob.type || "image/jpeg",
    handleUploadUrl: "/api/blob/upload",
  });

  return result.url;
}

/** Birden fazla gorseli sirayla yukler; ilerleme geri bildirimi verir. */
export async function uploadMany(entries, onProgress) {
  const urls = [];

  for (let i = 0; i < entries.length; i++) {
    const { dataUrl, prefix } = entries[i];
    urls.push(dataUrl ? await uploadDataUrl(dataUrl, prefix) : null);
    if (onProgress) onProgress(i + 1, entries.length);
  }

  return urls;
}
