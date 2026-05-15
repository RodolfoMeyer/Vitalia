import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Droplets } from "lucide-react";

const TOTAL_GLASSES = 12;
const ML_PER_GLASS  = 250;

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
} as const;

const gridItem = {
  hidden: { opacity: 0, scale: 0.5 },
  show:   { opacity: 1, scale: 1, transition: { duration: 0.3, ease: "easeInOut" as const } },
};

function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

function shortDay(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("es-ES", { weekday: "short" }).replace(".", "").slice(0, 2).toUpperCase();
}

interface WaterViewProps {
  waterCount:   number;
  waterHistory: Record<string, number>;
  onSetWater:   (count: number) => void;
  onReset:      () => void;
}

export function WaterView({ waterCount, waterHistory, onSetWater, onReset }: WaterViewProps) {
  const [burstIndex, setBurstIndex] = useState<number | null>(null);

  const fillPercent = (waterCount / TOTAL_GLASSES) * 100;
  const remaining   = TOTAL_GLASSES - waterCount;
  const remainingML = remaining * ML_PER_GLASS;

  const handleGlassClick = useCallback(
    (index: number) => {
      const isFilled = index < waterCount;
      if (isFilled) {
        onSetWater(index);
      } else {
        onSetWater(index + 1);
        setBurstIndex(index);
        setTimeout(() => setBurstIndex(null), 400);
      }
    },
    [waterCount, onSetWater]
  );

  const last7 = getLast7Days();
  const todayISO = last7[last7.length - 1];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="px-5 pt-6 pb-28"
    >
      <h2 className="text-2xl font-bold text-[#1A1A2E] mb-5">Hidratación</h2>

      {/* ---- Water Hero ---- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="relative overflow-hidden rounded-[20px] mb-4"
        style={{ background: "linear-gradient(180deg, #3B9DD8 0%, #1E6FA3 100%)", height: "260px" }}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="relative w-[180px] h-[180px] flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-white/30" />
            <motion.div
              className="absolute rounded-full"
              style={{ width: "160px", height: "160px", background: "radial-gradient(circle, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 100%)" }}
              initial={false}
              animate={{ scale: 0.2 + (fillPercent / 100) * 0.8 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            />
            <div className="relative z-10 text-center">
              <motion.span
                key={waterCount}
                initial={{ scale: 1.3, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="text-5xl font-bold text-white block"
              >
                {waterCount}
              </motion.span>
              <span className="text-white/70 text-base">/ {TOTAL_GLASSES} vasos</span>
            </div>
          </div>
          <p className="text-white/60 text-[13px] font-medium mt-3">
            Meta: 3 litros ({TOTAL_GLASSES} x 250ml)
          </p>
        </div>
        <div className="absolute top-4 left-6 w-3 h-3 rounded-full bg-white/20" />
        <div className="absolute top-10 left-10 w-2 h-2 rounded-full bg-white/15" />
        <div className="absolute bottom-8 right-8 w-4 h-4 rounded-full bg-white/10" />
        <div className="absolute top-6 right-12 w-2 h-2 rounded-full bg-white/20" />
      </motion.div>

      {/* ---- Remaining indicator ---- */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-white rounded-[16px] px-4 py-3 mb-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] flex items-center justify-between"
      >
        {waterCount >= TOTAL_GLASSES ? (
          <p className="text-[14px] font-semibold text-[#1B6B5B]">🎉 ¡Meta alcanzada! Hidratación completa del día.</p>
        ) : (
          <>
            <div>
              <p className="text-[12px] text-[#9CA3AF]">Faltan</p>
              <p className="text-[18px] font-bold text-[#3B9DD8]">
                {remaining} vasos
                <span className="text-[13px] font-normal text-[#9CA3AF] ml-1">· {remainingML >= 1000 ? `${(remainingML / 1000).toFixed(2)}L` : `${remainingML}ml`}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[12px] text-[#9CA3AF]">Tomados</p>
              <p className="text-[18px] font-bold text-[#1A1A2E]">
                {(waterCount * ML_PER_GLASS / 1000).toFixed(2)}<span className="text-[13px] font-normal text-[#9CA3AF] ml-1">L</span>
              </p>
            </div>
          </>
        )}
      </motion.div>

      {/* ---- Water Grid ---- */}
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-4 gap-3 mb-6">
        {Array.from({ length: TOTAL_GLASSES }).map((_, index) => {
          const isFilled   = index < waterCount;
          const isBursting = burstIndex === index;
          return (
            <motion.button
              key={index}
              variants={gridItem}
              onClick={() => handleGlassClick(index)}
              className={`relative aspect-square rounded-xl flex items-center justify-center transition-all duration-300 select-none ${
                isFilled
                  ? "bg-[#3B9DD8] shadow-[0_4px_16px_rgba(59,157,216,0.35)]"
                  : "bg-white border-2 border-[rgba(59,157,216,0.2)]"
              } ${isBursting ? "scale-110" : ""}`}
              whileTap={{ scale: 0.9 }}
            >
              <Droplets className={`w-6 h-6 transition-colors duration-300 ${isFilled ? "text-white" : "text-[rgba(59,157,216,0.3)]"}`} />
              {isBursting && (
                <>
                  {[...Array(4)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 rounded-full bg-[#3B9DD8]"
                      initial={{ scale: 1, opacity: 1, x: 0, y: 0 }}
                      animate={{ scale: 0, opacity: 0, x: Math.cos((i * Math.PI) / 2) * 30, y: Math.sin((i * Math.PI) / 2) * 30 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                  ))}
                </>
              )}
            </motion.button>
          );
        })}
      </motion.div>

      {/* ---- 7-day history ---- */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="bg-white rounded-[20px] p-4 shadow-[0_4px_24px_rgba(0,0,0,0.06)] mb-5"
      >
        <p className="text-[13px] font-semibold text-[#1A1A2E] mb-3">Últimos 7 días</p>
        <div className="flex items-end gap-2 h-[72px]">
          {last7.map((iso) => {
            const count   = iso === todayISO ? waterCount : (waterHistory[iso] ?? 0);
            const pct     = count / TOTAL_GLASSES;
            const isToday = iso === todayISO;
            const reached = count >= TOTAL_GLASSES;
            return (
              <div key={iso} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold" style={{ color: reached ? "#1B6B5B" : "#9CA3AF" }}>
                  {count > 0 ? count : ""}
                </span>
                <div className="w-full rounded-[6px] bg-[#EFF6FF] overflow-hidden" style={{ height: "48px" }}>
                  <motion.div
                    className="w-full rounded-[6px]"
                    style={{
                      height: `${Math.max(4, pct * 100)}%`,
                      marginTop: `${(1 - Math.max(0.04, pct)) * 100}%`,
                      background: reached
                        ? "linear-gradient(180deg,#1B6B5B,#2D8B7A)"
                        : isToday
                        ? "linear-gradient(180deg,#3B9DD8,#1E6FA3)"
                        : "linear-gradient(180deg,#7EC8E3,#3B9DD8)",
                    }}
                    initial={false}
                    animate={{ height: `${Math.max(4, pct * 100)}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <span className={`text-[10px] ${isToday ? "font-bold text-[#3B9DD8]" : "text-[#9CA3AF]"}`}>
                  {shortDay(iso)}
                </span>
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-[#C4C9D4] text-center mt-2">Meta: {TOTAL_GLASSES} vasos/día · Verde = meta alcanzada</p>
      </motion.div>

      {/* ---- Reset Button ---- */}
      <div className="text-center">
        <button
          onClick={onReset}
          className="text-[13px] font-medium text-[#9CA3AF] hover:text-[#6B7280] transition-colors select-none"
        >
          Reiniciar Contador
        </button>
      </div>
    </motion.div>
  );
}
