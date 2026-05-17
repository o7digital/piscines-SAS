import { readFileSync } from "node:fs";
import pg from "pg";

const command = process.argv[2];
const file = command === "seed" ? "db/seed.sql" : "db/schema.sql";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
});

await client.connect();
await client.query(readFileSync(file, "utf8"));
await client.end();

console.log(`${file} applied.`);
