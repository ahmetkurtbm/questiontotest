import "server-only";
import { Pool } from "pg";

const globalForDb = globalThis;

export const databaseConfigured = Boolean(process.env.DATABASE_URL);

export const pool = databaseConfigured
  ? globalForDb.questionToTestPool ??
    new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.DATABASE_SSL === "false"
          ? undefined
          : { rejectUnauthorized: false },
      max: 10,
    })
  : null;

if (process.env.NODE_ENV !== "production" && pool) {
  globalForDb.questionToTestPool = pool;
}

export async function query(text, values = []) {
  if (!pool) throw new Error("DATABASE_NOT_CONFIGURED");
  return pool.query(text, values);
}

export async function withTransaction(handler) {
  if (!pool) throw new Error("DATABASE_NOT_CONFIGURED");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await handler(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/** GateHub `sub` degerini yerel kullanici satirina esler. */
export async function ensureUser(externalUserId, displayName, email) {
  const result = await query(
    `INSERT INTO users(external_user_id, display_name, email)
     VALUES($1, $2, $3)
     ON CONFLICT(external_user_id) DO UPDATE SET
       display_name = EXCLUDED.display_name,
       email = EXCLUDED.email,
       updated_at = NOW()
     RETURNING id, external_user_id, display_name`,
    [externalUserId, displayName || externalUserId, email || null]
  );
  return result.rows[0];
}
