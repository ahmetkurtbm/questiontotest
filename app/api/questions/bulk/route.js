import { currentUser, failure } from "@/lib/session";
import { insertQuestions, validateQuestion } from "@/lib/questions";

const MAX_BULK = 200;

export async function POST(request) {
  try {
    const user = await currentUser();

    const body = await request.json();
    const incoming = Array.isArray(body?.questions) ? body.questions : null;

    if (!incoming || incoming.length === 0) {
      return Response.json({ error: "Kaydedilecek soru bulunamadı" }, { status: 400 });
    }

    if (incoming.length > MAX_BULK) {
      return Response.json({ error: `Tek seferde en fazla ${MAX_BULK} soru kaydedilebilir` }, { status: 413 });
    }

    const validated = [];
    for (let i = 0; i < incoming.length; i++) {
      const { error, value } = validateQuestion(incoming[i]);
      if (error) return Response.json({ error: `${i + 1}. soru: ${error}` }, { status: 400 });
      validated.push(value);
    }

    return Response.json({ saved: await insertQuestions(user.id, validated) }, { status: 201 });
  } catch (error) {
    return failure(error);
  }
}
