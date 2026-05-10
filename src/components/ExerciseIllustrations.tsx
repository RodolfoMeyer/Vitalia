// SVG exercise illustrations – proportioned icon-style figures
// viewBox "0 0 80 100"  ·  color = clothing/accent  ·  SK/SH are constants

type Props = { color: string };

const SK = "#E8B99A"; // skin
const SH = "#252525"; // shoe / dark detail

// ── Figures ──────────────────────────────────────────────────────────────────

function Squat({ color }: Props) {
  return (
    <svg viewBox="0 0 80 100" fill="none">
      <circle cx="40" cy="13" r="7" fill={SK} />
      {/* torso */}
      <line x1="40" y1="21" x2="40" y2="45" stroke={color} strokeWidth="10" strokeLinecap="round" />
      {/* arms extended forward */}
      <line x1="37" y1="30" x2="18" y2="43" stroke={color} strokeWidth="5" strokeLinecap="round" />
      <line x1="43" y1="30" x2="62" y2="43" stroke={color} strokeWidth="5" strokeLinecap="round" />
      {/* thighs wide */}
      <line x1="36" y1="45" x2="15" y2="67" stroke={color} strokeWidth="8" strokeLinecap="round" />
      <line x1="44" y1="45" x2="65" y2="67" stroke={color} strokeWidth="8" strokeLinecap="round" />
      {/* shins */}
      <line x1="15" y1="67" x2="12" y2="88" stroke={color} strokeWidth="7" strokeLinecap="round" />
      <line x1="65" y1="67" x2="68" y2="88" stroke={color} strokeWidth="7" strokeLinecap="round" />
      {/* feet */}
      <line x1="5" y1="89" x2="19" y2="89" stroke={SH} strokeWidth="5" strokeLinecap="round" />
      <line x1="61" y1="89" x2="75" y2="89" stroke={SH} strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

function ShoulderPress({ color }: Props) {
  return (
    <svg viewBox="0 0 80 100" fill="none">
      <circle cx="40" cy="11" r="7" fill={SK} />
      {/* torso */}
      <line x1="40" y1="19" x2="40" y2="52" stroke={color} strokeWidth="10" strokeLinecap="round" />
      {/* left arm overhead */}
      <line x1="36" y1="28" x2="18" y2="22" stroke={color} strokeWidth="5" strokeLinecap="round" />
      <line x1="18" y1="22" x2="16" y2="7" stroke={SK} strokeWidth="5" strokeLinecap="round" />
      {/* right arm overhead */}
      <line x1="44" y1="28" x2="62" y2="22" stroke={color} strokeWidth="5" strokeLinecap="round" />
      <line x1="62" y1="22" x2="64" y2="7" stroke={SK} strokeWidth="5" strokeLinecap="round" />
      {/* dumbbells */}
      <line x1="10" y1="7" x2="22" y2="7" stroke={SH} strokeWidth="5" strokeLinecap="round" />
      <line x1="58" y1="7" x2="70" y2="7" stroke={SH} strokeWidth="5" strokeLinecap="round" />
      {/* legs straight */}
      <path d="M37 52 L28 72 L26 90" stroke={color} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M43 52 L52 72 L54 90" stroke={color} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* feet */}
      <line x1="20" y1="90" x2="32" y2="90" stroke={SH} strokeWidth="5" strokeLinecap="round" />
      <line x1="48" y1="90" x2="60" y2="90" stroke={SH} strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

function Row({ color }: Props) {
  return (
    <svg viewBox="0 0 80 100" fill="none">
      <circle cx="58" cy="16" r="7" fill={SK} />
      {/* torso diagonal */}
      <line x1="56" y1="23" x2="26" y2="50" stroke={color} strokeWidth="10" strokeLinecap="round" />
      {/* pull arm up */}
      <line x1="44" y1="34" x2="56" y2="22" stroke={color} strokeWidth="5" strokeLinecap="round" />
      <line x1="56" y1="22" x2="62" y2="12" stroke={SK} strokeWidth="5" strokeLinecap="round" />
      {/* hang arm */}
      <line x1="44" y1="34" x2="38" y2="56" stroke={SK} strokeWidth="5" strokeLinecap="round" />
      {/* dumbbell */}
      <line x1="32" y1="56" x2="46" y2="56" stroke={SH} strokeWidth="5" strokeLinecap="round" />
      {/* legs */}
      <path d="M26 50 L20 70 L18 90" stroke={color} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M26 50 L42 68 L44 90" stroke={color} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* feet */}
      <line x1="12" y1="90" x2="24" y2="90" stroke={SH} strokeWidth="5" strokeLinecap="round" />
      <line x1="38" y1="90" x2="50" y2="90" stroke={SH} strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

function Deadlift({ color }: Props) {
  return (
    <svg viewBox="0 0 80 100" fill="none">
      <circle cx="54" cy="16" r="7" fill={SK} />
      {/* torso hip-hinge */}
      <line x1="52" y1="23" x2="24" y2="48" stroke={color} strokeWidth="10" strokeLinecap="round" />
      {/* both arms down to bar */}
      <line x1="40" y1="34" x2="34" y2="62" stroke={SK} strokeWidth="5" strokeLinecap="round" />
      <line x1="40" y1="34" x2="46" y2="62" stroke={SK} strokeWidth="5" strokeLinecap="round" />
      {/* bar */}
      <line x1="18" y1="63" x2="62" y2="63" stroke={SH} strokeWidth="5" strokeLinecap="round" />
      {/* weight plates */}
      <line x1="18" y1="58" x2="18" y2="68" stroke={SH} strokeWidth="4" strokeLinecap="round" />
      <line x1="62" y1="58" x2="62" y2="68" stroke={SH} strokeWidth="4" strokeLinecap="round" />
      {/* legs */}
      <path d="M24 48 L20 70 L18 90" stroke={color} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M24 48 L40 68 L42 90" stroke={color} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* feet */}
      <line x1="12" y1="90" x2="24" y2="90" stroke={SH} strokeWidth="5" strokeLinecap="round" />
      <line x1="36" y1="90" x2="48" y2="90" stroke={SH} strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

function Plank({ color }: Props) {
  return (
    <svg viewBox="0 0 80 100" fill="none">
      <circle cx="66" cy="36" r="7" fill={SK} />
      {/* body */}
      <line x1="64" y1="43" x2="12" y2="55" stroke={color} strokeWidth="10" strokeLinecap="round" />
      {/* right forearm */}
      <line x1="56" y1="46" x2="52" y2="62" stroke={color} strokeWidth="5" strokeLinecap="round" />
      <line x1="52" y1="62" x2="36" y2="64" stroke={color} strokeWidth="5" strokeLinecap="round" />
      {/* left forearm */}
      <line x1="42" y1="50" x2="38" y2="64" stroke={color} strokeWidth="5" strokeLinecap="round" />
      <line x1="38" y1="64" x2="22" y2="66" stroke={color} strokeWidth="5" strokeLinecap="round" />
      {/* feet */}
      <path d="M12 55 L8 66 L4 66" stroke={color} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function SidePlank({ color }: Props) {
  return (
    <svg viewBox="0 0 80 100" fill="none">
      <circle cx="66" cy="30" r="7" fill={SK} />
      {/* body diagonal */}
      <line x1="64" y1="37" x2="12" y2="58" stroke={color} strokeWidth="10" strokeLinecap="round" />
      {/* support arm */}
      <line x1="52" y1="42" x2="48" y2="60" stroke={color} strokeWidth="5" strokeLinecap="round" />
      <line x1="48" y1="60" x2="32" y2="62" stroke={color} strokeWidth="5" strokeLinecap="round" />
      {/* free arm up */}
      <line x1="60" y1="39" x2="66" y2="20" stroke={SK} strokeWidth="5" strokeLinecap="round" />
      {/* feet */}
      <path d="M12 58 L8 70 L4 70" stroke={color} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function Lunge({ color }: Props) {
  return (
    <svg viewBox="0 0 80 100" fill="none">
      <circle cx="40" cy="10" r="7" fill={SK} />
      {/* torso upright */}
      <line x1="40" y1="18" x2="40" y2="48" stroke={color} strokeWidth="10" strokeLinecap="round" />
      {/* arms */}
      <line x1="37" y1="28" x2="26" y2="46" stroke={SK} strokeWidth="5" strokeLinecap="round" />
      <line x1="43" y1="28" x2="54" y2="46" stroke={SK} strokeWidth="5" strokeLinecap="round" />
      {/* front leg */}
      <line x1="37" y1="48" x2="18" y2="66" stroke={color} strokeWidth="8" strokeLinecap="round" />
      <line x1="18" y1="66" x2="12" y2="88" stroke={color} strokeWidth="7" strokeLinecap="round" />
      {/* back leg */}
      <line x1="43" y1="48" x2="60" y2="62" stroke={color} strokeWidth="8" strokeLinecap="round" />
      <line x1="60" y1="62" x2="66" y2="88" stroke={color} strokeWidth="7" strokeLinecap="round" />
      {/* feet */}
      <line x1="5" y1="89" x2="18" y2="89" stroke={SH} strokeWidth="5" strokeLinecap="round" />
      <line x1="60" y1="89" x2="73" y2="89" stroke={SH} strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

function KettlebellSwing({ color }: Props) {
  return (
    <svg viewBox="0 0 80 100" fill="none">
      <circle cx="52" cy="14" r="7" fill={SK} />
      {/* torso hip-hinge */}
      <line x1="50" y1="21" x2="22" y2="46" stroke={color} strokeWidth="10" strokeLinecap="round" />
      {/* both arms forward */}
      <line x1="38" y1="32" x2="30" y2="54" stroke={SK} strokeWidth="5" strokeLinecap="round" />
      <line x1="38" y1="32" x2="44" y2="56" stroke={SK} strokeWidth="5" strokeLinecap="round" />
      {/* KB handle */}
      <line x1="24" y1="54" x2="50" y2="54" stroke={SH} strokeWidth="3" strokeLinecap="round" />
      {/* KB ball */}
      <circle cx="37" cy="64" r="8" fill={SH} opacity="0.85" />
      {/* legs */}
      <path d="M22 46 L14 66 L12 88" stroke={color} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M22 46 L36 64 L38 88" stroke={color} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* feet */}
      <line x1="5" y1="89" x2="18" y2="89" stroke={SH} strokeWidth="5" strokeLinecap="round" />
      <line x1="32" y1="89" x2="44" y2="89" stroke={SH} strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

function GobletSquat({ color }: Props) {
  return (
    <svg viewBox="0 0 80 100" fill="none">
      <circle cx="40" cy="12" r="7" fill={SK} />
      {/* torso */}
      <line x1="40" y1="20" x2="39" y2="48" stroke={color} strokeWidth="10" strokeLinecap="round" />
      {/* arms bent at chest */}
      <line x1="37" y1="30" x2="26" y2="38" stroke={color} strokeWidth="5" strokeLinecap="round" />
      <line x1="26" y1="38" x2="30" y2="48" stroke={color} strokeWidth="5" strokeLinecap="round" />
      <line x1="43" y1="30" x2="54" y2="38" stroke={color} strokeWidth="5" strokeLinecap="round" />
      <line x1="54" y1="38" x2="50" y2="48" stroke={color} strokeWidth="5" strokeLinecap="round" />
      {/* KB ball */}
      <circle cx="40" cy="52" r="6" fill={SH} opacity="0.85" />
      {/* thighs */}
      <line x1="36" y1="50" x2="16" y2="70" stroke={color} strokeWidth="8" strokeLinecap="round" />
      <line x1="44" y1="50" x2="64" y2="70" stroke={color} strokeWidth="8" strokeLinecap="round" />
      {/* shins */}
      <line x1="16" y1="70" x2="14" y2="88" stroke={color} strokeWidth="7" strokeLinecap="round" />
      <line x1="64" y1="70" x2="66" y2="88" stroke={color} strokeWidth="7" strokeLinecap="round" />
      {/* feet */}
      <line x1="6" y1="89" x2="20" y2="89" stroke={SH} strokeWidth="5" strokeLinecap="round" />
      <line x1="60" y1="89" x2="74" y2="89" stroke={SH} strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

function ChestPress({ color }: Props) {
  return (
    <svg viewBox="0 0 80 100" fill="none">
      <circle cx="64" cy="52" r="7" fill={SK} />
      {/* body horizontal */}
      <line x1="62" y1="59" x2="10" y2="67" stroke={color} strokeWidth="10" strokeLinecap="round" />
      {/* arm pressing up */}
      <line x1="52" y1="60" x2="48" y2="40" stroke={color} strokeWidth="5" strokeLinecap="round" />
      <line x1="48" y1="40" x2="38" y2="40" stroke={SK} strokeWidth="5" strokeLinecap="round" />
      {/* dumbbell */}
      <line x1="32" y1="40" x2="44" y2="40" stroke={SH} strokeWidth="5" strokeLinecap="round" />
      {/* legs bent */}
      <path d="M28 65 L22 78 L12 76" stroke={color} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function MountainClimbers({ color }: Props) {
  return (
    <svg viewBox="0 0 80 100" fill="none">
      <circle cx="66" cy="22" r="7" fill={SK} />
      {/* body diagonal */}
      <line x1="64" y1="29" x2="14" y2="48" stroke={color} strokeWidth="10" strokeLinecap="round" />
      {/* arms */}
      <line x1="56" y1="34" x2="52" y2="52" stroke={color} strokeWidth="5" strokeLinecap="round" />
      <line x1="52" y1="52" x2="36" y2="54" stroke={color} strokeWidth="5" strokeLinecap="round" />
      {/* knee driven in */}
      <line x1="44" y1="42" x2="44" y2="58" stroke={color} strokeWidth="7" strokeLinecap="round" />
      <line x1="44" y1="58" x2="36" y2="56" stroke={color} strokeWidth="7" strokeLinecap="round" />
      {/* back leg extended */}
      <path d="M14 48 L10 62 L6 62" stroke={color} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function PushUp({ color }: Props) {
  return (
    <svg viewBox="0 0 80 100" fill="none">
      <circle cx="66" cy="20" r="7" fill={SK} />
      {/* body */}
      <line x1="64" y1="27" x2="14" y2="40" stroke={color} strokeWidth="10" strokeLinecap="round" />
      {/* arms on hands */}
      <line x1="56" y1="32" x2="52" y2="50" stroke={color} strokeWidth="5" strokeLinecap="round" />
      <line x1="52" y1="50" x2="40" y2="52" stroke={SK} strokeWidth="5" strokeLinecap="round" />
      {/* feet */}
      <path d="M14 40 L10 54 L6 54" stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function Run({ color }: Props) {
  return (
    <svg viewBox="0 0 80 100" fill="none">
      <circle cx="40" cy="10" r="7" fill={SK} />
      {/* torso forward lean */}
      <line x1="40" y1="18" x2="37" y2="48" stroke={color} strokeWidth="10" strokeLinecap="round" />
      {/* arm back */}
      <line x1="39" y1="30" x2="56" y2="40" stroke={SK} strokeWidth="5" strokeLinecap="round" />
      {/* arm forward */}
      <line x1="39" y1="30" x2="22" y2="20" stroke={SK} strokeWidth="5" strokeLinecap="round" />
      {/* front leg */}
      <line x1="36" y1="48" x2="22" y2="62" stroke={color} strokeWidth="8" strokeLinecap="round" />
      <line x1="22" y1="62" x2="18" y2="82" stroke={color} strokeWidth="7" strokeLinecap="round" />
      {/* back leg */}
      <line x1="38" y1="48" x2="54" y2="58" stroke={color} strokeWidth="8" strokeLinecap="round" />
      <line x1="54" y1="58" x2="62" y2="78" stroke={color} strokeWidth="7" strokeLinecap="round" />
      {/* feet */}
      <line x1="12" y1="83" x2="24" y2="83" stroke={SH} strokeWidth="5" strokeLinecap="round" />
      <line x1="58" y1="79" x2="70" y2="79" stroke={SH} strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

function Walk({ color }: Props) {
  return (
    <svg viewBox="0 0 80 100" fill="none">
      <circle cx="40" cy="10" r="7" fill={SK} />
      {/* torso */}
      <line x1="40" y1="18" x2="40" y2="50" stroke={color} strokeWidth="10" strokeLinecap="round" />
      {/* arms */}
      <line x1="38" y1="28" x2="24" y2="44" stroke={SK} strokeWidth="5" strokeLinecap="round" />
      <line x1="42" y1="28" x2="56" y2="42" stroke={SK} strokeWidth="5" strokeLinecap="round" />
      {/* front leg */}
      <line x1="38" y1="50" x2="26" y2="68" stroke={color} strokeWidth="8" strokeLinecap="round" />
      <line x1="26" y1="68" x2="22" y2="88" stroke={color} strokeWidth="7" strokeLinecap="round" />
      {/* back leg */}
      <line x1="42" y1="50" x2="54" y2="66" stroke={color} strokeWidth="8" strokeLinecap="round" />
      <line x1="54" y1="66" x2="58" y2="88" stroke={color} strokeWidth="7" strokeLinecap="round" />
      {/* feet */}
      <line x1="16" y1="89" x2="28" y2="89" stroke={SH} strokeWidth="5" strokeLinecap="round" />
      <line x1="52" y1="89" x2="64" y2="89" stroke={SH} strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

function Standing({ color }: Props) {
  return (
    <svg viewBox="0 0 80 100" fill="none">
      <circle cx="40" cy="10" r="7" fill={SK} />
      <line x1="40" y1="18" x2="40" y2="52" stroke={color} strokeWidth="10" strokeLinecap="round" />
      <line x1="37" y1="28" x2="24" y2="46" stroke={SK} strokeWidth="5" strokeLinecap="round" />
      <line x1="43" y1="28" x2="56" y2="46" stroke={SK} strokeWidth="5" strokeLinecap="round" />
      <line x1="38" y1="52" x2="30" y2="72" stroke={color} strokeWidth="8" strokeLinecap="round" />
      <line x1="30" y1="72" x2="28" y2="90" stroke={color} strokeWidth="7" strokeLinecap="round" />
      <line x1="42" y1="52" x2="50" y2="72" stroke={color} strokeWidth="8" strokeLinecap="round" />
      <line x1="50" y1="72" x2="52" y2="90" stroke={color} strokeWidth="7" strokeLinecap="round" />
      <line x1="22" y1="90" x2="34" y2="90" stroke={SH} strokeWidth="5" strokeLinecap="round" />
      <line x1="46" y1="90" x2="58" y2="90" stroke={SH} strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

// ── Map + lookup ──────────────────────────────────────────────────────────────

const map: Record<string, (p: Props) => React.ReactElement> = {
  squat:            Squat,
  shoulderpress:    ShoulderPress,
  row:              Row,
  deadlift:         Deadlift,
  plank:            Plank,
  sideplank:        SidePlank,
  lunge:            Lunge,
  swing:            KettlebellSwing,
  goblet:           GobletSquat,
  chestpress:       ChestPress,
  mountainclimbers: MountainClimbers,
  pushup:           PushUp,
  run:              Run,
  walk:             Walk,
};

export function getExerciseKey(name: string): string {
  const n = name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (/goblet/.test(n))                              return "goblet";
  if (/sentadilla|squat/.test(n))                    return "squat";
  if (/press hombro|shoulder/.test(n))               return "shoulderpress";
  if (/remo|bent.?row/.test(n))                      return "row";
  if (/peso muerto|deadlift/.test(n))                return "deadlift";
  if (/plancha lateral|side.?plank/.test(n))         return "sideplank";
  if (/plancha|plank/.test(n))                       return "plank";
  if (/estocada|lunge/.test(n))                      return "lunge";
  if (/swing|kettlebell|pesa rusa/.test(n))          return "swing";
  if (/press pecho|chest/.test(n))                   return "chestpress";
  if (/mountain.?climber/.test(n))                   return "mountainclimbers";
  if (/flexion|push.?up/.test(n))                    return "pushup";
  if (/trote|sprint/.test(n))                        return "run";
  if (/caminata|walk/.test(n))                       return "walk";
  return "standing";
}

export function ExerciseIllustration({ name, color = "#1B6B5B" }: { name: string; color?: string }) {
  const key  = getExerciseKey(name);
  const Comp = map[key] ?? Standing;
  return <Comp color={color} />;
}
