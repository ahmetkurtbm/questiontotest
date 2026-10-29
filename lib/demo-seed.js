import "server-only";
import { DEMO_QUESTIONS } from "@/lib/demo-data";

/** Demo veritabanına yerel kullanıcıyı ve örnek soru bankasını ekler. */
export async function seedDemo(query) {
  const { rows } = await query(
    "INSERT INTO users (external_user_id, display_name) VALUES ('local', 'Öğretmen') RETURNING id"
  );
  const ownerId = rows[0].id;
  for (const [index, question] of DEMO_QUESTIONS.entries()) {
    await query(
      `INSERT INTO questions (owner_id, no, question_url, subject, difficulty, answer)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [ownerId, index + 1, question.url, question.subject, question.difficulty, question.answer]
    );
  }
}
