"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  api,
  type MetricsResponse,
  type EventsListResponse,
  type ApplicationsListResponse,
} from "@/lib/api";

/* ── R2 palette (ref: deck) ── */
const R2 = {
  bg: "#0C101B",
  bgPanel: "#141826",
  bgPanelHover: "#1B2030",
  border: "#222A3C",
  borderSubtle: "#1A2030",
  primary: "#2C9AFF",
  primaryDim: "#45A4FF",
  teal: "#38B7D2",
  orange: "#FE7D38",
  positive: "#22D47A",
  danger: "#F24E4E",
  textPrimary: "#FFFFFF",
  textSecondary: "#9BA4B6",
  textMuted: "#666E80",
};

const STEP_LABELS: Record<string, string> = {
  identity: "1. Identidad",
  consent: "2. Autorizaciones",
  offer1: "3. Oferta Buró",
  connections: "4. Conexiones digitales",
  offer2: "5. Oferta Social",
  fiscal: "6. Datos fiscales SAT",
  offer3: "7. Oferta Final",
};

type TabId = "overview" | "funnel" | "applications" | "events";

export default function MetricsDashboardPage() {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [events, setEvents] = useState<EventsListResponse | null>(null);
  const [applications, setApplications] =
    useState<ApplicationsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

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

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(load, 10_000);
    return () => clearInterval(t);
  }, [autoRefresh, load]);

  if (loading) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mb-3"
            style={{ borderColor: R2.primary, borderTopColor: "transparent" }}
          />
          <p className="text-[13px]" style={{ color: R2.textSecondary }}>
            Cargando métricas…
          </p>
        </div>
      </Shell>
    );
  }

  if (error || !metrics) {
    return (
      <Shell>
        <div
          className="max-w-2xl mx-auto mt-16 rounded-xl p-6"
          style={{
            background: R2.bgPanel,
            border: `1px solid ${R2.danger}`,
          }}
        >
          <p className="font-bold mb-1" style={{ color: R2.danger }}>
            No se pudieron cargar las métricas
          </p>
          <p className="text-[13px]" style={{ color: R2.textSecondary }}>
            {error ?? "Respuesta vacía del backend."}
          </p>
          <button
            onClick={load}
            className="mt-3 font-bold px-4 h-10 rounded-md text-[13px]"
            style={{ background: R2.primary, color: R2.textPrimary }}
          >
            Reintentar
          </button>
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
      />

      <Tabs active={activeTab} onChange={setActiveTab} />

      <div className="max-w-[1400px] mx-auto px-8 pb-12">
        {activeTab === "overview" && (
          <OverviewTab
            metrics={metrics}
            applications={applications}
          />
        )}
        {activeTab === "funnel" && <FunnelTab metrics={metrics} />}
        {activeTab === "applications" && (
          <ApplicationsTab data={applications} />
        )}
        {activeTab === "events" && <EventsTab data={events} />}
      </div>
    </Shell>
  );
}

/* ═════════════════════════════════════════════════════════════════════════
 * Layout primitives
 * ═════════════════════════════════════════════════════════════════════════ */

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen w-full">{children}</div>;
}

