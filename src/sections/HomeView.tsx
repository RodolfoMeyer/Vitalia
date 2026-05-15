import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Droplets,
  Pill,
  ForkKnife,
  Lightbulb,
  AlertCircle,
  Sun,
  Check,
  Bell,
  BellOff,
  BellRing,
  Pencil,
  Download,
  Upload,
  Shield,
} from "lucide-react";

/* ── Backup helpers ──────────────────────────────────────────────────────── */
const BACKUP_KEYS = [
  "vitalia_evolution",
  "vitalia_water_count", "vitalia_water_date", "vitalia_water_history",
  "vitalia_meds_checked", "vitalia_meds_date", "vitalia_meds_history",
  "vitalia_custom_meds", "vitalia_custom_meds_checked", "vitalia_custom_meds_date",
  "vitalia_menu_checked", "vitalia_menu_date", "vitalia_food_log",
  "vitalia_wakeup_time", "vitalia_wakeup_date",
  "vitalia_weight_goal",
  "vitalia_tip_idx", "vitalia_rec_idx", "vitalia_extip_idx",
];
const LAST_BACKUP_KEY = "vitalia_last_backup";

interface BackupPreview {
  date: string;        // ISO
  evolutionCount: number;
  hasWater: boolean;
  hasMeds: boolean;
  hasMenu: boolean;
  hasFoodLog: boolean;
}

/** Build the timestamped filename: Vitalia-20260515-1230.json */
function buildFilename(): string {
  const n = new Date();
  const p = (x: number) => String(x).padStart(2, "0");
  return `Vitalia-${n.getFullYear()}${p(n.getMonth() + 1)}${p(n.getDate())}-${p(n.getHours())}${p(n.getMinutes())}.json`;
}

/** Collect all Vitalia keys from localStorage into a payload object */
function buildPayload(): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    _meta: { app: "Vitalia", version: "1.0", date: new Date().toISOString() },
  };
  BACKUP_KEYS.forEach((key) => {
    const v = localStorage.getItem(key);
    if (v !== null) {
      try { payload[key] = JSON.parse(v); } catch { payload[key] = v; }
    }
  });
  return payload;
}

/** Export: silent download on desktop; Web Share API (native sheet) on iOS/mobile */
async function exportData(onDone: (filename: string) => void): Promise<void> {
  const payload = buildPayload();
  const json    = JSON.stringify(payload, null, 2);
  const filename = buildFilename();
  const blob    = new Blob([json], { type: "application/json" });

  // Record timestamp of last backup
  localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString());

  // Prefer Web Share API with file (iOS 15+, Chrome Android)
  const shareFile = new File([blob], filename, { type: "application/json" });
  if (
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [shareFile] })
  ) {
    try {
      await navigator.share({ files: [shareFile], title: "Respaldo Vitalia" });
      onDone(filename);
      return;
    } catch (e) {
      if ((e as Error).name === "AbortError") return; // user cancelled — not an error
    }
  }

  // Fallback: programmatic <a> download (desktop browsers)
  const url = URL.createObjectURL(blob);
  const a   = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  onDone(filename);
}

/** Parse a file and return a human-readable preview, or null if invalid */
function parseBackup(raw: string): BackupPreview | null {
  try {
    const p = JSON.parse(raw) as Record<string, unknown>;
    const m = p._meta as Record<string, unknown> | undefined;
    if (!m || typeof m !== "object" || m.app !== "Vitalia") return null;
    return {
      date:           typeof m.date === "string" ? m.date : new Date().toISOString(),
      evolutionCount: Array.isArray(p.vitalia_evolution) ? p.vitalia_evolution.length : 0,
      hasWater:       p.vitalia_water_history != null,
      hasMeds:        p.vitalia_meds_checked  != null,
      hasMenu:        p.vitalia_menu_checked   != null,
      hasFoodLog:     p.vitalia_food_log       != null,
    };
  } catch {
    return null;
  }
}

