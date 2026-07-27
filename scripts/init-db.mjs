// database/schema.sql dosyasini DATABASE_URL ile gosterilen veritabanina uygular.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const here = dirname(fileURLToPath(import.meta.url));
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL tanimli degil. .env.local dosyasina ekleyin.");
  process.exit(1);
}

const schema = readFileSync(join(here, "..", "database", "schema.sql"), "utf8");
const client = new pg.Client({
  connectionString,
  ssl: process.env.DATABASE_SSL === "false" ? undefined : { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(schema);
  console.log("Sema uygulandi.");
} catch (error) {
  console.error("Sema uygulanamadi:", error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
