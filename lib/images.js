const IMAGE_URL = /^\/api\/images\/([0-9a-f-]{36})$/i;

/** `/api/images/<uuid>` adresinden görsel kimliğini çıkarır; başka adreslerde null. */
export function imageIdFromUrl(url) {
  return IMAGE_URL.exec(url || "")?.[1] ?? null;
}

// Örnek soruların görselleri public/demo/ altında durur (bkz. lib/demo-data.js).
const DEMO_IMAGE = /^\/demo\/[\w.-]+$/;

/** Soru görseli olarak yalnızca uygulamanın kendi görselleri (`/api/images/<uuid>` ya da demo görselleri) kabul edilir. */
export function isOwnImageUrl(url) {
  return typeof url === "string" && (imageIdFromUrl(url) !== null || DEMO_IMAGE.test(url));
}
