import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, Zap, Target, Sun, Moon, Dumbbell, Flame,
  Lightbulb, AlertTriangle, Clock, ChevronDown, ChevronUp,
  TrendingUp,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie,
} from "recharts";
import { weekExercise, exerciseTips } from "@/data/menuData";
import type { ExerciseIcon, ExerciseIntensity, ExerciseSection } from "@/data/menuData";
import { ExerciseIllustration } from "@/components/ExerciseIllustrations";

// ── Visual config ────────────────────────────────────────────────────────────

const intensityColors: Record<ExerciseIntensity, string> = {
  alta:     "#F5A623",
  moderada: "#3B9DD8",
  baja:     "#1B6B5B",
  descanso: "#D1D5DB",
};

const intensityConfig: Record<ExerciseIntensity, { label: string; badge: string; badgeText: string }> = {
  baja:     { label: "Baja",     badge: "bg-[#E8F5F0]", badgeText: "text-[#1B6B5B]" },
  moderada: { label: "Moderada", badge: "bg-[#E8F2FA]", badgeText: "text-[#3B9DD8]" },
  alta:     { label: "Alta",     badge: "bg-[#FFF5E0]", badgeText: "text-[#F5A623]" },
  descanso: { label: "Descanso", badge: "bg-[#F3F4F6]", badgeText: "text-[#9CA3AF]" },
};

const heroGradient: Record<ExerciseIntensity, string> = {
  baja:     "linear-gradient(135deg, #1B6B5B 0%, #2D8B7A 100%)",
  moderada: "linear-gradient(135deg, #3B9DD8 0%, #1E6FA3 100%)",
  alta:     "linear-gradient(135deg, #E8890C 0%, #F5A623 100%)",
  descanso: "linear-gradient(135deg, #6B7280 0%, #4B5563 100%)",
};

const iconMap: Record<ExerciseIcon, React.ElementType> = {
  walk:      Activity,
  hiit:      Zap,
  circuit:   Target,
  yoga:      Sun,
  rest:      Moon,
  strength:  Dumbbell,
  kettlebell: Flame,
};

