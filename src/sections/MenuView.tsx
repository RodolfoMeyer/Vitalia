import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cherry, Fish, Soup, Wheat, Beef, Egg, CupSoda, Salad, Sandwich,
  Check, AlertCircle,
} from "lucide-react";
import { weekMenu, thyroidWeekMenu, thyroidFoodNotes } from "@/data/menuData";
import type { FoodLogEntry, DayFoodLog } from "@/hooks/useAppState";
import { FoodLogView } from "@/sections/FoodLogView";

const iconMap: Record<string, React.ElementType> = {
  Cherry, Fish, Soup, Wheat, Beef, Egg, CupSoda, Salad, Sandwich,
};

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
} as const;

const cardReveal = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeInOut" as const } },
};

type MenuMode = "plan" | "thyroid" | "registro";

// Helper: ISO date for a given day-of-week index relative to todayISO
function getDayISO(dayIndex: number, todayIndex: number, todayISO: string): string {
  const diff = dayIndex - todayIndex;
  const base = new Date(todayISO + "T12:00:00");
  base.setDate(base.getDate() + diff);
  return base.toISOString().split("T")[0];
}

interface MenuViewProps {
  todayIndex: number;
  todayISO: string;
  menuChecked: Record<number, boolean[]>;
  onToggleMeal: (dayIndex: number, mealIndex: number) => void;
  foodLog: Record<string, DayFoodLog>;
  onUpdateFoodLog: (date: string, mealType: string, patch: Partial<FoodLogEntry>) => void;
}

