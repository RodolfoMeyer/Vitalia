import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, Save, Trash2, Ruler, Bluetooth, BluetoothOff,
  Activity, Target, Edit3, Check,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import type { MeasureEntry } from "@/hooks/useAppState";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeInOut" as const },
};

const inputCls =
  "w-full px-3 py-3 rounded-[12px] border border-[#E5E7EB] text-[15px] text-[#1A1A2E] focus:outline-none focus:border-[#1B6B5B] transition-colors";
const labelCls = "block text-[13px] font-medium text-[#6B7280] mb-1";

const tooltipStyle = {
  background: "white",
  border: "none",
  borderRadius: "12px",
  boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
  fontSize: "13px",
  padding: "8px 12px",
};

type TimeRange = "week" | "month" | "year" | "all";

const RANGE_LABELS: Record<TimeRange, string> = {
  week:  "Semana",
  month: "Mes",
  year:  "Año",
  all:   "Todo",
};

function filterByRange(entries: MeasureEntry[], range: TimeRange): MeasureEntry[] {
  if (range === "all") return entries;
  const now  = new Date();
  const from = new Date(now);
  if (range === "week")  from.setDate(now.getDate() - 7);
  if (range === "month") from.setMonth(now.getMonth() - 1);
  if (range === "year")  from.setFullYear(now.getFullYear() - 1);
  return entries.filter((e) => new Date(e.date) >= from);
}

function formatLabel(isoDate: string, range: TimeRange): string {
  const d = new Date(isoDate + "T12:00:00");
  if (range === "week" || range === "month") {
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
  }
  if (range === "year") {
    return d.toLocaleDateString("es-ES", { month: "short" }).replace(".", "");
  }
  const mon = d.toLocaleDateString("es-ES", { month: "short" }).replace(".", "");
  const yr  = String(d.getFullYear()).slice(2);
  return `${mon} '${yr}`;
}

function getImcStatus(imc: number): { label: string; color: string; bg: string } {
  if (imc < 18.5) return { label: "Bajo peso", color: "#F5A623", bg: "#FFF5E0" };
  if (imc < 25)   return { label: "Normal",    color: "#1B6B5B", bg: "#E8F5F0" };
  if (imc < 30)   return { label: "Sobrepeso", color: "#E8890C", bg: "#FFF0E0" };
  return              { label: "Obesidad",  color: "#E53E3E", bg: "#FEE8E8" };
}

function getIccStatus(icc: number): { label: string; color: string } {
  if (icc <= 0.9)  return { label: "Normal",         color: "#1B6B5B" };
  if (icc <= 1.0)  return { label: "Riesgo elevado", color: "#E8890C" };
  return               { label: "Riesgo alto",    color: "#E53E3E" };
}

interface EvolutionViewProps {
  entries: MeasureEntry[];
  onAddEntry: (entry: MeasureEntry) => void;
  onDeleteEntry: (date: string) => void;
  weightGoal: number | null;
  onSetWeightGoal: (goal: number | null) => void;
}

/* ── Shared chart wrapper ───────────────────────────────────────────────── */
function ChartCard({
  icon, iconColor, title, subtitle, delay, children,
}: {
  icon: React.ReactNode; iconColor: string; title: string;
  subtitle: string; delay: number; children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeInOut", delay }}
      className="bg-white rounded-[20px] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
    >
      <div className="flex items-center gap-2 mb-1" style={{ color: iconColor }}>
        {icon}
        <p className="text-[15px] font-semibold text-[#1A1A2E]">{title}</p>
      </div>
      <p className="text-[12px] text-[#9CA3AF] mb-4">{subtitle}</p>
      {children}
    </motion.div>
  );
}

/* ── Empty chart placeholder ────────────────────────────────────────────── */
function NoDataInRange({ range }: { range: TimeRange }) {
  return (
    <div className="h-[140px] flex flex-col items-center justify-center gap-2">
      <TrendingUp className="w-8 h-8 text-[#E5E7EB]" />
      <p className="text-[13px] text-[#D1D5DB]">
        Sin datos para {RANGE_LABELS[range].toLowerCase()}
      </p>
    </div>
  );
}

