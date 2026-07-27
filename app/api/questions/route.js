import { currentUser, failure, unauthorized } from "@/lib/session";
import { insertQuestions, listQuestions, validateQuestion } from "@/lib/questions";

// Filtreler govdede geldigi icin liste de POST; sunucuda tum veri setine
// uygulanip sayfalanir.
export async function POST(request) {
  try {
    const user = await currentUser();
    if (!user) return unauthorized();

    const body = await request.json();

    if (body?.action === "create") {
      const { error, value } = validateQuestion(body.question);
      if (error) return Response.json({ error }, { status: 400 });

      const [saved] = await insertQuestions(user.id, [value]);
      return Response.json(saved, { status: 201 });
    }

    return Response.json(await listQuestions(user.id, body || {}));
  } catch (error) {
    return failure(error);
  }
}
