"use client";

import { useCallback, useEffect, useState } from "react";
import {
  api,
  type MetricsResponse,
  type EventsListResponse,
} from "@/lib/api";

const STEP_LABELS: Record<string, string> = {
  identity: "1. Identidad",
  consent: "2. Autorizaciones",
  offer1: "3. Oferta Buró ($60k)",
  connections: "4. Conexiones digitales",
  offer2: "5. Oferta Social ($70k)",
  fiscal: "6. Datos fiscales SAT",
  offer3: "7. Oferta Final ($100k)",
};

function fmtPct(ratio: number): string {
  if (!isFinite(ratio) || isNaN(ratio)) return "—";
  return (ratio * 100).toFixed(1) + "%";
}

export default function MetricsDashboardPage() {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [events, setEvents] = useState<EventsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const load = useCallback(async () => {
    try {
      const [m, ev] = await Promise.all([
        api.getMetrics(),
        api.listEvents({ limit: 100 }),
      ]);
      setMetrics(m);
      setEvents(ev);
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
      <div className="max-w-[1200px] mx-auto px-8 py-16 text-center">
        <div className="inline-block w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-[14px] text-uber-gray-700">Cargando métricas…</p>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="max-w-[1200px] mx-auto px-8 py-16">
        <div className="bg-uber-danger-bg border border-uber-danger/30 rounded-card p-6 text-uber-danger text-[14px]">
          <p className="font-bold mb-1">No se pudieron cargar las métricas</p>
          <p>{error ?? "Respuesta vacía del backend."}</p>
          <button
            onClick={load}
            className="mt-3 bg-black text-white font-bold px-4 h-10 rounded-btn text-[14px]"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const bannerSessions = metrics.offers_page.banner_sessions_clicked;
  const cardSessions = metrics.offers_page.card_sessions_clicked;
  const totalClicks = bannerSessions + cardSessions;

  return (
    <div className="max-w-[1200px] mx-auto px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[40px] font-bold text-black leading-[1.1] tracking-tight mb-2">
            Métricas
          </h1>
          <p className="text-[14px] text-uber-gray-700">
            Actualizado:{" "}
            <span className="font-mono">
              {new Date(metrics.generated_at).toLocaleString("es-MX")}
            </span>{" "}
            · {metrics.total_events.toLocaleString("es-MX")} eventos ·{" "}
            {metrics.unique_sessions.toLocaleString("es-MX")} sesiones únicas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-2 text-[13px] text-uber-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 accent-black"
            />
            Auto-refresh 10s
          </label>
          <button
            onClick={load}
            className="border-2 border-black rounded-pill px-4 py-2 text-[14px] font-bold text-black hover:bg-uber-gray-100 transition-colors"
          >
            Refrescar
          </button>
        </div>
      </div>

      {/* KPIs top row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi
          label="Sesiones que vieron /offers"
          value={metrics.offers_page.total_sessions}
        />
        <Kpi
          label="Clickearon banner Préstamo MÁS"
          value={bannerSessions}
          helper={
            totalClicks > 0
              ? `${fmtPct(bannerSessions / totalClicks)} del share`
              : undefined
          }
        />
        <Kpi
          label="Clickearon una oferta RBF"
          value={cardSessions}
          helper={
            totalClicks > 0
              ? `${fmtPct(cardSessions / totalClicks)} del share`
              : undefined
          }
        />
        <Kpi
          label="Completaron KYC"
          value={metrics.kyc_submitted_sessions}
          helper={
            metrics.form_started_sessions > 0
              ? `${fmtPct(
                  metrics.kyc_submitted_sessions / metrics.form_started_sessions
                )} de los que arrancaron flow`
              : undefined
          }
        />
      </div>

      {/* Banner vs Cards comparison */}
      <Section
        title="Interés: Banner vs Ofertas RBF"
        subtitle="Qué clickearon los usuarios cuando vieron el feed. Mide la fuerza visual de cada superficie."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ShareCard
            label="Banner Préstamo MÁS"
            value={bannerSessions}
            total={totalClicks}
            accentClass="bg-black"
          />
          <ShareCard
            label="Ofertas RBF (cualquiera)"
            value={cardSessions}
            total={totalClicks}
            accentClass="bg-uber-green"
          />
        </div>
        {Object.keys(metrics.offers_page.card_clicks_by_offer).length > 0 && (
          <div className="mt-4">
            <p className="text-[12px] font-bold text-uber-gray-500 uppercase tracking-wider mb-2">
              Click por oferta RBF
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {Object.entries(metrics.offers_page.card_clicks_by_offer).map(
                ([offerId, count]) => (
                  <div
                    key={offerId}
                    className="bg-uber-gray-100 rounded-card px-3 py-2 flex items-center justify-between"
                  >
                    <span className="text-[14px] text-uber-gray-700">
                      {offerId}
                    </span>
                    <span className="text-[14px] font-bold text-black">
                      {count}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        )}
        <p className="text-[12px] text-uber-gray-500 mt-3">
          Banner CTR (sesiones): {fmtPct(metrics.offers_page.banner_click_through_rate)}
        </p>
      </Section>

      {/* Funnel Préstamo MÁS */}
      <Section
        title="Embudo Préstamo MÁS (sesiones únicas)"
        subtitle="Cuántas sesiones llegan a cada paso y cuántas avanzan."
      >
        <div className="space-y-2">
          {metrics.funnel.map((f, idx) => {
            const prev = idx > 0 ? metrics.funnel[idx - 1].sessions_viewed : null;
            const dropoff =
              prev !== null && prev > 0
                ? (prev - f.sessions_viewed) / prev
                : null;
            const pctOfMax =
              metrics.funnel[0].sessions_viewed > 0
                ? (f.sessions_viewed / metrics.funnel[0].sessions_viewed) * 100
                : 0;
            return (
              <div key={f.step}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[14px] font-bold text-black">
                    {STEP_LABELS[f.step] ?? f.step}
                  </span>
                  <span className="text-[13px] text-uber-gray-700">
                    {f.sessions_viewed} vistas ·{" "}
                    <span className="font-bold text-black">
                      {f.sessions_completed} completaron ({fmtPct(f.completion_rate)})
                    </span>
                    {dropoff !== null && dropoff > 0 && (
                      <span className="ml-2 text-uber-danger">
                        −{fmtPct(dropoff)} vs anterior
                      </span>
                    )}
                  </span>
                </div>
                <div className="h-2 bg-uber-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-black rounded-full transition-all"
                    style={{ width: `${pctOfMax}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-uber-gray-200">
          <Kpi
            label="Arrancaron flow"
            value={metrics.form_started_sessions}
            compact
          />
          <Kpi
            label="Enviaron form"
            value={metrics.form_submitted_sessions}
            compact
          />
          <Kpi
            label="Completaron KYC"
            value={metrics.kyc_submitted_sessions}
            compact
          />
        </div>
      </Section>

      {/* Events by name */}
      <Section
        title="Eventos totales por nombre"
        subtitle="Suma de eventos brutos (no de sesiones únicas)."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {Object.entries(metrics.events_by_name)
            .sort((a, b) => b[1] - a[1])
            .map(([name, count]) => (
              <div
                key={name}
                className="bg-uber-gray-100 rounded-card px-3 py-2 flex items-center justify-between"
              >
                <span className="font-mono text-[12px] text-uber-gray-700 truncate">
                  {name}
                </span>
                <span className="text-[14px] font-bold text-black">
                  {count}
                </span>
              </div>
            ))}
        </div>
      </Section>

      {/* Eventos recientes */}
      <Section
        title={`Últimos ${events?.count ?? 0} eventos`}
        subtitle="Auditoría cronológica."
      >
        <div className="overflow-auto border border-uber-gray-200 rounded-card">
          <table className="w-full text-[12px]">
            <thead className="bg-uber-gray-100 text-uber-gray-700">
              <tr>
                <th className="text-left px-3 py-2 font-bold">Hora</th>
                <th className="text-left px-3 py-2 font-bold">Evento</th>
                <th className="text-left px-3 py-2 font-bold">Sesión</th>
                <th className="text-left px-3 py-2 font-bold">Metadata</th>
              </tr>
            </thead>
            <tbody>
              {events?.events.slice(0, 80).map((e, i) => {
                const sid =
                  (e.metadata as { session_id?: string } | undefined)
                    ?.session_id ?? "—";
                const step =
                  (e.metadata as { step?: string } | undefined)?.step;
                const offerId =
                  (e.metadata as { offer_id?: string } | undefined)?.offer_id;
                const summary = [
                  step && `step=${step}`,
                  offerId && `offer=${offerId}`,
                ]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <tr
                    key={i}
                    className="border-t border-uber-gray-200 hover:bg-uber-gray-100"
                  >
                    <td className="px-3 py-2 font-mono whitespace-nowrap text-uber-gray-700">
                      {new Date(e.timestamp).toLocaleTimeString("es-MX")}
                    </td>
                    <td className="px-3 py-2 font-mono">{e.event_name}</td>
                    <td className="px-3 py-2 font-mono text-uber-gray-500">
                      {sid.slice(0, 12)}
                    </td>
                    <td className="px-3 py-2 text-uber-gray-700">
                      {summary || "—"}
                    </td>
                  </tr>
                );
              })}
              {(!events || events.events.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-uber-gray-500">
                    Todavía no hay eventos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white border border-uber-gray-200 rounded-card p-6">
      <div className="mb-5">
        <h2 className="text-h2 text-black mb-1">{title}</h2>
        {subtitle && <p className="text-[14px] text-uber-gray-700">{subtitle}</p>}
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
}: {
  label: string;
  value: number;
  helper?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={[
        "bg-white border border-uber-gray-200 rounded-card",
        compact ? "p-3" : "p-4",
      ].join(" ")}
    >
      <p className="text-[12px] font-bold text-uber-gray-500 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p
        className={[
          "font-bold text-black leading-none",
          compact ? "text-[24px]" : "text-[32px]",
        ].join(" ")}
      >
        {value.toLocaleString("es-MX")}
      </p>
      {helper && (
        <p className="text-[12px] text-uber-gray-700 mt-1">{helper}</p>
      )}
    </div>
  );
}

function ShareCard({
  label,
  value,
  total,
  accentClass,
}: {
  label: string;
  value: number;
  total: number;
  accentClass: string;
}) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="border border-uber-gray-200 rounded-card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[14px] font-bold text-black">{label}</span>
        <span className="text-[14px] text-uber-gray-700">
          <span className="font-bold text-black">{value}</span>
          {total > 0 && (
            <>
              {" "}
              · {pct.toFixed(1)}%
            </>
          )}
        </span>
      </div>
      <div className="h-2 bg-uber-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${accentClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
