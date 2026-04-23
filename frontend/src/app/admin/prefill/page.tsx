"use client";

import { useEffect, useState } from "react";
import { api, type PrefillBulkResponse, type PrefillLinkResponse } from "@/lib/api";

const C = {
  bg: "#07090F",
  panel: "#0D1117",
  border: "#1F2937",
  blue: "#3B82F6",
  green: "#10B981",
  amber: "#F59E0B",
  red: "#EF4444",
  text: "#F9FAFB",
  textSub: "#9CA3AF",
};

const SAMPLE_CSV =
  "merchant_id,first_name,last_name,email,phone,curp,tax_id,legal_name,address,street,neighborhood,postal_code,city,state,clabe,bank_name,base_amount,offer1_amount,offer1_retention,offer1_total,offer1_fee,offer1_monthly,offer1_term,offer2_amount,offer2_retention,offer2_total,offer2_fee,offer2_monthly,offer2_term\n" +
  "rap_001,Paulina,Vega,paulina@mail.com,+525551234567,VECP850101MDFGRR08,VECP850101ABC,Paulina Vega Restaurantes SA,Av. Insurgentes 1500 Roma Norte CDMX 06700,Av. Insurgentes 1500,Roma Norte,06700,CDMX,CDMX,012345678901234567,BBVA,180000,180000,32.9,234000,54000,12000,6.3 meses,120000,24.9,150000,30000,8500,5 meses\n" +
  'rap_002,Carlos,Ramírez,carlos@mail.com,+525552345678,RACA790612HDFMRL05,RACA790612XYZ,Tacos Carlos SA,\"Calle 5 de Mayo 42, Centro, CDMX\",Calle 5 de Mayo 42,Centro,06010,CDMX,CDMX,,,75000,75000,28,93000,18000,8000,5 meses,,,,,,';

