"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  api,
  type MetricsResponse,
  type EventsListResponse,
  type ApplicationsListResponse,
} from "@/lib/api";

/* ── Design tokens ─────────────────────────────────────────────────── */
const C = {
  bg: "#07090F",
  panel: "#0D1117",
  panelHover: "#111827",
  panelActive: "#162032",
  border: "#1F2937",
  borderSubtle: "#111827",
  blue: "#3B82F6",
  blueLight: "#60A5FA",
  teal: "#06B6D4",
  green: "#10B981",
  amber: "#F59E0B",
  red: "#EF4444",
  purple: "#8B5CF6",
  text: "#F9FAFB",
  textSub: "#9CA3AF",
  textMuted: "#4B5563",
};

const STEP_META: Record<string, { label: string }> = {
  identity:    { label: "Identidad" },
  consent:     { label: "Autorizaciones" },
  offer1:      { label: "Oferta Buró" },
  connections: { label: "Conexiones digitales" },
  offer2:      { label: "Oferta Social" },
  fiscal:      { label: "Datos fiscales SAT" },
  offer3:      { label: "Oferta Final" },
};

const EVENT_COLORS: Record<string, string> = {
  page_viewed:        C.blue,
  banner_clicked:     C.teal,
  card_clicked:       C.purple,
  form_started:       C.green,
  step_viewed:        C.blue,
  step_completed:     C.green,
  form_submitted:     C.teal,
  kyc_submitted:      C.green,
  application_created: C.blue,
};

function getEventColor(name: string): string {
  for (const [key, color] of Object.entries(EVENT_COLORS)) {
    if (name.includes(key)) return color;
  }
  return C.textMuted;
}

type TabId = "overview" | "funnel" | "applications" | "events";

/* ═══════════════════════════════════════════════════════════════════
 * Page
 * ═══════════════════════════════════════════════════════════════════ */
