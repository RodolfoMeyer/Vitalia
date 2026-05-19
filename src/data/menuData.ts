export interface Meal {
  type: string;
  description: string;
  icon: string;
}

export interface DayMenu {
  dayName: string;
  shortName: string;
  meals: Meal[];
}

export const weekMenu: DayMenu[] = [
  {
    dayName: "Domingo",
    shortName: "D",
    meals: [
      { type: "Desayuno",     description: "Yogur griego + frutos rojos + 20g nueces",                               icon: "Cherry"   },
      { type: "Media Mañana", description: "1 manzana mediana",                                                       icon: "Cherry"   },
      { type: "Almuerzo",     description: "150g pollo al horno + verduras mixtas + arroz integral",                  icon: "Beef"     },
      { type: "Merienda",     description: "20g almendras",                                                           icon: "Wheat"    },
      { type: "Cena",         description: "Sopa de verduras + 200g pescado blanco",                                  icon: "Soup"     },
    ],
  },
  {
    dayName: "Lunes",
    shortName: "L",
    meals: [
      { type: "Desayuno",     description: "2 huevos cocidos (1 yema) + 150ml leche almendras + 100g fresas",         icon: "Egg"      },
      { type: "Media Mañana", description: "1 manzana (200g)",                                                        icon: "Cherry"   },
      { type: "Almuerzo",     description: "150g pollo a la plancha + lechuga + tomate + pepino + aceite oliva",      icon: "Beef"     },
      { type: "Merienda",     description: "20g almendras",                                                           icon: "Wheat"    },
      { type: "Cena",         description: "Sopa de verduras + 200g pescado blanco + 1 taza verduras mixtas",         icon: "Soup"     },
    ],
  },
  {
    dayName: "Martes",
    shortName: "M",
    meals: [
      { type: "Desayuno",     description: "150g yogur griego sin azúcar + 20g nueces + 1 rodaja pan integral",       icon: "CupSoda"  },
      { type: "Media Mañana", description: "10 almendras",                                                            icon: "Wheat"    },
      { type: "Almuerzo",     description: "150g pavo al horno + puré de coliflor (100g) + papa hervida",             icon: "Beef"     },
      { type: "Merienda",     description: "1 huevo duro",                                                            icon: "Egg"      },
      { type: "Cena",         description: "Atún al agua (1 lata) + brócoli salteado + 1 zanahoria",                  icon: "Fish"     },
    ],
  },
  {
    dayName: "Miércoles",
    shortName: "M",
    meals: [
      { type: "Desayuno",     description: "2 tostadas integrales + 1/2 palta",                                       icon: "Sandwich" },
      { type: "Media Mañana", description: "1 zanahoria + 1 pepino en rodajas (o zumo de zanahoria + arándanos)",     icon: "Salad"    },
      { type: "Almuerzo",     description: "150g salmón al vapor + 150g brócoli + zapallo italiano al horno",         icon: "Fish"     },
      { type: "Merienda",     description: "1 manzana",                                                               icon: "Cherry"   },
      { type: "Cena",         description: "150g pavo a la plancha + 1 calabacín",                                    icon: "Beef"     },
    ],
  },
  {
    dayName: "Jueves",
    shortName: "J",
    meals: [
      { type: "Desayuno",     description: "Revuelto de 4 claras de huevo + 1 taza espinacas",                        icon: "Egg"      },
      { type: "Media Mañana", description: "1 puñado de frutos secos (20g)",                                          icon: "Wheat"    },
      { type: "Almuerzo",     description: "150g atún + 100g garbanzos + lechuga + tomate + 100g arroz integral",     icon: "Salad"    },
      { type: "Merienda",     description: "1 puñado de pistachos (20g)",                                             icon: "Wheat"    },
      { type: "Cena",         description: "Sopa de verduras + 100g lentejas + 1 taza espinacas",                     icon: "Soup"     },
    ],
  },
  {
    dayName: "Viernes",
    shortName: "V",
    meals: [
      { type: "Desayuno",     description: "Batido manzana verde + omelette espinacas (1 plátano + 1 taza espinacas)", icon: "CupSoda" },
      { type: "Media Mañana", description: "150g yogur griego sin azúcar con fruta",                                  icon: "CupSoda"  },
      { type: "Almuerzo",     description: "150g pollo asado + 150g espárragos + ensalada de betarraga",              icon: "Beef"     },
      { type: "Merienda",     description: "1 rebanada pan integral + 1/4 aguacate",                                  icon: "Sandwich" },
      { type: "Cena",         description: "150g pollo + 1/2 pepino + 1/2 aguacate",                                  icon: "Salad"    },
    ],
  },
  {
    dayName: "Sábado",
    shortName: "S",
    meals: [
      { type: "Desayuno",     description: "Tostadas integrales + palta + huevo pochado",                             icon: "Sandwich" },
      { type: "Media Mañana", description: "1 fruta de temporada + 20g nueces",                                       icon: "Cherry"   },
      { type: "Almuerzo",     description: "150g salmón a la plancha + ensalada verde + papa hervida",                icon: "Fish"     },
      { type: "Merienda",     description: "150g yogur griego sin azúcar + 100g fresas",                              icon: "CupSoda"  },
      { type: "Cena",         description: "150g pollo + aguacate + tomate + lechuga",                                icon: "Salad"    },
    ],
  },
];

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  timeLabel: string;        // fallback label when no wake-up time is known
  timeContext: string;      // descriptive suffix shown after HH:MM (e.g. "Al despertar · En ayunas")
  wakeOffsetMin: number;    // minutes after wake-up when this med should be taken
  instructions: string;
  color: "amber" | "teal" | "blue" | "purple";
  startDate?: string;       // ISO YYYY-MM-DD — show as "upcoming" before this date
}

