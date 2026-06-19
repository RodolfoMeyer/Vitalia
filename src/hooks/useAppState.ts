import { useState, useCallback } from "react";
import { medications, weekMenu, thyroidWeekMenu, thyroidFoodNotes as defaultThyroidNotes, wellnessTips, medicalRecommendations, exerciseTips } from "@/data/menuData";
import type { Meal, DayMenu } from "@/data/menuData";

const mealCount = (dayIdx: number) => weekMenu[dayIdx]?.meals.length ?? 5;

// Increments once per app session (sessionStorage resets on tab close)
function getRotatingIndex(key: string, length: number): number {
  const sessionFlag = `${key}_session`;
  if (!sessionStorage.getItem(sessionFlag)) {
    sessionStorage.setItem(sessionFlag, "1");
    const current = parseInt(localStorage.getItem(key) ?? "-1", 10);
    const next = (current + 1) % length;
    localStorage.setItem(key, String(next));
    return next;
  }
  return parseInt(localStorage.getItem(key) ?? "0", 10);
}

export type MedScheduleMode = "fixed" | "wake_relative" | "breakfast_relative" | "lunch_relative" | "dinner_relative";

export interface MedOverride {
  name?: string;
  dosage?: string;
  instructions?: string;
  color?: "amber" | "teal" | "blue" | "purple";
  timeFixed?: string; // HH:MM — overrides wakeOffsetMin when set
}

export interface CustomMedication {
  id: string;
  name: string;
  dosage: string;
  time: string;              // HH:MM 24h base/fallback
  instructions: string;
  color: "amber" | "teal" | "blue" | "purple";
  scheduleMode?: MedScheduleMode; // default "fixed" for legacy entries
  delayMinutes?: number;    // for lunch/dinner_relative: minutes after the event
}

export interface FoodLogEntry {
  description: string;
  kcal:        string;
  estimated?:  boolean; // true = auto-calculated, false/undefined = manually entered
}

export type DayFoodLog = Record<string, FoodLogEntry>; // mealType → entry

export interface MeasureEntry {
  date: string;    // ISO date YYYY-MM-DD
  height: number;  // cm
  weight: number;  // kg
  imc: number;
  neck?: number;   // cm — circunferencia cuello
  waist?: number;  // cm — circunferencia cintura
  hip?: number;    // cm — circunferencia cadera
  bodyFat?: number;     // % grasa corporal
  muscleMass?: number;  // kg masa muscular
  boneMass?: number;    // kg masa ósea
  proteins?: number;    // % proteínas
  visceralFat?: number; // nivel grasa visceral
  bmr?: number;         // kcal/d TMB (tasa metabólica basal)
  bodyWater?: number;   // % agua corporal
}

function getTodayIndex(): number {
  return new Date().getDay();
}

function getTodayISO(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Santiago" }).format(new Date());
}

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch { /* ignore */ }
  return fallback;
}

function saveJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* ignore */ }
}

