import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  ForkKnife,
  Droplets,
  Pill,
  Leaf,
  TrendingUp,
  Activity,
} from "lucide-react";
import { useAppState } from "@/hooks/useAppState";
import { useNotifications } from "@/hooks/useNotifications";
import { HomeView } from "@/sections/HomeView";
import { MenuView } from "@/sections/MenuView";
import { WaterView } from "@/sections/WaterView";
import { MedsView } from "@/sections/MedsView";
import { ExerciseView } from "@/sections/ExerciseView";
import { EvolutionView } from "@/sections/EvolutionView";
import { AssistantView } from "@/sections/AssistantView";
import { Sparkles } from "lucide-react";

const navItems = [
  { label: "Inicio", icon: Home },
  { label: "Menú", icon: ForkKnife },
  { label: "Agua", icon: Droplets },
  { label: "Meds", icon: Pill },
  { label: "Ejercicios", icon: Activity },
  { label: "Evolución", icon: TrendingUp },
];

const viewNames = ["Inicio", "Menú", "Agua", "Medicamentos", "Ejercicios", "Evolución"];

export default function App() {
  const state = useAppState();
  useNotifications(state.wakeUpTime);
  const [showSplash, setShowSplash] = useState(true);
  const [showAssistant, setShowAssistant] = useState(false);
  const [splashPhase, setSplashPhase] = useState<"in" | "out">("in");

  // Splash screen sequence
  useEffect(() => {
    const t1 = setTimeout(() => setSplashPhase("out"), 1200);
    const t2 = setTimeout(() => setShowSplash(false), 1800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const todayName = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"][
    state.todayIndex
  ];

  return (
    <div className="min-h-screen bg-[#F5F7FA] relative">
      {/* ====== SPLASH SCREEN ====== */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #1B6B5B 0%, #2D8B7A 100%)" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            <motion.div
              className="flex flex-col items-center gap-4"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={
                splashPhase === "in"
                  ? { scale: 1, opacity: 1 }
                  : { scale: 1.1, opacity: 0 }
              }
              transition={{ duration: 0.6, ease: "easeInOut" }}
            >
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Leaf className="w-10 h-10 text-white" />
              </div>
              <h1
                className="text-3xl font-bold text-white tracking-tight"
                style={{ textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}
              >
                Vitalia
              </h1>
              <p className="text-white/70 text-sm">Tu plan de salud</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== HEADER ====== */}
      {!showSplash && (
        <header className="sticky top-0 z-40 bg-[#F5F7FA]/95 backdrop-blur-md px-5 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Avatar placeholder */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1B6B5B] to-[#2D8B7A] flex items-center justify-center border-2 border-[#E8F5F0]">
                <span className="text-white font-semibold text-sm">R</span>
              </div>
              <div>
                <p className="text-[#9CA3AF] text-[13px] font-medium">Vista actual</p>
                <p className="text-[#1A1A2E] font-semibold text-[15px]">
                  {viewNames[state.activeTab]}
                </p>
              </div>
            </div>
            <div className="px-3 py-1.5 rounded-full bg-[#E8F5F0]">
              <span className="text-[12px] font-medium text-[#1B6B5B]">
                {todayName}
              </span>
            </div>
          </div>
        </header>
      )}

      {/* ====== MAIN CONTENT ====== */}
      {!showSplash && (
        <main>
          <AnimatePresence mode="wait">
            {state.activeTab === 0 && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, delay: 0.1 }}
              >
                <HomeView
                  completedTasks={state.completedTasks}
                  totalTasks={state.totalTasks}
                  menuCompleted={state.menuCompletedCount}
                  menuTotal={state.menuTotalCount}
                  waterCount={state.waterCount}
                  medsCompleted={state.medsCompletedCount}
                  medsTotal={state.medsTotalCount}
                  onNavigate={state.navigateTo}
                  tipIndex={state.tipIndex}
                  recIndex={state.recIndex}
                  wakeUpTime={state.wakeUpTime}
                  onSetWakeUpTime={state.setWakeUpTime}
                  breakfastTime={state.breakfastTime}
                  onSetBreakfastTime={state.setBreakfastTime}
                  lunchTime={state.lunchTime}
                  onSetLunchTime={state.setLunchTime}
                  dinnerTime={state.dinnerTime}
                  onSetDinnerTime={state.setDinnerTime}
                />
              </motion.div>
            )}

            {state.activeTab === 1 && (
              <motion.div
                key="menu"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, delay: 0.1 }}
              >
                <MenuView
                  todayIndex={state.todayIndex}
                  todayISO={state.todayISO}
                  menuChecked={state.menuChecked}
                  onToggleMeal={state.toggleMeal}
                  foodLog={state.foodLog}
                  onUpdateFoodLog={state.updateFoodLogEntry}
                  customWeekMenu={state.customWeekMenu}
                  customThyroidMenu={state.customThyroidMenu}
                  customThyroidNotes={state.customThyroidNotes}
                  onUpdateMeal={state.updateMeal}
                  onAddMeal={state.addMeal}
                  onDeleteMeal={state.deleteMeal}
                  onResetMenu={state.resetMenu}
                  onUpdateThyroidNote={state.updateThyroidNote}
                  onAddThyroidNote={state.addThyroidNote}
                  onDeleteThyroidNote={state.deleteThyroidNote}
                />
              </motion.div>
            )}

            {state.activeTab === 2 && (
              <motion.div
                key="water"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, delay: 0.1 }}
              >
                <WaterView
                  waterCount={state.waterCount}
                  waterHistory={state.waterHistory}
                  onSetWater={state.setWaterCount}
                  onReset={state.resetWater}
                />
              </motion.div>
            )}

            {state.activeTab === 3 && (
              <motion.div
                key="meds"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, delay: 0.1 }}
              >
                <MedsView
                  medsChecked={state.medsChecked}
                  onToggleMed={state.toggleMed}
                  completedCount={state.medsCompletedCount}
                  totalCount={state.medsTotalCount}
                  customMeds={state.customMeds}
                  customMedsChecked={state.customMedsChecked}
                  onToggleCustomMed={state.toggleCustomMed}
                  onAddCustomMed={state.addCustomMed}
                  onEditCustomMed={state.editCustomMed}
                  onDeleteCustomMed={state.deleteCustomMed}
                  wakeUpTime={state.wakeUpTime}
                  breakfastTime={state.breakfastTime}
                  lunchTime={state.lunchTime}
                  dinnerTime={state.dinnerTime}
                  medCheckTimes={state.medCheckTimes}
                  medOverrides={state.medOverrides}
                  onUpdateBuiltinMed={state.updateBuiltinMed}
                  onResetBuiltinMed={state.resetBuiltinMed}
                />
              </motion.div>
            )}

            {state.activeTab === 4 && (
              <motion.div
                key="exercise"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, delay: 0.1 }}
              >
                <ExerciseView todayIndex={state.todayIndex} exTipIndex={state.exTipIndex} />
              </motion.div>
            )}

            {state.activeTab === 5 && (
              <motion.div
                key="evolution"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, delay: 0.1 }}
              >
                <EvolutionView
                  entries={state.evolutionEntries}
                  onAddEntry={state.addEvolutionEntry}
                  onDeleteEntry={state.deleteEvolutionEntry}
                  weightGoal={state.weightGoal}
                  onSetWeightGoal={state.setWeightGoal}
                  foodLog={state.foodLog}
                  todayISO={state.todayISO}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      )}

      {/* ====== AI FLOATING BUTTON ====== */}
      {!showSplash && (
        <button
          onClick={() => setShowAssistant(true)}
          className="fixed right-4 z-[55] rounded-full flex items-center justify-center active:scale-95 transition-transform"
          style={{
            background: "linear-gradient(135deg, #1B6B5B 0%, #2D8B7A 100%)",
            width: 52, height: 52,
            bottom: "calc(5rem + 16px)",
            boxShadow: "0 4px 20px rgba(27,107,91,0.5)",
          }}
        >
          <Sparkles className="w-5 h-5 text-white" />
        </button>
      )}

      {/* ====== AI ASSISTANT PANEL ====== */}
      <AssistantView isOpen={showAssistant} onClose={() => setShowAssistant(false)} />

      {/* ====== BOTTOM NAVIGATION ====== */}
      {!showSplash && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 h-20 bg-white/95 backdrop-blur-xl border-t border-black/[0.06]">
          <div className="h-full flex items-center justify-between max-w-lg mx-auto px-1">
            {navItems.map((item, idx) => {
              const isActive = state.activeTab === idx;
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => state.navigateTo(idx)}
                  className="flex-1 flex flex-col items-center justify-center gap-0.5 h-14 select-none"
                >
                  <motion.div
                    animate={{ scale: isActive ? 1.1 : 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Icon
                      className={`w-5 h-5 transition-colors duration-200 ${
                        isActive ? "text-[#1B6B5B]" : "text-[#9CA3AF]"
                      }`}
                      strokeWidth={isActive ? 2.5 : 1.5}
                    />
                  </motion.div>
                  <span
                    className={`text-[10px] font-medium transition-colors duration-200 ${
                      isActive ? "text-[#1B6B5B]" : "text-[#9CA3AF]"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
