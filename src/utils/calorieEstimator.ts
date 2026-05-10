// Local calorie estimator — keyword + quantity parser
// Returns estimated kcal (rounded to nearest 5) or null if unrecognised

// ── Food database ─────────────────────────────────────────────────────────────

interface FoodEntry {
  keys:       string[];     // normalised keyword substrings (longest/most specific first)
  per100g?:   number;       // kcal per 100 g
  perUnit?:   number;       // kcal per "1 unit" (egg, fruit, etc.)
  defaultG:   number;       // assumed serving when no quantity given
}

// Order matters: more specific entries must come before generic ones
const DB: FoodEntry[] = [
  // ── Proteins ──────────────────────────────────────────────────────
  { keys: ["clara de huevo", "claras de huevo", "claras"],  perUnit: 17,  defaultG: 30  },
  { keys: ["huevo duro", "huevo cocido", "huevo pochado", "huevo", "yema"], perUnit: 70, defaultG: 50 },
  { keys: ["pechuga de pollo", "pechuga"],                  per100g: 165, defaultG: 150 },
  { keys: ["pollo asado", "pollo a la plancha", "pollo al horno", "pollo"], per100g: 165, defaultG: 150 },
  { keys: ["pavo al horno", "pavo a la plancha", "pavo"],   per100g: 135, defaultG: 150 },
  { keys: ["salmon", "salmón"],                             per100g: 208, defaultG: 150 },
  { keys: ["atun al agua", "atún al agua", "atun", "atún"], per100g: 116, defaultG: 85  },
  { keys: ["merluza", "pescado blanco"],                    per100g: 90,  defaultG: 150 },
  { keys: ["sardina"],                                      per100g: 208, defaultG: 100 },
  { keys: ["camarones", "camaron", "camarón"],              per100g: 99,  defaultG: 100 },
  // ── Dairy / soy ───────────────────────────────────────────────────
  { keys: ["yogur griego sin azucar", "yogur griego", "yogurt griego"], per100g: 97, defaultG: 150 },
  { keys: ["leche de almendras", "leche almendras"],        per100g: 15,  defaultG: 150 },
  { keys: ["queso fresco", "queso"],                        per100g: 72,  defaultG: 30  },
  { keys: ["whey", "proteina en polvo"],                    per100g: 400, defaultG: 30  },
  // ── Legumes & grains ──────────────────────────────────────────────
  { keys: ["arroz integral cocido", "arroz integral"],      per100g: 111, defaultG: 100 },
  { keys: ["arroz blanco", "arroz"],                        per100g: 130, defaultG: 100 },
  { keys: ["avena"],                                        per100g: 389, defaultG: 40  },
  { keys: ["quinoa cocida", "quinoa"],                      per100g: 120, defaultG: 100 },
  { keys: ["lentejas cocidas", "lentejas"],                 per100g: 116, defaultG: 100 },
  { keys: ["garbanzos cocidos", "garbanzos"],               per100g: 164, defaultG: 100 },
  { keys: ["papa hervida", "papa cocida", "papa", "patata"],per100g: 77,  defaultG: 130 },
  { keys: ["pan integral", "tostada integral", "tostada", "rebanada integral"], per100g: 233, defaultG: 30 },
  // ── Vegetables ────────────────────────────────────────────────────
  { keys: ["pure de coliflor", "puré de coliflor"],         per100g: 25,  defaultG: 100 },
  { keys: ["coliflor"],                                     per100g: 25,  defaultG: 100 },
  { keys: ["brocoli", "brócoli"],                           per100g: 34,  defaultG: 100 },
  { keys: ["espinaca", "espinacas"],                        per100g: 23,  defaultG: 80  },
  { keys: ["esparragos", "espárragos"],                     per100g: 20,  defaultG: 100 },
  { keys: ["zanahoria"],                                    per100g: 41,  defaultG: 80  },
  { keys: ["zapallo italiano", "calabacin", "calabacín", "zucchini"], per100g: 17, defaultG: 100 },
  { keys: ["zapallo"],                                      per100g: 26,  defaultG: 100 },
  { keys: ["betarraga", "remolacha"],                       per100g: 43,  defaultG: 80  },
  { keys: ["pimiento"],                                     per100g: 31,  defaultG: 100 },
  { keys: ["lechuga"],                                      per100g: 15,  defaultG: 60  },
  { keys: ["tomate cherry", "tomate"],                      per100g: 18,  defaultG: 80  },
  { keys: ["pepino"],                                       per100g: 15,  defaultG: 100 },
  { keys: ["cebolla"],                                      per100g: 40,  defaultG: 60  },
  { keys: ["apio"],                                         per100g: 14,  defaultG: 80  },
  { keys: ["judias verdes", "judías verdes"],                per100g: 31,  defaultG: 100 },
  { keys: ["guisantes"],                                    per100g: 81,  defaultG: 80  },
  { keys: ["verduras mixtas", "verduras", "vegetales"],     per100g: 30,  defaultG: 100 },
  { keys: ["ensalada verde", "ensalada de hojas", "ensalada de lechuga", "ensalada"], per100g: 20, defaultG: 120 },
  { keys: ["sopa de verduras", "sopa"],                     per100g: 25,  defaultG: 250 },
  // ── Fruits ────────────────────────────────────────────────────────
  { keys: ["frutos rojos", "berries"],                      per100g: 45,  defaultG: 100 },
  { keys: ["arandanos", "arándanos"],                       per100g: 57,  defaultG: 100 },
  { keys: ["fresas", "frutillas"],                          per100g: 32,  defaultG: 100 },
  { keys: ["manzana verde", "manzana"],                     perUnit: 78,  defaultG: 150 },
  { keys: ["platano", "plátano"],                           perUnit: 107, defaultG: 120 },
  { keys: ["fruta de temporada", "fruta"],                  perUnit: 80,  defaultG: 150 },
  // ── Fats & nuts ───────────────────────────────────────────────────
  { keys: ["aguacate", "palta"],                            per100g: 160, defaultG: 80  },
  { keys: ["almendras"],                                    per100g: 579, defaultG: 20  },
  { keys: ["nueces"],                                       per100g: 654, defaultG: 20  },
  { keys: ["pistachos"],                                    per100g: 560, defaultG: 20  },
  { keys: ["frutos secos"],                                 per100g: 580, defaultG: 20  },
  { keys: ["chia", "chía"],                                 per100g: 486, defaultG: 10  },
  { keys: ["aceite de oliva", "aceite"],                    per100g: 884, defaultG: 10  },
];

