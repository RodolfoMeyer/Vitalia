import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Droplets } from "lucide-react";

const TOTAL_GLASSES = 12;

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
} as const;

const gridItem = {
  hidden: { opacity: 0, scale: 0.5 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: "easeInOut" as const },
  },
};

interface WaterViewProps {
  waterCount: number;
  onSetWater: (count: number) => void;
  onReset: () => void;
}

export function WaterView({ waterCount, onSetWater, onReset }: WaterViewProps) {
  const [burstIndex, setBurstIndex] = useState<number | null>(null);

  const fillPercent = (waterCount / TOTAL_GLASSES) * 100;

  const handleGlassClick = useCallback(
    (index: number) => {
      const isFilled = index < waterCount;
      if (isFilled) {
        // Empty this glass and all after it
        onSetWater(index);
      } else {
        // Fill up to this glass
        onSetWater(index + 1);
        setBurstIndex(index);
        setTimeout(() => setBurstIndex(null), 400);
      }
    },
    [waterCount, onSetWater]
  );

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
        className="relative overflow-hidden rounded-[20px] mb-6"
        style={{
          background: "linear-gradient(180deg, #3B9DD8 0%, #1E6FA3 100%)",
          height: "260px",
        }}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* Animated water circle */}
          <div className="relative w-[180px] h-[180px] flex items-center justify-center">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border-4 border-white/30" />

            {/* Inner fill */}
            <motion.div
              className="absolute rounded-full"
              style={{
                width: "160px",
                height: "160px",
                background:
                  "radial-gradient(circle, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 100%)",
              }}
              initial={false}
              animate={{
                scale: 0.2 + (fillPercent / 100) * 0.8,
              }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            />

            {/* Counter text */}
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

          {/* Goal text */}
          <p className="text-white/60 text-[13px] font-medium mt-3">
            Meta: 3 litros ({TOTAL_GLASSES} x 250ml)
          </p>
        </div>

        {/* Decorative bubbles */}
        <div className="absolute top-4 left-6 w-3 h-3 rounded-full bg-white/20" />
        <div className="absolute top-10 left-10 w-2 h-2 rounded-full bg-white/15" />
        <div className="absolute bottom-8 right-8 w-4 h-4 rounded-full bg-white/10" />
        <div className="absolute top-6 right-12 w-2 h-2 rounded-full bg-white/20" />
      </motion.div>

      {/* ---- Water Grid ---- */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-4 gap-3"
      >
        {Array.from({ length: TOTAL_GLASSES }).map((_, index) => {
          const isFilled = index < waterCount;
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
              <Droplets
                className={`w-6 h-6 transition-colors duration-300 ${
                  isFilled ? "text-white" : "text-[rgba(59,157,216,0.3)]"
                }`}
              />

              {/* Particle burst on fill */}
              {isBursting && (
                <>
                  {[...Array(4)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 rounded-full bg-[#3B9DD8]"
                      initial={{ scale: 1, opacity: 1, x: 0, y: 0 }}
                      animate={{
                        scale: 0,
                        opacity: 0,
                        x: Math.cos((i * Math.PI) / 2) * 30,
                        y: Math.sin((i * Math.PI) / 2) * 30,
                      }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                  ))}
                </>
              )}
            </motion.button>
          );
        })}
      </motion.div>

      {/* ---- Reset Button ---- */}
      <div className="mt-6 text-center">
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