const tooltipStyle = {
  background: "white",
  border: "none",
  borderRadius: "12px",
  boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
  fontSize: "13px",
  padding: "8px 12px",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseMidpoint(range: string | null): number {
  if (!range) return 0;
  const nums = range.match(/\d+/g);
  if (!nums || nums.length === 0) return 0;
  if (nums.length === 1) return parseInt(nums[0]);
  return Math.round((parseInt(nums[0]) + parseInt(nums[nums.length - 1])) / 2);
}

function sectionAccent(title: string): { bg: string; text: string; dot: string } {
  if (/fuerza|circuito|press|remo|squat|swing/i.test(title))
    return { bg: "bg-[#E8F5F0]", text: "text-[#1B6B5B]", dot: "#1B6B5B" };
  if (/hiit|interval/i.test(title))
    return { bg: "bg-[#FFF5E0]", text: "text-[#F5A623]", dot: "#F5A623" };
  if (/cardio|trotadora/i.test(title))
    return { bg: "bg-[#E8F2FA]", text: "text-[#3B9DD8]", dot: "#3B9DD8" };
  if (/calentamiento|enfriamiento/i.test(title))
    return { bg: "bg-[#F3F4F6]", text: "text-[#6B7280]", dot: "#6B7280" };
  return { bg: "bg-[#EDE9FE]", text: "text-[#8B5CF6]", dot: "#8B5CF6" };
}

// ── Section card ─────────────────────────────────────────────────────────────

function SectionCard({ section, idx }: { section: ExerciseSection; idx: number }) {
  const [open, setOpen] = useState(idx === 0);
  const accent = sectionAccent(section.title);
  return (
    <div className="bg-white rounded-[18px] shadow-[0_4px_20px_rgba(0,0,0,0.06)] overflow-hidden">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center justify-between px-4 py-3.5 select-none">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: accent.dot }} />
          <div className="text-left">
            <p className="text-[14px] font-semibold text-[#1A1A2E]">{section.title}</p>
            {section.subtitle && <p className="text-[12px] text-[#9CA3AF]">{section.subtitle}</p>}
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-[#9CA3AF] flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#9CA3AF] flex-shrink-0" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="body" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-2">
              {section.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-[12px] bg-[#F9FAFB]">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center flex-shrink-0 text-white" style={{ background: accent.dot }}>{i + 1}</span>
                    <div className="w-8 h-10 flex-shrink-0 opacity-80">
                      <ExerciseIllustration name={item.name} color={accent.dot} />
                    </div>
                    <span className="text-[14px] text-[#1A1A2E] truncate">{item.name}</span>
                  </div>
                  <span className={`text-[12px] font-semibold flex-shrink-0 px-2 py-0.5 rounded-full ${accent.bg} ${accent.text}`}>{item.reps}</span>
                </div>
              ))}
              {section.note && <p className="text-[12px] text-[#9CA3AF] pt-1 pl-1 leading-relaxed">{section.note}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── HIIT Timeline ────────────────────────────────────────────────────────────

function HiitTimeline() {
  // 5 warmup + 10×(1 alta + 2 recovery) + 5 cooldown = 40 min total
  const TOTAL = 40;
  const segments = useMemo(() => {
    const s: Array<{ duration: number; color: string; label: string }> = [];
    s.push({ duration: 5, color: "#9CA3AF", label: "Calentamiento" });
    for (let r = 0; r < 10; r++) {
      s.push({ duration: 1, color: "#F5A623", label: `R${r + 1} Alta` });
      s.push({ duration: 2, color: "#1B6B5B", label: `R${r + 1} Rec.` });
    }
    s.push({ duration: 5, color: "#9CA3AF", label: "Enfriamiento" });
    return s;
  }, []);

  return (
    <div>
      {/* Timeline strip */}
      <div className="flex w-full h-10 rounded-2xl overflow-hidden mb-4 gap-px">
        {segments.map((seg, i) => (
          <div
            key={i}
            style={{ width: `${(seg.duration / TOTAL) * 100}%`, background: seg.color }}
            className="transition-opacity"
          />
        ))}
      </div>

      {/* Time labels */}
      <div className="flex justify-between text-[11px] text-[#9CA3AF] mb-5 px-0.5">
        <span>0</span>
        <span>10</span>
        <span>20</span>
        <span>30</span>
        <span>40 min</span>
      </div>

      {/* Legend */}
      <div className="flex gap-4 flex-wrap">
        {[
          { color: "#9CA3AF", label: "Calentamiento/Enfriamiento", sub: "5 min c/u" },
          { color: "#F5A623", label: "Trote rápido (Alta)",         sub: "1 min × 10" },
          { color: "#1B6B5B", label: "Caminata (Recuperación)",     sub: "2 min × 10" },
        ].map(({ color, label, sub }) => (
          <div key={label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: color }} />
            <div>
              <p className="text-[12px] font-medium text-[#374151]">{label}</p>
              <p className="text-[11px] text-[#9CA3AF]">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Rounds summary */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          { label: "Rondas", value: "10", color: "#F5A623" },
          { label: "Trabajo total", value: "10 min", color: "#F5A623" },
          { label: "Recuperación", value: "20 min", color: "#1B6B5B" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#F9FAFB] rounded-[12px] p-3 text-center">
            <p className="text-[11px] text-[#9CA3AF] uppercase tracking-wide">{label}</p>
            <p className="text-[16px] font-bold mt-0.5" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Custom bar label ─────────────────────────────────────────────────────────

function CustomBarLabel(props: { x?: number; y?: number; width?: number; value?: number; unit?: string }) {
  const { x = 0, y = 0, width = 0, value, unit = "" } = props;
  if (!value) return null;
  return (
    <text x={x + width / 2} y={y - 4} fill="#6B7280" fontSize={10} textAnchor="middle">
      {value}{unit}
    </text>
  );
}

// ── Week charts ──────────────────────────────────────────────────────────────

function WeekCharts() {
  const durationData = weekExercise.map(d => ({
    name:      d.shortName,
    value:     parseMidpoint(d.duration),
    intensity: d.intensity,
    label:     d.duration ?? "—",
  }));

  const calData = weekExercise.map(d => ({
    name:      d.shortName,
    value:     parseMidpoint(d.calories),
    intensity: d.intensity,
    label:     d.calories ?? "—",
  }));

  // Intensity distribution (excluding descanso for pie)
  const intensityCount = weekExercise.reduce((acc, d) => {
    acc[d.intensity] = (acc[d.intensity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = [
    { name: "Alta",     value: intensityCount.alta     || 0, color: "#F5A623" },
    { name: "Moderada", value: intensityCount.moderada || 0, color: "#3B9DD8" },
    { name: "Baja",     value: intensityCount.baja     || 0, color: "#1B6B5B" },
    { name: "Descanso", value: intensityCount.descanso || 0, color: "#D1D5DB" },
  ].filter(d => d.value > 0);

  // Total active minutes
  const totalMin  = durationData.reduce((sum, d) => sum + d.value, 0);
  const totalKcal = calData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="space-y-5 px-5">

      {/* ── Summary chips ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Minutos semanales", value: `${totalMin} min`, color: "#1B6B5B", bg: "#E8F5F0" },
          { label: "Calorías estimadas", value: `~${totalKcal} kcal`, color: "#F5A623", bg: "#FFF5E0" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="rounded-[16px] p-4 text-center" style={{ background: bg }}>
            <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color }}>{label}</p>
            <p className="text-[20px] font-bold mt-1" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Duration chart ────────────────────────────────────────────── */}
      <div className="bg-white rounded-[20px] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-5 h-5 text-[#1B6B5B]" />
          <p className="text-[15px] font-semibold text-[#1A1A2E]">Duración por Día</p>
        </div>
        <p className="text-[12px] text-[#9CA3AF] mb-4">minutos</p>
        <ResponsiveContainer width="100%" height={190}>
          <BarChart data={durationData} margin={{ top: 20, right: 8, left: -28, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} domain={[0, 75]} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number, _: string, p: { payload?: { label?: string } }) => [p.payload?.label ?? `${v} min`, "Duración"]}
              cursor={{ fill: "rgba(0,0,0,0.04)", radius: 8 }}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]} label={<CustomBarLabel unit=" min" />}>
              {durationData.map((d, i) => (
                <Cell key={i} fill={intensityColors[d.intensity]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        {/* Legend */}
        <div className="flex gap-4 mt-2 flex-wrap">
          {(["alta", "moderada", "baja", "descanso"] as ExerciseIntensity[]).map(k => (
            <span key={k} className="flex items-center gap-1.5 text-[11px] text-[#6B7280] capitalize">
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: intensityColors[k] }} />
              {intensityConfig[k].label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Calories chart ────────────────────────────────────────────── */}
      <div className="bg-white rounded-[20px] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-2 mb-1">
          <Flame className="w-5 h-5 text-[#F5A623]" />
          <p className="text-[15px] font-semibold text-[#1A1A2E]">Calorías Estimadas</p>
        </div>
        <p className="text-[12px] text-[#9CA3AF] mb-4">kcal (punto medio del rango)</p>
        <ResponsiveContainer width="100%" height={190}>
          <BarChart data={calData} margin={{ top: 20, right: 8, left: -20, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} domain={[0, 600]} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number, _: string, p: { payload?: { label?: string } }) => [p.payload?.label ?? `${v} kcal`, "Calorías"]}
              cursor={{ fill: "rgba(0,0,0,0.04)", radius: 8 }}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]} label={<CustomBarLabel unit="" />}>
              {calData.map((d, i) => (
                <Cell key={i} fill={intensityColors[d.intensity]} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Intensity distribution pie ────────────────────────────────── */}
      <div className="bg-white rounded-[20px] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="w-5 h-5 text-[#3B9DD8]" />
          <p className="text-[15px] font-semibold text-[#1A1A2E]">Distribución Semanal</p>
        </div>
        <p className="text-[12px] text-[#9CA3AF] mb-2">días por nivel de intensidad</p>
        <div className="flex items-center gap-0">
          <ResponsiveContainer width="55%" height={180}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`${v} día${v !== 1 ? "s" : ""}`, ""]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex-1 space-y-2.5">
            {pieData.map(({ name, value, color }) => (
              <div key={name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-[#1A1A2E]">{name}</p>
                  <p className="text-[11px] text-[#9CA3AF]">{value} día{value !== 1 ? "s" : ""}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── HIIT Protocol ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-[20px] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-5 h-5 text-[#F5A623]" />
          <p className="text-[15px] font-semibold text-[#1A1A2E]">Protocolo HIIT · Martes</p>
        </div>
        <p className="text-[12px] text-[#9CA3AF] mb-5">40 min totales · 10 rondas</p>
        <HiitTimeline />
      </div>

    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────

interface ExerciseViewProps {
  todayIndex: number;
  exTipIndex: number;
}

export function ExerciseView({ todayIndex, exTipIndex }: ExerciseViewProps) {
  const [selectedDay, setSelectedDay] = useState(todayIndex);
  const [viewMode,    setViewMode]    = useState<"day" | "week">("day");
  const [safetyOpen,  setSafetyOpen]  = useState(false);

  const day      = weekExercise[selectedDay];
  const cfg      = intensityConfig[day.intensity];
  const IconComp = iconMap[day.icon] ?? Activity;
  const tip      = exerciseTips[exTipIndex % exerciseTips.length];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="pt-6 pb-28"
    >
      {/* ── Header + view toggle ─────────────────────────────────────────── */}
      <div className="px-5 mb-5">
        <h2 className="text-2xl font-bold text-[#1A1A2E] mb-4">Ejercicios</h2>

        {/* Toggle */}
        <div className="flex gap-2 p-1 bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] mb-5">
          <button
            onClick={() => setViewMode("day")}
            className={`flex-1 py-2 rounded-xl text-[13px] font-semibold transition-all duration-200 select-none ${
              viewMode === "day" ? "bg-[#1B6B5B] text-white shadow-sm" : "text-[#9CA3AF]"
            }`}
          >
            Por Día
          </button>
          <button
            onClick={() => setViewMode("week")}
            className={`flex-1 py-2 rounded-xl text-[13px] font-semibold transition-all duration-200 select-none ${
              viewMode === "week" ? "bg-[#1B6B5B] text-white shadow-sm" : "text-[#9CA3AF]"
            }`}
          >
            Semana
          </button>
        </div>

        {/* Day selector — only in day view */}
        {viewMode === "day" && (
          <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
            {weekExercise.map((d, idx) => {
              const isActive = idx === selectedDay;
              const isToday  = idx === todayIndex;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDay(idx)}
                  className={`snap-center flex-shrink-0 w-[52px] h-[60px] rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-200 select-none ${
                    isActive ? "text-white shadow-md" : "bg-white text-[#6B7280] shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
                  }`}
                  style={isActive ? { background: heroGradient[d.intensity] } : undefined}
                >
                  <span className="text-[13px] font-semibold">{d.shortName}</span>
                  {isToday && (
                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-white/70" : "bg-[#F5A623]"}`} />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">

        {/* ── WEEK VIEW ─────────────────────────────────────────────────── */}
        {viewMode === "week" && (
          <motion.div
            key="week"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <WeekCharts />
          </motion.div>
        )}

        {/* ── DAY VIEW ──────────────────────────────────────────────────── */}
        {viewMode === "day" && (
          <motion.div
            key={`day-${selectedDay}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
          >
            {/* Day title */}
            <div className="px-5">
              <h3 className="text-lg font-semibold text-[#1A1A2E]">
                {day.dayName}
                {selectedDay === todayIndex && (
                  <span className="text-[#F5A623] text-sm font-normal ml-2">(Hoy)</span>
                )}
              </h3>
            </div>

            {/* Hero card */}
            <div className="px-5">
              <motion.div
                className="relative overflow-hidden rounded-[20px] p-5"
                style={{ background: heroGradient[day.intensity] }}
              >
                <div className="absolute top-4 right-4 w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                  <IconComp className="w-7 h-7 text-white" />
                </div>
                {day.intensity === "descanso" ? (
                  <div>
                    <p className="text-white/70 text-[13px] font-medium uppercase tracking-wide mb-1">Descanso</p>
                    <p className="text-white text-xl font-bold mb-3">Día libre</p>
                    <p className="text-white/80 text-[14px] leading-relaxed pr-16">{day.description}</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-white/70 text-[13px] font-medium uppercase tracking-wide mb-1">Actividad</p>
                    <p className="text-white text-[18px] font-bold leading-snug mb-2 pr-16">{day.activity}</p>
                    <p className="text-white/80 text-[13px] leading-relaxed mb-4 pr-4">{day.description}</p>
                    <div className="flex gap-2">
                      <div className="bg-white/20 rounded-xl px-3 py-2 flex-1 text-center">
                        <p className="text-white/70 text-[11px] uppercase tracking-wide">Duración</p>
                        <p className="text-white font-bold text-[14px]">{day.duration}</p>
                      </div>
                      <div className="bg-white/20 rounded-xl px-3 py-2 flex-1 text-center">
                        <p className="text-white/70 text-[11px] uppercase tracking-wide">Intensidad</p>
                        <p className="text-white font-bold text-[14px]">{cfg.label}</p>
                      </div>
                      <div className="bg-white/20 rounded-xl px-3 py-2 flex-1 text-center">
                        <p className="text-white/70 text-[11px] uppercase tracking-wide">Calorías</p>
                        <p className="text-white font-bold text-[13px]">{day.calories}</p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Exercise sections */}
            {day.sections && day.sections.length > 0 && (
              <div className="px-5 space-y-3">
                <p className="text-[13px] font-semibold text-[#6B7280] uppercase tracking-wide">
                  Plan del día
                </p>
                {day.sections.map((section, i) => (
                  <SectionCard key={i} section={section} idx={i} />
                ))}
              </div>
            )}

            {/* Training window */}
            {day.intensity !== "descanso" && (
              <div className="px-5">
                <div className="bg-white rounded-[16px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#E8F2FA] flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-[#3B9DD8]" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-[#1A1A2E]">Ventana ideal: 11:30–12:30</p>
                    <p className="text-[12px] text-[#9CA3AF]">Después de Compulsine · antes de Fórmula Magistral</p>
                  </div>
                </div>
              </div>
            )}

            {/* Single rotating tip */}
            <div className="px-5">
              <p className="text-[13px] font-semibold text-[#6B7280] uppercase tracking-wide mb-3">
                Sugerencia del día
              </p>
              <div
                key={exTipIndex}
                className="bg-white rounded-[16px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)] flex items-start gap-3"
              >
                <div className="w-7 h-7 rounded-full bg-[#FFF5E0] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Lightbulb className="w-3.5 h-3.5 text-[#F5A623]" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-[#1A1A2E] mb-0.5">{tip.title}</p>
                  <p className="text-[13px] text-[#6B7280] leading-relaxed">{tip.body}</p>
                </div>
              </div>
            </div>

            {/* Safety signals */}
            <div className="px-5">
              <div className="bg-white rounded-[16px] shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden">
                <button onClick={() => setSafetyOpen(v => !v)} className="w-full flex items-center justify-between px-4 py-3.5 select-none">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#FEE8E8] flex items-center justify-center">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#E53E3E]" />
                    </div>
                    <p className="text-[14px] font-semibold text-[#1A1A2E]">Señales para bajar intensidad</p>
                  </div>
                  {safetyOpen ? <ChevronUp className="w-4 h-4 text-[#9CA3AF]" /> : <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />}
                </button>
                <AnimatePresence initial={false}>
                  {safetyOpen && (
                    <motion.div key="safety" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                      <div className="px-4 pb-4 space-y-2">
                        {["Mareos o sensación de desmayo", "Náuseas o malestar gástrico", "Palpitaciones irregulares", "Dolor o presión en el pecho", "Fatiga extrema desproporcionada", "Síntomas de hipoglicemia", "Disnea que impide hablar"].map((signal, i) => (
                          <div key={i} className="flex items-center gap-2.5 px-3 py-2 bg-[#FFF5F5] rounded-[10px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#E53E3E] flex-shrink-0" />
                            <p className="text-[13px] text-[#374151]">{signal}</p>
                          </div>
                        ))}
                        <p className="text-[12px] text-[#9CA3AF] pt-1 pl-1">
                          Si aparece cualquiera de estas señales, detén el entrenamiento y consulta a tu médico.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