export const medications: Medication[] = [
  {
    id: "eutirox",
    name: "Eutirox 150 mcg",
    dosage: "150 mcg",
    timeLabel: "08:00 · En ayunas",
    timeContext: "Al despertar · En ayunas",
    wakeOffsetMin: 0,       // taken immediately on waking
    instructions: "Solo con agua. Sin café, leche ni suplementos. Esperar 30 min antes de desayunar.",
    color: "amber",
  },
  {
    id: "compulsine",
    name: "Compulxine 37.5 mg",
    dosage: "37.5 mg",
    timeLabel: "09:30 · Mañana",
    timeContext: "Tras el desayuno",
    wakeOffsetMin: 90,      // +30 min ayunas wait + ~60 min breakfast = 90 min
    instructions: "Después del desayuno para mejor tolerancia post bypass.",
    color: "teal",
  },
  {
    id: "magistral",
    name: "Fórmula Magistral",
    dosage: "1 cápsula",
    timeLabel: "12:30 · Mediodía",
    timeContext: "4.5 h después del Eutirox",
    wakeOffsetMin: 270,     // 4.5 h = 270 min desde Eutirox (que es T+0)
    instructions: "Separación de 4.5 h del Eutirox. Contiene Topiramato, Orlistat, Berberina, Magnesio y más.",
    color: "purple",
    startDate: "2026-05-17",
  },
  {
    id: "vitamina-d",
    name: "Vitamina D",
    dosage: "Según indicación",
    timeLabel: "20:30 · Noche",
    timeContext: "Noche · Con la cena",
    wakeOffsetMin: 750,     // 12.5 h = 750 min (cena nocturna)
    instructions: "Con la cena. Necesita grasa dietaria para absorberse correctamente.",
    color: "blue",
  },
];

