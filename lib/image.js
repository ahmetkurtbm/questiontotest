// Gorseller base64 olarak saklaniyor; kucultmezsek tek soru birkac MB olup
// hem istekleri hem PDF uretimini kilitliyor.
const MAX_EDGE = 1400;
const JPEG_QUALITY = 0.88;

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Dosya okunamadı"));
    reader.readAsDataURL(file);
  });
}

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Görsel yüklenemedi"));
    image.src = src;
  });
}

function toJpeg(canvas) {
  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}

function drawOnWhite(canvas, draw) {
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  // Saydam PNG'ler JPEG'e cevrilince siyah zemin olusuyor; onune geciyoruz.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  draw(ctx);
  return toJpeg(canvas);
}

export async function shrinkDataUrl(dataUrl, maxEdge = MAX_EDGE) {
  const image = await loadImage(dataUrl);
  const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

  return drawOnWhite(canvas, (ctx) =>
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
  );
}

/**
 * @param imageEl  ekranda gorunen <img>
 * @param crop     react-image-crop'tan gelen piksel bazli secim
 */
export function cropImageElement(imageEl, crop) {
  const scaleX = imageEl.naturalWidth / imageEl.width;
  const scaleY = imageEl.naturalHeight / imageEl.height;

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(crop.width * scaleX));
  canvas.height = Math.max(1, Math.round(crop.height * scaleY));

  return drawOnWhite(canvas, (ctx) =>
    ctx.drawImage(
      imageEl,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    )
  );
}

/** Canvas uzerinden dogrudan bolge kirpar (PDF sayfalari icin). */
export function cropCanvasRegion(canvas, region) {
  const target = document.createElement("canvas");
  target.width = Math.max(1, Math.round(region.width));
  target.height = Math.max(1, Math.round(region.height));

  return drawOnWhite(target, (ctx) =>
    ctx.drawImage(
      canvas,
      region.x,
      region.y,
      region.width,
      region.height,
      0,
      0,
      target.width,
      target.height
    )
  );
}

export function approximateSizeKb(dataUrl) {
  if (!dataUrl) return 0;
  const base64 = dataUrl.split(",")[1] || "";
  return Math.round((base64.length * 0.75) / 1024);
}
