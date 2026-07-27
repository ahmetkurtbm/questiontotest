import { currentUser, failure, unauthorized } from "@/lib/session";
import { insertQuestions, validateQuestion } from "@/lib/questions";

export async function POST(request) {
  try {
    const user = await currentUser();
    if (!user) return unauthorized();

    const body = await request.json();
    const incoming = Array.isArray(body?.questions) ? body.questions : null;

    if (!incoming || incoming.length === 0) {
      return Response.json({ error: "Kaydedilecek soru bulunamadı" }, { status: 400 });
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
