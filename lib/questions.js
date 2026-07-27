import "server-only";
import { query, withTransaction } from "@/lib/db";

const DIFFICULTIES = ["Kolay", "Orta", "Zor"];
const ANSWERS = ["A", "B", "C", "D", "E"];

/** snake_case satirlari istemcinin bekledigi camelCase bicime cevirir. */
export function toDto(row) {
  return {
    id: row.id,
    no: row.no,
    questionUrl: row.question_url,
    solutionUrl: row.solution_url,
    subject: row.subject,
    difficulty: row.difficulty,
    answer: row.answer,
    createdAt: row.created_at,
  };
}

function normalizeDifficulty(value) {
  if (!value) return null;
  const lower = String(value).toLocaleLowerCase("tr");
  return DIFFICULTIES.find((level) => level.toLocaleLowerCase("tr") === lower) || null;
}

/** Istemciden gelen soruyu dogrular; gorseller artik base64 degil Blob URL'i. */
export function validateQuestion(body) {
  const { questionUrl, subject, difficulty, answer } = body || {};

  if (!questionUrl) return { error: "Soru görseli zorunlu" };
  if (!String(subject || "").trim()) return { error: "Konu zorunlu" };

  const normalizedDifficulty = normalizeDifficulty(difficulty);
  if (!normalizedDifficulty) return { error: "Zorluk Kolay/Orta/Zor olmalı" };

  const normalizedAnswer = String(answer || "").toLocaleUpperCase("tr");
  if (!ANSWERS.includes(normalizedAnswer)) return { error: "Cevap A-E arasında olmalı" };

  return {
    value: {
      questionUrl,
      solutionUrl: body.solutionUrl || null,
      subject: String(subject).trim(),
      difficulty: normalizedDifficulty,
      answer: normalizedAnswer,
    },
  };
}

/**
 * Ayni kullanici icin sirali `no` uretir. Numara uretimi ile ekleme ayni
 * transaction icinde; boylece toplu aktarimda numaralar cakismaz.
 */
export async function insertQuestions(ownerId, items) {
  return withTransaction(async (client) => {
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtext($1))",
      [`questiontotest:no:${ownerId}`]
    );

    const { rows } = await client.query(
      "SELECT COALESCE(MAX(no), 0) AS max FROM questions WHERE owner_id = $1",
      [ownerId]
    );

    let next = Number(rows[0].max) + 1;
    const saved = [];

    for (const item of items) {
      const inserted = await client.query(
        `INSERT INTO questions (owner_id, no, question_url, solution_url, subject, difficulty, answer)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          ownerId,
          next++,
          item.questionUrl,
          item.solutionUrl,
          item.subject,
          item.difficulty,
          item.answer,
        ]
      );
      saved.push(toDto(inserted.rows[0]));
    }

    return saved;
  });
}

export async function listQuestions(ownerId, params = {}) {
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = Math.min(48, Math.max(1, Number(params.pageSize) || 12));
  const search = String(params.search || "").trim();

  const where = ["owner_id = $1"];
  const values = [ownerId];

  // Bir deger ekleyip ona karsilik gelen $n yer tutucusunu dondurur.
  const bind = (value) => {
    values.push(value);
    return `$${values.length}`;
  };

  if (params.subject) where.push(`subject = ${bind(params.subject)}`);
  if (params.difficulty) where.push(`difficulty = ${bind(params.difficulty)}`);
  if (params.answer) where.push(`answer = ${bind(params.answer)}`);
  if (params.no) where.push(`no = ${bind(Number(params.no))}`);

  if (search) {
    const term = bind(`%${search}%`);
    where.push(
      `(subject ILIKE ${term} OR difficulty ILIKE ${term} OR answer ILIKE ${term} OR no::text ILIKE ${term})`
    );
  }

  const whereSql = where.join(" AND ");

  const totalResult = await query(
    `SELECT COUNT(*)::int AS total FROM questions WHERE ${whereSql}`,
    values
  );
  const total = totalResult.rows[0].total;

  const itemsResult = await query(
    `SELECT * FROM questions WHERE ${whereSql}
     ORDER BY no ASC
     LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, pageSize, (page - 1) * pageSize]
  );

  return {
    items: itemsResult.rows.map(toDto),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function questionCounts(ownerId) {
  const { rows } = await query(
    `SELECT subject AS topic,
            COUNT(*) FILTER (WHERE difficulty = 'Kolay')::int AS kolay,
            COUNT(*) FILTER (WHERE difficulty = 'Orta')::int  AS orta,
            COUNT(*) FILTER (WHERE difficulty = 'Zor')::int   AS zor,
            COUNT(*)::int AS total
     FROM questions WHERE owner_id = $1
     GROUP BY subject ORDER BY subject`,
    [ownerId]
  );

  const totals = rows.reduce(
    (acc, row) => ({
      all: acc.all + row.total,
      kolay: acc.kolay + row.kolay,
      orta: acc.orta + row.orta,
      zor: acc.zor + row.zor,
    }),
    { all: 0, kolay: 0, orta: 0, zor: 0 }
  );

  const solved = await query(
    "SELECT COUNT(*)::int AS c FROM questions WHERE owner_id = $1 AND solution_url IS NOT NULL",
    [ownerId]
  );

  return { topics: rows, totals: { ...totals, withSolution: solved.rows[0].c } };
}

/**
 * Test secimi. Kurallar `server.js`'ten aynen korundu:
 * bos konu/zorluk = farketmez, satirlar havuzu paylasir (tekrar yok),
 * sonuc butun olarak karistirilir, eksikler raporlanir.
 */
export async function createTest(ownerId, rows) {
  const used = [];
  const selected = [];
  const shortages = [];

  for (const row of rows) {
    const wanted = Math.max(0, Number(row.count) || 0);
    if (wanted === 0) continue;

    const where = ["owner_id = $1"];
    const values = [ownerId];

    if (row.subject) {
      values.push(row.subject);
      where.push(`subject = $${values.length}`);
    }
    if (row.difficulty) {
      values.push(row.difficulty);
      where.push(`difficulty = $${values.length}`);
    }
    if (used.length > 0) {
      values.push(used);
      where.push(`NOT (id = ANY($${values.length}::uuid[]))`);
    }

    values.push(wanted);

    const { rows: picked } = await query(
      `SELECT * FROM questions WHERE ${where.join(" AND ")}
       ORDER BY random() LIMIT $${values.length}`,
      values
    );

    picked.forEach((question) => used.push(question.id));
    selected.push(...picked);

    if (picked.length < wanted) {
      shortages.push({
        subject: row.subject || "Tüm konular",
        difficulty: row.difficulty || "Tüm zorluklar",
        wanted,
        got: picked.length,
      });
    }
  }

  // Ayni konudan sorular arka arkaya gelmesin diye tamami karistirilir.
  for (let i = selected.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [selected[i], selected[j]] = [selected[j], selected[i]];
  }

  return { questions: selected.map(toDto), shortages };
}