export default function AdminPrefillPage() {
  const [csv, setCsv] = useState("");
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [baseUrl, setBaseUrl] = useState("");
  const [result, setResult] = useState<PrefillBulkResponse | null>(null);
  const [existing, setExisting] = useState<PrefillLinkResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Inferir base URL del browser al montar
  useEffect(() => {
    if (typeof window !== "undefined") {
      setBaseUrl(window.location.origin);
    }
    void refresh();
  }, []);

  async function refresh() {
    try {
      const res = await api.listPrefillLinks(200);
      setExisting(res.links);
    } catch {
      /* ignore */
    }
  }

  async function handleSubmit() {
    setError(null);
    setResult(null);
    if (!csv.trim()) {
      setError("Pegá un CSV con headers en la primera fila.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.generatePrefillLinks(csv, {
        base_url: baseUrl || undefined,
        expires_in_days: expiresInDays,
      });
      setResult(res);
      await refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error generando links";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard(text: string, token: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 1500);
    } catch {
      /* ignore */
    }
  }

  async function copyAllUrls() {
    if (!result) return;
    const text = result.links.map((l) => `${l.merchant_id ?? ""}\t${l.url}`).join("\n");
    await navigator.clipboard.writeText(text);
    setCopiedToken("__all__");
    setTimeout(() => setCopiedToken(null), 1500);
  }

  function downloadCsv() {
    if (!result) return;
    const header = "merchant_id,token,url\n";
    const body = result.links
      .map((l) => `${l.merchant_id ?? ""},${l.token},${l.url}`)
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prefill-links-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, padding: 32 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
          Prefill Links
        </h1>
        <p style={{ color: C.textSub, fontSize: 14, marginBottom: 24 }}>
          Generá links personalizados con ofertas custom y campos pre-llenados
          para cada merchant. Pegá un CSV (headers en la primera fila) y apretá
          Generar.
        </p>

        {/* Config */}
        <div
          style={{
            background: C.panel,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 12, color: C.textSub, marginBottom: 4, display: "block" }}>
                Base URL (donde viven los links)
              </label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://full-revenue-frontend-zw22.vercel.app"
                style={{
                  width: "100%",
                  background: C.bg,
                  border: `1px solid ${C.border}`,
                  color: C.text,
                  padding: "8px 12px",
                  borderRadius: 6,
                  fontSize: 13,
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: C.textSub, marginBottom: 4, display: "block" }}>
                Expira en (días)
              </label>
              <input
                type="number"
                min={1}
                max={365}
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(parseInt(e.target.value, 10) || 30)}
                style={{
                  width: "100%",
                  background: C.bg,
                  border: `1px solid ${C.border}`,
                  color: C.text,
                  padding: "8px 12px",
                  borderRadius: 6,
                  fontSize: 13,
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <label style={{ fontSize: 12, color: C.textSub }}>CSV</label>
            <button
              type="button"
              onClick={() => setCsv(SAMPLE_CSV)}
              style={{
                background: "transparent",
                border: `1px solid ${C.border}`,
                color: C.textSub,
                padding: "4px 10px",
                borderRadius: 4,
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              Usar ejemplo
            </button>
          </div>
          <textarea
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            placeholder="merchant_id,first_name,last_name,email,phone,...,base_amount,offer1_amount,offer1_retention,..."
            rows={10}
            style={{
              width: "100%",
              background: C.bg,
              border: `1px solid ${C.border}`,
              color: C.text,
              padding: 12,
              borderRadius: 6,
              fontSize: 12,
              fontFamily: "ui-monospace, 'Courier New', monospace",
              resize: "vertical",
            }}
          />

          <div style={{ marginTop: 12, display: "flex", gap: 12 }}>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              style={{
                background: C.blue,
                color: "#fff",
                border: "none",
                padding: "10px 20px",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? "wait" : "pointer",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Generando..." : "Generar links"}
            </button>
          </div>

          {error && (
            <div
              style={{
                marginTop: 12,
                padding: 10,
                background: "rgba(239, 68, 68, 0.1)",
                border: `1px solid ${C.red}`,
                color: C.red,
                borderRadius: 6,
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}
        </div>

        {/* Result */}
        {result && (
          <div
            style={{
              background: C.panel,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: 20,
              marginBottom: 20,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 600 }}>Resultado</h2>
                <p style={{ fontSize: 13, color: C.textSub, marginTop: 4 }}>
                  <span style={{ color: C.green }}>{result.created}</span> creados
                  {" · "}
                  <span style={{ color: C.red }}>{result.errors.length}</span> errores
                  {" · "}
                  {result.total} filas totales
                </p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={copyAllUrls}
                  style={{
                    background: "transparent",
                    border: `1px solid ${C.border}`,
                    color: C.text,
                    padding: "6px 12px",
                    borderRadius: 6,
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  {copiedToken === "__all__" ? "¡Copiado!" : "Copiar todos"}
                </button>
                <button
                  type="button"
                  onClick={downloadCsv}
                  style={{
                    background: "transparent",
                    border: `1px solid ${C.border}`,
                    color: C.text,
                    padding: "6px 12px",
                    borderRadius: 6,
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Descargar CSV
                </button>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 13, color: C.red, marginBottom: 6 }}>Errores</h3>
                <ul style={{ fontSize: 12, color: C.textSub, paddingLeft: 20 }}>
                  {result.errors.map((e, i) => (
                    <li key={i}>Fila {e.row}: {e.error}</li>
                  ))}
                </ul>
              </div>
            )}

            <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ color: C.textSub, textAlign: "left" }}>
                  <th style={{ padding: "8px 6px", borderBottom: `1px solid ${C.border}` }}>Merchant</th>
                  <th style={{ padding: "8px 6px", borderBottom: `1px solid ${C.border}` }}>Token</th>
                  <th style={{ padding: "8px 6px", borderBottom: `1px solid ${C.border}` }}>URL</th>
                  <th style={{ padding: "8px 6px", borderBottom: `1px solid ${C.border}`, width: 80 }}></th>
                </tr>
              </thead>
              <tbody>
                {result.links.map((l) => (
                  <tr key={l.token}>
                    <td style={{ padding: "8px 6px", borderBottom: `1px solid ${C.border}` }}>
                      {l.merchant_id ?? "—"}
                    </td>
                    <td style={{ padding: "8px 6px", borderBottom: `1px solid ${C.border}`, fontFamily: "ui-monospace, monospace", color: C.amber }}>
                      {l.token}
                    </td>
                    <td style={{ padding: "8px 6px", borderBottom: `1px solid ${C.border}`, fontFamily: "ui-monospace, monospace", wordBreak: "break-all", color: C.textSub }}>
                      {l.url}
                    </td>
                    <td style={{ padding: "8px 6px", borderBottom: `1px solid ${C.border}` }}>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(l.url, l.token)}
                        style={{
                          background: C.blue,
                          color: "#fff",
                          border: "none",
                          padding: "4px 10px",
                          borderRadius: 4,
                          fontSize: 11,
                          cursor: "pointer",
                        }}
                      >
                        {copiedToken === l.token ? "✓" : "Copiar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Existing links */}
        {existing.length > 0 && (
          <div
            style={{
              background: C.panel,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: 20,
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
              Links existentes ({existing.length})
            </h2>
            <div style={{ maxHeight: 400, overflowY: "auto" }}>
              <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ color: C.textSub, textAlign: "left" }}>
                    <th style={{ padding: "8px 6px", borderBottom: `1px solid ${C.border}` }}>Merchant</th>
                    <th style={{ padding: "8px 6px", borderBottom: `1px solid ${C.border}` }}>Token</th>
                    <th style={{ padding: "8px 6px", borderBottom: `1px solid ${C.border}` }}>Base</th>
                    <th style={{ padding: "8px 6px", borderBottom: `1px solid ${C.border}` }}>Abierto</th>
                    <th style={{ padding: "8px 6px", borderBottom: `1px solid ${C.border}` }}>Usado</th>
                    <th style={{ padding: "8px 6px", borderBottom: `1px solid ${C.border}` }}>Creado</th>
                  </tr>
                </thead>
                <tbody>
                  {existing.map((l) => (
                    <tr key={l.token}>
                      <td style={{ padding: "8px 6px", borderBottom: `1px solid ${C.border}` }}>
                        {l.merchant_id ?? "—"}
                      </td>
                      <td style={{ padding: "8px 6px", borderBottom: `1px solid ${C.border}`, fontFamily: "ui-monospace, monospace", color: C.amber }}>
                        {l.token}
                      </td>
                      <td style={{ padding: "8px 6px", borderBottom: `1px solid ${C.border}` }}>
                        {l.base_amount ? `$${l.base_amount.toLocaleString("en-US")}` : "—"}
                      </td>
                      <td style={{ padding: "8px 6px", borderBottom: `1px solid ${C.border}`, color: l.opened_at ? C.green : C.textSub }}>
                        {l.opened_at ? "Sí" : "No"}
                      </td>
                      <td style={{ padding: "8px 6px", borderBottom: `1px solid ${C.border}`, color: l.used_at ? C.green : C.textSub }}>
                        {l.used_at ? "Sí" : "No"}
                      </td>
                      <td style={{ padding: "8px 6px", borderBottom: `1px solid ${C.border}`, color: C.textSub }}>
                        {l.created_at ? new Date(l.created_at).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