export const wellnessTips = [
  "Bebe un vaso de agua al despertar para activar tu metabolismo.",
  "Come despacio y mastica bien: mejora la digestión y controla el apetito.",
  "Sirve porciones pequeñas y detente al sentirte satisfecho, no lleno.",
  "Duerme entre 7 y 8 horas — la recuperación nocturna es clave para el metabolismo.",
  "Evita acostarte después de comer: espera al menos 1 hora en movimiento.",
  "Prefiere cocción a la plancha, al horno o al vapor para conservar nutrientes.",
  "Come sin celular ni TV para escuchar mejor las señales de saciedad.",
];

// Icon mapping to lucide-react icons
export const mealIconMap: Record<string, string> = {
  Cherry: "Cherry",
  Fish: "Fish",
  Soup: "Soup",
  Wheat: "Wheat",
  Beef: "Beef",
  Egg: "Egg",
  CupSoda: "CupSoda",
  Salad: "Salad",
  Sandwich: "Sandwich",
};

// ─── Exercise ────────────────────────────────────────────────────────────────

export type ExerciseIcon = "walk" | "hiit" | "circuit" | "yoga" | "rest" | "strength" | "kettlebell";
export type ExerciseIntensity = "baja" | "moderada" | "alta" | "descanso";

export interface ExerciseItem {
  name: string;
  reps: string;
}

export interface ExerciseSection {
  title: string;
  subtitle?: string;
  note?: string;
  items: ExerciseItem[];
}

export interface ExerciseDay {
  dayName: string;
  shortName: string;
  activity: string | null;
  duration: string | null;
  intensity: ExerciseIntensity;
  calories: string | null;
  description: string;
  icon: ExerciseIcon;
  sections?: ExerciseSection[];
}