export default function MetricsDashboardPage() {
  const [metrics, setMetrics]           = useState<MetricsResponse | null>(null);
  const [events, setEvents]             = useState<EventsListResponse | null>(null);
  const [applications, setApplications] = useState<ApplicationsListResponse | null>(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh]   = useState(true);
  const [activeTab, setActiveTab]       = useState<TabId>("overview");
  const [secondsSince, setSecondsSince] = useState(0);

  const load = useCallback(async () => {
    try {
      const [m, ev, apps] = await Promise.all([
        api.getMetrics(),
        api.listEvents({ limit: 200 }),
        api.listApplications(500),
      ]);
      setMetrics(m);
      setEvents(ev);
      setApplications(apps);
      setError(null);
      setSecondsSince(0);
    } catch (err) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Error cargando métricas";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(load, 10_000);
    return () => clearInterval(t);
  }, [autoRefresh, load]);

  useEffect(() => {
    const t = setInterval(() => setSecondsSince((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  if (loading) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center min-h-screen gap-3">
          <div
            className="w-9 h-9 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: `${C.blue}60`, borderTopColor: C.blue }}
          />
          <p className="text-[13px]" style={{ color: C.textSub }}>
            Cargando métricas…
          </p>
        </div>
      </Shell>
    );
  }

  if (error || !metrics) {
    return (
      <Shell>
        <div className="flex items-center justify-center min-h-screen px-4">
          <div
            className="max-w-sm w-full rounded-xl p-6"
            style={{ background: C.panel, border: `1px solid ${C.red}40` }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full" style={{ background: C.red }} />
              <span className="font-bold text-[14px]" style={{ color: C.red }}>
                Error de conexión
              </span>
            </div>
            <p className="text-[13px] mb-4" style={{ color: C.textSub }}>
              {error ?? "Respuesta vacía del backend."}
            </p>
            <button
              onClick={load}
              className="h-9 px-4 rounded-lg text-[13px] font-semibold transition-opacity hover:opacity-90"
              style={{ background: C.blue, color: "#fff" }}
            >
              Reintentar
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <Header
        generatedAt={metrics.generated_at}
        totalEvents={metrics.total_events}
        uniqueSessions={metrics.unique_sessions}
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={setAutoRefresh}
        onRefresh={load}
        secondsSince={secondsSince}
      />
      <Tabs active={activeTab} onChange={setActiveTab} />
      <div className="max-w-[1400px] mx-auto px-6 md:px-8 pb-16 pt-6">
        {activeTab === "overview"      && <OverviewTab      metrics={metrics} applications={applications} />}
        {activeTab === "funnel"        && <FunnelTab        metrics={metrics} />}
        {activeTab === "applications"  && <ApplicationsTab  data={applications} />}
        {activeTab === "events"        && <EventsTab        data={events} />}
      </div>
    </Shell>
  );
}

/* ═══════════════════════════════════════════════════════════════════
 * Shell
 * ═══════════════════════════════════════════════════════════════════ */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen w-full"
      style={{
        background: C.bg,
        backgroundImage: `
          radial-gradient(ellipse at 15% 0%, rgba(59,130,246,0.07) 0%, transparent 55%),
          radial-gradient(ellipse at 85% 0%, rgba(6,182,212,0.05) 0%, transparent 50%)
        `,
      }}
    >
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
 * Header
 * ═══════════════════════════════════════════════════════════════════ */
function Header({
  generatedAt,
  totalEvents,
  uniqueSessions,
  autoRefresh,
  onToggleAutoRefresh,
  onRefresh,
  secondsSince,
}: {
  generatedAt: string;
  totalEvents: number;
  uniqueSessions: number;
  autoRefresh: boolean;
  onToggleAutoRefresh: (v: boolean) => void;
  onRefresh: () => void;
  secondsSince: number;
}) {
  void generatedAt;
  return (
    <header
      className="sticky top-0 z-20"
      style={{
        background: `${C.bg}F2`,
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-8 h-14 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-[12px]"
              style={{
                background: `linear-gradient(135deg, ${C.blue}, ${C.teal})`,
                color: "#fff",
              }}
            >
              R2
            </div>
            <span className="font-bold text-[15px] tracking-tight" style={{ color: C.text }}>
              Full Revenue
            </span>
            <span className="text-[13px]" style={{ color: C.textMuted }}>/ Métricas</span>
          </div>

          <div
            className="hidden md:flex items-center gap-4 pl-5 text-[12px]"
            style={{ borderLeft: `1px solid ${C.border}`, color: C.textSub }}
          >
            {/* Live pulse */}
            {autoRefresh && (
              <div className="flex items-center gap-1.5">
                <span className="relative flex w-2 h-2">
                  <span
                    className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                    style={{ background: C.green }}
                  />
                  <span
                    className="relative inline-flex rounded-full w-2 h-2"
                    style={{ background: C.green }}
                  />
                </span>
                <span className="font-semibold text-[11px]" style={{ color: C.green }}>
                  LIVE
                </span>
              </div>
            )}
            <span>
              <span className="font-mono font-bold" style={{ color: C.text }}>
                {totalEvents.toLocaleString("es-MX")}
              </span>{" "}
              eventos
            </span>
            <span>
              <span className="font-mono font-bold" style={{ color: C.text }}>
                {uniqueSessions.toLocaleString("es-MX")}
              </span>{" "}
              sesiones
            </span>
            <span className="text-[11px]" style={{ color: C.textMuted }}>
              {secondsSince < 8 ? "recién actualizado" : `hace ${secondsSince}s`}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Toggle switch */}
          <label className="hidden sm:flex items-center gap-2 text-[12px] cursor-pointer select-none"
            style={{ color: C.textSub }}>
            <div
              className="relative w-8 h-4 rounded-full cursor-pointer transition-colors duration-200"
              style={{ background: autoRefresh ? C.blue : C.border }}
              onClick={() => onToggleAutoRefresh(!autoRefresh)}
            >
              <div
                className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all duration-200"
                style={{ left: autoRefresh ? "17px" : "2px" }}
              />
            </div>
            Auto
          </label>

          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-[12px] font-medium transition-opacity hover:opacity-80"
            style={{
              background: C.panelHover,
              color: C.textSub,
              border: `1px solid ${C.border}`,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M1 8a7 7 0 1 0 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M1 2v6h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Refrescar
          </button>
        </div>
      </div>
    </header>
  );
}

/* ═══════════════════════════════════════════════════════════════════
 * Tabs
 * ═══════════════════════════════════════════════════════════════════ */
function Tabs({ active, onChange }: { active: TabId; onChange: (id: TabId) => void }) {
  const tabs: Array<{ id: TabId; label: string }> = [
    { id: "overview",      label: "Resumen" },
    { id: "funnel",        label: "Embudo" },
    { id: "applications",  label: "Aplicaciones" },
    { id: "events",        label: "Eventos" },
  ];
  return (
    <nav style={{ borderBottom: `1px solid ${C.border}` }}>
      <div className="max-w-[1400px] mx-auto px-6 md:px-8 flex items-center">
        {tabs.map((t) => {
          const isActive = active === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className="relative h-11 px-4 text-[13px] font-medium transition-colors"
              style={{ color: isActive ? C.text : C.textSub }}
            >
              {t.label}
              {isActive && (
                <span
                  className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full"
                  style={{ background: `linear-gradient(90deg, ${C.blue}, ${C.teal})` }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/* ═══════════════════════════════════════════════════════════════════
 * Overview Tab
 * ═══════════════════════════════════════════════════════════════════ */
function OverviewTab({
  metrics,
  applications,
}: {
  metrics: MetricsResponse;
  applications: ApplicationsListResponse | null;
}) {
  const bannerSessions = metrics.offers_page.banner_sessions_clicked;
  const cardSessions   = metrics.offers_page.card_sessions_clicked;
  const totalClicks    = bannerSessions + cardSessions;
  const bannerShare    = totalClicks > 0 ? bannerSessions / totalClicks : 0;
  const cardShare      = totalClicks > 0 ? cardSessions / totalClicks : 0;

  const apps = applications?.applications ?? [];
  const submitted = apps.filter((a) =>
    ["APPROVED", "MANUAL_REVIEW", "REJECTED"].includes(a.decision_status)
  ).length;

  const offerViews        = metrics.offers_page.total_sessions;
  const overallConversion = offerViews > 0 ? submitted / offerViews : 0;

  return (
    <div className="space-y-5">
      {/* ── North Star ─────────────────────────── */}
      <div
        className="rounded-xl p-6 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${C.blue}18 0%, ${C.teal}08 100%)`,
          border: `1px solid ${C.blue}30`,
        }}
      >
        {/* BG glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 100% 50%, ${C.blue}08, transparent 60%)`,
          }}
        />
        <div className="relative flex flex-wrap items-center gap-x-12 gap-y-5">
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-widest mb-1"
              style={{ color: C.blue }}
            >
              Conversión total del funnel
            </p>
            <p
              className="font-black leading-none"
              style={{ color: C.text, fontSize: "56px", letterSpacing: "-0.03em" }}
            >
              {fmtPct(overallConversion)}
            </p>
            <p className="text-[12px] mt-2" style={{ color: C.textSub }}>
              {offerViews} vistas de oferta → {submitted} aplicaciones enviadas
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <ConvStep label="Vieron oferta" value={offerViews} />
            <ChevronRight />
            <ConvStep label="Clickearon" value={totalClicks} prev={offerViews} />
            <ChevronRight />
            <ConvStep label="Aplicaron" value={apps.length} prev={totalClicks} />
            <ChevronRight />
            <ConvStep label="Enviaron" value={submitted} prev={apps.length} color={C.green} />
          </div>
        </div>
      </div>

      {/* ── KPI row ──────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Sesiones en /offers"      value={offerViews}     />
        <KpiCard label="Clicks banner MÁS"        value={bannerSessions}
          helper={totalClicks > 0 ? `${fmtPct(bannerShare)} del total` : undefined}
          accent={C.blue} />
        <KpiCard label="Clicks ofertas RBF"       value={cardSessions}
          helper={totalClicks > 0 ? `${fmtPct(cardShare)} del total` : undefined}
          accent={C.teal} />
        <KpiCard label="Aplicaciones enviadas"    value={submitted}
          helper={apps.length > 0 ? `de ${apps.length} creadas` : undefined}
          accent={C.green} />
      </div>

      {/* ── Bottom row ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Panel title="Interés por superficie" subtitle="Dónde clickean los usuarios en /offers">
          <div className="space-y-4 mt-1">
            <SurfaceBar label="Banner Financiamiento MÁS"  value={bannerSessions} total={totalClicks} color={C.blue} />
            <SurfaceBar label="Ofertas RBF (3 cards)" value={cardSessions}   total={totalClicks} color={C.teal} />
          </div>
          {Object.keys(metrics.offers_page.card_clicks_by_offer).length > 0 && (
            <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: C.textMuted }}>
                Clicks por oferta RBF
              </p>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(metrics.offers_page.card_clicks_by_offer).map(([id, count]) => (
                  <div
                    key={id}
                    className="rounded-lg px-3 py-2.5 text-center"
                    style={{ background: C.panelHover, border: `1px solid ${C.border}` }}
                  >
                    <p className="font-mono text-[11px] mb-0.5" style={{ color: C.textSub }}>{id}</p>
                    <p className="font-bold text-[22px] leading-none" style={{ color: C.text }}>{count}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <p className="text-[11px] mt-4" style={{ color: C.textMuted }}>
            Banner CTR:{" "}
            <span className="font-mono font-bold" style={{ color: C.textSub }}>
              {fmtPct(metrics.offers_page.banner_click_through_rate)}
            </span>
          </p>
        </Panel>

        <Panel title="Vista rápida del embudo" subtitle="Sesiones y tasa de completado por paso">
          <MiniStepsBar funnel={metrics.funnel} />
        </Panel>
      </div>
    </div>
  );
}

function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M4 2.5l5 4.5-5 4.5" stroke={C.textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ConvStep({
  label,
  value,
  prev,
  color,
}: {
  label: string;
  value: number;
  prev?: number;
  color?: string;
}) {
  const rate = prev != null && prev > 0 ? value / prev : null;
  const rateColor = rate == null ? undefined : rate > 0.5 ? C.green : rate > 0.2 ? C.amber : C.red;
  return (
    <div className="text-center">
      <p className="text-[10px] mb-1" style={{ color: C.textSub }}>{label}</p>
      <p
        className="font-black leading-none"
        style={{ color: color ?? C.text, fontSize: "24px", letterSpacing: "-0.02em" }}
      >
        {value.toLocaleString("es-MX")}
      </p>
      {rate !== null && (
        <p className="text-[10px] font-mono font-bold mt-0.5" style={{ color: rateColor }}>
          {fmtPct(rate)}
        </p>
      )}
    </div>
  );
}

function SurfaceBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[13px] font-medium" style={{ color: C.text }}>{label}</span>
        <span>
          <span className="font-bold font-mono text-[14px]" style={{ color: C.text }}>{value}</span>
          {total > 0 && (
            <span className="ml-2 text-[11px]" style={{ color: C.textSub }}>{pct.toFixed(0)}%</span>
          )}
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: C.border }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}90)` }}
        />
      </div>
    </div>
  );
}

function MiniStepsBar({ funnel }: { funnel: MetricsResponse["funnel"] }) {
  const max = funnel[0]?.sessions_viewed ?? 1;
  return (
    <div className="space-y-3 mt-2">
      {funnel.map((f, idx) => {
        const pct   = max > 0 ? (f.sessions_viewed / max) * 100 : 0;
        const color = f.completion_rate >= 0.7 ? C.green : f.completion_rate >= 0.4 ? C.amber : C.red;
        const prev  = idx > 0 ? funnel[idx - 1].sessions_viewed : null;
        const drop  = prev != null && prev > 0 ? (prev - f.sessions_viewed) / prev : null;
        return (
          <div key={f.step}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[12px]" style={{ color: C.textSub }}>
                {idx + 1}. {STEP_META[f.step]?.label ?? f.step}
              </span>
              <div className="flex items-center gap-3">
                {drop != null && drop > 0.01 && (
                  <span className="text-[10px] font-mono font-bold" style={{ color: C.red }}>
                    −{fmtPct(drop)}
                  </span>
                )}
                <span className="font-mono text-[12px] font-bold" style={{ color: C.text }}>
                  {f.sessions_viewed}
                </span>
                <span className="font-mono text-[11px] font-bold w-10 text-right" style={{ color }}>
                  {fmtPct(f.completion_rate)}
                </span>
              </div>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: C.border }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
 * Funnel Tab
 * ═══════════════════════════════════════════════════════════════════ */
function FunnelTab({ metrics }: { metrics: MetricsResponse }) {
  const { funnel } = metrics;
  const startSessions = funnel[0]?.sessions_viewed ?? 0;
  const lastStep      = funnel[funnel.length - 1];
  const endSessions   = lastStep?.sessions_completed ?? 0;
  const overallRate   = startSessions > 0 ? endSessions / startSessions : 0;

  return (
    <div className="space-y-5">
      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <KpiCard label="Arrancaron el flow"    value={metrics.form_started_sessions}   accent={C.blue} />
        <KpiCard label="Enviaron formulario"   value={metrics.form_submitted_sessions} accent={C.teal} />
        <KpiCard label="Completaron KYC"       value={metrics.kyc_submitted_sessions}  accent={C.green} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Funnel */}
        <div className="lg:col-span-2">
          <Panel
            title="Embudo de conversión"
            subtitle={`Conversión total: ${fmtPct(overallRate)} · ${startSessions.toLocaleString()} sesiones de entrada`}
          >
            <FunnelViz funnel={funnel} />
          </Panel>
        </div>

        {/* Event frequency */}
        <Panel title="Eventos por nombre" subtitle="Frecuencia total de eventos disparados">
          <div className="space-y-2 mt-2">
            {Object.entries(metrics.events_by_name)
              .sort((a, b) => b[1] - a[1])
              .map(([name, count]) => {
                const maxCount = Math.max(...Object.values(metrics.events_by_name));
                const pct      = maxCount > 0 ? (count / maxCount) * 100 : 0;
                const color    = getEventColor(name);
                return (
                  <div key={name}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span
                        className="font-mono text-[11px] truncate"
                        style={{ color: C.textSub, maxWidth: "72%" }}
                      >
                        {name}
                      </span>
                      <span className="font-bold font-mono text-[12px]" style={{ color: C.text }}>
                        {count}
                      </span>
                    </div>
                    <div className="h-1 rounded-full" style={{ background: C.border }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function FunnelViz({ funnel }: { funnel: MetricsResponse["funnel"] }) {
  const maxSessions = funnel[0]?.sessions_viewed ?? 1;
  const STEP_H  = 56;
  const GAP_H   = 28;
  const VW      = 600;
  const MAX_W   = VW * 0.86;
  const MIN_W   = VW * 0.18;
  const totalH  = funnel.length * STEP_H + (funnel.length - 1) * GAP_H;

  const getW = (n: number) => MIN_W + (n / maxSessions) * (MAX_W - MIN_W);
  const getRateColor = (r: number) => (r >= 0.7 ? C.green : r >= 0.4 ? C.amber : C.red);

  return (
    <div className="mt-4 overflow-x-auto">
      <svg
        viewBox={`0 0 ${VW} ${totalH}`}
        className="w-full"
        style={{ height: totalH, minWidth: 320 }}
      >
        {funnel.map((f, idx) => {
          const y      = idx * (STEP_H + GAP_H);
          const w      = getW(f.sessions_viewed);
          const nextW  = idx < funnel.length - 1 ? getW(funnel[idx + 1].sessions_viewed) : w * 0.85;
          const x      = (VW - w) / 2;
          const nextX  = (VW - nextW) / 2;
          const color  = getRateColor(f.completion_rate);

          const trap   = `${x},${y} ${x + w},${y} ${nextX + nextW},${y + STEP_H} ${nextX},${y + STEP_H}`;

          const prev   = idx > 0 ? funnel[idx - 1].sessions_viewed : null;
          const drop   = prev != null && prev > 0 ? (prev - f.sessions_viewed) / prev : null;

          return (
            <g key={f.step}>
              {/* Drop-off badge */}
              {idx > 0 && drop != null && drop > 0.01 && (
                <g>
                  <rect
                    x={VW / 2 - 38}
                    y={y - GAP_H + 5}
                    width={76}
                    height={17}
                    rx={8}
                    fill={`${C.red}18`}
                    stroke={`${C.red}50`}
                  />
                  <text
                    x={VW / 2}
                    y={y - GAP_H + 16.5}
                    textAnchor="middle"
                    fontSize="10"
                    fill={C.red}
                    fontWeight="700"
                  >
                    −{(drop * 100).toFixed(0)}% drop-off
                  </text>
                </g>
              )}

              {/* Trapezoid */}
              <polygon
                points={trap}
                fill={`${color}12`}
                stroke={`${color}55`}
                strokeWidth="1"
              />

              {/* Step index badge */}
              <circle cx={x + 16} cy={y + STEP_H / 2} r={11} fill={`${color}20`} stroke={`${color}60`} />
              <text
                x={x + 16}
                y={y + STEP_H / 2 + 4}
                textAnchor="middle"
                fontSize="10"
                fill={color}
                fontWeight="700"
              >
                {idx + 1}
              </text>

              {/* Step label */}
              <text
                x={VW / 2}
                y={y + STEP_H / 2 - 7}
                textAnchor="middle"
                fontSize="12.5"
                fill={C.text}
                fontWeight="600"
              >
                {STEP_META[f.step]?.label ?? f.step}
              </text>

              {/* Sessions */}
              <text
                x={VW / 2}
                y={y + STEP_H / 2 + 10}
                textAnchor="middle"
                fontSize="11"
                fill={C.textSub}
              >
                {f.sessions_viewed.toLocaleString("es-MX")} sesiones · {f.sessions_completed} completaron
              </text>

              {/* Rate (top-right of trapezoid) */}
              <text
                x={x + w - 10}
                y={y + STEP_H / 2 + 4}
                textAnchor="end"
                fontSize="12"
                fill={color}
                fontWeight="700"
              >
                {fmtPct(f.completion_rate)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
 * Applications Tab
 * ═══════════════════════════════════════════════════════════════════ */
function ApplicationsTab({ data }: { data: ApplicationsListResponse | null }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter]     = useState<string>("all");
  const apps                    = data?.applications ?? [];

  const stats = useMemo(() => {
    const m: Record<string, number> = {};
    for (const a of apps) m[a.decision_status] = (m[a.decision_status] ?? 0) + 1;
    return m;
  }, [apps]);

  const statusConfig: Array<{ key: string; label: string; color: string }> = [
    { key: "APPROVED",             label: "Aprobadas",        color: C.green  },
    { key: "MANUAL_REVIEW",        label: "Revisión manual",  color: C.amber  },
    { key: "UNDERWRITING_PENDING", label: "Pendiente",        color: C.blue   },
    { key: "REJECTED",             label: "Rechazadas",       color: C.red    },
  ];

  const filtered = filter === "all" ? apps : apps.filter((a) => a.decision_status === filter);

  return (
    <div className="space-y-5">
      {/* Status tiles */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div
          className="col-span-2 md:col-span-1 rounded-xl p-4 cursor-pointer transition-all"
          onClick={() => setFilter("all")}
          style={{
            background: filter === "all" ? `${C.blue}18` : C.panel,
            border: `1px solid ${filter === "all" ? C.blue + "50" : C.border}`,
          }}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.textMuted }}>Total</p>
          <p className="font-black text-[40px] leading-none mt-2" style={{ color: C.text, letterSpacing: "-0.03em" }}>
            {apps.length}
          </p>
          <p className="text-[11px] mt-1" style={{ color: C.textSub }}>aplicaciones</p>
        </div>
        {statusConfig.map(({ key, label, color }) => (
          <div
            key={key}
            className="rounded-xl p-4 cursor-pointer transition-all"
            onClick={() => setFilter(filter === key ? "all" : key)}
            style={{
              background: filter === key ? `${color}15` : C.panel,
              border: `1px solid ${filter === key ? color + "50" : C.border}`,
            }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <span className="w-2 h-2 rounded-full" style={{ background: color }} />
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.textMuted }}>
                {label}
              </p>
            </div>
            <p
              className="font-black text-[32px] leading-none"
              style={{ color, letterSpacing: "-0.02em" }}
            >
              {(stats[key] ?? 0).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Distribution bar */}
      {apps.length > 0 && (
        <div className="rounded-xl p-4" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: C.textMuted }}>
            Distribución de estados
          </p>
          <div className="flex h-2.5 rounded-full overflow-hidden gap-px">
            {statusConfig.map(({ key, color }) => {
              const pct = apps.length > 0 ? ((stats[key] ?? 0) / apps.length) * 100 : 0;
              if (pct < 0.5) return null;
              return (
                <div
                  key={key}
                  className="h-full"
                  style={{ width: `${pct}%`, background: color, minWidth: 3 }}
                />
              );
            })}
          </div>
          <div className="flex flex-wrap gap-4 mt-2.5">
            {statusConfig.filter(({ key }) => (stats[key] ?? 0) > 0).map(({ key, label, color }) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                <span className="text-[11px]" style={{ color: C.textSub }}>
                  {label}: {fmtPct((stats[key] ?? 0) / apps.length)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <Panel
        title={`${filtered.length === apps.length ? "Todas las" : `${filtered.length} de ${apps.length}`} aplicaciones`}
        subtitle="Data real capturada de cada merchant con resultados del underwriting"
      >
        {apps.length === 0 ? (
          <EmptyState text="Todavía no se registraron aplicaciones. Compartí el link y los merchants aparecerán acá." />
        ) : (
          <div className="overflow-auto -mx-1 mt-1">
            <table className="w-full text-[12px] border-collapse" style={{ minWidth: 840 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  <Th />
                  <Th>Fecha</Th>
                  <Th>ID</Th>
                  <Th>Email / Negocio</Th>
                  <Th>RFC</Th>
                  <Th>Estado</Th>
                  <Th className="text-right">Monto</Th>
                  <Th>KYC</Th>
                  <Th>Fuentes</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => {
                  const form     = (a.form_data     ?? {}) as Record<string, unknown>;
                  const decision = (a.decision_payload ?? {}) as Record<string, unknown>;
                  const isExp    = expanded === a.id;
                  const amount   =
                    decision.credit_offer &&
                    typeof (decision.credit_offer as Record<string, unknown>).approved_amount === "number"
                      ? (decision.credit_offer as { approved_amount: number }).approved_amount
                      : null;

                  const hasBureau   = !!a.bureau_result   && Object.keys(a.bureau_result).length   > 0;
                  const hasGoogle   = !!a.places_result   && Object.keys(a.places_result).length   > 0;
                  const hasFacebook = !!a.facebook_result && Object.keys(a.facebook_result).length > 0;
                  const hasTwilio   = !!a.twilio_result   && Object.keys(a.twilio_result).length   > 0;

                  return (
                    <Fragment key={a.id}>
                      <tr
                        className="cursor-pointer"
                        style={{
                          borderBottom: `1px solid ${C.borderSubtle}`,
                          background: isExp ? C.panelHover : undefined,
                        }}
                        onClick={() => setExpanded(isExp ? null : a.id)}
                      >
                        <Td>
                          <svg
                            width="11"
                            height="11"
                            viewBox="0 0 12 12"
                            fill="none"
                            className="transition-transform"
                            style={{ transform: isExp ? "rotate(90deg)" : "", color: C.textMuted }}
                          >
                            <path d="M3.5 2l5 4-5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </Td>
                        <Td>
                          <span className="font-mono text-[11px]" style={{ color: C.textSub }}>
                            {new Date(a.created_at).toLocaleString("es-MX", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </Td>
                        <Td>
                          <span className="font-mono text-[10px]" style={{ color: C.textMuted }}>
                            {a.id.slice(0, 8)}
                          </span>
                        </Td>
                        <Td>
                          <div style={{ color: C.text }}>{(form.email as string) ?? "—"}</div>
                          {!!form.legal_name && (
                            <div className="text-[10px]" style={{ color: C.textMuted }}>
                              {form.legal_name as string}
                            </div>
                          )}
                        </Td>
                        <Td>
                          <span className="font-mono" style={{ color: C.textSub }}>
                            {(form.tax_id as string) ?? "—"}
                          </span>
                        </Td>
                        <Td>
                          <StatusBadge status={a.decision_status} />
                        </Td>
                        <Td className="text-right">
                          <span className="font-bold font-mono" style={{ color: amount ? C.text : C.textMuted }}>
                            {amount !== null ? `$${amount.toLocaleString("es-MX")}` : "—"}
                          </span>
                        </Td>
                        <Td>
                          {a.kyc_status ? (
                            <StatusBadge status={a.kyc_status} small />
                          ) : (
                            <span style={{ color: C.textMuted }}>—</span>
                          )}
                        </Td>
                        <Td>
                          <div className="flex gap-1">
                            {hasBureau   && <SourceDot label="B" color={C.purple} title="Bureau" />}
                            {hasGoogle   && <SourceDot label="G" color={C.blue}   title="Google Places" />}
                            {hasFacebook && <SourceDot label="F" color={C.teal}   title="Facebook" />}
                            {hasTwilio   && <SourceDot label="T" color={C.amber}  title="Twilio" />}
                          </div>
                        </Td>
                      </tr>
                      {isExp && (
                        <tr
                          style={{
                            background: C.panel,
                            borderBottom: `1px solid ${C.border}`,
                          }}
                        >
                          <td colSpan={9} className="p-0">
                            <ApplicationDetail app={a} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

function SourceDot({ label, color, title }: { label: string; color: string; title: string }) {
  return (
    <div
      className="w-5 h-5 rounded flex items-center justify-center font-bold"
      title={title}
      style={{
        fontSize: "9px",
        background: `${color}20`,
        color,
        border: `1px solid ${color}40`,
      }}
    >
      {label}
    </div>
  );
}

function ApplicationDetail({
  app,
}: {
  app: ApplicationsListResponse["applications"][number];
}) {
  const form     = (app.form_data      ?? {}) as Record<string, unknown>;
  const decision = (app.decision_payload ?? {}) as Record<string, unknown>;
  const places   = (app.places_result  ?? {}) as Record<string, unknown>;
  const facebook = (app.facebook_result ?? {}) as Record<string, unknown>;
  const instagram = (app.instagram_result ?? {}) as Record<string, unknown>;
  const twilio   = (app.twilio_result  ?? {}) as Record<string, unknown>;
  const bureau   = (app.bureau_result  ?? {}) as Record<string, unknown>;
  const platform = (app.platform_result ?? {}) as Record<string, unknown>;
  const syntage  = (app.syntage_result ?? {}) as Record<string, unknown>;
  const kyc      = (app.kyc_data       ?? {}) as Record<string, unknown>;

  return (
    <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      <DetailSection
        title="Datos del negocio"
        icon="🏪"
        data={{
          email: form.email,
          legal_name: form.legal_name,
          rfc: form.tax_id,
          phone: form.phone,
          address: form.address,
          google_maps_url: form.google_business_url,
        }}
      />
      <DetailSection
        title="Decision engine"
        icon="⚡"
        highlight
        data={{
          status: app.decision_status,
          bureau_score: decision.bureau_score,
          syntage_monthly_revenue: decision.syntage_monthly_revenue,
          syntage_tax_compliance: decision.syntage_tax_compliance,
          places_signals_score: decision.places_signals_score,
          places_rating: decision.places_rating,
          platform_gmv_6m: decision.platform_gmv_6m,
          platform_tenure_months: decision.platform_tenure_months,
          twilio_identity_match: decision.twilio_identity_match,
          twilio_whatsapp_business: decision.twilio_whatsapp_business,
          twilio_sim_swap_detected: decision.twilio_sim_swap_detected,
          twilio_risk_score: decision.twilio_risk_score,
          credit_offer: decision.credit_offer,
          reason: decision.reason,
        }}
      />
      <DetailSection title="Platform"      icon="🛵" data={platform} />
      <DetailSection title="Bureau"        icon="📋" data={bureau} />
      <DetailSection title="Syntage / SAT" icon="🧾" data={syntage} />
      <DetailSection title="Google Places" icon="📍" data={places} />
      <DetailSection title="Facebook"      icon="👥" data={facebook} />
      <DetailSection title="Instagram"     icon="📸" data={instagram} />
      <DetailSection title="Twilio"        icon="📱" data={twilio} />
      {Object.keys(kyc).length > 0 && (
        <DetailSection
          title="KYC"
          icon="🪪"
          data={kyc}
          className="md:col-span-2 lg:col-span-3"
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
 * Events Tab
 * ═══════════════════════════════════════════════════════════════════ */
function EventsTab({ data }: { data: EventsListResponse | null }) {
  const events = data?.events ?? [];
  return (
    <div className="space-y-5">
      <Panel
        title={`Stream de eventos · ${events.length} recientes`}
        subtitle="Actividad cronológica — más recientes primero"
      >
        {events.length === 0 ? (
          <EmptyState text="No hay eventos todavía." />
        ) : (
          <div className="mt-2">
            {events.map((e, i) => {
              const meta    = e.metadata as Record<string, unknown> | undefined;
              const sid     = (meta?.session_id as string | undefined) ?? "";
              const color   = getEventColor(e.event_name);
              const parts: string[] = [];
              if (meta?.step)           parts.push(`step=${meta.step}`);
              if (meta?.offer_id)       parts.push(`offer=${meta.offer_id}`);
              if (meta?.receive_amount) parts.push(`$${meta.receive_amount}`);

              return (
                <div
                  key={i}
                  className="flex items-start gap-4 py-3 px-2 rounded-lg"
                  style={{
                    borderBottom: i < events.length - 1 ? `1px solid ${C.borderSubtle}` : undefined,
                  }}
                >
                  {/* Timeline */}
                  <div className="flex flex-col items-center flex-shrink-0 pt-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                    {i < events.length - 1 && (
                      <div
                        className="w-px mt-1"
                        style={{ background: C.borderSubtle, height: 20 }}
                      />
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[12px] font-semibold" style={{ color }}>
                        {e.event_name}
                      </span>
                      {parts.length > 0 && (
                        <span
                          className="font-mono text-[10px] px-2 py-0.5 rounded"
                          style={{ background: C.panelHover, color: C.textSub }}
                        >
                          {parts.join(" · ")}
                        </span>
                      )}
                    </div>
                    {sid && (
                      <span className="font-mono text-[10px] mt-0.5 block" style={{ color: C.textMuted }}>
                        {sid.slice(0, 14)}
                      </span>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div className="flex-shrink-0 text-right">
                    <div className="font-mono text-[11px]" style={{ color: C.textMuted }}>
                      {new Date(e.timestamp).toLocaleTimeString("es-MX")}
                    </div>
                    <div className="font-mono text-[10px]" style={{ color: C.textMuted }}>
                      {new Date(e.timestamp).toLocaleDateString("es-MX", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
 * Shared primitives
 * ═══════════════════════════════════════════════════════════════════ */

function Panel({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={["rounded-xl p-5", className ?? ""].join(" ")}
      style={{ background: C.panel, border: `1px solid ${C.border}` }}
    >
      <div className="mb-4">
        <h2 className="text-[15px] font-bold" style={{ color: C.text }}>
          {title}
        </h2>
        {subtitle && (
          <p className="text-[12px] mt-0.5" style={{ color: C.textSub }}>
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

function KpiCard({
  label,
  value,
  helper,
  accent,
  compact,
}: {
  label: string;
  value: number;
  helper?: string;
  accent?: string;
  compact?: boolean;
}) {
  return (
    <div
      className="rounded-xl relative overflow-hidden"
      style={{
        background: C.panel,
        border: `1px solid ${accent ? accent + "30" : C.border}`,
        padding: compact ? "14px 16px" : "18px 20px",
        boxShadow: accent ? `0 0 28px ${accent}0D` : undefined,
      }}
    >
      {accent && (
        <>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse at 0% 50%, ${accent}08, transparent 65%)` }}
          />
          <div
            className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl"
            style={{ background: accent }}
          />
        </>
      )}
      <div className="relative">
        <p
          className="text-[10px] font-bold uppercase tracking-widest mb-2.5"
          style={{ color: C.textMuted }}
        >
          {label}
        </p>
        <p
          className="font-black leading-none"
          style={{
            color: accent ?? C.text,
            fontSize: compact ? "28px" : "36px",
            letterSpacing: "-0.025em",
          }}
        >
          {value.toLocaleString("es-MX")}
        </p>
        {helper && (
          <p className="text-[11px] mt-2 font-medium" style={{ color: C.textSub }}>
            {helper}
          </p>
        )}
      </div>
    </div>
  );
}

function DetailSection({
  title,
  icon,
  data,
  highlight,
  className,
}: {
  title: string;
  icon?: string;
  data: Record<string, unknown>;
  highlight?: boolean;
  className?: string;
}) {
  const keys = Object.keys(data).filter((k) => data[k] !== undefined);
  return (
    <div
      className={["rounded-lg p-3.5", className ?? ""].join(" ")}
      style={{
        background: C.panelHover,
        border: `1px solid ${highlight ? C.blue + "40" : C.borderSubtle}`,
      }}
    >
      <div className="flex items-center gap-1.5 mb-3">
        {icon && <span className="text-[13px]">{icon}</span>}
        <p
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: highlight ? C.blue : C.textMuted }}
        >
          {title}
        </p>
      </div>
      {keys.length === 0 ? (
        <p className="text-[11px]" style={{ color: C.textMuted }}>Sin datos</p>
      ) : (
        <dl className="space-y-1.5">
          {keys.map((k) => {
            const v      = data[k];
            const isComp = isCompositeValue(v);
            return (
              <div key={k} className={isComp ? "block" : "flex gap-2 items-start"}>
                <dt className="font-mono text-[10px] flex-shrink-0" style={{ color: C.textMuted }}>
                  {k}
                </dt>
                <dd
                  className={[
                    "font-mono text-[11px]",
                    isComp ? "mt-0.5 ml-3" : "text-right ml-auto break-all",
                  ].join(" ")}
                  style={{ color: C.text }}
                >
                  {renderValue(v)}
                </dd>
              </div>
            );
          })}
        </dl>
      )}
    </div>
  );
}

function StatusBadge({ status, small }: { status: string; small?: boolean }) {
  const cfg: Record<string, { color: string; label: string }> = {
    UNDERWRITING_PENDING: { color: C.blue,   label: "pendiente"  },
    APPROVED:             { color: C.green,  label: "aprobada"   },
    MANUAL_REVIEW:        { color: C.amber,  label: "revisión"   },
    REJECTED:             { color: C.red,    label: "rechazada"  },
    SUBMITTED:            { color: C.teal,   label: "enviada"    },
  };
  const { color, label } = cfg[status] ?? { color: C.textMuted, label: status.toLowerCase() };
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full font-semibold"
      style={{
        background: `${color}18`,
        color,
        border: `1px solid ${color}40`,
        padding: small ? "2px 8px" : "3px 10px",
        fontSize: small ? "10px" : "11px",
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div
      className="text-center py-16 rounded-xl"
      style={{ border: `1px dashed ${C.border}` }}
    >
      <div className="text-[32px] mb-3 opacity-20">◈</div>
      <p className="text-[13px] max-w-sm mx-auto" style={{ color: C.textMuted }}>
        {text}
      </p>
    </div>
  );
}

function Th({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={["text-left px-3 py-3 text-[10px] font-bold uppercase tracking-widest", className ?? ""].join(" ")}
      style={{ color: C.textMuted }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className,
  style,
}: {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <td
      className={["px-3 py-2.5 whitespace-nowrap align-middle", className ?? ""].join(" ")}
      style={style}
    >
      {children}
    </td>
  );
}

/* ═══════════════════════════════════════════════════════════════════
 * Value helpers
 * ═══════════════════════════════════════════════════════════════════ */

function isCompositeValue(v: unknown): boolean {
  if (Array.isArray(v)) return v.some((x) => typeof x === "object" && x !== null);
  return v !== null && typeof v === "object";
}

function renderValue(v: unknown): ReactNode {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean")
    return (
      <span style={{ color: v ? C.green : C.red }}>{v ? "✓ sí" : "✗ no"}</span>
    );
  if (typeof v === "number") return v.toLocaleString("es-MX");
  if (typeof v === "string") return v;
  if (Array.isArray(v)) {
    if (v.length === 0) return "—";
    if (v.every((x) => typeof x !== "object" || x === null)) {
      return v
        .map((x) =>
          x === null || x === undefined
            ? "—"
            : typeof x === "boolean"
            ? x ? "✓" : "✗"
            : typeof x === "number"
            ? x.toLocaleString("es-MX")
            : String(x)
        )
        .join(", ");
    }
    return (
      <ul className="space-y-1 list-none">
        {v.map((item, i) => (
          <li
            key={i}
            className="rounded p-1.5"
            style={{ background: C.panel, border: `1px solid ${C.borderSubtle}` }}
          >
            {renderValue(item)}
          </li>
        ))}
      </ul>
    );
  }
  if (typeof v === "object") {
    const entries = Object.entries(v as Record<string, unknown>).filter(
      ([, val]) => val !== undefined
    );
    if (entries.length === 0) return "—";
    return (
      <dl className="space-y-0.5">
        {entries.map(([k, val]) => {
          const comp = isCompositeValue(val);
          return (
            <div key={k} className={comp ? "block" : "flex gap-2 justify-end"}>
              <dt style={{ color: C.textMuted }}>{k}</dt>
              <dd
                className={comp ? "mt-0.5 ml-3 break-all" : "break-all text-right"}
                style={{ color: C.text }}
              >
                {renderValue(val)}
              </dd>
            </div>
          );
        })}
      </dl>
    );
  }
  return String(v);
}

function fmtPct(ratio: number): string {
  if (!isFinite(ratio) || isNaN(ratio)) return "—";
  return (ratio * 100).toFixed(1) + "%";
}
