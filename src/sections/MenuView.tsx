import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cherry, Fish, Soup, Wheat, Beef, Egg, CupSoda, Salad, Sandwich,
  Check, AlertCircle, Pencil, Trash2, Plus, RotateCcw, X,
} from "lucide-react";
import type { Meal, DayMenu } from "@/data/menuData";
import type { FoodLogEntry, DayFoodLog } from "@/hooks/useAppState";
import { FoodLogView } from "@/sections/FoodLogView";

const iconMap: Record<string, React.ElementType> = {
  Cherry, Fish, Soup, Wheat, Beef, Egg, CupSoda, Salad, Sandwich,
};

const AVAILABLE_ICONS = ["Cherry", "Fish", "Soup", "Wheat", "Beef", "Egg", "CupSoda", "Salad", "Sandwich"];
const MEAL_TYPE_PRESETS = ["Desayuno", "Media Mañana", "Almuerzo", "Merienda", "Cena"];

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
} as const;

const cardReveal = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeInOut" as const } },
};

type MenuMode = "plan" | "thyroid" | "registro";

type EditSheet =
  | { kind: "meal"; mealIdx: number }   // mealIdx = -1 → nueva comida
  | { kind: "note"; noteIdx: number }   // noteIdx = -1 → nueva nota
  | null;

function getDayISO(dayIndex: number, todayIndex: number, todayISO: string): string {
  const diff = dayIndex - todayIndex;
  const base = new Date(todayISO + "T12:00:00");
  base.setDate(base.getDate() + diff);
  return base.toISOString().split("T")[0];
}

interface MenuViewProps {
  todayIndex: number;
  todayISO: string;
  menuChecked: Record<string, boolean[]>;
  onToggleMeal: (dayISO: string, mealIndex: number) => void;
  foodLog: Record<string, DayFoodLog>;
  onUpdateFoodLog: (date: string, mealType: string, patch: Partial<FoodLogEntry>) => void;
  customWeekMenu: DayMenu[];
  customThyroidMenu: DayMenu[];
  customThyroidNotes: string[];
  onUpdateMeal: (menuType: "plan" | "thyroid", dayIdx: number, mealIdx: number, meal: Meal) => void;
  onAddMeal: (menuType: "plan" | "thyroid", dayIdx: number, meal: Meal) => void;
  onDeleteMeal: (menuType: "plan" | "thyroid", dayIdx: number, mealIdx: number) => void;
  onResetMenu: (menuType: "plan" | "thyroid") => void;
  onUpdateThyroidNote: (idx: number, text: string) => void;
  onAddThyroidNote: (text: string) => void;
  onDeleteThyroidNote: (idx: number) => void;
}