export const weekExercise: ExerciseDay[] = [
  // 0 — Domingo
  {
    dayName: "Domingo",
    shortName: "Dom",
    activity: null,
    duration: null,
    intensity: "descanso",
    calories: null,
    description: "Descanso total. Hidratate bien y prioriza el sueño para maximizar la recuperación.",
    icon: "rest",
  },
  // 1 — Lunes
  {
    dayName: "Lunes",
    shortName: "Lun",
    activity: "Fuerza Base + Cardio",
    duration: "55–65 min",
    intensity: "moderada",
    calories: "350–450 kcal",
    description: "Fuerza con mancuernas para preservar músculo. Cardio en trotadora para quemar grasa.",
    icon: "strength",
    sections: [
      {
        title: "Fuerza",
        subtitle: "3 rondas · Descanso 60–90 seg entre rondas",
        items: [
          { name: "Sentadilla con mancuerna",  reps: "12 rep" },
          { name: "Press hombro mancuernas",   reps: "12 rep" },
          { name: "Remo mancuerna",            reps: "12 rep" },
          { name: "Peso muerto pesa rusa",     reps: "12 rep" },
          { name: "Plancha",                   reps: "30 seg" },
        ],
      },
      {
        title: "Cardio · Trotadora",
        subtitle: "25 min",
        note: "Inclinación suave · ritmo moderado. Zona ideal: puedes hablar pero con esfuerzo.",
        items: [
          { name: "Caminata rápida inclinada", reps: "25 min" },
        ],
      },
    ],
  },
  // 2 — Martes
  {
    dayName: "Martes",
    shortName: "Mar",
    activity: "HIIT · Trotadora",
    duration: "35–40 min",
    intensity: "alta",
    calories: "300–420 kcal",
    description: "Intervalos de alta intensidad para acelerar el metabolismo y quemar grasa post entrenamiento.",
    icon: "hiit",
    sections: [
      {
        title: "Calentamiento",
        items: [{ name: "Caminata suave en trotadora", reps: "5 min" }],
      },
      {
        title: "HIIT",
        subtitle: "10 rondas",
        note: "Repite 10 veces el bloque completo. Total aprox. 30 min.",
        items: [
          { name: "Trote rápido", reps: "1 min" },
          { name: "Caminata",     reps: "2 min" },
        ],
      },
      {
        title: "Enfriamiento",
        items: [{ name: "Caminata suave", reps: "5 min" }],
      },
    ],
  },
  // 3 — Miércoles
  {
    dayName: "Miércoles",
    shortName: "Mié",
    activity: "Pesa Rusa + Core",
    duration: "40–50 min",
    intensity: "alta",
    calories: "380–480 kcal",
    description: "Pesa rusa 15 kg para activar cadena posterior y core. Aumenta gasto metabólico basal.",
    icon: "kettlebell",
    sections: [
      {
        title: "Circuito",
        subtitle: "4 rondas · Descanso 60 seg entre rondas",
        items: [
          { name: "Kettlebell swing",     reps: "15 rep" },
          { name: "Goblet squat",         reps: "12 rep" },
          { name: "Press pecho mancuerna", reps: "12 rep" },
          { name: "Estocadas",            reps: "10 por pierna" },
          { name: "Plancha lateral",      reps: "30 seg" },
        ],
      },
    ],
  },
  // 4 — Jueves
  {
    dayName: "Jueves",
    shortName: "Jue",
    activity: "Cardio Quema Grasa",
    duration: "45–60 min",
    intensity: "moderada",
    calories: "350–500 kcal",
    description: "Zona de oxidación de grasa. Ritmo sostenido que favorece el uso de lípidos como combustible.",
    icon: "walk",
    sections: [
      {
        title: "Trotadora · Zona quema grasa",
        subtitle: "45–60 min continuo",
        note: "Puedes hablar pero con esfuerzo. Inclinación moderada para aumentar gasto sin impacto articular excesivo.",
        items: [
          { name: "Caminata rápida con inclinación", reps: "45–60 min" },
        ],
      },
    ],
  },
  // 5 — Viernes
  {
    dayName: "Viernes",
    shortName: "Vie",
    activity: "Fuerza Metabólica",
    duration: "45–55 min",
    intensity: "alta",
    calories: "400–520 kcal",
    description: "Circuito continuo de fuerza + cardio. Máximo gasto calórico y efecto afterburn.",
    icon: "circuit",
    sections: [
      {
        title: "Circuito continuo",
        subtitle: "45 seg trabajo · 15 seg descanso · 4 rondas",
        note: "Sin pausas largas entre ejercicios. Descansa 90 seg entre rondas completas.",
        items: [
          { name: "Swing pesa rusa",       reps: "45 seg" },
          { name: "Sentadilla",            reps: "45 seg" },
          { name: "Flexiones inclinadas",  reps: "45 seg" },
          { name: "Remo mancuerna",        reps: "45 seg" },
          { name: "Mountain climbers",     reps: "45 seg" },
          { name: "Press hombro",          reps: "45 seg" },
        ],
      },
    ],
  },
  // 6 — Sábado
  {
    dayName: "Sábado",
    shortName: "Sáb",
    activity: "Recuperación Activa",
    duration: "45–60 min",
    intensity: "baja",
    calories: "150–250 kcal",
    description: "Movimiento suave para facilitar la recuperación muscular y mantener la movilidad articular.",
    icon: "yoga",
    sections: [
      {
        title: "Elige una opción",
        note: "No es obligatorio hacer todo. Escucha tu cuerpo.",
        items: [
          { name: "Caminata libre al aire libre", reps: "45–60 min" },
          { name: "Movilidad articular",          reps: "20–30 min" },
          { name: "Elongación general",           reps: "20–30 min" },
          { name: "Yoga suave",                   reps: "30–40 min" },
        ],
      },
    ],
  },
];