/** Write backup keys from a raw JSON string into localStorage */
function applyBackup(raw: string): boolean {
  try {
    const p = JSON.parse(raw) as Record<string, unknown>;
    const m = p._meta as Record<string, unknown> | undefined;
    if (!m || m.app !== "Vitalia") return false;
    BACKUP_KEYS.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(p, key)) {
        const val = p[key];
        localStorage.setItem(key, typeof val === "string" ? val : JSON.stringify(val));
      }
    });
    return true;
  } catch {
    return false;
  }
}
import { wellnessTips, medicalRecommendations } from "@/data/menuData";
import { requestNotificationPermission, fireNotification } from "@/hooks/useNotifications";

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
} as const;

const cardReveal = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeInOut" as const },
  },
};

interface HomeViewProps {
  completedTasks: number;
  totalTasks: number;
  menuCompleted: number;
  menuTotal: number;
  waterCount: number;
  medsCompleted: number;
  medsTotal: number;
  onNavigate: (tab: number) => void;
  tipIndex: number;
  recIndex: number;
  wakeUpTime: string | null;
  onSetWakeUpTime: (time: string) => void;
}

export function HomeView({
  completedTasks,
  totalTasks,
  menuCompleted,
  menuTotal,
  waterCount,
  medsCompleted,
  medsTotal,
  onNavigate,
  tipIndex,
  recIndex,
  wakeUpTime,
  onSetWakeUpTime,
}: HomeViewProps) {
  const progressPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const dailyTip = wellnessTips[tipIndex % wellnessTips.length];
  const dailyRec = medicalRecommendations[recIndex % medicalRecommendations.length];

  const today = new Date();
  const dateStr = today.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const hour = today.getHours();
  let greeting = "Buenos días";
  if (hour >= 12 && hour < 18) greeting = "Buenas tardes";
  else if (hour >= 18) greeting = "Buenas noches";

  // Format "08:30" → "8:30 AM"
  function formatTime12(hhmm: string): string {
    const [h, m] = hhmm.split(":").map(Number);
    const period = h < 12 ? "AM" : "PM";
    const h12    = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, "0")} ${period}`;
  }

  // Wake-up manual registration state
  // selectedTime and editTime are only set when the user explicitly opens the form
  const [showWakeUpForm, setShowWakeUpForm] = useState(false);
  const [selectedTime, setSelectedTime] = useState("07:00");
  const [isEditingWakeUp, setIsEditingWakeUp] = useState(false);
  const [editTime, setEditTime] = useState("07:00");

  // Capture current time only when the user taps "Registrar"
  function openWakeUpForm() {
    const now = new Date();
    const t = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    setSelectedTime(t);
    setShowWakeUpForm(true);
  }

  // ── Backup state ──────────────────────────────────────────────────
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const [exportDone,     setExportDone]     = useState<string | null>(null);
  const [importPreview,  setImportPreview]  = useState<BackupPreview | null>(null);
  const [importRaw,      setImportRaw]      = useState<string | null>(null);
  const [importError,    setImportError]    = useState<string | null>(null);
  const [lastBackupDate] = useState<string | null>(() => {
    const v = localStorage.getItem(LAST_BACKUP_KEY);
    if (!v) return null;
    return new Date(v).toLocaleDateString("es-ES", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    });
  });

  // ── Notification permission state ─────────────────────────────────
  const hasNotifAPI = "Notification" in window;
  const isIOS       = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone = hasNotifAPI && "standalone" in navigator && (navigator as Record<string, unknown>).standalone === true;

  const [notifPerm, setNotifPerm] = useState<NotificationPermission | "unavailable">(
    () => hasNotifAPI ? Notification.permission : "unavailable"
  );
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    if (hasNotifAPI) setNotifPerm(Notification.permission);
  }, [hasNotifAPI]);

  async function handleActivar() {
    const result = await requestNotificationPermission();
    setNotifPerm(result);
  }

  function handleTest() {
    void fireNotification("🔔 Vitalia — Prueba", "Las notificaciones funcionan correctamente.");
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="px-5 pt-6 pb-28 space-y-5"
    >
      {/* ── Wake-up registration (manual only) ────────────────────────── */}
      <AnimatePresence mode="wait">
        {!wakeUpTime && !showWakeUpForm && (
          <motion.div
            key="wakeup-btn"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <button
              onClick={openWakeUpForm}
              className="w-full flex items-center gap-3 rounded-[16px] px-4 py-3.5 active:scale-[0.98] transition-transform shadow-[0_2px_12px_rgba(27,107,91,0.12)]"
              style={{ background: "linear-gradient(135deg, #1B6B5B 0%, #2D8B7A 100%)" }}
            >
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Sun className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-semibold text-[15px]">Registrar hora de despertar</p>
                <p className="text-white/70 text-[12px]">Toca para ingresar la hora manualmente</p>
              </div>
              <Pencil className="w-4 h-4 text-white/60 flex-shrink-0" />
            </button>
          </motion.div>
        )}

        {!wakeUpTime && showWakeUpForm && (
          <motion.div
            key="wakeup-form"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="rounded-[20px] p-5 shadow-[0_4px_28px_rgba(27,107,91,0.18)]"
            style={{ background: "linear-gradient(135deg, #0f4c38 0%, #1B6B5B 60%, #2a8a72 100%)" }}
          >
            <p className="text-white font-semibold text-[16px] mb-1">¿A qué hora despertaste?</p>
            <p className="text-white/70 text-[13px] mb-4">Ajusta si es necesario y confirma</p>

            <div className="bg-white/15 rounded-[14px] px-4 py-3 mb-4 flex items-center gap-3">
              <Sun className="w-4 h-4 text-white/70 flex-shrink-0" />
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="flex-1 bg-transparent text-white text-[22px] font-semibold tracking-wider focus:outline-none"
                style={{ colorScheme: "dark" }}
                autoFocus
              />
            </div>

            <div className="bg-white/10 rounded-[12px] px-4 py-3 mb-4 space-y-1.5">
              <p className="text-white/60 text-[11px] font-semibold uppercase tracking-wide mb-2">Al despertar</p>
              <div className="flex items-center gap-2">
                <Droplets className="w-3.5 h-3.5 text-[#7DD3E8]" />
                <p className="text-white/90 text-[13px]">1 vaso de agua en ayunas</p>
              </div>
              <div className="flex items-center gap-2">
                <Pill className="w-3.5 h-3.5 text-[#F5C87A]" />
                <p className="text-white/90 text-[13px]">Eutirox 150 mcg — solo con agua, esperar 30 min</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowWakeUpForm(false)}
                className="flex-1 py-3 rounded-[12px] bg-white/20 text-white text-[14px] font-semibold active:scale-[0.98] transition-transform"
              >
                Cancelar
              </button>
              <button
                onClick={() => { onSetWakeUpTime(selectedTime); setShowWakeUpForm(false); }}
                className="flex-1 py-3 rounded-[12px] bg-white flex items-center justify-center gap-2 text-[15px] font-semibold text-[#1B6B5B] active:scale-[0.98] transition-transform"
              >
                <Check className="w-4 h-4" />
                Confirmar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Wake-up confirmed chip (replaces prompt) ───────────────────── */}
      <AnimatePresence mode="wait">
        {wakeUpTime && !isEditingWakeUp && (
          <motion.div
            key="wakeup-done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#E8F5F0] rounded-[14px]"
          >
            <Sun className="w-4 h-4 text-[#1B6B5B] flex-shrink-0" />
            <p className="text-[13px] font-medium text-[#1B6B5B] flex-1">
              Desperté a las{" "}
              <strong>{formatTime12(wakeUpTime)}</strong>
              {" "}— recordatorios ajustados
            </p>
            <button
              onClick={() => { setEditTime(wakeUpTime); setIsEditingWakeUp(true); }}
              className="flex-shrink-0 flex items-center gap-1 text-[12px] font-semibold text-[#1B6B5B]/70 bg-white/70 px-2.5 py-1 rounded-full active:scale-95 transition-transform"
            >
              <Pencil className="w-3 h-3" />
              Editar
            </button>
          </motion.div>
        )}

        {wakeUpTime && isEditingWakeUp && (
          <motion.div
            key="wakeup-edit"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="rounded-[18px] p-4 shadow-[0_4px_20px_rgba(27,107,91,0.15)]"
            style={{ background: "linear-gradient(135deg, #0f4c38 0%, #1B6B5B 100%)" }}
          >
            <p className="text-white/80 text-[13px] font-medium mb-3">Corregir hora de despertar</p>
            <div className="bg-white/15 rounded-[12px] px-4 py-3 mb-3 flex items-center gap-3">
              <Sun className="w-4 h-4 text-white/70 flex-shrink-0" />
              <input
                type="time"
                value={editTime}
                onChange={(e) => setEditTime(e.target.value)}
                className="flex-1 bg-transparent text-white text-[22px] font-semibold tracking-wider focus:outline-none"
                style={{ colorScheme: "dark" }}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditingWakeUp(false)}
                className="flex-1 py-2.5 rounded-[10px] bg-white/20 text-white text-[14px] font-semibold active:scale-[0.98] transition-transform"
              >
                Cancelar
              </button>
              <button
                onClick={() => { onSetWakeUpTime(editTime); setIsEditingWakeUp(false); }}
                className="flex-1 py-2.5 rounded-[10px] bg-white text-[#1B6B5B] text-[14px] font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
              >
                <Check className="w-4 h-4" />
                Guardar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Notification status widget ─────────────────────────────────── */}
      <motion.div variants={cardReveal}>
        {/* NOT available — iOS Safari sin PWA instalada */}
        {notifPerm === "unavailable" && isIOS && !isStandalone && (
          <div className="flex items-start gap-3 bg-[#FFF5E0] rounded-[16px] px-4 py-3.5 shadow-[0_2px_12px_rgba(245,166,35,0.12)]">
            <Bell className="w-5 h-5 text-[#F5A623] flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[#1A1A2E]">Instala la app para notificaciones</p>
              <p className="text-[11px] text-[#9CA3AF] leading-relaxed mt-0.5">
                Safari → <strong className="text-[#374151]">Compartir</strong> → <strong className="text-[#374151]">Agregar a pantalla de inicio</strong> → abre desde ahí
              </p>
            </div>
          </div>
        )}

        {/* NOT available — navegador sin soporte */}
        {notifPerm === "unavailable" && !isIOS && (
          <div className="flex items-center gap-3 bg-white rounded-[16px] px-4 py-3 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            <BellOff className="w-5 h-5 text-[#9CA3AF] flex-shrink-0" />
            <p className="text-[13px] text-[#9CA3AF]">Tu navegador no soporta notificaciones web</p>
          </div>
        )}

        {/* Default — not yet asked */}
        {notifPerm === "default" && (
          <button
            onClick={handleActivar}
            className="w-full flex items-center gap-3 bg-[#FFF5E0] rounded-[16px] px-4 py-3 shadow-[0_2px_12px_rgba(245,166,35,0.15)] active:scale-[0.98] transition-transform"
          >
            <Bell className="w-5 h-5 text-[#F5A623] flex-shrink-0" />
            <div className="flex-1 text-left">
              <p className="text-[13px] font-semibold text-[#1A1A2E]">Activar notificaciones</p>
              <p className="text-[11px] text-[#9CA3AF]">Recordatorios de agua, medicamentos y más</p>
            </div>
            <span className="text-[12px] font-semibold text-[#F5A623] bg-[#F5A623]/10 px-2.5 py-1 rounded-full flex-shrink-0">
              Activar
            </span>
          </button>
        )}

        {/* Denied */}
        {notifPerm === "denied" && (
          <div className="flex items-start gap-3 bg-white rounded-[16px] px-4 py-3 shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-red-100">
            <BellOff className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-semibold text-[#1A1A2E]">Notificaciones bloqueadas</p>
              <p className="text-[11px] text-[#9CA3AF] leading-snug">
                {isIOS
                  ? "Ve a Configuración → Vitalia → Notificaciones → Permitir"
                  : "Haz clic en el candado de la barra de URL → Notificaciones → Permitir"}
              </p>
            </div>
          </div>
        )}

        {/* Granted */}
        {notifPerm === "granted" && (
          <div className="flex items-center gap-3 bg-[#E8F5F0] rounded-[16px] px-4 py-3 shadow-[0_2px_12px_rgba(27,107,91,0.08)]">
            <BellRing className="w-5 h-5 text-[#1B6B5B] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[#1B6B5B]">Notificaciones activas</p>
              <p className="text-[11px] text-[#1B6B5B]/60">
                {isIOS && !isStandalone
                  ? "Instala en pantalla de inicio para recibirlas en segundo plano"
                  : "Recibirás recordatorios de agua y medicamentos"}
              </p>
            </div>
            <button
              onClick={handleTest}
              className="flex-shrink-0 text-[12px] font-semibold text-[#1B6B5B] bg-white px-3 py-1.5 rounded-full active:scale-[0.95] transition-all"
            >
              {testSent ? "✓ Enviada" : "Probar"}
            </button>
          </div>
        )}
      </motion.div>

      {/* ── Hero greeting card ─────────────────────────────────────────── */}
      <motion.div
        variants={cardReveal}
        className="relative overflow-hidden rounded-[20px] h-[200px]"
        style={{ background: "linear-gradient(135deg, #1B6B5B 0%, #2D8B7A 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-15 bg-cover bg-center"
          style={{ backgroundImage: "url(/hero-bg.jpg)", backgroundBlendMode: "overlay" }}
        />
        <div className="relative z-10 h-full flex flex-col justify-between p-5">
          <div>
            <h1
              className="text-[28px] font-semibold text-white leading-tight"
              style={{ textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}
            >
              {greeting}, Rodolfo
            </h1>
            <p className="text-white/80 text-base mt-1 capitalize">{dateStr}</p>
          </div>
          <div className="space-y-2">
            <p className="text-white/90 text-[13px] font-medium">
              Hoy has completado {completedTasks} de {totalTasks} tareas
            </p>
            <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white/80 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
              />
            </div>
          </div>
        </div>
        <div className="absolute top-4 right-4 flex items-start gap-[-8px]">
          <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div className="w-8 h-8 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center -ml-2 mt-3">
            <Droplets className="w-4 h-4 text-white" />
          </div>
          <div className="w-6 h-6 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center -ml-1 mt-1">
            <Pill className="w-3 h-3 text-white" />
          </div>
        </div>
      </motion.div>

      {/* ── Quick stats row ────────────────────────────────────────────── */}
      <motion.div variants={cardReveal} className="flex gap-3">
        <button
          onClick={() => onNavigate(1)}
          className="flex-1 bg-white rounded-[20px] p-4 text-left shadow-[0_4px_24px_rgba(0,0,0,0.06)] active:scale-[0.97] transition-transform select-none"
        >
          <div className="w-10 h-10 rounded-full bg-[#E8F5F0] flex items-center justify-center mb-2">
            <ForkKnife className="w-5 h-5 text-[#1B6B5B]" />
          </div>
          <p className="text-[13px] font-medium text-[#9CA3AF] uppercase tracking-wide">Menu</p>
          <p className="text-lg font-semibold text-[#1A1A2E]">{menuCompleted}/{menuTotal}</p>
        </button>

        <button
          onClick={() => onNavigate(2)}
          className="flex-1 bg-white rounded-[20px] p-4 text-left shadow-[0_4px_24px_rgba(0,0,0,0.06)] active:scale-[0.97] transition-transform select-none"
        >
          <div className="w-10 h-10 rounded-full bg-[#E8F2FA] flex items-center justify-center mb-2">
            <Droplets className="w-5 h-5 text-[#3B9DD8]" />
          </div>
          <p className="text-[13px] font-medium text-[#9CA3AF] uppercase tracking-wide">Agua</p>
          <p className="text-lg font-semibold text-[#3B9DD8]">{waterCount}/12 vasos</p>
        </button>

        <button
          onClick={() => onNavigate(3)}
          className="flex-1 bg-white rounded-[20px] p-4 text-left shadow-[0_4px_24px_rgba(0,0,0,0.06)] active:scale-[0.97] transition-transform select-none"
        >
          <div className="w-10 h-10 rounded-full bg-[#FFF5E0] flex items-center justify-center mb-2">
            <Pill className="w-5 h-5 text-[#F5A623]" />
          </div>
          <p className="text-[13px] font-medium text-[#9CA3AF] uppercase tracking-wide">Medicinas</p>
          <p className="text-lg font-semibold text-[#1A1A2E]">{medsCompleted}/{medsTotal}</p>
        </button>
      </motion.div>

      {/* ── Daily tip ──────────────────────────────────────────────────── */}
      <motion.div
        variants={cardReveal}
        className="bg-white rounded-[20px] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border-l-4 border-[#F5A623]"
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#FFF5E0] flex items-center justify-center flex-shrink-0 mt-0.5">
            <Lightbulb className="w-4 h-4 text-[#F5A623]" />
          </div>
          <div>
            <p className="text-base font-semibold text-[#1A1A2E] mb-1">Consejo del Día</p>
            <p className="text-[15px] text-[#6B7280] leading-relaxed">{dailyTip}</p>
          </div>
        </div>
      </motion.div>

      {/* ── Single rotating recommendation ────────────────────────────── */}
      <motion.div
        variants={cardReveal}
        className="bg-white rounded-[20px] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border-l-4 border-[#3B9DD8]"
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#E8F2FA] flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertCircle className="w-4 h-4 text-[#3B9DD8]" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-1">
              Recomendación SALUDMED
            </p>
            <p className="text-base font-semibold text-[#1A1A2E] mb-1">{dailyRec.title}</p>
            <p className="text-[14px] text-[#6B7280] leading-relaxed">{dailyRec.body}</p>
          </div>
        </div>
      </motion.div>

      {/* ── Backup & Restore ───────────────────────────────────────────── */}
      <motion.div
        variants={cardReveal}
        className="bg-white rounded-[20px] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
      >
        {/* ── Header ── */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-[#F0F4FF] flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-[#6366F1]" />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-[#1A1A2E]">Respaldo de datos</p>
            <p className={`text-[12px] ${lastBackupDate ? "text-[#9CA3AF]" : "text-[#F5A623]"}`}>
              {lastBackupDate ? `Último respaldo: ${lastBackupDate}` : "Sin respaldo guardado aún"}
            </p>
          </div>
        </div>

        {/* ── Crear respaldo ── */}
        <button
          onClick={() => {
            setExportDone(null);
            void exportData((filename) => setExportDone(filename));
          }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-[14px] bg-[#F0F4FF] text-[#6366F1] text-[14px] font-semibold active:scale-[0.97] transition-transform"
        >
          <Download className="w-4 h-4" />
          Crear respaldo
        </button>

        <AnimatePresence>
          {exportDone && (
            <motion.div
              key="export-done"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="mt-2 bg-[#E8F5F0] rounded-[12px] px-4 py-2.5"
            >
              <p className="text-[13px] font-semibold text-[#1B6B5B]">✓ Respaldo creado</p>
              <p className="text-[11px] text-[#6B7280] mt-0.5 font-mono break-all">{exportDone}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Divider ── */}
        <div className="border-t border-[#F3F4F6] my-4" />

        {/* ── Restaurar ── */}
        <AnimatePresence mode="wait">
          {!importPreview ? (
            <motion.div key="restore-btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  e.target.value = "";   // reset so same file can be re-selected
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    const raw = ev.target?.result as string;
                    const preview = parseBackup(raw);
                    if (!preview) {
                      setImportError("El archivo no es un respaldo válido de Vitalia. Asegúrate de seleccionar un archivo creado con el botón \"Crear respaldo\".");
                      setImportPreview(null);
                      setImportRaw(null);
                    } else {
                      setImportPreview(preview);
                      setImportRaw(raw);
                      setImportError(null);
                    }
                  };
                  reader.onerror = () => setImportError("No se pudo leer el archivo.");
                  reader.readAsText(file);
                }}
              />
              <button
                onClick={() => { setImportError(null); fileInputRef.current?.click(); }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-[14px] bg-[#E8F5F0] text-[#1B6B5B] text-[14px] font-semibold active:scale-[0.97] transition-transform"
              >
                <Upload className="w-4 h-4" />
                Restaurar desde respaldo
              </button>
              {importError && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2 text-[12px] text-red-500 leading-snug"
                >
                  {importError}
                </motion.p>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="restore-preview"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {/* Preview card */}
              <div className="bg-[#F8FAFB] rounded-[14px] p-4">
                <p className="text-[13px] font-semibold text-[#1A1A2E] mb-2">
                  📁{" "}
                  {new Date(importPreview.date).toLocaleDateString("es-ES", {
                    day: "numeric", month: "long", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {importPreview.evolutionCount > 0 && (
                    <span className="text-[11px] bg-[#E8F5F0] text-[#1B6B5B] px-2.5 py-1 rounded-full font-medium">
                      📊 {importPreview.evolutionCount} medidas
                    </span>
                  )}
                  {importPreview.hasWater && (
                    <span className="text-[11px] bg-[#E8F2FA] text-[#3B9DD8] px-2.5 py-1 rounded-full font-medium">
                      💧 Agua
                    </span>
                  )}
                  {importPreview.hasMeds && (
                    <span className="text-[11px] bg-[#FFF5E0] text-[#E8890C] px-2.5 py-1 rounded-full font-medium">
                      💊 Medicamentos
                    </span>
                  )}
                  {importPreview.hasMenu && (
                    <span className="text-[11px] bg-[#F5F0FF] text-[#8B5CF6] px-2.5 py-1 rounded-full font-medium">
                      🍽️ Menú
                    </span>
                  )}
                  {importPreview.hasFoodLog && (
                    <span className="text-[11px] bg-[#FFF5E0] text-[#E8890C] px-2.5 py-1 rounded-full font-medium">
                      🔥 Calorías
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#9CA3AF]">
                  Los datos actuales serán reemplazados por este respaldo.
                </p>
              </div>

              {/* Confirm / Cancel */}
              <div className="flex gap-2">
                <button
                  onClick={() => { setImportPreview(null); setImportRaw(null); setImportError(null); }}
                  className="flex-1 py-2.5 rounded-[12px] bg-[#F3F4F6] text-[#6B7280] text-[14px] font-semibold active:scale-[0.97] transition-transform"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (!importRaw) return;
                    const ok = applyBackup(importRaw);
                    if (ok) {
                      setTimeout(() => window.location.reload(), 400);
                    } else {
                      setImportError("Error inesperado al restaurar. Intenta de nuevo.");
                      setImportPreview(null);
                      setImportRaw(null);
                    }
                  }}
                  className="flex-1 py-2.5 rounded-[12px] bg-[#1B6B5B] text-white text-[14px] font-semibold flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
                >
                  <Check className="w-4 h-4" />
                  Restaurar ahora
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-[11px] text-[#C4C4C4] text-center mt-4">
          iOS puede borrar datos sin uso en 7 días · Haz un respaldo semanal
        </p>
      </motion.div>
    </motion.div>
  );

}
