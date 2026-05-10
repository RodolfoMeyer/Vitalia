import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cherry, Fish, Soup, Wheat, Beef, Egg, CupSoda, Salad, Sandwich,
  Target, TrendingUp, TrendingDown, AlertCircle, CheckCircle2,
  Info, Pencil, Plus, ChevronUp, Sparkles,
} from "lucide-react";
import type { FoodLogEntry, DayFoodLog } from "@/hooks/useAppState";
import type { Meal } from "@/data/menuData";
import { estimateKcal } from "@/utils/calorieEstimator";

// ── Config ────────────────────────────────────────────────────────────────────

const TARGET_KCAL = 1400;

const iconMap: Record<string, React.ElementType> = {
  Cherry, Fish, Soup, Wheat, Beef, Egg, CupSoda, Salad, Sandwich,
};

const MEAL_TIMES: Record<string, string> = {
  "Desayuno":     "08:00",
  "Media Mañana": "10:30",
  "Almuerzo":     "13:00",
  "Merienda":     "16:00",
  "Cena":         "20:00",
};

const insightStyle: Record<string, string> = {
  ok:    "text-[#1B6B5B] bg-[#E8F5F0]",
  warn:  "text-[#F5A623] bg-[#FFF5E0]",
  info:  "text-[#3B9DD8] bg-[#E8F2FA]",
  error: "text-[#E53E3E] bg-[#FEE8E8]",
};

// ── Analysis ──────────────────────────────────────────────────────────────────

type InsightType = "ok" | "warn" | "info" | "error";
interface Insight { type: InsightType; text: string }
interface StatusCfg { label: string; color: string; bg: string; Icon: React.ElementType }

function buildAnalysis(totalKcal: number, loggedCount: number, totalMeals: number) {
  if (totalKcal === 0) return null;
  const deviation    = ((totalKcal - TARGET_KCAL) / TARGET_KCAL) * 100;
  const absDeviation = Math.abs(deviation);
  let status: StatusCfg;
  let summary: string;
  let insights: Insight[];

  if (deviation < -30) {
    status   = { label: "Déficit Importante", color: "#3B9DD8", bg: "#EBF5FB", Icon: TrendingDown };
    summary  = `Consumiste ${totalKcal} kcal, un ${Math.round(absDeviation)}% bajo el objetivo de ${TARGET_KCAL} kcal. Con tu medicación actual esto puede ser riesgoso.`;
    insights = [
      { type: "error", text: "Riesgo de hipoglicemia: la Compulsine necesita alimento para tolerarse." },
      { type: "error", text: "El déficit severo favorece pérdida de masa muscular post bypass." },
      { type: "warn",  text: "Añade un snack proteico: yogur griego, queso fresco o huevo duro." },
    ];
  } else if (deviation < -15) {
    status   = { label: "Déficit Leve", color: "#3B9DD8", bg: "#EBF5FB", Icon: TrendingDown };
    summary  = `Consumiste ${totalKcal} kcal, un ${Math.round(absDeviation)}% bajo el objetivo. Hay espacio para un snack proteico.`;
    insights = [
      { type: "warn", text: "Incorpora un snack de 150–200 kcal rico en proteína para completar el día." },
      { type: "ok",   text: "Un déficit leve puede ser adecuado si es intencional y supervisado." },
    ];
  } else if (absDeviation <= 10) {
    status   = { label: "En Objetivo ✓", color: "#1B6B5B", bg: "#E8F5F0", Icon: CheckCircle2 };
    summary  = `¡Excelente! Consumiste ${totalKcal} kcal, dentro del rango óptimo (${deviation > 0 ? "+" : ""}${Math.round(deviation)}%).`;
    insights = [
      { type: "ok", text: "Tu balance calórico diario está dentro del rango ideal post bypass." },
      { type: "ok", text: "Mantén esta consistencia para maximizar la pérdida de grasa." },
      ...(loggedCount < totalMeals
        ? [{ type: "info" as InsightType, text: `${totalMeals - loggedCount} comida(s) sin registrar — el análisis mejora con todos los datos.` }]
        : [{ type: "info" as InsightType, text: "Todas las comidas registradas. Análisis completo del día." }]),
    ];
  } else if (deviation <= 20) {
    status   = { label: "Leve Exceso", color: "#F5A623", bg: "#FFF5E0", Icon: AlertCircle };
    summary  = `Consumiste ${totalKcal} kcal, un ${Math.round(deviation)}% sobre el objetivo. Aceptable si el exceso es de proteína magra.`;
    insights = [
      { type: "warn", text: "Revisa si el exceso es de proteína (aceptable) o carbohidratos/grasas (ajustar)." },
      { type: "info", text: "El Orlistat bloquea ~30% de grasa ingerida, pero no compensa el exceso total." },
    ];
  } else if (deviation <= 40) {
    status   = { label: "Exceso Moderado", color: "#E8890C", bg: "#FFF0D9", Icon: TrendingUp };
    summary  = `Consumiste ${totalKcal} kcal, un ${Math.round(deviation)}% sobre el objetivo. Puede frenar el progreso de pérdida de peso.`;
    insights = [
      { type: "warn",  text: "Revisa tamaños de porciones, especialmente en almuerzo y cena." },
      { type: "error", text: "Con bypass, ingestas elevadas pueden desencadenar dumping syndrome." },
    ];
  } else {
    status   = { label: "Exceso Alto", color: "#E53E3E", bg: "#FEE8E8", Icon: TrendingUp };
    summary  = `Consumiste ${totalKcal} kcal, un ${Math.round(deviation)}% sobre el objetivo. Compromete significativamente los resultados.`;
    insights = [
      { type: "error", text: "Desviación muy alta: considera revisar tu plan con la nutricionista." },
      { type: "warn",  text: "Mañana: vuelve al plan, prioriza proteína magra y limita carbohidratos." },
    ];
  }

  return { status, summary, insights, deviation, absDeviation };
}

