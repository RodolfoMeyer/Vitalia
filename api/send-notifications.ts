import type { VercelRequest, VercelResponse } from "@vercel/node";
import webpush from "web-push";
import { notificationSchedule, timeToMins, minsToHHMM } from "./_schedule.js";

const GIST_FILE  = "vitalia-push.json";
const BASE_WAKE  = "08:00";

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
  if (req.method !== "GET" && req.method !== "POST")
    return res.status(405).json({ error: "Método no permitido" });

  const secret =
    (req.query.secret as string | undefined) ??
    req.headers["x-cron-secret"] as string | undefined;

  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET)
    return res.status(401).json({ error: "No autorizado" });

  const vapidPublic  = process.env.VITE_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  if (!vapidPublic || !vapidPrivate)
    return res.status(500).json({ error: "VAPID no configurado" });

  webpush.setVapidDetails("mailto:rodolfo.andres.meyer@gmail.com", vapidPublic, vapidPrivate);

  const store = await readGist();
  const subscription = store.subscription as webpush.PushSubscription | null;
  if (!subscription?.endpoint)
    return res.status(200).json({ ok: true, message: "Sin suscripción registrada" });

  // Current Chile time
  const now       = new Date();
  const chileTime = new Intl.DateTimeFormat("es-CL", {
    timeZone: "America/Santiago", hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(now).replace(".", ":").replace(",", ":").padStart(5, "0");

  const todayISO   = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Santiago" }).format(now);
  const wakeUpTime = (store[`wakeup_${todayISO}`] as string | undefined) ?? BASE_WAKE;
  const offset     = timeToMins(wakeUpTime) - timeToMins(BASE_WAKE);

  const sent: string[]   = [];
  const errors: string[] = [];
  let   subExpired       = false;

  for (const notif of notificationSchedule) {
    if (notif.startDate && todayISO < notif.startDate) continue;

    const shiftedTime = offset === 0 ? notif.time : minsToHHMM(timeToMins(notif.time) + offset);
    if (shiftedTime !== chileTime) continue;

    const sentKey = `sent_${notif.id}_${todayISO}`;
    if (store[sentKey]) continue;

    try {
      await webpush.sendNotification(subscription, JSON.stringify({ title: notif.title, body: notif.body }));
      store[sentKey] = "1";
      sent.push(notif.id);
    } catch (e) {
      const err = e as { statusCode?: number; body?: Buffer | string };
      const body = err.body ? err.body.toString() : "";

      // 410 = subscription expired; 400 BadDeviceToken = Apple invalid token
      if (err.statusCode === 410 || (err.statusCode === 400 && body.includes("BadDeviceToken"))) {
        subExpired = true;
        errors.push(`${notif.id}: SUSCRIPCIÓN VENCIDA (${err.statusCode}) — se limpiará`);
      } else {
        errors.push(`${notif.id}: ${body || String(e)}`);
      }
    }
  }

  // If subscription is expired, clear it so the next app open registers a fresh one
  if (subExpired) {
    store.subscription = null;
    store.sub_expired_at = new Date().toISOString();
  }

  // Persist if anything changed
  if (sent.length > 0 || subExpired) {
    await writeGist(store);
  }

  return res.status(200).json({
    ok: true, time: chileTime, wakeUpTime, sent, errors,
    ...(subExpired ? { warning: "Suscripción push vencida — necesita renovarse en la app" } : {}),
  });
}
