import type { VercelRequest, VercelResponse } from "@vercel/node";
import webpush from "web-push";
import { kv } from "@vercel/kv";
import { notificationSchedule, timeToMins, minsToHHMM } from "./_schedule.js";

const BASE_WAKE_UP = "08:00";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET (cron) or POST
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  // Validate cron secret
  const secret =
    (req.query.secret as string | undefined) ??
    req.headers["x-cron-secret"];

  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: "No autorizado" });
  }

  // Validate VAPID config
  const vapidPublic  = process.env.VITE_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  if (!vapidPublic || !vapidPrivate) {
    return res.status(500).json({ error: "VAPID no configurado" });
  }

  webpush.setVapidDetails(
    "mailto:rodolfo.andres.meyer@gmail.com",
    vapidPublic,
    vapidPrivate
  );

  // Get stored push subscription
  const subRaw = await kv.get<unknown>("push:subscription");
  if (!subRaw) {
    return res.status(200).json({ ok: true, message: "Sin suscripción registrada" });
  }
  const subscription = (typeof subRaw === "string" ? JSON.parse(subRaw) : subRaw) as webpush.PushSubscription;

  // Current time in Chile timezone
  const now = new Date();
  const chileTime = new Intl.DateTimeFormat("es-CL", {
    timeZone: "America/Santiago",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now).replace(".", ":"); // some locales use "." as separator

  const todayISO = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Santiago",
  }).format(now);

  // Get today's wake-up time (fallback to base)
  const wakeUpTime = (await kv.get<string>(`wakeup:${todayISO}`)) ?? BASE_WAKE_UP;
  const offset = timeToMins(wakeUpTime) - timeToMins(BASE_WAKE_UP);

  const sent: string[] = [];
  const errors: string[] = [];

  for (const notif of notificationSchedule) {
    if (notif.startDate && todayISO < notif.startDate) continue;

    const shiftedTime = offset === 0
      ? notif.time
      : minsToHHMM(timeToMins(notif.time) + offset);

    if (shiftedTime !== chileTime) continue;

    // Idempotency: skip if already sent today
    const sentKey = `sent:${notif.id}:${todayISO}`;
    const alreadySent = await kv.get(sentKey);
    if (alreadySent) continue;

    try {
      await webpush.sendNotification(
        subscription,
        JSON.stringify({ title: notif.title, body: notif.body })
      );
      await kv.set(sentKey, "1", { ex: 86400 }); // expire after 24 h
      sent.push(notif.id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`${notif.id}: ${msg}`);
      // If subscription is gone (410), clear it so we don't keep trying
      if (msg.includes("410") || msg.includes("404")) {
        await kv.del("push:subscription");
      }
    }
  }

  return res.status(200).json({ ok: true, time: chileTime, sent, errors });
}
