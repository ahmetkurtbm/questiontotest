/**
 * Eski dosya tabanli soru bankasini (requesttotestb/data/questions.json)
 * Vercel Blob + Postgres'e tasir.
 *
 * Kullanim:
 *   node scripts/migrate-json-to-db.mjs <gatehub-sub> [questions.json yolu]
 *
 * <gatehub-sub>: sorularin atanacagi kullanicinin GateHub `sub` degeri.
 * Uygulamaya bir kez giris yaptiktan sonra:
 *   SELECT external_user_id, display_name FROM users;
 */
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { put } from "@vercel/blob";
import pg from "pg";

const here = dirname(fileURLToPath(import.meta.url));
const [externalUserId, jsonPathArg] = process.argv.slice(2);

if (!externalUserId) {
  console.error("Kullanim: node scripts/migrate-json-to-db.mjs <gatehub-sub> [json-yolu]");
  process.exit(1);
}

for (const key of ["DATABASE_URL", "BLOB_READ_WRITE_TOKEN"]) {
  if (!process.env[key]) {
    console.error(`${key} tanimli degil.`);
    process.exit(1);
  }
}

const jsonPath = jsonPathArg
  ? resolve(jsonPathArg)
  : join(here, "..", "..", "requesttotestb", "data", "questions.json");

const data = JSON.parse(readFileSync(jsonPath, "utf8"));
const questions = Array.isArray(data.questions) ? data.questions : [];

if (questions.length === 0) {
  console.log("Tasinacak soru yok.");
  process.exit(0);
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "false" ? undefined : { rejectUnauthorized: false },
});

async function uploadBase64(dataUrl, name) {
  if (!dataUrl) return null;

  const [meta, base64] = dataUrl.split(",");
  const contentType = /data:([^;]+)/.exec(meta)?.[1] || "image/jpeg";
  const extension = contentType.includes("png") ? "png" : "jpg";

  const { url } = await put(`${name}.${extension}`, Buffer.from(base64, "base64"), {
    access: "public",
    contentType,
    addRandomSuffix: true,
  });

  return url;
}

try {
  await client.connect();

  const user = await client.query(
    "SELECT id FROM users WHERE external_user_id = $1",
    [externalUserId]
  );

  if (user.rowCount === 0) {
    console.error(
      `'${externalUserId}' icin kullanici bulunamadi. Once uygulamaya GateHub ile giris yapin.`
    );
    process.exit(1);
  }

  const ownerId = user.rows[0].id;
  const start = await client.query(
    "SELECT COALESCE(MAX(no), 0) AS max FROM questions WHERE owner_id = $1",
    [ownerId]
  );

  let no = Number(start.rows[0].max) + 1;
  let migrated = 0;

  for (const question of questions) {
    const questionUrl = await uploadBase64(question.fileQuestion, `soru/gecis-${question.no}`);
    if (!questionUrl) {
      console.warn(`${question.no}. soru atlandi (gorsel yok).`);
      continue;
    }

    const solutionUrl = await uploadBase64(question.fileAnswer, `cozum/gecis-${question.no}`);

    await client.query(
      `INSERT INTO questions (owner_id, no, question_url, solution_url, subject, difficulty, answer)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [ownerId, no++, questionUrl, solutionUrl, question.subject, question.difficulty, question.answer]
    );

    migrated++;
    console.log(`${migrated}/${questions.length} tasindi`);
  }

  console.log(`Tamam: ${migrated} soru tasindi.`);
} catch (error) {
  console.error("Tasima basarisiz:", error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
