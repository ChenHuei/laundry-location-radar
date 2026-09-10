import { readFile, mkdir, writeFile } from "node:fs/promises";
const files = ["supabase/schema.sql", "supabase/migrations/002_review.sql"];
const sql = (await Promise.all(files.map(file => readFile(file, "utf8")))).join("\n\n");
await mkdir("public", { recursive: true });
await writeFile("public/setup.sql", sql);