// ── Meal card ─────────────────────────────────────────────────────────────────

interface MealCardProps {
  meal:     Meal;
  entry:    FoodLogEntry;
  isOpen:   boolean;
  onOpen:   () => void;
  onSave:   (patch: Partial<FoodLogEntry>) => void;
  onPatch:  (patch: Partial<FoodLogEntry>) => void;
}

function MealCard({ meal, entry, isOpen, onOpen, onSave, onPatch }: MealCardProps) {
  // Local state while editing so we don't trigger re-renders on every keystroke
  const [localDesc, setLocalDesc] = useState(entry.description);
  const [localKcal, setLocalKcal] = useState(entry.kcal);

  // Sync local state if entry changes externally (e.g. opening a different day)
  useMemo(() => {
    setLocalDesc(entry.description);
    setLocalKcal(entry.kcal);
  }, [entry.description, entry.kcal]);

  const IconComp  = iconMap[meal.icon] ?? Beef;
  const hasData   = entry.description.trim() || entry.kcal.trim();
  const mealTime  = MEAL_TIMES[meal.type] ?? "";

  // Live estimate while user types (shown as hint below kcal field)
  const liveEstimate = useMemo(() => {
    if (localKcal.trim()) return null; // don't show hint if kcal already filled
    return estimateKcal(localDesc);
  }, [localDesc, localKcal]);

  function handleSave() {
    let kcalToSave   = localKcal.trim();
    let isEstimated  = false;

    if (!kcalToSave && localDesc.trim()) {
      const est = estimateKcal(localDesc);
      if (est !== null) {
        kcalToSave  = String(est);
        isEstimated = true;
      }
    }

    onSave({
      description: localDesc,
      kcal:        kcalToSave,
      estimated:   isEstimated,
    });
  }

  // ── EXPANDED ────────────────────────────────────────────────────────
  if (isOpen) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        className="bg-white rounded-[18px] shadow-[0_6px_28px_rgba(0,0,0,0.09)] overflow-hidden border border-[#F5A623]/20"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-0">
          <div className="w-9 h-9 rounded-full bg-[#FFF5E0] flex items-center justify-center flex-shrink-0">
            <IconComp className="w-[18px] h-[18px] text-[#F5A623]" />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-bold text-[#F5A623] uppercase tracking-wide">{meal.type}</p>
            {mealTime && <p className="text-[11px] text-[#9CA3AF]">{mealTime} h</p>}
          </div>
          <button
            onClick={() => {
              // Discard local changes on close without save
              setLocalDesc(entry.description);
              setLocalKcal(entry.kcal);
              onSave({ description: entry.description, kcal: entry.kcal, estimated: entry.estimated });
            }}
            className="w-7 h-7 rounded-full bg-[#F3F4F6] flex items-center justify-center flex-shrink-0"
          >
            <ChevronUp className="w-3.5 h-3.5 text-[#9CA3AF]" />
          </button>
        </div>

        <div className="px-4 pb-4 pt-3 space-y-3">
          {/* Plan reference */}
          <p className="text-[11px] text-[#B0B8C4] italic leading-relaxed bg-[#F9FAFB] rounded-[8px] px-3 py-2">
            📋 Plan: {meal.description}
          </p>

          {/* Description */}
          <div>
            <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide block mb-1.5">
              ¿Qué comiste?
            </label>
            <input
              type="text"
              placeholder="ej: 150g pollo a la plancha + ensalada"
              value={localDesc}
              onChange={e => setLocalDesc(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#F9FAFB] rounded-[11px] text-[14px] text-[#1A1A2E] placeholder-[#C4C9D4] outline-none border border-transparent focus:border-[#F5A623]/40 transition-colors"
            />
          </div>

          {/* Calories */}
          <div>
            <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide block mb-1.5">
              Calorías
            </label>
            <div className="flex items-center gap-2">
              <div className="relative w-44">
                <input
                  type="number"
                  min="0"
                  max="3000"
                  placeholder={liveEstimate ? String(liveEstimate) : "0"}
                  value={localKcal}
                  onChange={e => {
                    setLocalKcal(e.target.value);
                    // If user types manually, clear estimated flag
                    onPatch({ estimated: false });
                  }}
                  className="w-full px-3 pr-12 py-2.5 bg-[#F9FAFB] rounded-[11px] text-[15px] font-semibold text-[#1A1A2E] text-right outline-none border border-transparent focus:border-[#F5A623]/40 transition-colors"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-[#9CA3AF] pointer-events-none select-none">
                  kcal
                </span>
              </div>

              {/* Live estimate hint */}
              {liveEstimate !== null && !localKcal.trim() && (
                <motion.div
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-1 bg-[#E8F5F0] px-2.5 py-1.5 rounded-[8px]"
                >
                  <Sparkles className="w-3 h-3 text-[#1B6B5B] flex-shrink-0" />
                  <span className="text-[12px] font-semibold text-[#1B6B5B]">≈{liveEstimate}</span>
                </motion.div>
              )}
            </div>

            {liveEstimate !== null && !localKcal.trim() && (
              <p className="text-[11px] text-[#9CA3AF] mt-1.5 pl-1">
                Se usará el valor estimado al guardar · puedes sobrescribirlo
              </p>
            )}
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={!localDesc.trim()}
            className={`w-full py-2.5 rounded-[12px] font-semibold text-[14px] transition-all duration-200 ${
              localDesc.trim()
                ? "bg-[#1B6B5B] text-white shadow-[0_4px_12px_rgba(27,107,91,0.3)]"
                : "bg-[#F3F4F6] text-[#C4C9D4]"
            }`}
          >
            {localDesc.trim() ? "✓ Guardar comida" : "Escribe qué comiste"}
          </button>
        </div>
      </motion.div>
    );
  }

  // ── LOGGED (compact) ────────────────────────────────────────────────
  if (hasData) {
    return (
      <motion.button
        layout
        onClick={onOpen}
        className="w-full bg-white rounded-[16px] shadow-[0_2px_12px_rgba(0,0,0,0.06)] text-left overflow-hidden"
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-7 h-7 rounded-full bg-[#E8F5F0] flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-4 h-4 text-[#1B6B5B]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#1B6B5B] uppercase tracking-wide leading-none mb-0.5">
              {meal.type}
              {mealTime && <span className="text-[#9CA3AF] font-normal ml-1 normal-case">· {mealTime}</span>}
            </p>
            <p className="text-[13px] text-[#374151] truncate">
              {entry.description || <span className="text-[#9CA3AF] italic">Sin descripción</span>}
            </p>
          </div>
          {entry.kcal.trim() && (
            <div className="flex items-center gap-1 flex-shrink-0">
              {entry.estimated && (
                <Sparkles className="w-3 h-3 text-[#1B6B5B] opacity-60" />
              )}
              <span className="text-[12px] font-bold text-[#F5A623] bg-[#FFF5E0] px-2.5 py-0.5 rounded-full">
                {entry.estimated ? "≈" : ""}{entry.kcal} kcal
              </span>
            </div>
          )}
          <Pencil className="w-3.5 h-3.5 text-[#D1D5DB] flex-shrink-0 ml-1" />
        </div>
      </motion.button>
    );
  }

  // ── EMPTY ────────────────────────────────────────────────────────────
  return (
    <motion.button
      layout
      onClick={onOpen}
      className="w-full bg-white rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-left border-2 border-dashed border-[#E8F5F0]"
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-7 h-7 rounded-full bg-[#F9FAFB] flex items-center justify-center flex-shrink-0">
          <IconComp className="w-4 h-4 text-[#D1D5DB]" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-[12px] font-semibold text-[#C4C9D4] uppercase tracking-wide">{meal.type}</p>
          <p className="text-[12px] text-[#D1D5DB]">{mealTime && `${mealTime} · `}Toca para registrar</p>
        </div>
        <div className="w-6 h-6 rounded-full bg-[#F3F4F6] flex items-center justify-center flex-shrink-0">
          <Plus className="w-3.5 h-3.5 text-[#C4C9D4]" />
        </div>
      </div>
    </motion.button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  plannedMeals: Meal[];
  dayLog:       DayFoodLog;
  onUpdate:     (mealType: string, patch: Partial<FoodLogEntry>) => void;
}

export function FoodLogView({ plannedMeals, dayLog, onUpdate }: Props) {
  const [openMeal, setOpenMeal] = useState<string | null>(null);

  const totalKcal = useMemo(
    () => Object.values(dayLog).reduce((sum, e) => sum + (parseInt(e.kcal) || 0), 0),
    [dayLog],
  );

  const loggedCount = useMemo(
    () => plannedMeals.filter(m => {
      const e = dayLog[m.type];
      return e && (e.description.trim() || e.kcal.trim());
    }).length,
    [dayLog, plannedMeals],
  );

  const analysis = useMemo(
    () => buildAnalysis(totalKcal, loggedCount, plannedMeals.length),
    [totalKcal, loggedCount, plannedMeals.length],
  );

  const barPct   = Math.min(150, totalKcal > 0 ? (totalKcal / TARGET_KCAL) * 100 : 0);
  const barColor = analysis?.status.color ?? "#D1D5DB";

  return (
    <div className="space-y-2.5">

      {/* ── Progress header ───────────────────────────────────────── */}
      <div className="bg-white rounded-[18px] shadow-[0_2px_12px_rgba(0,0,0,0.05)] px-4 py-4">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-[#1B6B5B]" />
            <p className="text-[13px] font-semibold text-[#1A1A2E]">Total del día</p>
          </div>
          <div>
            <span className="text-[22px] font-bold text-[#1A1A2E]">{totalKcal}</span>
            <span className="text-[12px] text-[#9CA3AF] ml-1">/ {TARGET_KCAL} kcal</span>
          </div>
        </div>

        <div className="h-3 bg-[#F3F4F6] rounded-full overflow-hidden mb-1.5">
          <motion.div
            className="h-full rounded-full"
            style={{ background: barColor }}
            animate={{ width: `${barPct}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-[#C4C9D4]">
          <span>0</span><span>700</span>
          <span className="font-medium text-[#9CA3AF]">1.400 ▲</span>
          <span>2.100</span>
        </div>
        <p className="text-[11px] text-[#9CA3AF] mt-2 text-center">
          {loggedCount === 0
            ? "Registra tu primera comida del día"
            : `${loggedCount} de ${plannedMeals.length} comidas registradas`}
        </p>
      </div>

      {/* ── Meal cards ────────────────────────────────────────────── */}
      <AnimatePresence mode="popLayout">
        {plannedMeals.map(meal => {
          const entry: FoodLogEntry = dayLog[meal.type] ?? { description: "", kcal: "" };
          return (
            <MealCard
              key={meal.type}
              meal={meal}
              entry={entry}
              isOpen={openMeal === meal.type}
              onOpen={() => setOpenMeal(meal.type)}
              onSave={patch => {
                onUpdate(meal.type, patch);
                setOpenMeal(null);
              }}
              onPatch={patch => onUpdate(meal.type, patch)}
            />
          );
        })}
      </AnimatePresence>

      {/* ── Analysis ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {analysis ? (
          <motion.div
            key="analysis"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-[20px] shadow-[0_4px_24px_rgba(0,0,0,0.08)] overflow-hidden"
          >
            <div className="px-4 pt-4 pb-3" style={{ background: analysis.status.bg }}>
              <div className="flex items-center gap-2 mb-1.5">
                <analysis.status.Icon className="w-5 h-5 flex-shrink-0" style={{ color: analysis.status.color }} />
                <p className="text-[15px] font-bold" style={{ color: analysis.status.color }}>
                  {analysis.status.label}
                </p>
              </div>
              <p className="text-[13px] leading-relaxed" style={{ color: analysis.status.color, opacity: 0.9 }}>
                {analysis.summary}
              </p>
            </div>

            <div className="grid grid-cols-3 divide-x divide-[#F3F4F6] border-t border-[#F3F4F6]">
              {[
                { label: "Consumido",  value: String(totalKcal), unit: "kcal", color: analysis.status.color },
                { label: "Objetivo",   value: String(TARGET_KCAL), unit: "kcal", color: "#6B7280" },
                { label: "Diferencia", value: `${analysis.deviation > 0 ? "+" : ""}${Math.round(analysis.deviation)}`, unit: "%", color: analysis.status.color },
              ].map(({ label, value, unit, color }) => (
                <div key={label} className="px-2 py-3 text-center">
                  <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide mb-1">{label}</p>
                  <p className="text-[17px] font-bold leading-none" style={{ color }}>
                    {value}<span className="text-[11px] font-normal ml-0.5">{unit}</span>
                  </p>
                </div>
              ))}
            </div>

            <div className="px-4 py-4 space-y-2.5">
              <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-3">Análisis detallado</p>
              {analysis.insights.map((ins, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${insightStyle[ins.type]}`}>
                    {ins.type === "ok"    && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {ins.type === "warn"  && <AlertCircle  className="w-3.5 h-3.5" />}
                    {ins.type === "info"  && <Info          className="w-3.5 h-3.5" />}
                    {ins.type === "error" && <AlertCircle  className="w-3.5 h-3.5" />}
                  </span>
                  <p className="text-[13px] text-[#374151] leading-relaxed">{ins.text}</p>
                </div>
              ))}
              <div className="mt-2 px-3 py-2 bg-[#F9FAFB] rounded-[10px] flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#1B6B5B] flex-shrink-0" />
                <p className="text-[12px] text-[#9CA3AF]">
                  ≈ = estimado automáticamente · Objetivo: 1.400 kcal/día post bypass
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white rounded-[18px] shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-6 flex flex-col items-center gap-2 text-center"
          >
            <Target className="w-9 h-9 text-[#D1D5DB]" />
            <p className="text-[14px] font-semibold text-[#9CA3AF]">
              Ve registrando tus comidas a medida que avanza el día
            </p>
            <p className="text-[12px] text-[#C4C9D4]">
              Objetivo: {TARGET_KCAL} kcal · Las calorías se estiman automáticamente
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