/* ── Metric tile (body composition grid) ───────────────────────────────── */
function MetricTile({
  label, value, unit, note, noteColor,
}: {
  label: string; value: string; unit: string; note?: string; noteColor?: string;
}) {
  return (
    <div className="bg-[#F8FAFB] rounded-[14px] p-3">
      <p className="text-[11px] text-[#9CA3AF] leading-tight mb-1">{label}</p>
      <p className="text-[20px] font-bold text-[#1A1A2E] leading-none">
        {value}
        <span className="text-[13px] font-medium text-[#6B7280] ml-0.5">{unit}</span>
      </p>
      {note && (
        <p className="text-[11px] font-semibold mt-0.5" style={{ color: noteColor ?? "#6B7280" }}>
          {note}
        </p>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════ */
export function EvolutionView({
  entries, onAddEntry, onDeleteEntry, weightGoal, onSetWeightGoal,
}: EvolutionViewProps) {
  const today = new Date().toISOString().split("T")[0];
  const [date,   setDate]   = useState(today);
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [neck,   setNeck]   = useState("");
  const [waist,  setWaist]  = useState("");
  const [hip,    setHip]    = useState("");
  const [saved,  setSaved]  = useState(false);
  const [range,  setRange]  = useState<TimeRange>("month");

  const [bodyFat,     setBodyFat]     = useState("");
  const [muscleMass,  setMuscleMass]  = useState("");
  const [boneMass,    setBoneMass]    = useState("");
  const [proteins,    setProteins]    = useState("");
  const [visceralFat, setVisceralFat] = useState("");
  const [bmr,         setBmr]         = useState("");
  const [bodyWater,   setBodyWater]   = useState("");

  const [btStatus,  setBtStatus]  = useState<"idle"|"scanning"|"connected"|"error"|"unavailable">("idle");
  const [btMessage, setBtMessage] = useState("");

  // Goal editing
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput,   setGoalInput]   = useState(weightGoal ? String(weightGoal) : "73");

  // Form collapsed / expanded
  const [formOpen, setFormOpen] = useState(false);

  /* ── Bluetooth ──────────────────────────────────────────────────────── */
  const connectScale = useCallback(async () => {
    if (!("bluetooth" in navigator)) {
      setBtStatus("unavailable");
      setBtMessage("Bluetooth no disponible en iPhone/Safari. Ingresa los datos manualmente desde Huawei Health.");
      return;
    }
    setBtStatus("scanning");
    setBtMessage("Buscando balanza Huawei AH100…");
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const btNav = navigator as any;
      const device = await btNav.bluetooth.requestDevice({
        filters: [
          { namePrefix: "HUAWEI" },
          { namePrefix: "Huawei" },
          { namePrefix: "Body Fat" },
          { namePrefix: "AH100" },
        ],
        optionalServices: [0x181B, 0x181D, 0xFFF0],
      });
      setBtMessage(`Conectando a ${device.name ?? "balanza"}…`);
      const server = await device.gatt!.connect();
      setBtStatus("connected");

      let handled = false;
      try {
        const svc  = await server.getPrimaryService(0x181B);
        const char = await svc.getCharacteristic(0x2A9C);
        await char.startNotifications();
        char.addEventListener("characteristicvaluechanged", (ev: Event) => {
          const val = (ev.target as unknown as { value: DataView }).value!;
          const flags = val.getUint16(0, true);
          let offset = 2;
          if (!(flags & 0x0001)) {
            const fatPct = val.getUint16(offset, true) * 0.1; offset += 2;
            setBodyFat(fatPct.toFixed(1));
            if (flags & 0x0002) { offset += 2; }
            if (flags & 0x0004) { offset += 2; }
            if (flags & 0x0008) { const muscle = val.getUint16(offset, true) * 0.005; offset += 2; setMuscleMass(muscle.toFixed(1)); }
            if (flags & 0x0010) { offset += 2; }
            if (flags & 0x0020) { offset += 2; }
            if (flags & 0x0040) { const water = val.getUint16(offset, true) * 0.005; offset += 2; setBodyWater((water / (parseFloat(weight) || 1) * 100).toFixed(1)); }
            if (flags & 0x0080) { offset += 2; }
            if (flags & 0x0100) { const w = val.getUint16(offset, true) * 0.005; offset += 2; setWeight(w.toFixed(1)); }
            if (flags & 0x0200) { const h = val.getUint16(offset, true) * 0.1; offset += 2; setHeight(h.toFixed(0)); }
          }
          setBtMessage("✓ Datos recibidos. Revisa y guarda.");
        });
        handled = true;
      } catch { /* service not found */ }

      if (!handled) {
        try {
          const svc  = await server.getPrimaryService(0x181D);
          const char = await svc.getCharacteristic(0x2A9D);
          await char.startNotifications();
          char.addEventListener("characteristicvaluechanged", (ev: Event) => {
            const val = (ev.target as unknown as { value: DataView }).value!;
            const flags = val.getUint8(0);
            if (!(flags & 0x01)) {
              const w = val.getUint16(1, true) * 0.005;
              setWeight(w.toFixed(1));
              setBtMessage("✓ Peso recibido. Ingresa los demás datos manualmente.");
            }
          });
        } catch {
          setBtMessage("Balanza conectada pero no envía composición. Ingresa manualmente.");
        }
      }
    } catch (e) {
      setBtStatus("error");
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("cancelled") || msg.includes("user")) {
        setBtStatus("idle");
        setBtMessage("");
      } else {
        setBtMessage("No se pudo conectar. Asegúrate de que la balanza esté encendida.");
      }
    }
  }, [weight]);

  /* ── IMC & ICC ──────────────────────────────────────────────────────── */
  const calcImc = (): number | null => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (!h || !w || h <= 0 || w <= 0) return null;
    return parseFloat((w / (h / 100) ** 2).toFixed(1));
  };

  const imc       = calcImc();
  const imcStatus = imc !== null ? getImcStatus(imc) : null;

  const neckVal   = parseFloat(neck)  || null;
  const waistVal  = parseFloat(waist) || null;
  const hipVal    = parseFloat(hip)   || null;
  const icc       = waistVal && hipVal ? parseFloat((waistVal / hipVal).toFixed(2)) : null;
  const iccStatus = icc !== null ? getIccStatus(icc) : null;

  /* ── Save ───────────────────────────────────────────────────────────── */
  const handleSave = () => {
    const h      = parseFloat(height);
    const w      = parseFloat(weight);
    const imcVal = calcImc();
    if (!h || !w || imcVal === null || !date) return;
    const entry: MeasureEntry = { date, height: h, weight: w, imc: imcVal };
    if (neckVal)  entry.neck  = neckVal;
    if (waistVal) entry.waist = waistVal;
    if (hipVal)   entry.hip   = hipVal;
    const bfVal = parseFloat(bodyFat);     if (!isNaN(bfVal)  && bfVal > 0)  entry.bodyFat     = bfVal;
    const mmVal = parseFloat(muscleMass);  if (!isNaN(mmVal)  && mmVal > 0)  entry.muscleMass  = mmVal;
    const bmVal = parseFloat(boneMass);    if (!isNaN(bmVal)  && bmVal > 0)  entry.boneMass    = bmVal;
    const prVal = parseFloat(proteins);    if (!isNaN(prVal)  && prVal > 0)  entry.proteins    = prVal;
    const vfVal = parseFloat(visceralFat); if (!isNaN(vfVal)  && vfVal > 0)  entry.visceralFat = vfVal;
    const brVal = parseFloat(bmr);         if (!isNaN(brVal)  && brVal > 0)  entry.bmr         = brVal;
    const bwVal = parseFloat(bodyWater);   if (!isNaN(bwVal)  && bwVal > 0)  entry.bodyWater   = bwVal;
    onAddEntry(entry);
    setSaved(true);
    setFormOpen(false);
    setTimeout(() => setSaved(false), 2000);
  };

  /* ── Derived data ───────────────────────────────────────────────────── */
  const allSorted  = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const filtered   = filterByRange(allSorted, range);

  const latestEntry = allSorted.length > 0 ? allSorted[allSorted.length - 1] : null;
  const firstEntry  = allSorted.length > 0 ? allSorted[0] : null;
  const totalLost   = latestEntry && firstEntry
    ? parseFloat((latestEntry.weight - firstEntry.weight).toFixed(1))
    : null;
  const latestImcStatus = latestEntry ? getImcStatus(latestEntry.imc) : null;

  const chartData = filtered.map((e) => ({
    label:      formatLabel(e.date, range),
    rawDate:    e.date,
    peso:       e.weight,
    imc:        e.imc,
    cuello:     e.neck        ?? null,
    cintura:    e.waist       ?? null,
    cadera:     e.hip         ?? null,
    grasa:      e.bodyFat     ?? null,
    musculo:    e.muscleMass  ?? null,
  }));

  const has2pts       = chartData.length >= 2;
  const has1pt        = chartData.length >= 1;
  const hasCircumData = filtered.some((e) => e.waist || e.hip || e.neck);
  const hasBodyComp   = filtered.some((e) => e.bodyFat);
  const hasMuscle     = filtered.some((e) => e.muscleMass);
  const hasAnyData    = entries.length > 0;

  /* ════════════════════════════════════════════════════════════════════
     JSX
  ════════════════════════════════════════════════════════════════════ */
  return (
    <div className="px-5 pt-6 pb-28 space-y-5">
      <h2 className="text-2xl font-bold text-[#1A1A2E]">Evolución</h2>

      {/* ══ DASHBOARD: última medida (estilo Huawei Health) ══════════════ */}
      {latestEntry && latestImcStatus && (
        <motion.div
          {...fadeUp}
          className="bg-white rounded-[24px] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.08)] overflow-hidden relative"
        >
          {/* Fondo decorativo */}
          <div
            className="absolute -top-10 -right-10 w-44 h-44 rounded-full opacity-[0.06]"
            style={{ background: latestImcStatus.color }}
          />

          {/* ── Peso principal ───────────────────────────────────────── */}
          <div className="text-center pb-5 mb-5 border-b border-[#F3F4F6]">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span
                className="text-[13px] font-semibold"
                style={{ color: latestImcStatus.color }}
              >
                IMC {latestEntry.imc}
              </span>
              <span
                className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                style={{ background: latestImcStatus.bg, color: latestImcStatus.color }}
              >
                {latestImcStatus.label}
              </span>
            </div>
            <p className="text-[64px] font-black text-[#1A1A2E] leading-none tracking-tight">
              {latestEntry.weight}
              <span className="text-[22px] font-semibold text-[#9CA3AF] ml-1.5">kg</span>
            </p>
            {latestEntry.bodyFat && (
              <p className="text-[14px] text-[#6B7280] mt-1.5">
                Grasa corporal <strong>{latestEntry.bodyFat}%</strong>
              </p>
            )}
            <p className="text-[11px] text-[#9CA3AF] mt-1">
              {new Date(latestEntry.date + "T12:00:00").toLocaleDateString("es-ES", {
                day: "numeric", month: "long", year: "numeric",
              })}
            </p>
          </div>

          {/* ── Peso inicial | Perdido | Objetivo ────────────────────── */}
          <div className="grid grid-cols-3 gap-1 pb-5 mb-5 border-b border-[#F3F4F6]">
            <div className="text-center">
              <p className="text-[11px] text-[#9CA3AF] mb-0.5">Peso inicial</p>
              <p className="text-[17px] font-bold text-[#1A1A2E]">
                {firstEntry!.weight}
                <span className="text-[11px] font-medium text-[#9CA3AF] ml-0.5">kg</span>
              </p>
            </div>
            <div className="text-center border-x border-[#F3F4F6]">
              <p className="text-[11px] text-[#9CA3AF] mb-0.5">Total perdido</p>
              <div className="flex items-center justify-center gap-0.5">
                {totalLost !== null && totalLost < 0
                  ? <TrendingDown className="w-3.5 h-3.5 text-[#1B6B5B]" />
                  : <TrendingUp className="w-3.5 h-3.5 text-[#E53E3E]" />}
                <p
                  className="text-[17px] font-bold"
                  style={{ color: (totalLost ?? 0) <= 0 ? "#1B6B5B" : "#E53E3E" }}
                >
                  {totalLost !== null
                    ? `${totalLost > 0 ? "+" : ""}${totalLost}`
                    : "—"}
                  <span className="text-[11px] font-medium ml-0.5">kg</span>
                </p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-[11px] text-[#9CA3AF] mb-0.5">Peso objetivo</p>
              {editingGoal ? (
                <div className="flex items-center justify-center gap-1">
                  <input
                    type="number"
                    step="0.1"
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    className="w-14 text-center text-[14px] font-bold text-[#1B6B5B] border-b-2 border-[#1B6B5B] bg-transparent outline-none"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const v = parseFloat(goalInput);
                        if (!isNaN(v) && v > 0) onSetWeightGoal(v);
                        setEditingGoal(false);
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const v = parseFloat(goalInput);
                      if (!isNaN(v) && v > 0) onSetWeightGoal(v);
                      setEditingGoal(false);
                    }}
                    className="text-[#1B6B5B]"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setGoalInput(weightGoal ? String(weightGoal) : "73"); setEditingGoal(true); }}
                  className="flex items-center justify-center gap-1 mx-auto"
                >
                  <p className="text-[17px] font-bold text-[#1B6B5B]">
                    {weightGoal ?? "—"}
                    {weightGoal && <span className="text-[11px] font-medium ml-0.5">kg</span>}
                  </p>
                  <Edit3 className="w-3 h-3 text-[#9CA3AF]" />
                </button>
              )}
            </div>
          </div>

          {/* ── Progreso hacia objetivo ───────────────────────────────── */}
          {weightGoal && firstEntry && (
            <div className="pb-5 mb-5 border-b border-[#F3F4F6]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] text-[#9CA3AF]">
                  {latestEntry.weight} kg → objetivo {weightGoal} kg
                </span>
                <span className="text-[12px] font-semibold text-[#1B6B5B]">
                  {Math.max(0, Math.min(100,
                    firstEntry.weight === weightGoal ? 100 :
                    Math.round(
                      ((firstEntry.weight - latestEntry.weight) /
                       (firstEntry.weight - weightGoal)) * 100
                    )
                  ))}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-[#F3F4F6] overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #1B6B5B, #2D8B7A)" }}
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.max(0, Math.min(100,
                      firstEntry.weight === weightGoal ? 100 :
                      Math.round(
                        ((firstEntry.weight - latestEntry.weight) /
                         (firstEntry.weight - weightGoal)) * 100
                      )
                    ))}%`,
                  }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <p className="text-[11px] text-[#9CA3AF] mt-1">
                Faltan {Math.max(0, parseFloat((latestEntry.weight - weightGoal).toFixed(1)))} kg para tu objetivo
              </p>
            </div>
          )}

          {/* ── Grid composición corporal ─────────────────────────────── */}
          <div className="grid grid-cols-2 gap-2.5">
            <MetricTile
              label="IMC"
              value={latestEntry.imc.toFixed(1)}
              unit=""
              note={latestImcStatus.label}
              noteColor={latestImcStatus.color}
            />
            {latestEntry.bodyFat != null && (
              <MetricTile label="Índice de grasa corporal" value={latestEntry.bodyFat.toFixed(1)} unit="%" />
            )}
            {latestEntry.muscleMass != null && (
              <MetricTile label="Masa muscular" value={latestEntry.muscleMass.toFixed(1)} unit="kg" />
            )}
            {latestEntry.bmr != null && (
              <MetricTile label="Tasa metabólica basal" value={latestEntry.bmr.toFixed(0)} unit="kcal/d" />
            )}
            {latestEntry.bodyWater != null && (
              <MetricTile label="Agua corporal" value={latestEntry.bodyWater.toFixed(1)} unit="%" />
            )}
            {latestEntry.visceralFat != null && (
              <MetricTile label="Grasa visceral" value={latestEntry.visceralFat.toFixed(1)} unit="Nivel" />
            )}
            {latestEntry.boneMass != null && (
              <MetricTile label="Masa ósea" value={latestEntry.boneMass.toFixed(2)} unit="kg" />
            )}
            {latestEntry.proteins != null && (
              <MetricTile label="Proteínas" value={latestEntry.proteins.toFixed(1)} unit="%" />
            )}
          </div>
        </motion.div>
      )}

      {/* ══ BOTÓN: nueva medida ══════════════════════════════════════════ */}
      <motion.button
        {...fadeUp}
        transition={{ ...fadeUp.transition, delay: 0.05 }}
        onClick={() => setFormOpen((v) => !v)}
        className="w-full py-3 rounded-[14px] flex items-center justify-center gap-2 text-[14px] font-semibold transition-all"
        style={{
          background: formOpen ? "#F3F4F6" : "linear-gradient(135deg, #1B6B5B 0%, #2D8B7A 100%)",
          color: formOpen ? "#6B7280" : "#fff",
        }}
      >
        <Target className="w-4 h-4" />
        {formOpen ? "Cancelar" : (hasAnyData ? "Registrar nueva medida" : "Registrar primera medida")}
      </motion.button>

      {/* ══ FORM ════════════════════════════════════════════════════════ */}
      {formOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="bg-white rounded-[20px] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
        >
          <p className="text-[15px] font-semibold text-[#1A1A2E] mb-4">Registrar Medidas</p>

          {/* Bluetooth */}
          <div className="mb-4">
            <button
              onClick={() => void connectScale()}
              disabled={btStatus === "scanning" || btStatus === "connected"}
              className="w-full py-2.5 rounded-[12px] flex items-center justify-center gap-2 text-[14px] font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
              style={{
                background:
                  btStatus === "connected"
                    ? "#E8F5F0"
                    : btStatus === "unavailable" || btStatus === "error"
                    ? "#FEF3C7"
                    : "#1A1A2E",
                color:
                  btStatus === "connected"
                    ? "#1B6B5B"
                    : btStatus === "unavailable" || btStatus === "error"
                    ? "#92400E"
                    : "#fff",
              }}
            >
              {btStatus === "connected" ? (
                <Bluetooth className="w-4 h-4" />
              ) : btStatus === "unavailable" || btStatus === "error" ? (
                <BluetoothOff className="w-4 h-4" />
              ) : (
                <Bluetooth className="w-4 h-4" />
              )}
              {btStatus === "scanning"
                ? "Buscando balanza…"
                : btStatus === "connected"
                ? "Balanza conectada"
                : "Conectar Balanza Huawei AH100"}
            </button>
            {btMessage && (
              <p
                className={`text-[11px] mt-1.5 px-1 leading-relaxed ${
                  btStatus === "connected" ? "text-[#1B6B5B]" : "text-[#6B7280]"
                }`}
              >
                {btMessage}
              </p>
            )}
          </div>

          {/* Fecha */}
          <div className="mb-3">
            <label className={labelCls}>Fecha</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Estatura + Peso */}
          <div className="flex gap-3 mb-3">
            <div className="flex-1">
              <label className={labelCls}>Estatura (cm)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="170"
                className={inputCls}
              />
            </div>
            <div className="flex-1">
              <label className={labelCls}>Peso (kg)</label>
              <input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="89.1"
                className={inputCls}
              />
            </div>
          </div>

          {/* IMC preview */}
          {imc !== null && imcStatus && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-4 px-4 py-3 rounded-[12px] flex items-center justify-between"
              style={{ background: imcStatus.bg }}
            >
              <span className="text-[14px] font-medium" style={{ color: imcStatus.color }}>
                IMC: <strong>{imc}</strong>
              </span>
              <span
                className="text-[12px] font-semibold px-2.5 py-1 rounded-full bg-white"
                style={{ color: imcStatus.color }}
              >
                {imcStatus.label}
              </span>
            </motion.div>
          )}

          {/* Circunferencias */}
          <div className="flex items-center gap-2 mb-3 mt-1">
            <Ruler className="w-4 h-4 text-[#9CA3AF]" />
            <p className="text-[13px] font-semibold text-[#9CA3AF] uppercase tracking-wide">
              Circunferencias (cm) — opcional
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div>
              <label className={labelCls}>Cuello</label>
              <input type="number" step="0.1" value={neck} onChange={(e) => setNeck(e.target.value)} placeholder="38" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Cintura</label>
              <input type="number" step="0.1" value={waist} onChange={(e) => setWaist(e.target.value)} placeholder="90" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Cadera</label>
              <input type="number" step="0.1" value={hip} onChange={(e) => setHip(e.target.value)} placeholder="105" className={inputCls} />
            </div>
          </div>

          {/* Composición corporal */}
          <div className="flex items-center gap-2 mb-3 mt-1">
            <Activity className="w-4 h-4 text-[#9CA3AF]" />
            <p className="text-[13px] font-semibold text-[#9CA3AF] uppercase tracking-wide">
              Composición corporal — opcional
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className={labelCls}>Índice de grasa (%)</label>
              <input type="number" step="0.1" value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} placeholder="26.6" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Masa muscular (kg)</label>
              <input type="number" step="0.1" value={muscleMass} onChange={(e) => setMuscleMass(e.target.value)} placeholder="61.9" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Masa ósea (kg)</label>
              <input type="number" step="0.01" value={boneMass} onChange={(e) => setBoneMass(e.target.value)} placeholder="3.50" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Proteínas (%)</label>
              <input type="number" step="0.1" value={proteins} onChange={(e) => setProteins(e.target.value)} placeholder="17.1" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Grasa visceral (nivel)</label>
              <input type="number" step="0.1" value={visceralFat} onChange={(e) => setVisceralFat(e.target.value)} placeholder="17.0" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>TMB (kcal/d)</label>
              <input type="number" value={bmr} onChange={(e) => setBmr(e.target.value)} placeholder="1798" className={inputCls} />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Agua corporal (%)</label>
              <input type="number" step="0.1" value={bodyWater} onChange={(e) => setBodyWater(e.target.value)} placeholder="52.4" className={inputCls} />
            </div>
          </div>

          {/* ICC preview */}
          {icc !== null && iccStatus && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-4 px-4 py-3 rounded-[12px] bg-[#E8F2FA] flex items-center justify-between"
            >
              <span className="text-[14px] font-medium text-[#3B9DD8]">
                ICC (cintura/cadera): <strong>{icc}</strong>
              </span>
              <span
                className="text-[12px] font-semibold px-2.5 py-1 rounded-full bg-white"
                style={{ color: iccStatus.color }}
              >
                {iccStatus.label}
              </span>
            </motion.div>
          )}

          <button
            onClick={handleSave}
            disabled={imc === null || !date}
            className="w-full py-3.5 rounded-[12px] flex items-center justify-center gap-2 text-[15px] font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #1B6B5B 0%, #2D8B7A 100%)" }}
          >
            {saved ? (
              <motion.span initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
                ✓ Guardado
              </motion.span>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar Medidas
              </>
            )}
          </button>
        </motion.div>
      )}

      {/* ══ SELECTOR DE RANGO ════════════════════════════════════════════ */}
      {hasAnyData && (
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 }}>
          <div className="flex gap-2 p-1 bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            {(["week", "month", "year", "all"] as TimeRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`flex-1 py-2 rounded-xl text-[13px] font-semibold transition-all select-none ${
                  range === r ? "bg-[#1B6B5B] text-white shadow-sm" : "text-[#9CA3AF]"
                }`}
              >
                {RANGE_LABELS[r]}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* ══ GRÁFICO PESO ═════════════════════════════════════════════════ */}
      {hasAnyData && (
        <ChartCard
          icon={<TrendingUp className="w-5 h-5" />}
          iconColor="#1B6B5B"
          title="Evolución del Peso"
          subtitle="kg"
          delay={0.1}
        >
          {has1pt ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData} margin={{ top: 5, right: 8, left: -22, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} kg`, "Peso"]} labelFormatter={(l) => `Fecha: ${l}`} />
                {weightGoal && <ReferenceLine y={weightGoal} stroke="#1B6B5B" strokeDasharray="4 3" strokeWidth={1.5} label={{ value: `Objetivo ${weightGoal}kg`, position: "insideTopRight", fontSize: 10, fill: "#1B6B5B" }} />}
                <Line type="monotone" dataKey="peso" stroke="#1B6B5B" strokeWidth={2.5}
                  dot={has2pts ? { fill: "#1B6B5B", r: 4, strokeWidth: 0 } : { fill: "#1B6B5B", r: 6, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: "#1B6B5B", strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <NoDataInRange range={range} />
          )}
        </ChartCard>
      )}

      {/* ══ GRÁFICO IMC ══════════════════════════════════════════════════ */}
      {hasAnyData && (
        <ChartCard
          icon={<TrendingUp className="w-5 h-5" />}
          iconColor="#3B9DD8"
          title="Índice de Masa Corporal"
          subtitle="Rango normal: 18.5 – 24.9"
          delay={0.15}
        >
          {has1pt ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData} margin={{ top: 5, right: 8, left: -22, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} domain={[15, "auto"]} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}`, "IMC"]} labelFormatter={(l) => `Fecha: ${l}`} />
                <ReferenceLine y={18.5} stroke="#F5A623" strokeDasharray="4 3" strokeWidth={1} />
                <ReferenceLine y={25}   stroke="#E8890C" strokeDasharray="4 3" strokeWidth={1} />
                <ReferenceLine y={30}   stroke="#E53E3E" strokeDasharray="4 3" strokeWidth={1} />
                <Line type="monotone" dataKey="imc" stroke="#3B9DD8" strokeWidth={2.5}
                  dot={has2pts ? { fill: "#3B9DD8", r: 4, strokeWidth: 0 } : { fill: "#3B9DD8", r: 6, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: "#3B9DD8", strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <NoDataInRange range={range} />
          )}
        </ChartCard>
      )}

      {/* ══ GRÁFICO GRASA CORPORAL ═══════════════════════════════════════ */}
      {hasAnyData && hasBodyComp && (
        <ChartCard
          icon={<Activity className="w-5 h-5" />}
          iconColor="#E8890C"
          title="Índice de Grasa Corporal"
          subtitle="% — Saludable: 10–20% hombres"
          delay={0.18}
        >
          {has1pt ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData} margin={{ top: 5, right: 8, left: -22, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, "Grasa corporal"]} labelFormatter={(l) => `Fecha: ${l}`} />
                <ReferenceLine y={20} stroke="#1B6B5B" strokeDasharray="4 3" strokeWidth={1} label={{ value: "Objetivo 20%", position: "insideTopRight", fontSize: 10, fill: "#1B6B5B" }} />
                <Line type="monotone" dataKey="grasa" stroke="#E8890C" strokeWidth={2.5} connectNulls
                  dot={has2pts ? { fill: "#E8890C", r: 4, strokeWidth: 0 } : { fill: "#E8890C", r: 6, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: "#E8890C", strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <NoDataInRange range={range} />
          )}
        </ChartCard>
      )}

      {/* ══ GRÁFICO MASA MUSCULAR ════════════════════════════════════════ */}
      {hasAnyData && hasMuscle && (
        <ChartCard
          icon={<Activity className="w-5 h-5" />}
          iconColor="#8B5CF6"
          title="Masa Muscular"
          subtitle="kg"
          delay={0.2}
        >
          {has1pt ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData} margin={{ top: 5, right: 8, left: -22, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} kg`, "Masa muscular"]} labelFormatter={(l) => `Fecha: ${l}`} />
                <Line type="monotone" dataKey="musculo" stroke="#8B5CF6" strokeWidth={2.5} connectNulls
                  dot={has2pts ? { fill: "#8B5CF6", r: 4, strokeWidth: 0 } : { fill: "#8B5CF6", r: 6, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: "#8B5CF6", strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <NoDataInRange range={range} />
          )}
        </ChartCard>
      )}

      {/* ══ GRÁFICO CIRCUNFERENCIAS ══════════════════════════════════════ */}
      {hasAnyData && entries.some((e) => e.waist || e.hip || e.neck) && (
        <ChartCard
          icon={<Ruler className="w-5 h-5" />}
          iconColor="#F5A623"
          title="Circunferencias"
          subtitle="cm"
          delay={0.22}
        >
          <div className="flex gap-4 mb-4">
            {[
              { label: "Cintura", color: "#F5A623" },
              { label: "Cadera",  color: "#8B5CF6" },
              { label: "Cuello",  color: "#1B6B5B" },
            ].map(({ label, color }) => (
              <span key={label} className="flex items-center gap-1.5 text-[12px] text-[#6B7280]">
                <span className="w-3 h-3 rounded-full inline-block" style={{ background: color }} />
                {label}
              </span>
            ))}
          </div>
          {has1pt && hasCircumData ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData} margin={{ top: 5, right: 8, left: -22, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
                <Tooltip contentStyle={tooltipStyle}
                  formatter={(v, name) => [`${v} cm`, name === "cintura" ? "Cintura" : name === "cadera" ? "Cadera" : "Cuello"]}
                  labelFormatter={(l) => `Fecha: ${l}`}
                />
                <Line type="monotone" dataKey="cintura" stroke="#F5A623" strokeWidth={2.5} dot={{ fill: "#F5A623", r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} connectNulls />
                <Line type="monotone" dataKey="cadera"  stroke="#8B5CF6" strokeWidth={2.5} dot={{ fill: "#8B5CF6", r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} connectNulls />
                <Line type="monotone" dataKey="cuello"  stroke="#1B6B5B" strokeWidth={2.5} dot={{ fill: "#1B6B5B", r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <NoDataInRange range={range} />
          )}
        </ChartCard>
      )}

      {/* ══ HISTORIAL ════════════════════════════════════════════════════ */}
      {entries.length > 0 && (
        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.25 }}
          className="space-y-3"
        >
          <p className="text-[15px] font-semibold text-[#1A1A2E]">Historial</p>
          {[...entries]
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 10)
            .map((entry) => {
              const status = getImcStatus(entry.imc);
              const entryIcc =
                entry.waist && entry.hip
                  ? (entry.waist / entry.hip).toFixed(2)
                  : null;
              return (
                <div
                  key={entry.date}
                  className="bg-white rounded-[16px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-semibold text-[#1A1A2E]">
                        {new Date(entry.date + "T12:00:00").toLocaleDateString("es-ES", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </p>
                      <p className="text-[13px] text-[#6B7280] mt-0.5">
                        {entry.weight} kg · {entry.height} cm · IMC {entry.imc}
                      </p>
                      {(entry.bodyFat || entry.muscleMass || entry.bmr) && (
                        <p className="text-[12px] text-[#9CA3AF] mt-0.5">
                          {[
                            entry.bodyFat    ? `Grasa ${entry.bodyFat}%`          : null,
                            entry.muscleMass ? `Músculo ${entry.muscleMass}kg`    : null,
                            entry.bodyWater  ? `Agua ${entry.bodyWater}%`         : null,
                            entry.visceralFat? `Visceral ${entry.visceralFat}`    : null,
                            entry.bmr        ? `TMB ${entry.bmr}kcal`             : null,
                          ].filter(Boolean).join(" · ")}
                        </p>
                      )}
                      {(entry.neck || entry.waist || entry.hip) && (
                        <p className="text-[12px] text-[#9CA3AF] mt-0.5">
                          {[
                            entry.neck  ? `Cuello ${entry.neck}cm`   : null,
                            entry.waist ? `Cintura ${entry.waist}cm` : null,
                            entry.hip   ? `Cadera ${entry.hip}cm`    : null,
                            entryIcc    ? `ICC ${entryIcc}`           : null,
                          ].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className="text-[11px] font-semibold px-2 py-1 rounded-full"
                        style={{ background: status.bg, color: status.color }}
                      >
                        {status.label}
                      </span>
                      <button
                        onClick={() => {
                          if (window.confirm("¿Eliminar esta medida?")) onDeleteEntry(entry.date);
                        }}
                        className="w-7 h-7 rounded-full bg-[#FEE8E8] flex items-center justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-[#E53E3E]" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
        </motion.div>
      )}

      {/* ══ ESTADO VACÍO ═════════════════════════════════════════════════ */}
      {entries.length === 0 && (
        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.1 }}
          className="bg-white rounded-[20px] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)] text-center"
        >
          <TrendingUp className="w-10 h-10 text-[#D1D5DB] mx-auto mb-3" />
          <p className="text-[15px] font-semibold text-[#1A1A2E] mb-1">
            Registra tu primera medida
          </p>
          <p className="text-[13px] text-[#9CA3AF]">
            Toca el botón de arriba para comenzar a trackear tu evolución
          </p>
        </motion.div>
      )}
    </div>
  );
}