export function useAppState() {
  const todayIndex = getTodayIndex();
  const todayISO = getTodayISO();

  // ---- Menu checkboxes (per day) ----
  const [menuChecked, setMenuChecked] = useState<Record<string, boolean[]>>(() => {
    const raw = loadJSON<Record<string, boolean[]>>("vitalia_menu_checked", {});
    // Migrate away from legacy numeric-key format
    const isLegacy = Object.keys(raw).length > 0 && Object.keys(raw).every(k => /^[0-6]$/.test(k));
    const all: Record<string, boolean[]> = isLegacy ? {} : raw;
    const storedDate = localStorage.getItem("vitalia_menu_date");
    const expectedLen = mealCount(todayIndex);
    if (storedDate !== todayISO) {
      all[todayISO] = new Array(expectedLen).fill(false);
      localStorage.setItem("vitalia_menu_date", todayISO);
      saveJSON("vitalia_menu_checked", all);
    }
    if (!all[todayISO] || all[todayISO].length !== expectedLen) {
      all[todayISO] = new Array(expectedLen).fill(false);
    }
    return all;
  });

  const toggleMeal = useCallback((dayISO: string, mealIndex: number) => {
    setMenuChecked((prev) => {
      const next = { ...prev };
      const dayLen = next[dayISO]?.length ?? mealCount(todayIndex);
      const dayChecks = [...(next[dayISO] || new Array(dayLen).fill(false))];
      dayChecks[mealIndex] = !dayChecks[mealIndex];
      next[dayISO] = dayChecks;
      saveJSON("vitalia_menu_checked", next);
      return next;
    });
  }, [todayIndex]);

  // ---- Custom menus (editable) ----
  const [customWeekMenu, setCustomWeekMenuState] = useState<DayMenu[]>(() =>
    loadJSON<DayMenu[]>("vitalia_custom_week_menu", weekMenu)
  );

  const [customThyroidMenu, setCustomThyroidMenuState] = useState<DayMenu[]>(() =>
    loadJSON<DayMenu[]>("vitalia_custom_thyroid_menu", thyroidWeekMenu)
  );

  const [customThyroidNotes, setCustomThyroidNotesState] = useState<string[]>(() =>
    loadJSON<string[]>("vitalia_custom_thyroid_notes", defaultThyroidNotes)
  );

  const updateMeal = useCallback((menuType: "plan" | "thyroid", dayIdx: number, mealIdx: number, meal: Meal) => {
    if (menuType === "plan") {
      setCustomWeekMenuState(prev => {
        const next = prev.map((day, i) => i !== dayIdx ? day : { ...day, meals: day.meals.map((m, j) => j !== mealIdx ? m : meal) });
        saveJSON("vitalia_custom_week_menu", next);
        return next;
      });
    } else {
      setCustomThyroidMenuState(prev => {
        const next = prev.map((day, i) => i !== dayIdx ? day : { ...day, meals: day.meals.map((m, j) => j !== mealIdx ? m : meal) });
        saveJSON("vitalia_custom_thyroid_menu", next);
        return next;
      });
    }
  }, []);

  const addMeal = useCallback((menuType: "plan" | "thyroid", dayIdx: number, meal: Meal) => {
    if (menuType === "plan") {
      setCustomWeekMenuState(prev => {
        const next = prev.map((day, i) => i !== dayIdx ? day : { ...day, meals: [...day.meals, meal] });
        saveJSON("vitalia_custom_week_menu", next);
        return next;
      });
    } else {
      setCustomThyroidMenuState(prev => {
        const next = prev.map((day, i) => i !== dayIdx ? day : { ...day, meals: [...day.meals, meal] });
        saveJSON("vitalia_custom_thyroid_menu", next);
        return next;
      });
    }
  }, []);

  const deleteMeal = useCallback((menuType: "plan" | "thyroid", dayIdx: number, mealIdx: number) => {
    if (menuType === "plan") {
      setCustomWeekMenuState(prev => {
        const next = prev.map((day, i) => i !== dayIdx ? day : { ...day, meals: day.meals.filter((_, j) => j !== mealIdx) });
        saveJSON("vitalia_custom_week_menu", next);
        return next;
      });
    } else {
      setCustomThyroidMenuState(prev => {
        const next = prev.map((day, i) => i !== dayIdx ? day : { ...day, meals: day.meals.filter((_, j) => j !== mealIdx) });
        saveJSON("vitalia_custom_thyroid_menu", next);
        return next;
      });
    }
  }, []);

  const resetMenu = useCallback((menuType: "plan" | "thyroid") => {
    if (menuType === "plan") {
      setCustomWeekMenuState(weekMenu);
      saveJSON("vitalia_custom_week_menu", weekMenu);
    } else {
      setCustomThyroidMenuState(thyroidWeekMenu);
      saveJSON("vitalia_custom_thyroid_menu", thyroidWeekMenu);
    }
  }, []);

  const updateThyroidNote = useCallback((idx: number, text: string) => {
    setCustomThyroidNotesState(prev => {
      const next = prev.map((n, i) => i === idx ? text : n);
      saveJSON("vitalia_custom_thyroid_notes", next);
      return next;
    });
  }, []);

  const addThyroidNote = useCallback((text: string) => {
    setCustomThyroidNotesState(prev => {
      const next = [...prev, text];
      saveJSON("vitalia_custom_thyroid_notes", next);
      return next;
    });
  }, []);

  const deleteThyroidNote = useCallback((idx: number) => {
    setCustomThyroidNotesState(prev => {
      const next = prev.filter((_, i) => i !== idx);
      saveJSON("vitalia_custom_thyroid_notes", next);
      return next;
    });
  }, []);

  // ---- Water count ----
  const [waterCount, setWaterCount] = useState<number>(() => {
    const storedDate  = localStorage.getItem("vitalia_water_date");
    const storedCount = loadJSON<number>("vitalia_water_count", 0);
    if (storedDate && storedDate !== todayISO) {
      // Save previous day's count to history
      const hist = loadJSON<Record<string, number>>("vitalia_water_history", {});
      hist[storedDate] = storedCount;
      // Keep only last 30 days
      const sorted = Object.entries(hist).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 30);
      saveJSON("vitalia_water_history", Object.fromEntries(sorted));
    }
    if (storedDate !== todayISO) {
      localStorage.setItem("vitalia_water_date", todayISO);
      localStorage.setItem("vitalia_water_count", "0");
      return 0;
    }
    return storedCount;
  });

  const [waterHistory] = useState<Record<string, number>>(() =>
    loadJSON<Record<string, number>>("vitalia_water_history", {})
  );

  const setWaterCountPersisted = useCallback((count: number) => {
    const clamped = Math.max(0, Math.min(12, count));
    setWaterCount(clamped);
    saveJSON("vitalia_water_count", clamped);
    localStorage.setItem("vitalia_water_date", todayISO);
  }, [todayISO]);

  const resetWater = useCallback(() => {
    if (typeof window !== "undefined" && window.confirm("Reiniciar contador de agua?")) {
      setWaterCountPersisted(0);
    }
  }, [setWaterCountPersisted]);

  // ---- Medications ----
  const [medsChecked, setMedsChecked] = useState<boolean[]>(() => {
    const storedDate = localStorage.getItem("vitalia_meds_date");
    const storedChecked = loadJSON<boolean[]>("vitalia_meds_checked", new Array(medications.length).fill(false));
    if (storedDate && storedDate !== todayISO) {
      // Save previous day's state to history
      const hist = loadJSON<Record<string, boolean[]>>("vitalia_meds_history", {});
      hist[storedDate] = storedChecked;
      const sorted = Object.entries(hist).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 30);
      saveJSON("vitalia_meds_history", Object.fromEntries(sorted));
    }
    if (storedDate !== todayISO) {
      localStorage.setItem("vitalia_meds_date", todayISO);
      const fresh = new Array(medications.length).fill(false);
      saveJSON("vitalia_meds_checked", fresh);
      return fresh;
    }
    return storedChecked;
  });

  const [medsHistory] = useState<Record<string, boolean[]>>(() =>
    loadJSON<Record<string, boolean[]>>("vitalia_meds_history", {})
  );

  // Tracks HH:MM when each built-in med was checked today (medId → "HH:MM")
  const [medCheckTimes, setMedCheckTimes] = useState<Record<string, string>>(() => {
    const storedDate = localStorage.getItem("vitalia_med_check_times_date");
    if (storedDate !== todayISO) return {};
    return loadJSON<Record<string, string>>("vitalia_med_check_times", {});
  });

  const toggleMed = useCallback((index: number) => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const medId = medications[index]?.id;

    setMedsChecked((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      saveJSON("vitalia_meds_checked", next);
      localStorage.setItem("vitalia_meds_date", todayISO);

      // Record or clear check time
      if (medId) {
        setMedCheckTimes((prevTimes) => {
          const nextTimes = { ...prevTimes };
          if (next[index]) {
            nextTimes[medId] = currentTime;
          } else {
            delete nextTimes[medId];
          }
          saveJSON("vitalia_med_check_times", nextTimes);
          localStorage.setItem("vitalia_med_check_times_date", todayISO);
          return nextTimes;
        });
      }

      return next;
    });
  }, [todayISO]);

  // ---- Custom medications ----
  const [customMeds, setCustomMeds] = useState<CustomMedication[]>(() =>
    loadJSON<CustomMedication[]>("vitalia_custom_meds", [])
  );

  const [customMedsChecked, setCustomMedsChecked] = useState<Record<string, boolean>>(() => {
    const storedDate = localStorage.getItem("vitalia_custom_meds_date");
    if (storedDate !== todayISO) {
      localStorage.setItem("vitalia_custom_meds_date", todayISO);
      saveJSON("vitalia_custom_meds_checked", {});
      return {};
    }
    return loadJSON<Record<string, boolean>>("vitalia_custom_meds_checked", {});
  });

  const addCustomMed = useCallback((med: CustomMedication) => {
    setCustomMeds((prev) => {
      const next = [...prev, med];
      saveJSON("vitalia_custom_meds", next);
      return next;
    });
  }, []);

  const editCustomMed = useCallback((id: string, updated: Omit<CustomMedication, "id">) => {
    setCustomMeds((prev) => {
      const next = prev.map((m) => m.id === id ? { ...updated, id } : m);
      saveJSON("vitalia_custom_meds", next);
      return next;
    });
  }, []);

  const deleteCustomMed = useCallback((id: string) => {
    setCustomMeds((prev) => {
      const next = prev.filter((m) => m.id !== id);
      saveJSON("vitalia_custom_meds", next);
      return next;
    });
    setCustomMedsChecked((prev) => {
      const next = { ...prev };
      delete next[id];
      saveJSON("vitalia_custom_meds_checked", next);
      return next;
    });
  }, []);

  const toggleCustomMed = useCallback((id: string) => {
    setCustomMedsChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      saveJSON("vitalia_custom_meds_checked", next);
      localStorage.setItem("vitalia_custom_meds_date", todayISO);
      return next;
    });
  }, [todayISO]);

  // ---- Built-in medication overrides ----
  const [medOverrides, setMedOverrides] = useState<Record<string, MedOverride>>(() =>
    loadJSON<Record<string, MedOverride>>("vitalia_med_overrides", {})
  );

  const updateBuiltinMed = useCallback((id: string, override: MedOverride) => {
    setMedOverrides((prev) => {
      const next = { ...prev, [id]: override };
      saveJSON("vitalia_med_overrides", next);
      return next;
    });
  }, []);

  const resetBuiltinMed = useCallback((id: string) => {
    setMedOverrides((prev) => {
      const next = { ...prev };
      delete next[id];
      saveJSON("vitalia_med_overrides", next);
      return next;
    });
  }, []);

  // ---- Weight goal ----
  const [weightGoal, setWeightGoalState] = useState<number | null>(() => {
    const v = localStorage.getItem("vitalia_weight_goal");
    return v ? parseFloat(v) : null;
  });

  const setWeightGoal = useCallback((goal: number | null) => {
    if (goal === null) {
      localStorage.removeItem("vitalia_weight_goal");
    } else {
      localStorage.setItem("vitalia_weight_goal", String(goal));
    }
    setWeightGoalState(goal);
  }, []);

  // ---- Evolution entries ----
  const [evolutionEntries, setEvolutionEntries] = useState<MeasureEntry[]>(() =>
    loadJSON<MeasureEntry[]>("vitalia_evolution", [])
  );

  const addEvolutionEntry = useCallback((entry: MeasureEntry) => {
    setEvolutionEntries((prev) => {
      // Upsert: replace if same date already exists
      const filtered = prev.filter((e) => e.date !== entry.date);
      const next = [...filtered, entry];
      saveJSON("vitalia_evolution", next);
      return next;
    });
  }, []);

  const deleteEvolutionEntry = useCallback((date: string) => {
    setEvolutionEntries((prev) => {
      const next = prev.filter((e) => e.date !== date);
      saveJSON("vitalia_evolution", next);
      return next;
    });
  }, []);

  // ---- Food log (calorie tracking) ----
  const [foodLog, setFoodLog] = useState<Record<string, DayFoodLog>>(() =>
    loadJSON<Record<string, DayFoodLog>>("vitalia_food_log", {})
  );

  const updateFoodLogEntry = useCallback(
    (date: string, mealType: string, patch: Partial<FoodLogEntry>) => {
      setFoodLog(prev => {
        const dayLog = prev[date] ?? {};
        const entry  = dayLog[mealType] ?? { description: "", kcal: "" };
        const next = {
          ...prev,
          [date]: { ...dayLog, [mealType]: { ...entry, ...patch } },
        };
        saveJSON("vitalia_food_log", next);
        return next;
      });
    },
    [],
  );

  // ---- Wake-up time (daily) ----
  // Only restore if the user already confirmed their wake-up time TODAY.
  // On a new day, return null so the prompt appears and the user
  // explicitly confirms — never auto-capture the app-open time.
  const [wakeUpTime, setWakeUpTimeState] = useState<string | null>(() => {
    const storedDate = localStorage.getItem("vitalia_wakeup_date");
    if (storedDate === todayISO) {
      return localStorage.getItem("vitalia_wakeup_time");
    }
    // New day (or first ever run): clear any stale value, wait for user confirmation
    return null;
  });

  const setWakeUpTime = useCallback((time: string) => {
    localStorage.setItem("vitalia_wakeup_time", time);
    localStorage.setItem("vitalia_wakeup_date", todayISO);
    setWakeUpTimeState(time);

    // Fire immediate notification: water + first med
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification("🌅 ¡Buen día, Rodolfo!", {
          body: "Toma un vaso de agua en ayunas y luego Eutirox 150 mcg. Espera 30 min para desayunar.",
          icon: "/favicon.ico",
        });
      } catch { /* ignore */ }
    }
    // Mark Eutirox as already notified today to avoid double-fire
    localStorage.setItem(`vitalia_notif_med-eutirox_${todayISO}`, "1");
  }, [todayISO]);

  // ---- Breakfast time (daily) ----
  // Same pattern as wakeUpTime: only restore if confirmed today, otherwise null
  const [breakfastTime, setBreakfastTimeState] = useState<string | null>(() => {
    const storedDate = localStorage.getItem("vitalia_breakfast_date");
    if (storedDate === todayISO) {
      return localStorage.getItem("vitalia_breakfast_time");
    }
    return null;
  });

  const setBreakfastTime = useCallback((time: string) => {
    localStorage.setItem("vitalia_breakfast_time", time);
    localStorage.setItem("vitalia_breakfast_date", todayISO);
    setBreakfastTimeState(time);
  }, [todayISO]);

  // ---- Lunch time (daily) ----
  const [lunchTime, setLunchTimeState] = useState<string | null>(() => {
    const storedDate = localStorage.getItem("vitalia_lunch_date");
    if (storedDate === todayISO) return localStorage.getItem("vitalia_lunch_time");
    return null;
  });

  const setLunchTime = useCallback((time: string) => {
    localStorage.setItem("vitalia_lunch_time", time);
    localStorage.setItem("vitalia_lunch_date", todayISO);
    setLunchTimeState(time);
  }, [todayISO]);

  // ---- Dinner time (daily) ----
  const [dinnerTime, setDinnerTimeState] = useState<string | null>(() => {
    const storedDate = localStorage.getItem("vitalia_dinner_date");
    if (storedDate === todayISO) return localStorage.getItem("vitalia_dinner_time");
    return null;
  });

  const setDinnerTime = useCallback((time: string) => {
    localStorage.setItem("vitalia_dinner_time", time);
    localStorage.setItem("vitalia_dinner_date", todayISO);
    setDinnerTimeState(time);
  }, [todayISO]);

  // ---- Rotating content indexes (change each app open) ----
  const [tipIndex]      = useState(() => getRotatingIndex("vitalia_tip_idx",  wellnessTips.length));
  const [recIndex]      = useState(() => getRotatingIndex("vitalia_rec_idx",  medicalRecommendations.length));
  const [exTipIndex]    = useState(() => getRotatingIndex("vitalia_extip_idx", exerciseTips.length));

  // ---- Navigation ----
  const [activeTab, setActiveTab] = useState(0);

  const navigateTo = useCallback((tab: number) => {
    setActiveTab(tab);
    // Haptic feedback on mobile
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try { navigator.vibrate(10); } catch { /* ignore */ }
    }
  }, []);

  // ---- Computed stats ----
  const todayMenuChecks = menuChecked[todayISO] || new Array(customWeekMenu[todayIndex]?.meals.length ?? 5).fill(false);
  const menuCompletedCount = todayMenuChecks.filter(Boolean).length;
  const menuTotalCount = customWeekMenu[todayIndex]?.meals.length ?? todayMenuChecks.length;

  // Only count medications that are already active (startDate reached or no startDate)
  const activeMedIndices = medications
    .map((m, i) => ({ m, i }))
    .filter(({ m }) => !m.startDate || todayISO >= m.startDate)
    .map(({ i }) => i);
  const medsCompletedCount = activeMedIndices.filter((i) => medsChecked[i]).length;
  const medsTotalCount = activeMedIndices.length;

  const customMedsCompletedCount = customMeds.filter((m) => customMedsChecked[m.id]).length;
  const customMedsTotalCount = customMeds.length;

  const totalTasks = menuTotalCount + 1 + medsTotalCount + customMedsTotalCount;
  const completedTasks = menuCompletedCount + (waterCount >= 12 ? 1 : 0) + medsCompletedCount + customMedsCompletedCount;

  return {
    activeTab,
    navigateTo,
    todayIndex,
    todayISO,
    // Menu
    menuChecked,
    toggleMeal,
    menuCompletedCount,
    menuTotalCount,
    customWeekMenu,
    customThyroidMenu,
    customThyroidNotes,
    updateMeal,
    addMeal,
    deleteMeal,
    resetMenu,
    updateThyroidNote,
    addThyroidNote,
    deleteThyroidNote,
    // Water
    waterCount,
    waterHistory,
    setWaterCount: setWaterCountPersisted,
    resetWater,
    // Meds (built-in)
    medsChecked,
    medsHistory,
    medCheckTimes,
    toggleMed,
    medsCompletedCount,
    medsTotalCount,
    // Meds (custom)
    customMeds,
    customMedsChecked,
    addCustomMed,
    editCustomMed,
    deleteCustomMed,
    toggleCustomMed,
    // Meds (builtin overrides)
    medOverrides,
    updateBuiltinMed,
    resetBuiltinMed,
    // Evolution
    evolutionEntries,
    addEvolutionEntry,
    deleteEvolutionEntry,
    weightGoal,
    setWeightGoal,
    // Stats
    completedTasks,
    totalTasks,
    // Food log
    foodLog,
    updateFoodLogEntry,
    // Wake-up
    wakeUpTime,
    setWakeUpTime,
    // Breakfast
    breakfastTime,
    setBreakfastTime,
    // Lunch
    lunchTime,
    setLunchTime,
    // Dinner
    dinnerTime,
    setDinnerTime,
    // Rotating content
    tipIndex,
    recIndex,
    exTipIndex,
  };
}