export function MenuView({
  todayIndex,
  todayISO,
  menuChecked,
  onToggleMeal,
  foodLog,
  onUpdateFoodLog,
  customWeekMenu,
  customThyroidMenu,
  customThyroidNotes,
  onUpdateMeal,
  onAddMeal,
  onDeleteMeal,
  onResetMenu,
  onUpdateThyroidNote,
  onAddThyroidNote,
  onDeleteThyroidNote,
}: MenuViewProps) {
  const [selectedDay, setSelectedDay] = useState(todayIndex);
  const [menuMode,    setMenuMode]    = useState<MenuMode>("plan");
  const [editSheet,   setEditSheet]   = useState<EditSheet>(null);

  // Form state (shared for meal + note editing)
  const [formType,  setFormType]  = useState("");
  const [formDesc,  setFormDesc]  = useState("");
  const [formIcon,  setFormIcon]  = useState("Beef");
  const [formNote,  setFormNote]  = useState("");

  const isThyroid  = menuMode === "thyroid";
  const isRegistro = menuMode === "registro";
  const currentMenuType: "plan" | "thyroid" = isThyroid ? "thyroid" : "plan";
  const currentMenu = isThyroid ? customThyroidMenu[selectedDay] : customWeekMenu[selectedDay];

  const selectedDayISO = getDayISO(selectedDay, todayIndex, todayISO);
  const currentChecks  = menuChecked[selectedDayISO] || new Array(currentMenu.meals.length).fill(false);
  const dayLog: DayFoodLog = foodLog[selectedDayISO] ?? {};

  const activeColor = isThyroid ? "#3B9DD8" : "#1B6B5B";

  // ── Sheet helpers ──────────────────────────────────────────────────────────

  function openEditMeal(mealIdx: number) {
    if (mealIdx === -1) {
      setFormType(""); setFormDesc(""); setFormIcon("Beef");
    } else {
      const meal = currentMenu.meals[mealIdx];
      setFormType(meal.type); setFormDesc(meal.description); setFormIcon(meal.icon);
    }
    setEditSheet({ kind: "meal", mealIdx });
  }

  function openEditNote(noteIdx: number) {
    setFormNote(noteIdx === -1 ? "" : customThyroidNotes[noteIdx]);
    setEditSheet({ kind: "note", noteIdx });
  }

  function closeSheet() { setEditSheet(null); }

  function handleSaveMeal() {
    if (!editSheet || editSheet.kind !== "meal") return;
    const meal: Meal = {
      type: formType.trim() || "Comida",
      description: formDesc.trim() || "-",
      icon: formIcon,
    };
    if (editSheet.mealIdx === -1) {
      onAddMeal(currentMenuType, selectedDay, meal);
    } else {
      onUpdateMeal(currentMenuType, selectedDay, editSheet.mealIdx, meal);
    }
    closeSheet();
  }

  function handleDeleteMeal() {
    if (!editSheet || editSheet.kind !== "meal" || editSheet.mealIdx === -1) return;
    onDeleteMeal(currentMenuType, selectedDay, editSheet.mealIdx);
    closeSheet();
  }

  function handleSaveNote() {
    if (!editSheet || editSheet.kind !== "note") return;
    const text = formNote.trim();
    if (!text) return;
    if (editSheet.noteIdx === -1) {
      onAddThyroidNote(text);
    } else {
      onUpdateThyroidNote(editSheet.noteIdx, text);
    }
    closeSheet();
  }

  function handleDeleteNote() {
    if (!editSheet || editSheet.kind !== "note" || editSheet.noteIdx === -1) return;
    onDeleteThyroidNote(editSheet.noteIdx);
    closeSheet();
  }

  function handleResetMenu() {
    if (!window.confirm(`¿Restaurar el menú ${isThyroid ? "de hipotiroidismo" : "nutricional"} al original?`)) return;
    onResetMenu(currentMenuType);
  }

  const sheetIsOpen = editSheet !== null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="pt-6 pb-28"
    >
      {/* ── Title + tab toggle ─────────────────────────────────────────── */}
      <div className="px-5 mb-4">
        <h2 className="text-2xl font-bold text-[#1A1A2E] mb-4">Menú Semanal</h2>

        <div className="flex gap-1.5 p-1 bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          {(
            [
              { mode: "plan",     label: "Nutricional",    active: "#1B6B5B" },
              { mode: "thyroid",  label: "Hipotiroidismo", active: "#3B9DD8" },
              { mode: "registro", label: "Registro",       active: "#F5A623" },
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
          {customWeekMenu.map((day, idx) => {
            const isActive = idx === selectedDay;
            const isToday  = idx === todayIndex;
            const ac = menuMode === "registro" ? "#F5A623" : menuMode === "thyroid" ? "#3B9DD8" : "#1B6B5B";
            return (
              <button
                key={idx}
                onClick={() => setSelectedDay(idx)}
                className="snap-center flex-shrink-0 w-[52px] h-[60px] rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-200 select-none bg-white text-[#6B7280] shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
                style={isActive ? { background: ac, color: "#fff", boxShadow: `0 8px 24px ${ac}55` } : undefined}
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

      {/* ── Day Title + reset link ─────────────────────────────────────── */}
      <div className="px-5 mb-4 flex items-center justify-between">
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

        {!isRegistro && (
          <button
            onClick={handleResetMenu}
            className="flex items-center gap-1 text-[11px] text-[#9CA3AF] active:text-[#6B7280]"
          >
            <RotateCcw className="w-3 h-3" />
            Restaurar
          </button>
        )}
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
              plannedMeals={customWeekMenu[selectedDay].meals}
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
                      onClick={() => onToggleMeal(selectedDayISO, idx)}
                      className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                        isChecked
                          ? "border-[#1B6B5B]"
                          : "border-[#9CA3AF] bg-transparent"
                      }`}
                      style={isChecked ? { background: activeColor, borderColor: activeColor } : undefined}
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
                      <p className="text-[13px] font-medium uppercase tracking-wide mb-0.5"
                         style={{ color: activeColor }}>
                        {meal.type}
                      </p>
                      <p className={`text-[15px] leading-snug ${
                        isChecked ? "text-[#9CA3AF] line-through" : "text-[#1A1A2E]"
                      }`}>
                        {meal.description}
                      </p>
                    </div>

                    {/* Icon + edit button */}
                    <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center"
                           style={{ background: isThyroid ? "#E8F4FD" : "#E8F5F0" }}>
                        <IconComp className="w-5 h-5" style={{ color: activeColor }} />
                      </div>
                      <button
                        onClick={() => openEditMeal(idx)}
                        className="w-6 h-6 rounded-full bg-[#F3F4F6] flex items-center justify-center active:bg-[#E5E7EB]"
                      >
                        <Pencil className="w-3 h-3 text-[#6B7280]" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Add meal button */}
            <div className="px-5 mt-3">
              <button
                onClick={() => openEditMeal(-1)}
                className="w-full py-3 rounded-[16px] border-2 border-dashed flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98]"
                style={{ borderColor: activeColor + "66", color: activeColor }}
              >
                <Plus className="w-4 h-4" />
                <span className="text-[13px] font-semibold">Agregar comida</span>
              </button>
            </div>

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
                  {customThyroidNotes.map((note, i) => {
                    const isPositive = note.startsWith("Prioriza") || note.startsWith("Verduras") || note.startsWith("Proteínas");
                    return (
                      <div
                        key={i}
                        className="flex items-start gap-3 bg-white rounded-[14px] p-3 shadow-[0_2px_10px_rgba(0,0,0,0.05)]"
                      >
                        <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                          isPositive ? "text-[#3B9DD8]" : "text-[#F5A623]"
                        }`} />
                        <p className="text-[13px] text-[#374151] leading-relaxed flex-1">{note}</p>
                        <button
                          onClick={() => openEditNote(i)}
                          className="flex-shrink-0 w-6 h-6 rounded-full bg-[#F3F4F6] flex items-center justify-center active:bg-[#E5E7EB]"
                        >
                          <Pencil className="w-3 h-3 text-[#6B7280]" />
                        </button>
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={() => openEditNote(-1)}
                  className="w-full mt-2 py-2.5 rounded-[14px] border-2 border-dashed flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98]"
                  style={{ borderColor: "#3B9DD866", color: "#3B9DD8" }}
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-[13px] font-semibold">Agregar nota</span>
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

      </AnimatePresence>

      {/* ── Edit Sheet ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {sheetIsOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-[80] bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeSheet}
            />

            {/* Sheet */}
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-[90] bg-white rounded-t-[24px] p-5 pb-10 overflow-y-auto max-h-[85vh]"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              {/* Handle */}
              <div className="w-10 h-1 bg-[#E5E7EB] rounded-full mx-auto mb-4" />

              {/* Close */}
              <button
                onClick={closeSheet}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#F3F4F6] flex items-center justify-center"
              >
                <X className="w-4 h-4 text-[#6B7280]" />
              </button>

              {/* ── MEAL FORM ── */}
              {editSheet?.kind === "meal" && (
                <>
                  <h3 className="text-[17px] font-bold text-[#1A1A2E] mb-5">
                    {editSheet.mealIdx === -1 ? "Nueva comida" : "Editar comida"}
                  </h3>

                  {/* Type presets */}
                  <div className="mb-4">
                    <label className="text-[12px] font-semibold text-[#6B7280] uppercase tracking-wide mb-2 block">
                      Tipo de comida
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {MEAL_TYPE_PRESETS.map(t => (
                        <button
                          key={t}
                          onClick={() => setFormType(t)}
                          className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
                          style={
                            formType === t
                              ? { background: activeColor, color: "#fff" }
                              : { background: "#F3F4F6", color: "#6B7280" }
                          }
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={formType}
                      onChange={e => setFormType(e.target.value)}
                      placeholder="O escribe uno personalizado…"
                      className="w-full px-4 py-2.5 rounded-[12px] border border-[#E5E7EB] text-[14px] text-[#1A1A2E] placeholder-[#9CA3AF] outline-none focus:border-[#1B6B5B]"
                    />
                  </div>

                  {/* Description */}
                  <div className="mb-4">
                    <label className="text-[12px] font-semibold text-[#6B7280] uppercase tracking-wide mb-2 block">
                      Descripción
                    </label>
                    <textarea
                      value={formDesc}
                      onChange={e => setFormDesc(e.target.value)}
                      rows={3}
                      placeholder="Ej: 150g pollo a la plancha + ensalada verde"
                      className="w-full px-4 py-2.5 rounded-[12px] border border-[#E5E7EB] text-[14px] text-[#1A1A2E] placeholder-[#9CA3AF] outline-none focus:border-[#1B6B5B] resize-none"
                    />
                  </div>

                  {/* Icon selector */}
                  <div className="mb-5">
                    <label className="text-[12px] font-semibold text-[#6B7280] uppercase tracking-wide mb-2 block">
                      Ícono
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {AVAILABLE_ICONS.map(iconName => {
                        const Icon = iconMap[iconName];
                        const isSelected = formIcon === iconName;
                        return (
                          <button
                            key={iconName}
                            onClick={() => setFormIcon(iconName)}
                            className="w-10 h-10 rounded-[10px] flex items-center justify-center transition-all"
                            style={
                              isSelected
                                ? { background: activeColor }
                                : { background: "#F3F4F6" }
                            }
                          >
                            <Icon className="w-5 h-5" style={{ color: isSelected ? "#fff" : "#6B7280" }} />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={closeSheet}
                      className="flex-1 py-3 rounded-[14px] bg-[#F3F4F6] text-[14px] font-semibold text-[#6B7280]"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveMeal}
                      className="flex-1 py-3 rounded-[14px] text-[14px] font-semibold text-white"
                      style={{ background: activeColor }}
                    >
                      Guardar
                    </button>
                  </div>

                  {editSheet.mealIdx !== -1 && (
                    <button
                      onClick={handleDeleteMeal}
                      className="w-full mt-3 py-3 rounded-[14px] flex items-center justify-center gap-2 text-[14px] font-semibold text-[#EF4444] bg-[#FEF2F2]"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar comida
                    </button>
                  )}
                </>
              )}

              {/* ── NOTE FORM ── */}
              {editSheet?.kind === "note" && (
                <>
                  <h3 className="text-[17px] font-bold text-[#1A1A2E] mb-5">
                    {editSheet.noteIdx === -1 ? "Nueva nota" : "Editar nota"}
                  </h3>

                  <div className="mb-5">
                    <label className="text-[12px] font-semibold text-[#6B7280] uppercase tracking-wide mb-2 block">
                      Texto de la nota
                    </label>
                    <textarea
                      value={formNote}
                      onChange={e => setFormNote(e.target.value)}
                      rows={4}
                      placeholder="Ej: Prioriza pescados ricos en yodo…"
                      className="w-full px-4 py-2.5 rounded-[12px] border border-[#E5E7EB] text-[14px] text-[#1A1A2E] placeholder-[#9CA3AF] outline-none focus:border-[#3B9DD8] resize-none"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={closeSheet}
                      className="flex-1 py-3 rounded-[14px] bg-[#F3F4F6] text-[14px] font-semibold text-[#6B7280]"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveNote}
                      className="flex-1 py-3 rounded-[14px] text-[14px] font-semibold text-white bg-[#3B9DD8]"
                    >
                      Guardar
                    </button>
                  </div>

                  {editSheet.noteIdx !== -1 && (
                    <button
                      onClick={handleDeleteNote}
                      className="w-full mt-3 py-3 rounded-[14px] flex items-center justify-center gap-2 text-[14px] font-semibold text-[#EF4444] bg-[#FEF2F2]"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar nota
                    </button>
                  )}
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
