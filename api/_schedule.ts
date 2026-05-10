// Shared notification schedule — used by send-notifications.ts
// Times are based on wake-up 08:00; offset is applied server-side

export interface ScheduledNotification {
  id: string;
  time: string; // HH:MM 24h, base wake-up 08:00
  title: string;
  body: string;
  startDate?: string; // YYYY-MM-DD, optional activation date
}

export const notificationSchedule: ScheduledNotification[] = [
  // Water reminders
  { id: "water-1000", time: "10:00", title: "💧 Hidratación", body: "Hora de hidratarse — un vaso de agua." },
  { id: "water-1130", time: "11:30", title: "💧 Hidratación", body: "Mitad de la mañana — seguí sumando líquidos." },
  { id: "water-1300", time: "13:00", title: "💧 Hidratación", body: "Antes del almuerzo, un vaso de agua." },
  { id: "water-1430", time: "14:30", title: "💧 Hidratación", body: "Después del almuerzo — hidratate bien." },
  { id: "water-1600", time: "16:00", title: "💧 Hidratación", body: "Media tarde — no esperes tener sed." },
  { id: "water-1730", time: "17:30", title: "💧 Hidratación", body: "Objetivo: 3 litros al día — seguís sumando." },
  { id: "water-1900", time: "19:00", title: "💧 Hidratación", body: "Antes de la cena, un vaso de agua." },
  { id: "water-2030", time: "20:30", title: "💧 Hidratación", body: "Último recordatorio de agua del día. ¿Llegaste a los 3 litros?" },

  // Medications
  { id: "med-eutirox",    time: "08:00", title: "💊 Eutirox 150 mcg",    body: "En ayunas. Solo con agua — sin café, leche ni suplementos. Espera 30 min para desayunar." },
  { id: "med-compulsine", time: "09:30", title: "💊 Compulsine 37.5 mg", body: "Tomarlo después del desayuno para mejor tolerancia." },
  { id: "med-magistral",  time: "12:30", title: "💊 Fórmula Magistral",  body: "1 cápsula — separación de 4.5 h del Eutirox. Contiene Orlistat, Berberina, Magnesio.", startDate: "2026-05-17" },
  { id: "med-vitamina-d", time: "20:30", title: "💊 Vitamina D",         body: "Tomarlo con la cena — necesita grasa para absorberse bien." },
];

export function timeToMins(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function minsToHHMM(mins: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, mins));
  return `${String(Math.floor(clamped / 60)).padStart(2, "0")}:${String(clamped % 60).padStart(2, "0")}`;
}
