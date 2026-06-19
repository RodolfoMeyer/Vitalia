// Hidden off-screen component captured by html2canvas to generate PDF.
// Uses fixed-size recharts (no ResponsiveContainer) and no animations.

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, PieChart, Pie, Cell,
} from "recharts";
import type { MeasureEntry } from "@/hooks/useAppState";

function getImcStatus(imc: number) {
  if (imc < 18.5) return { label: "Bajo peso",  color: "#F5A623", bg: "#FFF5E0" };
  if (imc < 25)   return { label: "Normal",      color: "#1B6B5B", bg: "#E8F5F0" };
  if (imc < 30)   return { label: "Sobrepeso",   color: "#E8890C", bg: "#FFF0E0" };
  return               { label: "Obesidad",   color: "#E53E3E", bg: "#FEE8E8" };
}

function fmtDate(iso: string, style: "short" | "long" = "long") {
  const d = new Date(iso + "T12:00:00");
  if (style === "short") {
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
  }
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

const CHART_W = 714;
const axisStyle = { fontSize: 10, fill: "#9CA3AF" };
const ttStyle   = { background: "white", border: "1px solid #F3F4F6", borderRadius: 8, fontSize: 11, padding: "5px 9px" };

interface Props {
  entries: MeasureEntry[];
  weightGoal: number | null;
}

export function EvolutionPrintView({ entries, weightGoal }: Props) {
  if (entries.length === 0) return null;

  const allSorted  = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const latest     = allSorted[allSorted.length - 1];
  const first      = allSorted[0];
  const totalLost  = parseFloat((latest.weight - first.weight).toFixed(1));
  const latestSt   = getImcStatus(latest.imc);
  const today      = new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });

  const progressPct = weightGoal && first.weight !== weightGoal
    ? Math.max(0, Math.min(100, Math.round(
        ((first.weight - latest.weight) / (first.weight - weightGoal)) * 100
      )))
    : null;

  // Chart data — label every point, but show abbreviated if many
  const chartData = allSorted.map((e) => ({
    label:   fmtDate(e.date, "short"),
    peso:    e.weight,
    imc:     e.imc,
    grasa:   e.bodyFat     ?? null,
    musculo: e.muscleMass  ?? null,
    cintura: e.waist       ?? null,
    cadera:  e.hip         ?? null,
    cuello:  e.neck        ?? null,
  }));

  const hasGrasa   = allSorted.some((e) => e.bodyFat   != null);
  const hasMusculo = allSorted.some((e) => e.muscleMass != null);
  const hasCircum  = allSorted.some((e) => e.waist || e.hip || e.neck);

  // Body composition donut
  const compData: { name: string; value: number; color: string; pct: string }[] = [];
  if (latest.bodyWater != null) compData.push({ name: "Agua",      value: +((latest.bodyWater / 100) * latest.weight).toFixed(1), color: "#3B9DD8", pct: `${latest.bodyWater.toFixed(1)}%` });
  if (latest.proteins  != null) compData.push({ name: "Proteínas", value: +((latest.proteins  / 100) * latest.weight).toFixed(1), color: "#1B6B5B", pct: `${latest.proteins.toFixed(1)}%` });
  if (latest.bodyFat   != null) compData.push({ name: "Grasa",     value: +((latest.bodyFat   / 100) * latest.weight).toFixed(1), color: "#E8890C", pct: `${latest.bodyFat.toFixed(1)}%` });
  if (latest.boneMass  != null) compData.push({ name: "Masa ósea", value: latest.boneMass,                                         color: "#D1D5DB", pct: `${latest.boneMass.toFixed(2)} kg` });

  const dotProps = (color: string) => ({ fill: color, r: 4, strokeWidth: 0 });

  const latestMetrics = [
    { label: "IMC",              value: latest.imc.toFixed(1),          unit: "",       note: latestSt.label, noteColor: latestSt.color },
    latest.bodyFat     != null && { label: "Grasa corporal",    value: latest.bodyFat.toFixed(1),     unit: "%"      },
    latest.muscleMass  != null && { label: "Masa muscular",     value: latest.muscleMass.toFixed(1),  unit: "kg"     },
    latest.bmr         != null && { label: "TMB",                value: latest.bmr.toFixed(0),         unit: "kcal/d" },
    latest.bodyWater   != null && { label: "Agua corporal",     value: latest.bodyWater.toFixed(1),   unit: "%"      },
    latest.visceralFat != null && { label: "Grasa visceral",    value: latest.visceralFat.toFixed(1), unit: "Niv."  },
    latest.boneMass    != null && { label: "Masa ósea",         value: latest.boneMass.toFixed(2),    unit: "kg"     },
    latest.proteins    != null && { label: "Proteínas",         value: latest.proteins.toFixed(1),    unit: "%"      },
  ].filter(Boolean) as { label: string; value: string; unit: string; note?: string; noteColor?: string }[];

  return (
    <div
      id="vitalia-pdf-content"
      style={{ width: 794, background: "white", fontFamily: "system-ui, -apple-system, Arial, sans-serif", color: "#1A1A2E" }}
    >
      {/* ══ HEADER ══════════════════════════════════════════════════ */}
      <div style={{
        background: "linear-gradient(135deg, #1B6B5B 0%, #2D8B7A 100%)",
        padding: "30px 40px 26px",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", right: -50, top: -50, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
        <div style={{ position: "absolute", right: 40, bottom: -80, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
              🌿
            </div>
            <div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 3 }}>
                Vitalia · Plan de Salud Personal
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "white", lineHeight: 1.1 }}>
                Reporte de Evolución Corporal
              </div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", marginTop: 4 }}>
                Rodolfo Meyer
              </div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginBottom: 2 }}>Generado</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>{today}</div>
          </div>
        </div>
      </div>

      {/* ══ RESUMEN GENERAL ════════════════════════════════════════ */}
      <div style={{ padding: "22px 40px 20px", borderBottom: "2px solid #F3F4F6" }}>
        <div style={{ fontSize: 10, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
          Resumen general
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {[
            { label: "Peso actual",   value: `${latest.weight} kg`, sub: fmtDate(latest.date),  color: "#1A1A2E" },
            { label: "IMC actual",    value: latest.imc.toFixed(1), sub: latestSt.label,         color: latestSt.color },
            { label: "Evolución",     value: `${totalLost > 0 ? "+" : ""}${totalLost} kg`, sub: `desde ${fmtDate(first.date, "short")}`, color: totalLost <= 0 ? "#1B6B5B" : "#E53E3E" },
            { label: "Mediciones",    value: String(entries.length),  sub: "registros totales",  color: "#1A1A2E" },
          ].map(({ label, value, sub, color }) => (
            <div key={label} style={{ background: "#F8FAFB", borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 5 }}>{label}</div>
              <div style={{ fontSize: 21, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 10, color: "#6B7280", marginTop: 4 }}>{sub}</div>
            </div>
          ))}
        </div>

        {progressPct !== null && weightGoal && (
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 11, color: "#6B7280" }}>
              <span>Progreso hacia objetivo ({weightGoal} kg)</span>
              <span style={{ fontWeight: 700, color: "#1B6B5B" }}>{progressPct}%</span>
            </div>
            <div style={{ height: 8, background: "#F3F4F6", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progressPct}%`, borderRadius: 4, background: "linear-gradient(90deg, #1B6B5B, #2D8B7A)" }} />
            </div>
            <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 3 }}>
              Faltan {Math.max(0, parseFloat((latest.weight - weightGoal).toFixed(1)))} kg para el objetivo
            </div>
          </div>
        )}
      </div>

      {/* ══ ÚLTIMA MEDICIÓN ════════════════════════════════════════ */}
      <div style={{ padding: "20px 40px", borderBottom: "2px solid #F3F4F6" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Última medición
          </div>
          <div style={{ fontSize: 11, color: "#6B7280" }}>{fmtDate(latest.date)}</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {latestMetrics.map((m) => (
            <div key={m.label} style={{ background: "#F8FAFB", borderRadius: 10, padding: "10px 11px" }}>
              <div style={{ fontSize: 9, color: "#9CA3AF", marginBottom: 3 }}>{m.label}</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#1A1A2E", lineHeight: 1 }}>
                {m.value}
                <span style={{ fontSize: 10, fontWeight: 500, color: "#9CA3AF", marginLeft: 2 }}>{m.unit}</span>
              </div>
              {m.note && <div style={{ fontSize: 10, fontWeight: 700, color: m.noteColor, marginTop: 2 }}>{m.note}</div>}
            </div>
          ))}
        </div>

        {/* Circunferences row */}
        {(latest.neck || latest.waist || latest.hip) && (
          <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {latest.neck  && <div style={{ background: "#E8F5F0", borderRadius: 8, padding: "6px 12px", fontSize: 11, color: "#1B6B5B" }}>Cuello: <strong>{latest.neck} cm</strong></div>}
            {latest.waist && <div style={{ background: "#E8F5F0", borderRadius: 8, padding: "6px 12px", fontSize: 11, color: "#1B6B5B" }}>Cintura: <strong>{latest.waist} cm</strong></div>}
            {latest.hip   && <div style={{ background: "#E8F5F0", borderRadius: 8, padding: "6px 12px", fontSize: 11, color: "#1B6B5B" }}>Cadera: <strong>{latest.hip} cm</strong></div>}
            {latest.waist && latest.hip && <div style={{ background: "#E8F2FA", borderRadius: 8, padding: "6px 12px", fontSize: 11, color: "#3B9DD8" }}>ICC: <strong>{(latest.waist / latest.hip).toFixed(2)}</strong></div>}
          </div>
        )}
      </div>

      {/* ══ GRÁFICOS DE EVOLUCIÓN ══════════════════════════════════ */}
      <div style={{ padding: "20px 40px", borderBottom: "2px solid #F3F4F6" }}>
        <div style={{ fontSize: 10, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 18 }}>
          Gráficos de evolución
        </div>

        {/* Peso */}
        <div style={{ marginBottom: 26 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Evolución del Peso (kg)</div>
          <LineChart width={CHART_W} height={190} data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis dataKey="label" tick={axisStyle} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tick={axisStyle} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
            <Tooltip contentStyle={ttStyle} formatter={(v: number) => [`${v} kg`, "Peso"]} />
            {weightGoal && <ReferenceLine y={weightGoal} stroke="#1B6B5B" strokeDasharray="4 3" strokeWidth={1.5} label={{ value: `Obj. ${weightGoal} kg`, position: "insideTopRight", fontSize: 9, fill: "#1B6B5B" }} />}
            <Line type="monotone" dataKey="peso" stroke="#1B6B5B" strokeWidth={2.5} dot={dotProps("#1B6B5B")} activeDot={{ r: 5 }} isAnimationActive={false} />
          </LineChart>
        </div>

        {/* IMC */}
        <div style={{ marginBottom: 26 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Índice de Masa Corporal (IMC)</div>
          <div style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 6 }}>Rango normal: 18.5–24.9 · Sobrepeso: 25–29.9 · Obesidad: ≥30</div>
          <LineChart width={CHART_W} height={190} data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis dataKey="label" tick={axisStyle} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tick={axisStyle} tickLine={false} axisLine={false} domain={[15, "auto"]} />
            <Tooltip contentStyle={ttStyle} formatter={(v: number) => [`${v}`, "IMC"]} />
            <ReferenceLine y={18.5} stroke="#F5A623" strokeDasharray="4 3" strokeWidth={1} />
            <ReferenceLine y={25}   stroke="#E8890C" strokeDasharray="4 3" strokeWidth={1} />
            <ReferenceLine y={30}   stroke="#E53E3E" strokeDasharray="4 3" strokeWidth={1} />
            <Line type="monotone" dataKey="imc" stroke="#3B9DD8" strokeWidth={2.5} dot={dotProps("#3B9DD8")} activeDot={{ r: 5 }} isAnimationActive={false} />
          </LineChart>
        </div>

        {/* Grasa corporal */}
        {hasGrasa && (
          <div style={{ marginBottom: 26 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Índice de Grasa Corporal (%)</div>
            <div style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 6 }}>Rango saludable hombres: 10–20%</div>
            <LineChart width={CHART_W} height={190} data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="label" tick={axisStyle} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={axisStyle} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
              <Tooltip contentStyle={ttStyle} formatter={(v: number) => [`${v}%`, "Grasa"]} />
              <ReferenceLine y={20} stroke="#1B6B5B" strokeDasharray="4 3" strokeWidth={1} label={{ value: "Obj. 20%", position: "insideTopRight", fontSize: 9, fill: "#1B6B5B" }} />
              <Line type="monotone" dataKey="grasa" stroke="#E8890C" strokeWidth={2.5} dot={dotProps("#E8890C")} connectNulls isAnimationActive={false} />
            </LineChart>
          </div>
        )}

        {/* Masa muscular */}
        {hasMusculo && (
          <div style={{ marginBottom: 26 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Masa Muscular (kg)</div>
            <LineChart width={CHART_W} height={190} data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="label" tick={axisStyle} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={axisStyle} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
              <Tooltip contentStyle={ttStyle} formatter={(v: number) => [`${v} kg`, "Músculo"]} />
              <Line type="monotone" dataKey="musculo" stroke="#8B5CF6" strokeWidth={2.5} dot={dotProps("#8B5CF6")} connectNulls isAnimationActive={false} />
            </LineChart>
          </div>
        )}

        {/* Circunferencias */}
        {hasCircum && (
          <div style={{ marginBottom: 26 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Circunferencias (cm)</div>
            <div style={{ display: "flex", gap: 16, marginBottom: 6 }}>
              {[{ label: "Cintura", color: "#F5A623" }, { label: "Cadera", color: "#8B5CF6" }, { label: "Cuello", color: "#1B6B5B" }].map(({ label, color }) => (
                <span key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#6B7280" }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, display: "inline-block" }} />
                  {label}
                </span>
              ))}
            </div>
            <LineChart width={CHART_W} height={190} data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="label" tick={axisStyle} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={axisStyle} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
              <Tooltip contentStyle={ttStyle} formatter={(v: number, n: string) => [`${v} cm`, n === "cintura" ? "Cintura" : n === "cadera" ? "Cadera" : "Cuello"]} />
              <Line type="monotone" dataKey="cintura" stroke="#F5A623" strokeWidth={2.5} dot={dotProps("#F5A623")} connectNulls isAnimationActive={false} />
              <Line type="monotone" dataKey="cadera"  stroke="#8B5CF6" strokeWidth={2.5} dot={dotProps("#8B5CF6")} connectNulls isAnimationActive={false} />
              <Line type="monotone" dataKey="cuello"  stroke="#1B6B5B" strokeWidth={2.5} dot={dotProps("#1B6B5B")} connectNulls isAnimationActive={false} />
            </LineChart>
          </div>
        )}

        {/* Composición corporal donut */}
        {compData.length > 0 && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Composición Corporal — última medición</div>
            <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <PieChart width={180} height={180}>
                  <Pie data={compData} cx={85} cy={85} innerRadius={50} outerRadius={78} dataKey="value" strokeWidth={0} isAnimationActive={false}>
                    {compData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                </PieChart>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                  <div style={{ fontSize: 9, color: "#9CA3AF" }}>Peso total</div>
                  <div style={{ fontSize: 19, fontWeight: 800, color: "#1A1A2E", lineHeight: 1 }}>{latest.weight}</div>
                  <div style={{ fontSize: 9, color: "#9CA3AF" }}>kg</div>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                {compData.map((d) => (
                  <div key={d.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: d.color, display: "inline-block" }} />
                      <span style={{ fontSize: 13, color: "#6B7280" }}>{d.name}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "#1A1A2E" }}>{d.value} <span style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 400 }}>kg</span></span>
                      <div style={{ fontSize: 10, color: "#9CA3AF" }}>{d.pct}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══ HISTORIAL COMPLETO ══════════════════════════════════════ */}
      <div style={{ padding: "20px 40px 40px" }}>
        <div style={{ fontSize: 10, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>
          Historial completo — {entries.length} registros
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10.5 }}>
          <thead>
            <tr style={{ background: "#1B6B5B" }}>
              {["Fecha", "Peso", "Alt.", "IMC", "Estado", "Grasa", "Músculo", "Agua", "Proteínas", "TMB", "Cintura", "Cadera", "Cuello", "ICC"].map((h) => (
                <th key={h} style={{ padding: "8px 6px", textAlign: "left", fontWeight: 600, color: "rgba(255,255,255,0.9)", fontSize: 9, letterSpacing: "0.04em" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...entries].sort((a, b) => b.date.localeCompare(a.date)).map((e, i) => {
              const st  = getImcStatus(e.imc);
              const icc = e.waist && e.hip ? (e.waist / e.hip).toFixed(2) : null;
              return (
                <tr key={e.date} style={{ background: i % 2 === 0 ? "white" : "#F8FAFB" }}>
                  <td style={{ padding: "6px 6px", fontWeight: 600, color: "#1A1A2E", borderBottom: "1px solid #F3F4F6", whiteSpace: "nowrap" }}>
                    {new Date(e.date + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td style={{ padding: "6px 6px", fontWeight: 700, color: "#1A1A2E", borderBottom: "1px solid #F3F4F6" }}>{e.weight}</td>
                  <td style={{ padding: "6px 6px", color: "#6B7280", borderBottom: "1px solid #F3F4F6" }}>{e.height}</td>
                  <td style={{ padding: "6px 6px", fontWeight: 600, color: st.color, borderBottom: "1px solid #F3F4F6" }}>{e.imc}</td>
                  <td style={{ padding: "6px 6px", color: st.color, borderBottom: "1px solid #F3F4F6", whiteSpace: "nowrap" }}>{st.label}</td>
                  <td style={{ padding: "6px 6px", color: "#6B7280", borderBottom: "1px solid #F3F4F6" }}>{e.bodyFat     != null ? `${e.bodyFat}%`          : "—"}</td>
                  <td style={{ padding: "6px 6px", color: "#6B7280", borderBottom: "1px solid #F3F4F6" }}>{e.muscleMass  != null ? `${e.muscleMass}kg`      : "—"}</td>
                  <td style={{ padding: "6px 6px", color: "#6B7280", borderBottom: "1px solid #F3F4F6" }}>{e.bodyWater   != null ? `${e.bodyWater}%`        : "—"}</td>
                  <td style={{ padding: "6px 6px", color: "#6B7280", borderBottom: "1px solid #F3F4F6" }}>{e.proteins    != null ? `${e.proteins}%`         : "—"}</td>
                  <td style={{ padding: "6px 6px", color: "#6B7280", borderBottom: "1px solid #F3F4F6" }}>{e.bmr         != null ? `${e.bmr}`              : "—"}</td>
                  <td style={{ padding: "6px 6px", color: "#6B7280", borderBottom: "1px solid #F3F4F6" }}>{e.waist       != null ? `${e.waist}cm`          : "—"}</td>
                  <td style={{ padding: "6px 6px", color: "#6B7280", borderBottom: "1px solid #F3F4F6" }}>{e.hip         != null ? `${e.hip}cm`            : "—"}</td>
                  <td style={{ padding: "6px 6px", color: "#6B7280", borderBottom: "1px solid #F3F4F6" }}>{e.neck        != null ? `${e.neck}cm`           : "—"}</td>
                  <td style={{ padding: "6px 6px", color: "#6B7280", borderBottom: "1px solid #F3F4F6" }}>{icc ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Footer */}
        <div style={{ marginTop: 30, paddingTop: 14, borderTop: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 9, color: "#D1D5DB" }}>Generado por Vitalia · Plan de Salud Personal de Rodolfo Meyer</div>
          <div style={{ fontSize: 9, color: "#D1D5DB" }}>{today}</div>
        </div>
      </div>
    </div>
  );
}
