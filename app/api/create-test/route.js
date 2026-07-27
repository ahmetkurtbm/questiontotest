import { currentUser, failure, unauthorized } from "@/lib/session";
import { createTest } from "@/lib/questions";

export async function POST(request) {
  try {
    const user = await currentUser();
    if (!user) return unauthorized();

    const body = await request.json();
    const rows = Array.isArray(body?.rows) ? body.rows : [];

    if (rows.length === 0) {
      return Response.json({ error: "En az bir satır ekleyin" }, { status: 400 });
    }

    const result = await createTest(user.id, rows);

    if (result.questions.length === 0) {
      return Response.json(
        { error: "Seçilen kriterlere uyan soru bulunamadı" },
        { status: 404 }
      );
    }

    return Response.json(result);
  } catch (error) {
    return failure(error);
  }
}
