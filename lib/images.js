const IMAGE_URL = /^\/api\/images\/([0-9a-f-]{36})$/i;

/** `/api/images/<uuid>` adresinden görsel kimliğini çıkarır; başka adreslerde null. */
export function imageIdFromUrl(url) {
  return IMAGE_URL.exec(url || "")?.[1] ?? null;
}