export function MenuView({
  todayIndex,
  todayISO,
  menuChecked,
  onToggleMeal,
  foodLog,
  onUpdateFoodLog,
}: MenuViewProps) {
  const [selectedDay, setSelectedDay] = useState(todayIndex);
  const [menuMode,    setMenuMode]    = useState<MenuMode>("plan");

  const isThyroid     = menuMode === "thyroid";
  const isRegistro    = menuMode === "registro";
  const currentMenu   = isThyroid ? thyroidWeekMenu[selectedDay] : weekMenu[selectedDay];
  const currentChecks = menuChecked[selectedDay] || new Array(currentMenu.meals.length).fill(false);

  // Build the day log for the selected day
  const selectedDayISO = getDayISO(selectedDay, todayIndex, todayISO);
  const dayLog: DayFoodLog = foodLog[selectedDayISO] ?? {};

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="pt-6 pb-28"
    >
      {/* ── Title ─────────────────────────────────────────────────────── */}
      <div className="px-5 mb-4">
        <h2 className="text-2xl font-bold text-[#1A1A2E] mb-4">Menú Semanal</h2>

        {/* 3-tab toggle */}
        <div className="flex gap-1.5 p-1 bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          {(
            [
              { mode: "plan",     label: "Nutricional",   active: "#1B6B5B" },
              { mode: "thyroid",  label: "Hipotiroidismo",active: "#3B9DD8" },
              { mode: "registro", label: "Registro",      active: "#F5A623" },
            ] as { mode: MenuMode; label: string; active: string }[]
          ).map(({ mode, label, active }) => (
            <button
              key={mode}
              onClick={() => setMenuMode(mode)}
              className="flex-1 py-2 rounded-xl text-[12px] font-semibold transition-all duration-200 select-none"
              style={
                menuMode === mode
                  ? { background: active, color: "#fff" }
                  : { color: "#9CA3AF" }
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Day Selector ──────────────────────────────────────────────── */}
      <div className="px-5 mb-5">
        <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
          {weekMenu.map((day, idx) => {
            const isActive = idx === selectedDay;
            const isToday  = idx === todayIndex;
            const activeColor = menuMode === "registro" ? "#F5A623"
                              : menuMode === "thyroid"  ? "#3B9DD8"
                              : "#1B6B5B";
            return (
              <button
                key={idx}
                onClick={() => setSelectedDay(idx)}
                className="snap-center flex-shrink-0 w-[52px] h-[60px] rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-200 select-none bg-white text-[#6B7280] shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
                style={isActive ? { background: activeColor, color: "#fff", boxShadow: `0 8px 24px ${activeColor}55` } : undefined}
              >
                <span className="text-base font-semibold">{day.shortName}</span>
                {isToday && (
                  <span className="w-1.5 h-1.5 rounded-full"
                    style={{ background: isActive ? "rgba(255,255,255,0.7)" : "#F5A623" }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Day Title ─────────────────────────────────────────────────── */}
      <div className="px-5 mb-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDay}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2"
          >
            <h3 className="text-lg font-semibold text-[#1A1A2E]">
              {currentMenu.dayName}
              {selectedDay === todayIndex && (
                <span className="text-[#1B6B5B] text-sm font-normal ml-2">(Hoy)</span>
              )}
            </h3>
            {isRegistro && (
              <span className="text-[11px] text-[#9CA3AF] bg-[#F3F4F6] px-2 py-0.5 rounded-full">
                {selectedDayISO}
              </span>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Content ───────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">

        {/* REGISTRO CALÓRICO */}
        {isRegistro && (
          <motion.div
            key="registro"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="px-5"
          >
            <FoodLogView
              plannedMeals={weekMenu[selectedDay].meals}
              dayLog={dayLog}
              onUpdate={(mealType, patch) =>
                onUpdateFoodLog(selectedDayISO, mealType, patch)
              }
            />
          </motion.div>
        )}

        {/* PLAN NUTRICIONAL / HIPOTIROIDISMO */}
        {!isRegistro && (
          <motion.div
            key={`${selectedDay}-${menuMode}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Meal Cards */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="px-5 space-y-3"
            >
              {currentMenu.meals.map((meal, idx) => {
                const isChecked = currentChecks[idx] || false;
                const IconComp  = iconMap[meal.icon] || Beef;
                return (
                  <motion.div
                    key={`${selectedDay}-${idx}`}
                    variants={cardReveal}
                    className={`bg-white rounded-[20px] p-4 shadow-[0_4px_24px_rgba(0,0,0,0.06)] flex items-center gap-4 transition-opacity duration-300 ${
                      isChecked ? "opacity-60" : "opacity-100"
                    }`}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => onToggleMeal(selectedDay, idx)}
                      className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                        isChecked
                          ? "bg-[#1B6B5B] border-[#1B6B5B]"
                          : "border-[#9CA3AF] bg-transparent"
                      }`}
                    >
                      {isChecked && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 15 }}
                        >
                          <Check className="w-4 h-4 text-white" strokeWidth={3} />
                        </motion.div>
                      )}
                    </button>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[#1B6B5B] uppercase tracking-wide mb-0.5">
                        {meal.type}
                      </p>
                      <p className={`text-[15px] leading-snug ${
                        isChecked ? "text-[#9CA3AF] line-through" : "text-[#1A1A2E]"
                      }`}>
                        {meal.description}
                      </p>
                    </div>

                    {/* Icon */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#E8F5F0] flex items-center justify-center">
                      <IconComp className="w-5 h-5 text-[#1B6B5B]" />
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Thyroid notes */}
            {isThyroid && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.15 }}
                className="px-5 mt-5"
              >
                <p className="text-[13px] font-semibold text-[#6B7280] uppercase tracking-wide mb-3">
                  Notas para hipotiroidismo
                </p>
                <div className="space-y-2">
                  {thyroidFoodNotes.map((note, i) => {
                    const isPositive = note.startsWith("Prioriza") || note.startsWith("Verduras") || note.startsWith("Proteínas");
                    return (
                      <div
                        key={i}
                        className="flex items-start gap-3 bg-white rounded-[14px] p-3 shadow-[0_2px_10px_rgba(0,0,0,0.05)]"
                      >
                        <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                          isPositive ? "text-[#3B9DD8]" : "text-[#F5A623]"
                        }`} />
                        <p className="text-[13px] text-[#374151] leading-relaxed">{note}</p>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  );
}