function Header({
  generatedAt,
  totalEvents,
  uniqueSessions,
  autoRefresh,
  onToggleAutoRefresh,
  onRefresh,
}: {
  generatedAt: string;
  totalEvents: number;
  uniqueSessions: number;
  autoRefresh: boolean;
  onToggleAutoRefresh: (v: boolean) => void;
  onRefresh: () => void;
}) {
  return (
    <header
      className="sticky top-0 z-10 backdrop-blur"
      style={{
        background: `${R2.bg}EE`,
        borderBottom: `1px solid ${R2.border}`,
      }}
    >
      <div className="max-w-[1400px] mx-auto px-8 py-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className="flex items-center gap-2 font-bold text-[18px] tracking-tight"
            style={{ color: R2.textPrimary }}
          >
            <div
              className="w-7 h-7 rounded flex items-center justify-center font-black text-[14px]"
              style={{ background: R2.primary, color: R2.bg }}
            >
              R2
            </div>
            <span>Full Revenue · Métricas</span>
          </div>
          <div
            className="hidden sm:flex items-center gap-4 text-[12px] ml-4 pl-4"
            style={{
              color: R2.textSecondary,
              borderLeft: `1px solid ${R2.border}`,
            }}
          >
            <span>
              <span className="font-mono">
                {totalEvents.toLocaleString("es-MX")}
              </span>{" "}
              eventos
            </span>
            <span>·</span>
            <span>
              <span className="font-mono">
                {uniqueSessions.toLocaleString("es-MX")}
              </span>{" "}
              sesiones únicas
            </span>
            <span>·</span>
            <span>
              {new Date(generatedAt).toLocaleTimeString("es-MX", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label
            className="inline-flex items-center gap-2 text-[12px] cursor-pointer"
            style={{ color: R2.textSecondary }}
          >
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => onToggleAutoRefresh(e.target.checked)}
              className="w-4 h-4"
              style={{ accentColor: R2.primary }}
            />
            Auto 10s
          </label>
          <button
            onClick={onRefresh}
            className="px-3 h-9 rounded-md text-[13px] font-medium transition-colors"
            style={{
              background: R2.bgPanel,
              color: R2.textPrimary,
              border: `1px solid ${R2.border}`,
            }}
          >
            Refrescar
          </button>
        </div>
      </div>
    </header>
  );
}

function Tabs({
  active,
  onChange,
}: {
  active: TabId;
  onChange: (id: TabId) => void;
}) {
  const tabs: Array<{ id: TabId; label: string }> = [
    { id: "overview", label: "Resumen" },
    { id: "funnel", label: "Embudo" },
    { id: "applications", label: "Aplicaciones" },
    { id: "events", label: "Eventos" },
  ];
  return (
    <nav
      style={{ borderBottom: `1px solid ${R2.border}` }}
      className="sticky z-[5]"
    >
      <div className="max-w-[1400px] mx-auto px-8 flex items-center gap-1">
        {tabs.map((t) => {
          const isActive = active === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className="relative h-12 px-4 text-[13px] font-medium transition-colors"
              style={{
                color: isActive ? R2.textPrimary : R2.textSecondary,
              }}
            >
              {t.label}
              {isActive && (
                <span
                  className="absolute left-0 right-0 bottom-0 h-[2px]"
                  style={{ background: R2.primary }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/* ═════════════════════════════════════════════════════════════════════════
 * Tabs
 * ═════════════════════════════════════════════════════════════════════════ */

function OverviewTab({
  metrics,
  applications,
}: {
  metrics: MetricsResponse;
  applications: ApplicationsListResponse | null;
}) {
  const bannerSessions = metrics.offers_page.banner_sessions_clicked;
  const cardSessions = metrics.offers_page.card_sessions_clicked;
  const totalClicks = bannerSessions + cardSessions;
  const bannerShare = totalClicks > 0 ? bannerSessions / totalClicks : 0;
  const cardShare = totalClicks > 0 ? cardSessions / totalClicks : 0;

  const applicationsSubmitted = applications?.applications.filter(
    (a) =>
      a.decision_status === "APPROVED" ||
      a.decision_status === "MANUAL_REVIEW" ||
      a.decision_status === "REJECTED"
  ).length ?? 0;

  return (
    <div className="mt-8 space-y-6">
      {/* KPIs top row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi
          label="Sesiones que vieron /offers"
          value={metrics.offers_page.total_sessions}
        />
        <Kpi
          label="Clicks banner Préstamo MÁS"
          value={bannerSessions}
          helper={
            totalClicks > 0 ? `${fmtPct(bannerShare)} del total` : "—"
          }
          accent={bannerShare > cardShare ? R2.primary : undefined}
        />
        <Kpi
          label="Clicks ofertas RBF"
          value={cardSessions}
          helper={totalClicks > 0 ? `${fmtPct(cardShare)} del total` : "—"}
          accent={cardShare > bannerShare ? R2.primary : undefined}
        />
        <Kpi
          label="Aplicaciones enviadas"
          value={applicationsSubmitted}
          helper={
            applications?.count
              ? `de ${applications.count} creadas`
              : undefined
          }
        />
      </div>

      {/* Banner vs Cards */}
      <Panel
        title="Interés: Banner vs Ofertas RBF"
        subtitle="Qué superficie clickean los usuarios cuando ven el feed."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ShareCard
            label="Banner Préstamo MÁS"
            value={bannerSessions}
            total={totalClicks}
            color={R2.primary}
          />
          <ShareCard
            label="Ofertas RBF (3 cards)"
            value={cardSessions}
            total={totalClicks}
            color={R2.teal}
          />
        </div>
        {Object.keys(metrics.offers_page.card_clicks_by_offer).length > 0 && (
          <div className="mt-5">
            <p
              className="text-[11px] font-bold uppercase tracking-wider mb-2"
              style={{ color: R2.textMuted }}
            >
              Click por oferta RBF
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {Object.entries(metrics.offers_page.card_clicks_by_offer).map(
                ([offerId, count]) => (
                  <div
                    key={offerId}
                    className="flex items-center justify-between rounded-md px-3 py-2"
                    style={{
                      background: R2.bgPanelHover,
                      border: `1px solid ${R2.borderSubtle}`,
                    }}
                  >
                    <span
                      className="text-[13px] font-mono"
                      style={{ color: R2.textSecondary }}
                    >
                      {offerId}
                    </span>
                    <span
                      className="text-[14px] font-bold"
                      style={{ color: R2.textPrimary }}
                    >
                      {count}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        )}
        <p
          className="text-[11px] mt-4"
          style={{ color: R2.textMuted }}
        >
          Banner CTR: {fmtPct(metrics.offers_page.banner_click_through_rate)}
        </p>
      </Panel>

      {/* Mini funnel preview */}
      <Panel
        title="Vista rápida del embudo"
        subtitle="Click en tab 'Embudo' para el desglose completo."
      >
        <FunnelChart funnel={metrics.funnel} />
      </Panel>
    </div>
  );
}

function FunnelTab({ metrics }: { metrics: MetricsResponse }) {
  return (
    <div className="mt-8 space-y-6">
      <Panel
        title="Embudo Préstamo MÁS"
        subtitle="Sesiones únicas que llegan a cada paso y la tasa de avance."
      >
        <FunnelChart funnel={metrics.funnel} detailed />
      </Panel>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Kpi
          label="Arrancaron el flow"
          value={metrics.form_started_sessions}
        />
        <Kpi label="Enviaron form" value={metrics.form_submitted_sessions} />
        <Kpi
          label="Completaron KYC"
          value={metrics.kyc_submitted_sessions}
          accent={R2.positive}
        />
      </div>

      <Panel
        title="Eventos totales por nombre"
        subtitle="Suma bruta de eventos disparados (no sesiones únicas)."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {Object.entries(metrics.events_by_name)
            .sort((a, b) => b[1] - a[1])
            .map(([name, count]) => (
              <div
                key={name}
                className="flex items-center justify-between rounded-md px-3 py-2"
                style={{
                  background: R2.bgPanelHover,
                  border: `1px solid ${R2.borderSubtle}`,
                }}
              >
                <span
                  className="font-mono text-[11px] truncate"
                  style={{ color: R2.textSecondary }}
                >
                  {name}
                </span>
                <span
                  className="font-bold text-[13px]"
                  style={{ color: R2.textPrimary }}
                >
                  {count}
                </span>
              </div>
            ))}
        </div>
      </Panel>
    </div>
  );
}

function ApplicationsTab({
  data,
}: {
  data: ApplicationsListResponse | null;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const apps = data?.applications ?? [];

  const stats = useMemo(() => {
    const byStatus: Record<string, number> = {};
    for (const a of apps) byStatus[a.decision_status] = (byStatus[a.decision_status] ?? 0) + 1;
    return byStatus;
  }, [apps]);

  return (
    <div className="mt-8 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Kpi label="Total aplicaciones" value={apps.length} compact />
        <Kpi
          label="Pending"
          value={stats["UNDERWRITING_PENDING"] ?? 0}
          compact
          accent={R2.teal}
        />
        <Kpi
          label="Approved"
          value={stats["APPROVED"] ?? 0}
          compact
          accent={R2.positive}
        />
        <Kpi
          label="Manual review"
          value={stats["MANUAL_REVIEW"] ?? 0}
          compact
          accent={R2.orange}
        />
        <Kpi
          label="Rejected"
          value={stats["REJECTED"] ?? 0}
          compact
          accent={R2.danger}
        />
      </div>

      <Panel
        title={`Aplicaciones registradas (${apps.length})`}
        subtitle="Data real capturada de cada merchant con resultados del underwriting."
      >
        {apps.length === 0 ? (
          <EmptyState text="Todavía no se registraron aplicaciones. Compartí el link y los merchants aparecerán acá." />
        ) : (
          <div className="overflow-auto">
            <table
              className="w-full text-[12px] border-collapse"
              style={{ color: R2.textSecondary }}
            >
              <thead>
                <tr
                  style={{
                    background: R2.bgPanelHover,
                    borderBottom: `1px solid ${R2.border}`,
                  }}
                >
                  <Th />
                  <Th>Fecha</Th>
                  <Th>ID</Th>
                  <Th>Email</Th>
                  <Th>RFC</Th>
                  <Th>Negocio</Th>
                  <Th>Teléfono</Th>
                  <Th>Estado</Th>
                  <Th className="text-right">Monto sugerido</Th>
                  <Th>KYC</Th>
                </tr>
              </thead>
              <tbody>
                {apps.map((a) => {
                  const form = (a.form_data ?? {}) as Record<string, unknown>;
                  const decision = (a.decision_payload ?? {}) as Record<
                    string,
                    unknown
                  >;
                  const isExpanded = expanded === a.id;
                  const amount =
                    decision.credit_offer &&
                    typeof (decision.credit_offer as Record<string, unknown>)
                      .approved_amount === "number"
                      ? (decision.credit_offer as { approved_amount: number })
                          .approved_amount
                      : null;
                  return (
                    <>
                      <tr
                        key={a.id}
                        className="cursor-pointer transition-colors"
                        style={{
                          borderBottom: `1px solid ${R2.borderSubtle}`,
                          background: isExpanded ? R2.bgPanelHover : undefined,
                        }}
                        onClick={() => setExpanded(isExpanded ? null : a.id)}
                      >
                        <Td>
                          <span
                            className="inline-block w-4 text-center transition-transform"
                            style={{
                              transform: isExpanded ? "rotate(90deg)" : "",
                              color: R2.textMuted,
                            }}
                          >
                            ▶
                          </span>
                        </Td>
                        <Td>
                          {new Date(a.created_at).toLocaleString("es-MX", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Td>
                        <Td>
                          <span className="font-mono" style={{ color: R2.textMuted }}>
                            {a.id.slice(0, 8)}
                          </span>
                        </Td>
                        <Td>
                          <span style={{ color: R2.textPrimary }}>
                            {(form.email as string) ?? "—"}
                          </span>
                        </Td>
                        <Td>
                          <span className="font-mono">
                            {(form.tax_id as string) ?? "—"}
                          </span>
                        </Td>
                        <Td>{(form.legal_name as string) ?? "—"}</Td>
                        <Td>
                          <span className="font-mono">
                            {(form.phone as string) ?? "—"}
                          </span>
                        </Td>
                        <Td>
                          <StatusBadge status={a.decision_status} />
                        </Td>
                        <Td className="text-right font-bold" style={{ color: R2.textPrimary }}>
                          {amount !== null
                            ? `$${amount.toLocaleString("es-MX")}`
                            : "—"}
                        </Td>
                        <Td>
                          {a.kyc_status ? (
                            <StatusBadge status={a.kyc_status} small />
                          ) : (
                            <span style={{ color: R2.textMuted }}>—</span>
                          )}
                        </Td>
                      </tr>
                      {isExpanded && (
                        <tr
                          key={`${a.id}-expanded`}
                          style={{
                            background: R2.bgPanel,
                            borderBottom: `1px solid ${R2.border}`,
                          }}
                        >
                          <td colSpan={10} className="p-0">
                            <ApplicationDetail app={a} />
                          </td>
                        </tr>
                      )}
                    </>
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

function ApplicationDetail({
  app,
}: {
  app: ApplicationsListResponse["applications"][number];
}) {
  const form = (app.form_data ?? {}) as Record<string, unknown>;
  const decision = (app.decision_payload ?? {}) as Record<string, unknown>;
  const places = (app.places_result ?? {}) as Record<string, unknown>;
  const facebook = (app.facebook_result ?? {}) as Record<string, unknown>;
  const instagram = (app.instagram_result ?? {}) as Record<string, unknown>;
  const twilio = (app.twilio_result ?? {}) as Record<string, unknown>;
  const bureau = (app.bureau_result ?? {}) as Record<string, unknown>;
  const platform = (app.platform_result ?? {}) as Record<string, unknown>;
  const syntage = (app.syntage_result ?? {}) as Record<string, unknown>;
  const kyc = (app.kyc_data ?? {}) as Record<string, unknown>;

  return (
    <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <DetailSection
        title="Datos del negocio"
        data={{
          email: form.email,
          legal_name: form.legal_name,
          rfc: form.tax_id,
          phone: form.phone,
          address: form.address,
          google_maps_url: form.google_business_url,
          consent_given: form.consent_given,
        }}
      />
      <DetailSection
        title="Decision engine"
        data={{
          status: app.decision_status,
          total_revenue: decision.total_revenue,
          threshold_used: decision.threshold_used,
          data_sources: decision.data_sources,
          credit_offer: decision.credit_offer,
          // Highlights por fuente — facilita lectura del analista
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
          twilio_call_forwarding: decision.twilio_call_forwarding,
          twilio_carrier_detail: decision.twilio_carrier_detail,
          twilio_number_tenure: decision.twilio_number_tenure,
          twilio_risk_score: decision.twilio_risk_score,
          twilio_risk_flags: decision.twilio_risk_flags,
          reason: decision.reason,
          decided_at: decision.decided_at,
        }}
      />
      <DetailSection title="Platform (Uber Eats)" data={platform} />
      <DetailSection title="Bureau" data={bureau} />
      <DetailSection title="Syntage / SAT" data={syntage} />
      <DetailSection title="Google Places" data={places} />
      <DetailSection title="Facebook" data={facebook} />
      <DetailSection title="Instagram" data={instagram} />
      <DetailSection title="Twilio" data={twilio} />
      {Object.keys(kyc).length > 0 && (
        <DetailSection title="KYC" data={kyc} className="md:col-span-2 lg:col-span-3" />
      )}
    </div>
  );
}

function DetailSection({
  title,
  data,
  className,
}: {
  title: string;
  data: Record<string, unknown>;
  className?: string;
}) {
  const keys = Object.keys(data).filter((k) => data[k] !== undefined);
  return (
    <div
      className={["rounded-lg p-3", className ?? ""].join(" ")}
      style={{
        background: R2.bgPanelHover,
        border: `1px solid ${R2.borderSubtle}`,
      }}
    >
      <p
        className="text-[10px] font-bold uppercase tracking-wider mb-2"
        style={{ color: R2.primary }}
      >
        {title}
      </p>
      {keys.length === 0 ? (
        <p className="text-[11px]" style={{ color: R2.textMuted }}>
          Sin datos
        </p>
      ) : (
        <dl className="space-y-1 text-[11px]">
          {keys.map((k) => {
            const v = data[k];
            const isComposite = isCompositeValue(v);
            return (
              <div
                key={k}
                className={isComposite ? "block" : "flex gap-2"}
              >
                <dt
                  className="font-mono flex-shrink-0"
                  style={{ color: R2.textMuted }}
                >
                  {k}
                </dt>
                <dd
                  className={[
                    "font-mono",
                    isComposite ? "mt-0.5 ml-3" : "break-all text-right ml-auto",
                  ].join(" ")}
                  style={{ color: R2.textPrimary }}
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

function isCompositeValue(v: unknown): boolean {
  if (Array.isArray(v)) {
    // Arrays de primitivos quedan inline; arrays de objetos se expanden
    return v.some((x) => typeof x === "object" && x !== null);
  }
  return v !== null && typeof v === "object";
}

function renderValue(v: unknown): ReactNode {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "✓" : "✗";
  if (typeof v === "number") return v.toLocaleString("es-MX");
  if (typeof v === "string") return v;
  // Arrays
  if (Array.isArray(v)) {
    if (v.length === 0) return "—";
    // Array de primitivos → inline comma-separated
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
    // Array de objetos → lista vertical compacta
    return (
      <ul className="space-y-1.5 list-none">
        {v.map((item, i) => (
          <li
            key={i}
            className="rounded p-1.5"
            style={{
              background: R2.bgPanel,
              border: `1px solid ${R2.borderSubtle}`,
            }}
          >
            {renderValue(item)}
          </li>
        ))}
      </ul>
    );
  }
  // Objeto → sub-dl key/value
  if (typeof v === "object") {
    const entries = Object.entries(v as Record<string, unknown>).filter(
      ([, val]) => val !== undefined
    );
    if (entries.length === 0) return "—";
    return (
      <dl className="space-y-0.5">
        {entries.map(([k, val]) => {
          const composite = isCompositeValue(val);
          return (
            <div
              key={k}
              className={composite ? "block" : "flex gap-2 justify-end"}
            >
              <dt style={{ color: R2.textMuted }}>{k}</dt>
              <dd
                className={composite ? "mt-0.5 ml-3" : "break-all text-right"}
                style={{ color: R2.textPrimary }}
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

function EventsTab({ data }: { data: EventsListResponse | null }) {
  const events = data?.events ?? [];
  return (
    <div className="mt-8 space-y-6">
      <Panel
        title={`Últimos ${events.length} eventos`}
        subtitle="Auditoría cronológica por evento — más recientes primero."
      >
        {events.length === 0 ? (
          <EmptyState text="No hay eventos todavía." />
        ) : (
          <div className="overflow-auto">
            <table
              className="w-full text-[12px]"
              style={{ color: R2.textSecondary }}
            >
              <thead>
                <tr
                  style={{
                    background: R2.bgPanelHover,
                    borderBottom: `1px solid ${R2.border}`,
                  }}
                >
                  <Th>Hora</Th>
                  <Th>Evento</Th>
                  <Th>Sesión</Th>
                  <Th>Metadata</Th>
                </tr>
              </thead>
              <tbody>
                {events.map((e, i) => {
                  const meta = e.metadata as
                    | Record<string, unknown>
                    | undefined;
                  const sid = (meta?.session_id as string | undefined) ?? "—";
                  const summary: string[] = [];
                  if (meta?.step) summary.push(`step=${meta.step}`);
                  if (meta?.offer_id)
                    summary.push(`offer=${meta.offer_id}`);
                  if (meta?.receive_amount)
                    summary.push(`amount=${meta.receive_amount}`);
                  return (
                    <tr
                      key={i}
                      style={{
                        borderBottom: `1px solid ${R2.borderSubtle}`,
                      }}
                    >
                      <Td>
                        <span className="font-mono">
                          {new Date(e.timestamp).toLocaleTimeString("es-MX")}
                        </span>
                      </Td>
                      <Td>
                        <span className="font-mono" style={{ color: R2.textPrimary }}>
                          {e.event_name}
                        </span>
                      </Td>
                      <Td>
                        <span
                          className="font-mono text-[11px]"
                          style={{ color: R2.textMuted }}
                        >
                          {sid.slice(0, 12)}
                        </span>
                      </Td>
                      <Td>
                        <span className="font-mono text-[11px]">
                          {summary.join(" · ") || "—"}
                        </span>
                      </Td>
                    </tr>
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

/* ═════════════════════════════════════════════════════════════════════════
 * Primitives
 * ═════════════════════════════════════════════════════════════════════════ */

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-xl p-6"
      style={{
        background: R2.bgPanel,
        border: `1px solid ${R2.border}`,
      }}
    >
      <div className="mb-4">
        <h2
          className="text-[18px] font-bold mb-1"
          style={{ color: R2.textPrimary }}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="text-[12px]" style={{ color: R2.textSecondary }}>
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

function Kpi({
  label,
  value,
  helper,
  compact,
  accent,
}: {
  label: string;
  value: number;
  helper?: string;
  compact?: boolean;
  accent?: string;
}) {
  return (
    <div
      className="rounded-xl relative overflow-hidden"
      style={{
        background: R2.bgPanel,
        border: `1px solid ${R2.border}`,
        padding: compact ? "12px 14px" : "18px 20px",
      }}
    >
      {accent && (
        <span
          className="absolute left-0 top-0 bottom-0 w-[3px]"
          style={{ background: accent }}
        />
      )}
      <p
        className="text-[11px] font-bold uppercase tracking-wider mb-1"
        style={{ color: R2.textMuted }}
      >
        {label}
      </p>
      <p
        className="font-bold leading-none"
        style={{
          color: R2.textPrimary,
          fontSize: compact ? "24px" : "32px",
        }}
      >
        {value.toLocaleString("es-MX")}
      </p>
      {helper && (
        <p className="text-[11px] mt-1" style={{ color: R2.textSecondary }}>
          {helper}
        </p>
      )}
    </div>
  );
}

function ShareCard({
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
    <div
      className="rounded-lg p-4"
      style={{
        background: R2.bgPanelHover,
        border: `1px solid ${R2.borderSubtle}`,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-[13px] font-bold"
          style={{ color: R2.textPrimary }}
        >
          {label}
        </span>
        <span className="text-[13px]" style={{ color: R2.textSecondary }}>
          <span className="font-bold" style={{ color: R2.textPrimary }}>
            {value}
          </span>
          {total > 0 && (
            <>
              {" · "}
              {pct.toFixed(1)}%
            </>
          )}
        </span>
      </div>
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ background: R2.border }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

function FunnelChart({
  funnel,
  detailed,
}: {
  funnel: MetricsResponse["funnel"];
  detailed?: boolean;
}) {
  const max = funnel[0]?.sessions_viewed ?? 0;
  return (
    <div className="space-y-3">
      {funnel.map((f, idx) => {
        const prev = idx > 0 ? funnel[idx - 1].sessions_viewed : null;
        const dropoff =
          prev !== null && prev > 0
            ? (prev - f.sessions_viewed) / prev
            : null;
        const pctOfMax = max > 0 ? (f.sessions_viewed / max) * 100 : 0;
        return (
          <div key={f.step}>
            <div className="flex items-center justify-between mb-1.5">
              <span
                className="text-[13px] font-bold"
                style={{ color: R2.textPrimary }}
              >
                {STEP_LABELS[f.step] ?? f.step}
              </span>
              <span
                className="text-[12px]"
                style={{ color: R2.textSecondary }}
              >
                <span className="font-mono">{f.sessions_viewed}</span> vistas
                {detailed && (
                  <>
                    {" · "}
                    <span className="font-mono">{f.sessions_completed}</span>{" "}
                    completaron
                  </>
                )}
                {" · "}
                <span
                  className="font-bold"
                  style={{ color: R2.primary }}
                >
                  {fmtPct(f.completion_rate)}
                </span>
                {dropoff !== null && dropoff > 0 && (
                  <span
                    className="ml-2 font-bold"
                    style={{ color: R2.danger }}
                  >
                    −{fmtPct(dropoff)}
                  </span>
                )}
              </span>
            </div>
            <div
              className="h-2.5 rounded-full overflow-hidden"
              style={{ background: R2.border }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${pctOfMax}%`,
                  background: `linear-gradient(90deg, ${R2.primary} 0%, ${R2.primaryDim} 100%)`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatusBadge({
  status,
  small,
}: {
  status: string;
  small?: boolean;
}) {
  const colorMap: Record<string, string> = {
    UNDERWRITING_PENDING: R2.teal,
    APPROVED: R2.positive,
    MANUAL_REVIEW: R2.orange,
    REJECTED: R2.danger,
    SUBMITTED: R2.primary,
  };
  const color = colorMap[status] ?? R2.textMuted;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full font-mono tracking-tight"
      style={{
        background: `${color}22`,
        color,
        border: `1px solid ${color}44`,
        padding: small ? "2px 8px" : "3px 10px",
        fontSize: small ? "10px" : "11px",
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: color }}
      />
      {status.replace(/_/g, " ").toLowerCase()}
    </span>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div
      className="text-center py-12 rounded-lg"
      style={{
        color: R2.textMuted,
        background: R2.bgPanelHover,
        border: `1px dashed ${R2.borderSubtle}`,
      }}
    >
      {text}
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
      className={[
        "text-left px-3 py-2 font-bold text-[11px] uppercase tracking-wider",
        className ?? "",
      ].join(" ")}
      style={{ color: R2.textMuted }}
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
      className={["px-3 py-2.5 whitespace-nowrap", className ?? ""].join(" ")}
      style={style}
    >
      {children}
    </td>
  );
}

function fmtPct(ratio: number): string {
  if (!isFinite(ratio) || isNaN(ratio)) return "—";
  return (ratio * 100).toFixed(1) + "%";
}