// ── Normalise ─────────────────────────────────────────────────────────────────

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[()[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ── Quantity extraction ───────────────────────────────────────────────────────

interface Qty {
  grams?:  number;
  units?:  number;
  rest:    string;
}

function extractQty(s: string): Qty {
  // grams/ml: "150g", "150 g", "150gr", "150 gramos", "200ml", "200 cc"
  let m = s.match(/^(\d+(?:[.,]\d+)?)\s*(?:g|gr|gramos?|ml|cc|l(?:itro)?)\b\s*(.*)/);
  if (m) return { grams: parseFloat(m[1].replace(",", ".")), rest: m[2] };

  // fraction unit: "1/2 palta", "1/4 aguacate"
  m = s.match(/^(1\/[234])\s+(.*)/);
  if (m) {
    const frac = m[1] === "1/2" ? 0.5 : m[1] === "1/4" ? 0.25 : 1 / 3;
    return { units: frac, rest: m[2] };
  }

  // cucharada/cdas ≈ 15 g
  m = s.match(/^(\d+(?:[.,]\d+)?)\s*(?:cucharada|cucharadas|cda|cdas)\b\s*(.*)/);
  if (m) return { grams: parseFloat(m[1]) * 15, rest: m[2] };

  // taza ≈ 240 g (rough)
  m = s.match(/^(\d+(?:[.,]\d+)?)\s*(?:taza|tazas)\b\s*(.*)/);
  if (m) return { grams: parseFloat(m[1]) * 240, rest: m[2] };

  // integer/decimal unit count: "2 huevos", "1 manzana", "3 claras"
  m = s.match(/^(\d+(?:[.,]\d+)?)\s+(.*)/);
  if (m) {
    const n = parseFloat(m[1].replace(",", "."));
    if (n >= 0.5 && n <= 20) return { units: n, rest: m[2] };
  }

  // "un"/"una" = 1 unit
  m = s.match(/^(?:un|una)\s+(.*)/);
  if (m) return { units: 1, rest: m[1] };

  return { rest: s };
}

// ── Match & calculate ─────────────────────────────────────────────────────────

function calcSegment(raw: string): number | null {
  const s = norm(raw);
  const { grams, units, rest } = extractQty(s);
  const text = norm(rest || s);

  for (const entry of DB) {
    const matched = entry.keys.some(k => text.includes(k));
    if (!matched) continue;

    if (grams !== undefined) {
      // gram quantity given
      const ref = entry.per100g ?? (entry.perUnit && entry.defaultG ? (entry.perUnit / entry.defaultG) * 100 : null);
      if (ref) return (ref / 100) * grams;
    }

    if (units !== undefined) {
      // unit quantity given
      if (entry.perUnit)  return entry.perUnit  * units;
      if (entry.per100g)  return (entry.per100g / 100) * entry.defaultG * units;
    }

    // no quantity — use default serving
    if (entry.perUnit)  return entry.perUnit;
    if (entry.per100g)  return (entry.per100g / 100) * entry.defaultG;
  }

  return null;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Estimates total kcal from a meal description.
 * Returns a rounded integer or null if nothing recognised.
 */
export function estimateKcal(description: string): number | null {
  if (!description.trim()) return null;

  // Split on common food-list separators
  const segments = norm(description).split(/[+,]|\by\b|\bcon\b|\bmas\b|\bmas\b/);

  let total    = 0;
  let hitCount = 0;

  for (const seg of segments) {
    const trimmed = seg.trim();
    if (!trimmed) continue;
    const kcal = calcSegment(trimmed);
    if (kcal !== null) {
      total += kcal;
      hitCount++;
    }
  }

  if (hitCount === 0) return null;
  return Math.round(total / 5) * 5; // round to nearest 5 kcal
}