export const exerciseTips: Array<{ title: string; body: string }> = [
  {
    title: "No entrenes en ayunas",
    body: "Con fentermina, ten un snack previo: yogurt griego, whey o queso fresco. El entrenamiento vacío puede causar hipoglicemia.",
  },
  {
    title: "Zona cardíaca ideal",
    body: "Ritmo donde puedes hablar pero con esfuerzo. Esta zona favorece la oxidación de grasa y la tolerancia cardiovascular.",
  },
  {
    title: "Objetivo proteico",
    body: "80–110 g proteína/día para preservar masa muscular post bypass y evitar sarcopenia bariátrica.",
  },
  {
    title: "Horario ideal de entrenamiento",
    body: "11:30–12:30 es el ventana óptima: después de Compulxine (09:30) y antes de la Fórmula Magistral (12:30).",
  },
  {
    title: "Cuidado con la pesa rusa",
    body: "Evita inicialmente movimientos explosivos al máximo. La fentermina puede elevar frecuencia cardíaca y presión arterial.",
  },
  {
    title: "Post entrenamiento",
    body: "Ingiere proteína dentro de los 30–60 min post entrenamiento para maximizar síntesis muscular (whey, huevos, yogurt griego).",
  },
  {
    title: "El músculo es tu aliado",
    body: "Cada kg de masa muscular quema 70–100 kcal extra en reposo. Priorizar fuerza es clave para el rebote post bypass.",
  },
  {
    title: "Señales de alarma",
    body: "Detente si sientes: mareos, náuseas, palpitaciones, dolor torácico, fatiga extrema o disnea desproporcionada.",
  },
  {
    title: "Progresión gradual",
    body: "Las primeras 3–4 semanas son de adaptación. Constancia sostenida supera siempre a la intensidad extrema ocasional.",
  },
  {
    title: "Sueño = entrenamiento",
    body: "Durante el sueño profundo se libera hormona del crecimiento. Dormir 7–8 h potencia tus resultados igual que entrenar.",
  },
  {
    title: "Hidratación durante ejercicio",
    body: "Toma al menos 500 ml de agua por sesión. El bypass reduce la absorción: prioriza hidratación fraccionada.",
  },
  {
    title: "Efecto afterburn",
    body: "Los circuitos de fuerza metabólica (viernes) generan consumo de oxígeno elevado por 24–48 h post ejercicio.",
  },
];

// ─── Thyroid diet plan ────────────────────────────────────────────────────────

