import { useEffect } from "react";
import { notificationSchedule } from "@/data/menuData";
import type { CustomMedication } from "@/hooks/useAppState";

// ── Time utilities ────────────────────────────────────────────────────────────

function getTodayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function getCurrentHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function minutesToHHMM(mins: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, mins));
  return `${String(Math.floor(clamped / 60)).padStart(2, "0")}:${String(clamped % 60).padStart(2, "0")}`;
}

// ── Wake-up offset ────────────────────────────────────────────────────────────
const BASE_WAKE_UP = "08:00";

function getOffset(wakeUpTime: string | null): number {
  if (!wakeUpTime) return 0;
  return timeToMinutes(wakeUpTime) - timeToMinutes(BASE_WAKE_UP);
}

function getWakeUpTime(): string | null {
  const storedDate = localStorage.getItem("vitalia_wakeup_date");
  if (storedDate !== getTodayISO()) return null;
  return localStorage.getItem("vitalia_wakeup_time");
}

// ── Service Worker registration ───────────────────────────────────────────────

let swReg: ServiceWorkerRegistration | null = null;

async function getSWReg(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  if (swReg) return swReg;
  try {
    swReg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;
    return swReg;
  } catch (e) {
    console.warn("[Vitalia] SW register failed:", e);
    return null;
  }
}

// ── Permission ────────────────────────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission !== "default") return Notification.permission;
  return await Notification.requestPermission();
}

// ── Fire a notification (SW-first, then direct fallback) ─────────────────────

export async function fireNotification(title: string, body: string): Promise<void> {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const opts: NotificationOptions = { body, icon: "/pwa-192x192.png", badge: "/pwa-64x64.png" };

  const reg = await getSWReg();
  if (reg) {
    try {
      await reg.showNotification(title, opts);
      return;
    } catch (e) {
      console.warn("[Vitalia] SW showNotification failed:", e);
    }
  }

  try {
    new Notification(title, opts);
  } catch (e) {
    console.warn("[Vitalia] Notification() failed:", e);
  }
}

// ── Web Push subscription ─────────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
  return output;
}

async function subscribeToPush(wakeUpTime: string | null, forceRefresh = false): Promise<void> {
  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
  if (!vapidKey) {
    // No VAPID key → push can't work, clear any stale flag
    localStorage.removeItem("vitalia_push_active");
    return;
  }

  const reg = await getSWReg();
  if (!reg) return;

  try {
    let sub = await reg.pushManager.getSubscription();

    // Force a fresh subscription:
    // - On explicit refresh request
    // - If no subscription exists
    // - Once per day (to keep Apple/Google token fresh)
    const lastSubDate = localStorage.getItem("vitalia_push_sub_date");
    const todayISO    = getTodayISO();
    const needsRenew  = forceRefresh || !sub || lastSubDate !== todayISO;

    if (needsRenew) {
      // Unsubscribe existing (might be stale/expired)
      if (sub) {
        try { await sub.unsubscribe(); } catch { /* ignore */ }
      }
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
      });
      localStorage.setItem("vitalia_push_sub_date", todayISO);
    }

    if (!sub) return;

    // Send fresh subscription + wakeUpTime to server
    const res = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...sub.toJSON(),
        wakeUpTime: wakeUpTime ?? "08:00",
      }),
    });

    if (res.ok) {
      localStorage.setItem("vitalia_push_active", "1");
    } else {
      localStorage.removeItem("vitalia_push_active");
    }
  } catch (e) {
    console.warn("[Vitalia] Push subscription failed:", e);
    localStorage.removeItem("vitalia_push_active");
  }
}

function loadCustomMeds(): CustomMedication[] {
  try {
    const raw = localStorage.getItem("vitalia_custom_meds");
    if (raw) return JSON.parse(raw) as CustomMedication[];
  } catch { /* ignore */ }
  return [];
}

// ── Catch-up: fire missed notifications from the last 30 min ─────────────────
// (runs on app open, covers the foreground case)

