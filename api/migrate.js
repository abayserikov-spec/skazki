// api/migrate.js — one-shot DB migration via Supabase Management API
// POST /api/migrate  with header  x-migrate-secret: <MIGRATE_SECRET>
//
// Required env vars:
//   MIGRATE_SECRET         — any random string you choose, guards the endpoint
//   SUPABASE_ACCESS_TOKEN  — personal access token from supabase.com/dashboard/account/tokens
//   VITE_SUPABASE_URL      — already set for the frontend (e.g. https://xyz.supabase.co)

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-migrate-secret");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const secret = req.headers["x-migrate-secret"];
  if (!secret || secret !== process.env.MIGRATE_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  const supabaseUrl = process.env.VITE_SUPABASE_URL;

  if (!accessToken) return res.status(500).json({ error: "SUPABASE_ACCESS_TOKEN not set" });
  if (!supabaseUrl) return res.status(500).json({ error: "VITE_SUPABASE_URL not set" });

  // Extract project ref from https://{ref}.supabase.co
  const projectRef = new URL(supabaseUrl).hostname.split(".")[0];

  const sql = readFileSync(
    join(__dirname, "../supabase/migrations/001_init.sql"),
    "utf8",
  );

  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    console.error("Migration failed:", body);
    return res.status(500).json({ error: body });
  }

  return res.status(200).json({ success: true, message: "Migration applied." });
}