export const thyroidWeekMenu: DayMenu[] = [
  {
    dayName: "Domingo",
    shortName: "D",
    meals: [
      { type: "Desayuno",     description: "Yogur griego + arándanos + 20g nueces",                                   icon: "Cherry"   },
      { type: "Media Mañana", description: "1 manzana mediana",                                                       icon: "Cherry"   },
      { type: "Almuerzo",     description: "Merluza al vapor + arroz integral + zanahoria cocida",                    icon: "Fish"     },
      { type: "Merienda",     description: "20g almendras (ricas en selenio)",                                        icon: "Wheat"    },
      { type: "Cena",         description: "Sopa de zapallo y zanahoria (sin coliflor cruda)",                        icon: "Soup"     },
    ],
  },
  {
    dayName: "Lunes",
    shortName: "L",
    meals: [
      { type: "Desayuno",     description: "Avena (40g) + plátano + 20g almendras + chía",                            icon: "Wheat"    },
      { type: "Media Mañana", description: "20g nueces (selenio para la tiroides)",                                   icon: "Wheat"    },
      { type: "Almuerzo",     description: "150g pollo + quinoa + ensalada de lechuga y tomate",                      icon: "Beef"     },
      { type: "Merienda",     description: "150g yogur griego + fruta",                                               icon: "CupSoda"  },
      { type: "Cena",         description: "150g salmón al horno + espinacas salteadas",                              icon: "Fish"     },
    ],
  },
  {
    dayName: "Martes",
    shortName: "M",
    meals: [
      { type: "Desayuno",     description: "Huevos revueltos + aguacate + pan integral",                              icon: "Egg"      },
      { type: "Media Mañana", description: "1 manzana (200g)",                                                        icon: "Cherry"   },
      { type: "Almuerzo",     description: "150g pavo + arroz + judías verdes cocidas",                               icon: "Beef"     },
      { type: "Merienda",     description: "1 huevo duro",                                                            icon: "Egg"      },
      { type: "Cena",         description: "Atún + ensalada de hojas verdes y tomate",                                icon: "Fish"     },
    ],
  },
  {
    dayName: "Miércoles",
    shortName: "M",
    meals: [
      { type: "Desayuno",     description: "Batido de plátano + espinacas + yogur natural",                           icon: "CupSoda"  },
      { type: "Media Mañana", description: "Zanahoria + pepino en rodajas",                                           icon: "Salad"    },
      { type: "Almuerzo",     description: "150g salmón + papa al horno + pimientos rojos",                           icon: "Fish"     },
      { type: "Merienda",     description: "1 manzana",                                                               icon: "Cherry"   },
      { type: "Cena",         description: "Pollo + zanahorias y zapallo al vapor",                                   icon: "Beef"     },
    ],
  },
  {
    dayName: "Jueves",
    shortName: "J",
    meals: [
      { type: "Desayuno",     description: "Huevos + palta + pan integral (sin gluten opcional)",                     icon: "Egg"      },
      { type: "Media Mañana", description: "20g frutos secos mixtos",                                                 icon: "Wheat"    },
      { type: "Almuerzo",     description: "Sardinas + quinoa + pepino + tomate cherry",                              icon: "Fish"     },
      { type: "Merienda",     description: "20g pistachos",                                                           icon: "Wheat"    },
      { type: "Cena",         description: "Pechuga de pavo + zapallo cocido + guisantes",                            icon: "Beef"     },
    ],
  },
  {
    dayName: "Viernes",
    shortName: "V",
    meals: [
      { type: "Desayuno",     description: "Avena + fresas + nueces + semillas de lino",                              icon: "Wheat"    },
      { type: "Media Mañana", description: "150g yogur griego sin azúcar con fruta",                                  icon: "CupSoda"  },
      { type: "Almuerzo",     description: "Merluza al horno + arroz + espárragos cocidos",                           icon: "Fish"     },
      { type: "Merienda",     description: "1 rebanada pan integral + 1/4 aguacate",                                  icon: "Sandwich" },
      { type: "Cena",         description: "Salmón + ensalada de hojas verdes + aguacate",                            icon: "Fish"     },
    ],
  },
  {
    dayName: "Sábado",
    shortName: "S",
    meals: [
      { type: "Desayuno",     description: "Tostadas integrales + huevo pochado + aguacate",                          icon: "Sandwich" },
      { type: "Media Mañana", description: "1 fruta + 20g nueces",                                                    icon: "Cherry"   },
      { type: "Almuerzo",     description: "Atún + quinoa + pepino + zanahoria rallada",                              icon: "Fish"     },
      { type: "Merienda",     description: "150g yogur griego sin azúcar",                                            icon: "CupSoda"  },
      { type: "Cena",         description: "Pollo asado + ensalada de lechuga y tomate",                              icon: "Beef"     },
    ],
  },
];

export const thyroidFoodNotes: string[] = [
  "Prioriza pescado y mariscos: ricos en yodo esencial para la tiroides.",
  "Verduras crucíferas solo cocidas (brócoli, coliflor): la cocción reduce el efecto bociógeno.",
  "Proteínas magras en cada comida: pollo, pavo, huevo, pescado.",
  "Evita soja no fermentada: puede interferir con la absorción de hormona tiroidea.",
  "No tomes calcio o hierro cerca de la toma de Eutirox (espera al menos 4 horas).",
  "Limita alimentos ultraprocesados y harinas refinadas.",
];

// ─── Notification schedule ───────────────────────────────────────────────────

export interface ScheduledNotification {
  id: string;
  time: string;       // "HH:MM" 24h
  title: string;
  body: string;
  type: "medication" | "water";
  startDate?: string; // ISO YYYY-MM-DD — only fire from this date onward
}

