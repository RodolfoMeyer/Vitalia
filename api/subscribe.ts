import type { VercelRequest, VercelResponse } from "@vercel/node";
import { kv } from "@vercel/kv";

const ALLOWED_ORIGINS = [
  "https://app-nine-chi-25.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
];

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

  // Validate push subscription shape
  if (
    typeof body?.endpoint !== "string" ||
    typeof body?.keys !== "object" ||
    !body.keys
  ) {
    return res.status(400).json({ error: "Suscripción inválida" });
  }

  const wakeUpTime = typeof body.wakeUpTime === "string" ? body.wakeUpTime : "08:00";

  // Store subscription and today's wakeUpTime
  const todayISO = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Santiago" }).format(new Date());

  await Promise.all([
    kv.set("push:subscription", JSON.stringify({
      endpoint: body.endpoint,
      keys: body.keys,
      expirationTime: body.expirationTime ?? null,
    })),
    kv.set(`wakeup:${todayISO}`, wakeUpTime),
  ]);

  return res.status(200).json({ ok: true });
}
