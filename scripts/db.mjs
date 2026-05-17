import { readdirSync, readFileSync } from "node:fs";
import pg from "pg";

const command = process.argv[2];
const files =
  command === "seed"
    ? ["db/seed.sql"]
    : readdirSync("db/migrations")
        .filter((file) => file.endsWith(".sql"))
        .sort()
        .map((file) => `db/migrations/${file}`);

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
});

await client.connect();
for (const file of files) {
  await client.query(readFileSync(file, "utf8"));
  console.log(`${file} applied.`);
}
await client.end();
