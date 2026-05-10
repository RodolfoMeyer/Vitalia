import type { VercelRequest, VercelResponse } from "@vercel/node";

const ALLOWED_ORIGINS = [
  "https://app-nine-chi-25.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
];

const GIST_FILE = "vitalia-push.json";

async function readGist(): Promise<Record<string, unknown>> {
  const res = await fetch(`https://api.github.com/gists/${process.env.GIST_ID}`, {
    headers: { Authorization: `token ${process.env.GITHUB_TOKEN}`, "User-Agent": "Vitalia" },
  });
  const data = await res.json() as { files?: Record<string, { content: string }> };
  try { return JSON.parse(data.files?.[GIST_FILE]?.content ?? "{}") as Record<string, unknown>; }
  catch { return {}; }
}

async function writeGist(payload: Record<string, unknown>): Promise<void> {
  await fetch(`https://api.github.com/gists/${process.env.GIST_ID}`, {
    method: "PATCH",
    headers: {
      Authorization: `token ${process.env.GITHUB_TOKEN}`,
      "Content-Type": "application/json",
      "User-Agent": "Vitalia",
    },
    body: JSON.stringify({ files: { [GIST_FILE]: { content: JSON.stringify(payload, null, 2) } } }),
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = String(req.headers.origin ?? "");
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

  const body = req.body as Record<string, unknown> | null;
  if (typeof body?.endpoint !== "string" || typeof body?.keys !== "object" || !body.keys) {
    return res.status(400).json({ error: "Suscripción inválida" });
  }

  const wakeUpTime = typeof body.wakeUpTime === "string" ? body.wakeUpTime : "08:00";
  const todayISO = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Santiago" }).format(new Date());

  const current = await readGist();
  await writeGist({
    ...current,
    subscription: { endpoint: body.endpoint, keys: body.keys, expirationTime: body.expirationTime ?? null },
    [`wakeup_${todayISO}`]: wakeUpTime,
  });

  return res.status(200).json({ ok: true });
}
