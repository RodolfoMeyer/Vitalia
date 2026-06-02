import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Clock, Plus, Trash2, X, Save, AlarmClock, Bell, BellOff, RefreshCw } from "lucide-react";
import { refreshPushSubscription } from "@/hooks/useNotifications";
import { medications } from "@/data/menuData";
import type { CustomMedication } from "@/hooks/useAppState";

// ── Time helpers ──────────────────────────────────────────────────────────────

function addMinutes(hhmm: string, mins: number): string {
  const [h, m] = hhmm.split(":").map(Number);
  const total   = h * 60 + m + mins;
  const clamped = Math.max(0, Math.min(23 * 60 + 59, total));
  return `${String(Math.floor(clamped / 60)).padStart(2, "0")}:${String(clamped % 60).padStart(2, "0")}`;
}

function formatAmPm(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h < 12 ? "AM" : "PM";
  const h12    = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

function getTodayISO(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Santiago" }).format(new Date());
}

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

const colorClasses: Record<string, { border: string; badge: string; badgeText: string }> = {
  amber:  { border: "border-l-[#F5A623]", badge: "bg-[#FFF5E0]",  badgeText: "text-[#F5A623]" },
  teal:   { border: "border-l-[#1B6B5B]", badge: "bg-[#E8F5F0]",  badgeText: "text-[#1B6B5B]" },
  blue:   { border: "border-l-[#3B9DD8]", badge: "bg-[#E8F2FA]",  badgeText: "text-[#3B9DD8]" },
  purple: { border: "border-l-[#8B5CF6]", badge: "bg-[#EDE9FE]",  badgeText: "text-[#8B5CF6]" },
};

const colorOptions: Array<{ key: CustomMedication["color"]; hex: string; label: string }> = [
  { key: "teal",   hex: "#1B6B5B", label: "Verde"   },
  { key: "blue",   hex: "#3B9DD8", label: "Azul"    },
  { key: "amber",  hex: "#F5A623", label: "Naranja" },
  { key: "purple", hex: "#8B5CF6", label: "Violeta" },
];

const inputCls =
  "w-full px-3 py-2.5 rounded-[10px] border border-[#E5E7EB] text-[14px] text-[#1A1A2E] focus:outline-none focus:border-[#1B6B5B] transition-colors bg-[#F9FAFB]";
const labelCls = "block text-[12px] font-medium text-[#6B7280] mb-1";

interface MedsViewProps {
  medsChecked: boolean[];
  onToggleMed: (index: number) => void;
  completedCount: number;
  totalCount: number;
  customMeds: CustomMedication[];
  customMedsChecked: Record<string, boolean>;
  onToggleCustomMed: (id: string) => void;
  onAddCustomMed: (med: CustomMedication) => void;
  onDeleteCustomMed: (id: string) => void;
  wakeUpTime: string | null;
}

export function MedsView({
  medsChecked,
  onToggleMed,
  completedCount,
  totalCount,
  customMeds,
  customMedsChecked,
  onToggleCustomMed,
  onAddCustomMed,
  onDeleteCustomMed,
  wakeUpTime,
}: MedsViewProps) {
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const todayISO = getTodayISO();

  // ── Notification status ─────────────────────────────────────────────────
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
    return Notification.permission;
  });
  const [pushActive,   setPushActive]   = useState(() => !!localStorage.getItem("vitalia_push_active"));
  const [refreshing,   setRefreshing]   = useState(false);
  const [refreshResult, setRefreshResult] = useState<"ok" | "fail" | null>(null);

  useEffect(() => {
    if ("Notification" in window) setNotifPermission(Notification.permission);
    setPushActive(!!localStorage.getItem("vitalia_push_active"));
  }, []);

  const handleRefreshPush = async () => {
    setRefreshing(true);
    setRefreshResult(null);
    const ok = await refreshPushSubscription(wakeUpTime);
    setPushActive(ok);
    setRefreshResult(ok ? "ok" : "fail");
    setRefreshing(false);
    setTimeout(() => setRefreshResult(null), 4000);
  };

  // ── Add-med form state ──────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [name,         setName]         = useState("");
  const [dosage,       setDosage]       = useState("");
  const [time,         setTime]         = useState("08:00");
  const [instructions, setInstructions] = useState("");
  const [color,        setColor]        = useState<CustomMedication["color"]>("blue");
  const [saved,        setSaved]        = useState(false);

  const canSave = name.trim().length > 0 && dosage.trim().length > 0 && time.length > 0;

  const handleSave = () => {
    if (!canSave) return;
    const id = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    onAddCustomMed({ id, name: name.trim(), dosage: dosage.trim(), time, instructions: instructions.trim(), color });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setShowForm(false);
      setName(""); setDosage(""); setTime("08:00"); setInstructions(""); setColor("blue");
    }, 1000);
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="px-5 pt-6 pb-28"
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-bold text-[#1A1A2E]">Medicamentos</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm transition-all duration-200 ${
            showForm
              ? "bg-[#FEE8E8] text-[#E53E3E]"
              : "bg-[#1B6B5B] text-white"
          }`}
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>

      {/* ── Notification status card ───────────────────────────────────── */}
      <motion.div variants={cardReveal} className="bg-white rounded-[20px] p-4 shadow-[0_4px_24px_rgba(0,0,0,0.06)] mb-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
              notifPermission === "granted" && pushActive
                ? "bg-[#E8F5F0]"
                : notifPermission === "denied"
                ? "bg-[#FEE8E8]"
                : "bg-[#FFF5E0]"
            }`}>
              {notifPermission === "granted" && pushActive
                ? <Bell className="w-4 h-4 text-[#1B6B5B]" />
                : notifPermission === "denied"
                ? <BellOff className="w-4 h-4 text-[#E53E3E]" />
                : <Bell className="w-4 h-4 text-[#F5A623]" />
              }
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#1A1A2E]">
                {notifPermission === "granted" && pushActive
                  ? "Notificaciones activas"
                  : notifPermission === "granted" && !pushActive
                  ? "Suscripción vencida"
                  : notifPermission === "denied"
                  ? "Notificaciones bloqueadas"
                  : notifPermission === "unsupported"
                  ? "No soportadas en este navegador"
                  : "Notificaciones no activadas"}
              </p>
              <p className="text-[11px] text-[#9CA3AF]">
                {notifPermission === "granted" && pushActive
                  ? "Recibirás avisos aunque la app esté cerrada"
                  : notifPermission === "granted" && !pushActive
                  ? "Toca Renovar para recibir notificaciones de nuevo"
                  : notifPermission === "denied"
                  ? "Ve a Ajustes del sistema para habilitarlas"
                  : notifPermission === "unsupported"
                  ? "Instala la app en tu pantalla de inicio (iOS 16.4+)"
                  : "Toca Activar para recibir recordatorios"}
              </p>
            </div>
          </div>

          {/* Action button */}
          {notifPermission !== "denied" && notifPermission !== "unsupported" && (
            <button
              onClick={handleRefreshPush}
              disabled={refreshing}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[12px] font-semibold transition-all ${
                refreshResult === "ok"
                  ? "bg-[#E8F5F0] text-[#1B6B5B]"
                  : refreshResult === "fail"
                  ? "bg-[#FEE8E8] text-[#E53E3E]"
                  : "bg-[#1B6B5B] text-white"
              } disabled:opacity-60`}
            >
              {refreshing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : refreshResult === "ok" ? (
                <>✓ Listo</>
              ) : refreshResult === "fail" ? (
                <>✗ Error</>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  {notifPermission === "granted" ? "Renovar" : "Activar"}
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>

      {/* ── Add-med form ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            key="add-form"
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 20 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-[20px] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
              <p className="text-[15px] font-semibold text-[#1A1A2E] mb-4">Nuevo medicamento</p>

              {/* Nombre + Dosis */}
              <div className="flex gap-3 mb-3">
                <div className="flex-1">
                  <label className={labelCls}>Nombre *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Metformina"
                    className={inputCls}
                  />
                </div>
                <div className="w-[110px]">
                  <label className={labelCls}>Dosis *</label>
                  <input
                    type="text"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="500 mg"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Horario */}
              <div className="mb-3">
                <label className={labelCls}>Horario *</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className={inputCls}
                />
                <p className="text-[11px] text-[#9CA3AF] mt-1">
                  Se programará una notificación a esta hora cada día.
                </p>
              </div>

              {/* Instrucciones */}
              <div className="mb-4">
                <label className={labelCls}>Instrucciones (opcional)</label>
                <input
                  type="text"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Ej: Con el desayuno"
                  className={inputCls}
                />
              </div>

              {/* Color */}
              <div className="mb-5">
                <label className={labelCls}>Color</label>
                <div className="flex gap-3 mt-1">
                  {colorOptions.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setColor(opt.key)}
                      title={opt.label}
                      className={`w-8 h-8 rounded-full transition-transform duration-150 ${
                        color === opt.key ? "scale-125 ring-2 ring-offset-2" : "scale-100"
                      }`}
                      style={{
                        background: opt.hex,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Save */}
              <button
                onClick={handleSave}
                disabled={!canSave}
                className="w-full py-3 rounded-[12px] flex items-center justify-center gap-2 text-[14px] font-semibold text-white transition-all duration-200 active:scale-[0.98] disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #1B6B5B 0%, #2D8B7A 100%)" }}
              >
                {saved ? (
                  <motion.span initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
                    ✓ Guardado
                  </motion.span>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Agregar medicamento
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Wake-up schedule banner ─────────────────────────────────────── */}
      {wakeUpTime ? (
        <motion.div
          variants={cardReveal}
          className="bg-[#E8F5F0] rounded-[16px] px-4 py-3 flex items-center gap-3 mb-1"
        >
          <AlarmClock className="w-4 h-4 text-[#1B6B5B] flex-shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-[#1B6B5B]">
              Horario calculado desde las {formatAmPm(wakeUpTime)}
            </p>
            <p className="text-[11px] text-[#1B6B5B]/70">
              Los horarios se ajustan automáticamente a tu hora de despertar
            </p>
          </div>
        </motion.div>
      ) : (
        <motion.div
          variants={cardReveal}
          className="bg-[#FFF5E0] rounded-[16px] px-4 py-3 flex items-center gap-3 mb-1"
        >
          <AlarmClock className="w-4 h-4 text-[#F5A623] flex-shrink-0" />
          <p className="text-[12px] text-[#92400E]">
            Registra tu hora de despertar en <strong>Inicio</strong> para ver los horarios exactos
          </p>
        </motion.div>
      )}

      {/* ── Built-in medication cards ───────────────────────────────────── */}
      <div className="space-y-3">
        {medications.map((med, idx) => {
          const isUpcoming = !!med.startDate && todayISO < med.startDate;
          const isChecked  = !isUpcoming && (medsChecked[idx] || false);
          const colors     = colorClasses[med.color] ?? colorClasses.blue;
          const startLabel = med.startDate
            ? med.startDate.split("-").reverse().slice(0, 2).join("/")
            : null;

          // Compute dynamic time label based on wake-up time
          const computedTime  = wakeUpTime ? addMinutes(wakeUpTime, med.wakeOffsetMin) : null;
          const displayLabel  = computedTime
            ? `${computedTime} · ${med.timeContext}`
            : med.timeLabel;

          return (
            <motion.div
              key={med.id}
              variants={cardReveal}
              className={`bg-white rounded-[20px] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border-l-4 ${colors.border} transition-opacity duration-300 ${
                isChecked ? "opacity-50" : isUpcoming ? "opacity-70" : "opacity-100"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className={`text-lg font-semibold ${isChecked ? "text-[#9CA3AF] line-through" : "text-[#1A1A2E]"}`}>
                      {med.name}
                    </h3>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${colors.badge} ${colors.badgeText}`}>
                      {displayLabel}
                    </span>
                    {isUpcoming && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F3F4F6] text-[#9CA3AF]">
                        <Clock className="w-3 h-3" />
                        Desde {startLabel}
                      </span>
                    )}
                  </div>
                  <p className="text-[15px] text-[#6B7280] mb-1">{med.dosage}</p>
                  <p className="text-[13px] text-[#9CA3AF]">{med.instructions}</p>
                </div>
                <button
                  onClick={() => !isUpcoming && onToggleMed(idx)}
                  disabled={isUpcoming}
                  className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200 mt-1 ${
                    isUpcoming
                      ? "border-[#E5E7EB] bg-[#F9FAFB] cursor-not-allowed"
                      : isChecked
                      ? "bg-[#10B981] border-[#10B981]"
                      : "border-[#D1D5DB] bg-transparent hover:border-[#9CA3AF]"
                  }`}
                >
                  {isChecked && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 15 }}>
                      <Check className="w-4 h-4 text-white" strokeWidth={3} />
                    </motion.div>
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}

        {/* ── Custom medication cards ─────────────────────────────────── */}
        <AnimatePresence>
          {customMeds.map((med) => {
            const isChecked = customMedsChecked[med.id] || false;
            const colors    = colorClasses[med.color] ?? colorClasses.blue;
            const [hh]  = med.time.split(":");
            const h = parseInt(hh, 10);
            const period = h < 12 ? "Mañana" : h < 17 ? "Tarde" : "Noche";
            const timeLabel = `${med.time} · ${period}`;

            return (
              <motion.div
                key={med.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className={`bg-white rounded-[20px] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border-l-4 ${colors.border} transition-opacity duration-300 ${
                  isChecked ? "opacity-50" : "opacity-100"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className={`text-lg font-semibold ${isChecked ? "text-[#9CA3AF] line-through" : "text-[#1A1A2E]"}`}>
                        {med.name}
                      </h3>
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${colors.badge} ${colors.badgeText}`}>
                        {timeLabel}
                      </span>
                    </div>
                    <p className="text-[15px] text-[#6B7280] mb-1">{med.dosage}</p>
                    {med.instructions && (
                      <p className="text-[13px] text-[#9CA3AF]">{med.instructions}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                    {/* Delete */}
                    <button
                      onClick={() => {
                        if (window.confirm(`¿Eliminar "${med.name}"?`)) onDeleteCustomMed(med.id);
                      }}
                      className="w-7 h-7 rounded-full bg-[#FEE8E8] flex items-center justify-center"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-[#E53E3E]" />
                    </button>

                    {/* Checkbox */}
                    <button
                      onClick={() => onToggleCustomMed(med.id)}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                        isChecked
                          ? "bg-[#10B981] border-[#10B981]"
                          : "border-[#D1D5DB] bg-transparent hover:border-[#9CA3AF]"
                      }`}
                    >
                      {isChecked && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 15 }}>
                          <Check className="w-4 h-4 text-white" strokeWidth={3} />
                        </motion.div>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ── Completion summary ─────────────────────────────────────────── */}
      <motion.div variants={cardReveal} className="mt-6">
        <div className="bg-white rounded-[20px] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[15px] text-[#6B7280]">
              {completedCount} de {totalCount} medicamentos tomados hoy
            </span>
            <span className="text-[15px] font-semibold text-[#1A1A2E]">
              {Math.round(progressPercent)}%
            </span>
          </div>
          <div className="w-full h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #1B6B5B 0%, #2D8B7A 100%)" }}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
