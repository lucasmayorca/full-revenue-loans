"use client";

export type FlowStep =
  | "identity"     // 1. Datos del negocio
  | "consent"      // 2. Autorizaciones (buró + twilio)
  | "offer1"       // 3. Oferta inicial (1.5X)
  | "connections"  // 4. Google Maps + redes
  | "offer2"       // 5. Oferta ampliada (2X)
  | "fiscal"       // 6. Datos fiscales (RFC + CIEC)
  | "offer3";      // 7. Oferta máxima (4X)

export const STEP_ORDER: FlowStep[] = [
  "identity",
  "consent",
  "offer1",
  "connections",
  "offer2",
  "fiscal",
  "offer3",
];

// The 4 "data input" steps shown as numbered nodes
const ACTION_STEPS: { key: FlowStep; label: string }[] = [
  { key: "identity",    label: "Negocio"   },
  { key: "consent",     label: "Autorizar" },
  { key: "connections", label: "Digital"   },
  { key: "fiscal",      label: "Fiscal"    },
];

interface Props {
  current: FlowStep;
  onBack?: () => void;
  offerAmounts?: { bureau: number; social: number; fiscal: number };
}

function fmtK(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${Math.round(n / 1_000)}k`;
  return `$${n}`;
}

// Which action step number we're on (1-based, only counts data steps)
function getActionStepNum(current: FlowStep): number {
  const idx = STEP_ORDER.indexOf(current);
  // identity=0→1, consent=1→2, offer1=2→2, connections=3→3, offer2=4→3, fiscal=5→4, offer3=6→4
  if (idx <= 1) return idx + 1;
  if (idx <= 3) return idx;
  if (idx <= 5) return idx - 1;
  return 4;
}

export function GamifiedProgressBar({ current, onBack, offerAmounts }: Props) {
  const currentIdx = STEP_ORDER.indexOf(current);

  const bureauLabel = offerAmounts ? fmtK(offerAmounts.bureau) : "1.25x";
  const socialLabel = offerAmounts ? fmtK(offerAmounts.social) : "1.5x";
  const fiscalLabel = offerAmounts ? fmtK(offerAmounts.fiscal) : "3x";

  // State for each action node
  const getActionState = (key: FlowStep): "done" | "active" | "pending" => {
    const keyIdx = STEP_ORDER.indexOf(key);
    if (currentIdx > keyIdx) return "done";
    if (currentIdx === keyIdx) return "active";
    return "pending";
  };

  // Offer badges unlock as we pass their reveal step
  const offer1Unlocked = currentIdx >= STEP_ORDER.indexOf("offer1"); // ≥ 2
  const offer2Unlocked = currentIdx >= STEP_ORDER.indexOf("offer2"); // ≥ 4
  const offer3Unlocked = currentIdx >= STEP_ORDER.indexOf("offer3"); // ≥ 6

  // Connector fill: left half of badge area = action step done, right half = offer reveal done
  const c1Left  = currentIdx > 1;  // consent passed
  const c1Right = currentIdx > 2;  // offer1 passed
  const c2Left  = currentIdx > 3;  // connections passed
  const c2Right = currentIdx > 4;  // offer2 passed

  const actionStepNum = getActionStepNum(current);

  return (
    <div className="space-y-3">
      {/* Back button + step indicator */}
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="w-8 h-8 rounded-full bg-uber-gray-100 flex items-center justify-center text-uber-gray-700 hover:bg-uber-gray-200 transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"/>
            </svg>
          </button>
        )}
        <p className="text-xs text-uber-gray-500 font-medium">
          {current.startsWith("offer")
            ? "Oferta desbloqueada"
            : `Paso ${actionStepNum} de ${ACTION_STEPS.length}`}
        </p>
      </div>

      {/*
        Stepper layout:
        [①Negocio] ─── [②Autorizar] ─$X─ [③Digital] ─$X─ [④Fiscal] ─$X

        - Nodes: 4 action steps (numbered circles)
        - Between consent → connections: offer1 amount badge on the connector
        - Between connections → fiscal:  offer2 amount badge on the connector
        - After fiscal:                  offer3 amount badge (terminal)
      */}
      <div className="flex items-center w-full">

        {/* Node 1: identity */}
        <ActionNode num={1} label="Negocio" state={getActionState("identity")} />

        {/* Simple connector identity → consent */}
        <SimpleConnector done={currentIdx > 0} />

        {/* Node 2: consent */}
        <ActionNode num={2} label="Autorizar" state={getActionState("consent")} />

        {/* Badge connector consent → connections (shows offer1 amount) */}
        <BadgeConnector
          label={bureauLabel}
          unlocked={offer1Unlocked}
          leftDone={c1Left}
          rightDone={c1Right}
        />

        {/* Node 3: connections */}
        <ActionNode num={3} label="Digital" state={getActionState("connections")} />

        {/* Badge connector connections → fiscal (shows offer2 amount) */}
        <BadgeConnector
          label={socialLabel}
          unlocked={offer2Unlocked}
          leftDone={c2Left}
          rightDone={c2Right}
        />

        {/* Node 4: fiscal */}
        <ActionNode num={4} label="Fiscal" state={getActionState("fiscal")} />

        {/* Terminal badge: offer3 (final offer) */}
        <div className="flex flex-col items-center ml-1.5 flex-shrink-0">
          <div className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap transition-colors duration-300 ${
            offer3Unlocked
              ? "bg-uber-green text-black"
              : "bg-uber-gray-100 text-uber-gray-500"
          }`}>
            {fiscalLabel}
          </div>
          <p className="text-[7px] text-uber-gray-500 mt-0.5 text-center">máximo</p>
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="h-1 bg-uber-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-black rounded-full transition-all duration-700"
          style={{ width: `${(currentIdx / (STEP_ORDER.length - 1)) * 100}%` }}
        />
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ActionNode({
  num,
  label,
  state,
}: {
  num: number;
  label: string;
  state: "done" | "active" | "pending";
}) {
  return (
    <div className="flex flex-col items-center flex-shrink-0">
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
          state === "done"
            ? "bg-black text-white"
            : state === "active"
            ? "bg-black text-white ring-2 ring-black ring-offset-2"
            : "bg-uber-gray-200 text-uber-gray-500"
        }`}
      >
        {state === "done" ? (
          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
            <path
              d="M2 6l3 3 5-5"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <span className="text-[10px] font-bold">{num}</span>
        )}
      </div>
      <p
        className={`text-[8px] mt-0.5 font-medium text-center ${
          state === "pending" ? "text-uber-gray-500" : "text-black font-bold"
        }`}
      >
        {label}
      </p>
    </div>
  );
}

function SimpleConnector({ done }: { done: boolean }) {
  return (
    <div
      className={`flex-1 h-px min-w-[6px] transition-colors duration-500 ${
        done ? "bg-black" : "bg-uber-gray-200"
      }`}
    />
  );
}

function BadgeConnector({
  label,
  unlocked,
  leftDone,
  rightDone,
}: {
  label: string;
  unlocked: boolean;
  leftDone: boolean;
  rightDone: boolean;
}) {
  return (
    <div className="flex-[2] flex items-center min-w-0">
      {/* Left half of connector */}
      <div
        className={`flex-1 h-px transition-colors duration-500 ${
          leftDone ? "bg-black" : "bg-uber-gray-200"
        }`}
      />
      {/* Amount badge */}
      <div
        className={`mx-1 flex-shrink-0 text-[8px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap transition-all duration-300 ${
          unlocked
            ? "bg-black text-white"
            : "bg-uber-gray-100 text-uber-gray-500"
        }`}
      >
        {label}
      </div>
      {/* Right half of connector */}
      <div
        className={`flex-1 h-px transition-colors duration-500 ${
          rightDone ? "bg-black" : "bg-uber-gray-200"
        }`}
      />
    </div>
  );
}
