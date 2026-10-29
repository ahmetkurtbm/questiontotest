import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { ANSWER_KEYS, DIFFICULTIES, SUBJECTS } from "@/lib/subjects";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const DATA_URL = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/;

const DetectionSchema = z.object({
  questions: z.array(
    z.object({
      // Görsel genişliğine/yüksekliğine oranla 0-1 arası; sol üst köşe + boyut.
      box: z.object({ x: z.number(), y: z.number(), width: z.number(), height: z.number() }),
      subject: z.enum(SUBJECTS),
      difficulty: z.enum(DIFFICULTIES),
      answer: z.enum(ANSWER_KEYS).nullable(),
    })
  ),
});

const PROMPT = `Bu görsel bir sınav/test kitabı sayfasıdır. Sayfadaki her çoktan seçmeli soruyu bul.

Her soru için:
- box: Soru kökünü ve bütün şıklarını (A-E) kapsayan en küçük dikdörtgen. Değerler görselin genişliğine ve yüksekliğine oranla 0 ile 1 arasında olsun (x, y sol üst köşe). Soru numarasını kutuya dahil et; sayfa başlığını, sayfa numarasını ve komşu soruları dahil etme. Kutuyu kenarlardan çok az boşluk bırakacak şekilde çiz.
- subject: Listeden sorunun ölçtüğü konuya en uygun olanı.
- difficulty: Ortaöğretim öğrencisi için Kolay, Orta veya Zor.
- answer: Soruyu çöz ve doğru şıkkı ver. Emin değilsen null döndür; tahmin etme.

Sayfada soru yoksa boş liste döndür. Soruları sayfadaki okuma sırasıyla (sütun sütun, yukarıdan aşağıya) listele.`;

/** Sayfa bilir ki gerçek analiz mi yapılacak, yoksa demo sonucu mu gösterilecek. */
export function GET() {
  return Response.json({ configured: Boolean(process.env.ANTHROPIC_API_KEY) });
}

export async function POST(request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "ANTHROPIC_API_KEY tanımlı değil; yapay zekâ özelliği kapalı." }, { status: 503 });
  }

  const { image } = (await request.json().catch(() => ({}))) || {};
  const match = DATA_URL.exec(typeof image === "string" ? image : "");
  if (!match) return Response.json({ error: "Sayfa görseli JPEG, PNG veya WebP olmalı." }, { status: 400 });
  const [, mediaType, data] = match;
  if (data.length * 0.75 > MAX_IMAGE_BYTES) {
    return Response.json({ error: "Sayfa görseli 5 MB'tan büyük olamaz." }, { status: 413 });
  }

  try {
    const client = new Anthropic();
    const response = await client.messages.parse({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      output_config: { effort: "medium", format: zodOutputFormat(DetectionSchema) },
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data } },
            { type: "text", text: `${PROMPT}\n\nKonu listesi: ${SUBJECTS.join(" | ")}` },
          ],
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return Response.json({ error: "Yapay zekâ bu sayfayı işlemedi. Soruları elle kırpabilirsiniz." }, { status: 422 });
    }
    if (!response.parsed_output) {
      return Response.json({ error: "Yapay zekâ yanıtı okunamadı. Tekrar deneyin." }, { status: 502 });
    }

    // Model sınır dışı bir kutu verirse kırpma bozulmasın diye 0-1 aralığına sıkıştırılır.
    const clamp = (value) => Math.min(1, Math.max(0, value));
    const questions = response.parsed_output.questions
      .map(({ box, ...rest }) => {
        const x = clamp(box.x);
        const y = clamp(box.y);
        return { ...rest, box: { x, y, width: Math.min(clamp(box.width), 1 - x), height: Math.min(clamp(box.height), 1 - y) } };
      })
      .filter(({ box }) => box.width > 0.02 && box.height > 0.01);

    return Response.json({ questions });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return Response.json({ error: "ANTHROPIC_API_KEY geçersiz." }, { status: 503 });
    }
    if (error instanceof Anthropic.RateLimitError) {
      return Response.json({ error: "Yapay zekâ kullanım sınırına ulaşıldı. Biraz sonra tekrar deneyin." }, { status: 429 });
    }
    if (error instanceof Anthropic.APIError) {
      console.error("Claude API hatası:", error.status, error.message);
      return Response.json({ error: "Yapay zekâ servisine ulaşılamadı." }, { status: 502 });
    }
    console.error(error);
    return Response.json({ error: "Sayfa analiz edilemedi." }, { status: 500 });
  }
}