async function checkCatchUp(): Promise<void> {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  if (localStorage.getItem("vitalia_push_active")) return; // server push handles it

  const now      = new Date();
  const nowMins  = now.getHours() * 60 + now.getMinutes();
  const todayISO = getTodayISO();
  const offset   = getOffset(getWakeUpTime());

  for (const notif of notificationSchedule) {
    if (notif.startDate && todayISO < notif.startDate) continue;
    const shiftedMins = timeToMinutes(notif.time) + offset;
    const diff        = nowMins - shiftedMins;
    if (diff < 0 || diff > 30) continue;

    const sentKey = `vitalia_notif_${notif.id}_${todayISO}`;
    if (localStorage.getItem(sentKey)) continue;
    localStorage.setItem(sentKey, "1");
    await fireNotification(notif.title, notif.body);
  }

  const customMeds = loadCustomMeds();
  for (const med of customMeds) {
    const shiftedMins = timeToMinutes(med.time) + offset;
    const diff        = nowMins - shiftedMins;
    if (diff < 0 || diff > 30) continue;

    const sentKey = `vitalia_notif_custom_${med.id}_${todayISO}`;
    if (localStorage.getItem(sentKey)) continue;
    localStorage.setItem(sentKey, "1");
    const body = [med.dosage, med.instructions].filter(Boolean).join(" · ");
    await fireNotification(`💊 ${med.name}`, body || "Hora de tomar tu medicamento.");
  }
}

// ── Ongoing schedule check (every 30 s) — fallback when push not active ──────

async function checkSchedule(): Promise<void> {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  if (localStorage.getItem("vitalia_push_active")) return; // server push handles it

  const currentTime = getCurrentHHMM();
  const todayISO    = getTodayISO();
  const offset      = getOffset(getWakeUpTime());

  for (const notif of notificationSchedule) {
    if (notif.startDate && todayISO < notif.startDate) continue;
    const shiftedTime = offset === 0
      ? notif.time
      : minutesToHHMM(timeToMinutes(notif.time) + offset);

    if (shiftedTime !== currentTime) continue;
    const sentKey = `vitalia_notif_${notif.id}_${todayISO}`;
    if (localStorage.getItem(sentKey)) continue;
    localStorage.setItem(sentKey, "1");
    await fireNotification(notif.title, notif.body);
  }

  const customMeds = loadCustomMeds();
  for (const med of customMeds) {
    const shiftedTime = offset === 0
      ? med.time
      : minutesToHHMM(timeToMinutes(med.time) + offset);

    if (shiftedTime !== currentTime) continue;
    const sentKey = `vitalia_notif_custom_${med.id}_${todayISO}`;
    if (localStorage.getItem(sentKey)) continue;
    localStorage.setItem(sentKey, "1");
    const body = [med.dosage, med.instructions].filter(Boolean).join(" · ");
    await fireNotification(`💊 ${med.name}`, body || "Hora de tomar tu medicamento.");
  }
}

// ── Force-refresh push subscription (callable from UI) ───────────────────────

export async function refreshPushSubscription(wakeUpTime: string | null): Promise<boolean> {
  if (!("Notification" in window)) return false;
  const permission = await requestNotificationPermission();
  if (permission !== "granted") return false;
  try {
    await subscribeToPush(wakeUpTime, true); // forceRefresh = true
    return !!localStorage.getItem("vitalia_push_active");
  } catch {
    return false;
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useNotifications(wakeUpTime: string | null = null): void {
  useEffect(() => {
    getSWReg()
      .then(() => requestNotificationPermission())
      .then((permission) => {
        if (permission === "granted") {
          void subscribeToPush(wakeUpTime); // renews daily
          void checkCatchUp();
        }
      });

    // Check schedule every 30 s while app is open
    const interval = setInterval(() => { void checkSchedule(); }, 30_000);

    // Re-check immediately when user returns to the tab
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void checkCatchUp();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-send subscription to server whenever wakeUpTime changes
  useEffect(() => {
    if (wakeUpTime && Notification.permission === "granted") {
      void subscribeToPush(wakeUpTime);
    }
  }, [wakeUpTime]);
}
