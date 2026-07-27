import { del } from "@vercel/blob";
import { currentUser, failure, unauthorized } from "@/lib/session";
import { query } from "@/lib/db";
import { toDto } from "@/lib/questions";

const DIFFICULTIES = ["Kolay", "Orta", "Zor"];
const ANSWERS = ["A", "B", "C", "D", "E"];

async function findOwned(ownerId, id) {
  const { rows } = await query(
    "SELECT * FROM questions WHERE id = $1 AND owner_id = $2",
    [id, ownerId]
  );
  return rows[0] || null;
}

export async function GET(request, { params }) {
  try {
    const user = await currentUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const question = await findOwned(user.id, id);
    if (!question) return Response.json({ error: "Soru bulunamadı" }, { status: 404 });

    return Response.json(toDto(question));
  } catch (error) {
    return failure(error);
  }
}

export async function PUT(request, { params }) {
  try {
    const user = await currentUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const existing = await findOwned(user.id, id);
    if (!existing) return Response.json({ error: "Soru bulunamadı" }, { status: 404 });

    const body = await request.json();
    const sets = [];
    const values = [];

    const bind = (value) => {
      values.push(value);
      return `$${values.length}`;
    };

    if (body.subject !== undefined) {
      const subject = String(body.subject).trim();
      if (!subject) return Response.json({ error: "Konu boş olamaz" }, { status: 400 });
      sets.push(`subject = ${bind(subject)}`);
    }

    if (body.difficulty !== undefined) {
      if (!DIFFICULTIES.includes(body.difficulty)) {
        return Response.json({ error: "Zorluk Kolay/Orta/Zor olmalı" }, { status: 400 });
      }
      sets.push(`difficulty = ${bind(body.difficulty)}`);
    }

    if (body.answer !== undefined) {
      const answer = String(body.answer).toLocaleUpperCase("tr");
      if (!ANSWERS.includes(answer)) {
        return Response.json({ error: "Cevap A-E arasında olmalı" }, { status: 400 });
      }
      sets.push(`answer = ${bind(answer)}`);
    }

    if (body.solutionUrl !== undefined) {
      sets.push(`solution_url = ${bind(body.solutionUrl || null)}`);
    }

    if (sets.length === 0) return Response.json(toDto(existing));

    const { rows } = await query(
      `UPDATE questions SET ${sets.join(", ")}
       WHERE id = ${bind(id)} AND owner_id = ${bind(user.id)}
       RETURNING *`,
      values
    );

    return Response.json(toDto(rows[0]));
  } catch (error) {
    return failure(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await currentUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const existing = await findOwned(user.id, id);
    if (!existing) return Response.json({ error: "Soru bulunamadı" }, { status: 404 });

    await query("DELETE FROM questions WHERE id = $1 AND owner_id = $2", [id, user.id]);

    // Satir gittikten sonra blob'lari da temizle; basarisiz olursa istegi
    // dusurme, sadece logla (yetim blob kalmasi veri kaybindan iyidir).
    const urls = [existing.question_url, existing.solution_url].filter(Boolean);
    if (urls.length > 0 && process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        await del(urls);
      } catch (blobError) {
        console.error("Blob silinemedi:", blobError.message);
      }
    }

    return Response.json({ ok: true });
  } catch (error) {
    return failure(error);
  }
}
