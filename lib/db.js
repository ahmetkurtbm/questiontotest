import "server-only";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { seedDemo } from "@/lib/demo-seed";

/**
 * Aynı SQL iki yerde çalışır:
 *  - DATABASE_URL tanımlı → yerel PostgreSQL (Docker). Şema `npm run db:setup` ile kurulur.
 *  - DATABASE_URL boş     → demo modu: PGlite (WASM'a derlenmiş Postgres) sunucu
 *                           sürecinin içinde açılır, migration'lar ve örnek sorular
 *                           yüklenir. Vercel'deki herkese açık demo böyle çalışır.
 */

export const isDemoMode = () => !process.env.DATABASE_URL;

const DB_DIR = join(process.cwd(), "db");
const globalForDb = globalThis;

async function createDemo() {
  const { PGlite } = await import("@electric-sql/pglite");
  const db = await PGlite.create();
  const migrations = readdirSync(join(DB_DIR, "migrations")).filter((f) => f.endsWith(".sql")).sort();
  for (const name of migrations) await db.exec(readFileSync(join(DB_DIR, "migrations", name), "utf8"));
  await seedDemo((text, values) => db.query(text, values));
  return {
    query: (text, values) => db.query(text, values),
    transaction: (handler) => db.transaction((tx) => handler({ query: (text, values) => tx.query(text, values) })),
  };
}

async function createPostgres() {
  const { Pool } = (await import("pg")).default;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
  return {
    query: (text, values) => pool.query(text, values),
    async transaction(handler) {
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
    },
  };
}

function database() {
  if (!globalForDb.questionToTestDb) {
    const created = isDemoMode() ? createDemo() : createPostgres();
    globalForDb.questionToTestDb = created;
    // Başarısız bir açılış önbellekte kalmasın; sonraki istek yeniden dener.
    created.catch(() => {
      if (globalForDb.questionToTestDb === created) delete globalForDb.questionToTestDb;
    });
  }
  return globalForDb.questionToTestDb;
}

/** `{ rows }` döner; pg ve PGlite aynı biçimi kullanır. */
export async function query(text, values = []) {
  return (await database()).query(text, values);
}

export async function withTransaction(handler) {
  return (await database()).transaction(handler);
}

/** Uygulama tek kullanıcılıdır; bütün kayıtlar bu yerel kullanıcıya aittir. */
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
