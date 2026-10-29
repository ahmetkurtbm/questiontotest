import { ANSWER_KEYS, DIFFICULTIES, SUBJECTS } from "@/lib/subjects";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const DATA_URL = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/;

// Gemini kutuları kendi alıştığı biçimde, [ymin, xmin, ymax, xmax] olarak 0-1000
// ölçeğinde verir; bu biçimde istemek konum doğruluğunu artırır.
const responseSchema = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          box_2d: { type: "array", items: { type: "integer" }, minItems: 4, maxItems: 4 },
          subject: { type: "string", enum: SUBJECTS },
          difficulty: { type: "string", enum: DIFFICULTIES },
          answer: { type: "string", enum: [...ANSWER_KEYS, "BILINMIYOR"] },
        },
        required: ["box_2d", "subject", "difficulty", "answer"],
      },
    },
  },
  required: ["questions"],
};

const PROMPT = `Bu görsel bir sınav/test kitabı sayfasıdır. Sayfadaki her çoktan seçmeli soruyu bul.

Her soru için:
- box_2d: Soru kökünü ve bütün şıklarını (A-E) kapsayan kutu, [ymin, xmin, ymax, xmax] biçiminde ve 0-1000 ölçeğinde. Soru numarasını kutuya dahil et; sayfa başlığını, sayfa numarasını ve komşu soruları dahil etme.
- subject: Listeden sorunun ölçtüğü konuya en uygun olanı.
- difficulty: Ortaöğretim öğrencisi için Kolay, Orta veya Zor.
- answer: Soruyu çöz ve doğru şıkkı ver. Emin değilsen BILINMIYOR yaz; tahmin etme.

Sayfada soru yoksa boş liste döndür. Soruları okuma sırasıyla (sütun sütun, yukarıdan aşağıya) listele.`;

/** Sayfa, gerçek analiz mi yapılacağını yoksa demo sonucu mu gösterileceğini buradan öğrenir. */
export function GET() {
  return Response.json({ configured: Boolean(process.env.GEMINI_API_KEY) });
}

export async function POST(request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "GEMINI_API_KEY tanımlı değil; yapay zekâ özelliği kapalı." }, { status: 503 });
  }

  const { image } = (await request.json().catch(() => ({}))) || {};
  const match = DATA_URL.exec(typeof image === "string" ? image : "");
  if (!match) return Response.json({ error: "Sayfa görseli JPEG, PNG veya WebP olmalı." }, { status: 400 });
  const [, mediaType, data] = match;
  if (data.length * 0.75 > MAX_IMAGE_BYTES) {
    return Response.json({ error: "Sayfa görseli 5 MB'tan büyük olamaz." }, { status: 413 });
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [
            { inline_data: { mime_type: mediaType, data } },
            { text: `${PROMPT}\n\nKonu listesi: ${SUBJECTS.join(" | ")}` },
          ],
        }],
        generationConfig: { responseMimeType: "application/json", responseJsonSchema: responseSchema, temperature: 0.1 },
      }),
    });

    if (!response.ok) {
      console.error("Gemini hatası:", response.status, await response.text());
      const message = response.status === 429
        ? "Gemini ücretsiz kullanım sınırına ulaşıldı. Biraz sonra tekrar deneyin."
        : response.status === 400 || response.status === 403
          ? "GEMINI_API_KEY geçersiz ya da yetkisiz."
          : "Yapay zekâ servisine ulaşılamadı.";
      return Response.json({ error: message }, { status: response.status === 429 ? 429 : 502 });
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.find((part) => typeof part.text === "string")?.text;
    const parsed = text ? JSON.parse(text) : null;
    if (!Array.isArray(parsed?.questions)) {
      return Response.json({ error: "Yapay zekâ yanıtı okunamadı. Tekrar deneyin." }, { status: 502 });
    }

    // 0-1000 ölçeğindeki kutu, istemcinin beklediği 0-1 oranlı { x, y, width, height } biçimine çevrilir.
    const clamp = (value) => Math.min(1000, Math.max(0, Number(value) || 0)) / 1000;
    const questions = parsed.questions
      .filter((q) => Array.isArray(q.box_2d) && q.box_2d.length === 4)
      .map(({ box_2d: [ymin, xmin, ymax, xmax], subject, difficulty, answer }) => ({
        box: { x: clamp(xmin), y: clamp(ymin), width: clamp(xmax) - clamp(xmin), height: clamp(ymax) - clamp(ymin) },
        subject: SUBJECTS.includes(subject) ? subject : SUBJECTS[0],
        difficulty: DIFFICULTIES.includes(difficulty) ? difficulty : "Orta",
        answer: ANSWER_KEYS.includes(answer) ? answer : null,
      }))
      .filter(({ box }) => box.width > 0.02 && box.height > 0.01);

    return Response.json({ questions });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Sayfa analiz edilemedi." }, { status: 500 });
  }
}