export const notificationSchedule: ScheduledNotification[] = [
  // ── Agua (Mayo Clinic: ~250 ml c/1.5 h, desde las 10:00) ────────────────────
  { id: "water-1000", time: "10:00", type: "water", title: "💧 Hidratación", body: "Hora de hidratarse — un vaso de agua." },
  { id: "water-1130", time: "11:30", type: "water", title: "💧 Hidratación", body: "Mitad de la mañana — seguí sumando líquidos." },
  { id: "water-1300", time: "13:00", type: "water", title: "💧 Hidratación", body: "Antes del almuerzo, un vaso de agua." },
  { id: "water-1430", time: "14:30", type: "water", title: "💧 Hidratación", body: "Después del almuerzo — hidratate bien." },
  { id: "water-1600", time: "16:00", type: "water", title: "💧 Hidratación", body: "Media tarde — no esperes tener sed." },
  { id: "water-1730", time: "17:30", type: "water", title: "💧 Hidratación", body: "Objetivo: 3 litros al día — seguís sumando." },
  { id: "water-1900", time: "19:00", type: "water", title: "💧 Hidratación", body: "Antes de la cena, un vaso de agua." },
  { id: "water-2030", time: "20:30", type: "water", title: "💧 Hidratación", body: "Último recordatorio de agua del día. ¿Llegaste a los 3 litros?" },
  // ── Medicamentos ─────────────────────────────────────────────────────────────
  { id: "med-eutirox",    time: "08:00", type: "medication", title: "💊 Eutirox 150 mcg",      body: "En ayunas. Solo con agua — sin café, leche ni suplementos. Espera 30 min para desayunar." },
  { id: "med-compulsine", time: "09:30", type: "medication", title: "💊 Compulxine 37.5 mg",   body: "Tomarlo después del desayuno para mejor tolerancia." },
  { id: "med-magistral",  time: "12:30", type: "medication", title: "💊 Fórmula Magistral",    body: "1 cápsula — separación de 4.5 h del Eutirox. Contiene Orlistat, Berberina, Magnesio y más.", startDate: "2026-05-17" },
  { id: "med-vitamina-d", time: "20:30", type: "medication", title: "💊 Vitamina D",           body: "Tomarlo con la cena — necesita grasa para absorberse bien." },
];

// ─── Medical recommendations (RECOMENDACIONES.pdf – Dra. Castellón, SALUDMED) ─

export const medicalRecommendations: Array<{ title: string; body: string }> = [
  {
    title: "Come despacio",
    body: "Mastica bien cada bocado. Comer rápido favorece la indigestión y dificulta la sensación de saciedad.",
  },
  {
    title: "Porciones pequeñas",
    body: "Llena el plato con menos cantidad de lo habitual. Puedes repetir si tienes hambre real.",
  },
  {
    title: "Detente al saciarte",
    body: "Para de comer cuando te sientas satisfecho, no lleno. Aprende a escuchar las señales de tu cuerpo.",
  },
  {
    title: "No te acuestes tras comer",
    body: "Espera al menos 1–2 horas antes de acostarte. El movimiento suave después de comer ayuda a la digestión.",
  },
  {
    title: "Sin distracciones",
    body: "Evita el celular y la TV al comer. La alimentación consciente mejora la saciedad y el disfrute.",
  },
  {
    title: "Evita fritos y dulces",
    body: "Reduce el azúcar refinado y las frituras. Prefiere cocción a la plancha, al horno o al vapor.",
  },
  {
    title: "Cuidado con el azufre crudo",
    body: "Limita brócoli crudo, cebolla, ajo y coliflor cruda si generan molestias digestivas o inflamación.",
  },
  {
    title: "Aumenta los líquidos",
    body: "Bebe al menos 3 litros al día entre agua e infusiones. Empieza cada mañana con un vaso en ayunas.",
  },
];
