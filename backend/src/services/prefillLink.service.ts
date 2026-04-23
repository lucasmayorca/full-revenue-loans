import crypto from "crypto";
import { isPgEnabled, query } from "../clients/pgClient";
import { PrefillLinkDoc, PrefillOffer, PrefillData } from "../models/PrefillLink";
import { logger } from "../utils/logger";

/* ─────────────────────── Token generator ─────────────────────── */

// Alfabeto sin caracteres confusos (0/O, 1/I/l).
const TOKEN_ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
const TOKEN_LENGTH = 10;

function generateToken(): string {
  const bytes = crypto.randomBytes(TOKEN_LENGTH);
  let out = "";
  for (let i = 0; i < TOKEN_LENGTH; i++) {
    out += TOKEN_ALPHABET[bytes[i] % TOKEN_ALPHABET.length];
  }
  return out;
}

/* ─────────────────────── In-memory fallback ─────────────────────── */
// Se usa si no hay DATABASE_URL configurada (dev local / demo)
const memStore = new Map<string, PrefillLinkDoc>();

/* ─────────────────────── CSV parser ─────────────────────── */

/**
 * Parser CSV simple. Soporta:
 *  - Campos entre comillas dobles (para comas dentro de valores)
 *  - Comillas escapadas como `""`
 *  - \n y \r\n como separadores de fila
 *  - Campos vacíos
 * No es RFC 4180 completo, pero cubre los casos de Excel/Sheets.
 */
export function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;

  // Normalizar line endings
  const text = input.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      current.push(field);
      field = "";
      continue;
    }
    if (ch === "\n") {
      current.push(field);
      field = "";
      rows.push(current);
      current = [];
      continue;
    }
    field += ch;
  }

  // Último campo / última fila (si no terminó con newline)
  if (field.length > 0 || current.length > 0) {
    current.push(field);
    rows.push(current);
  }

  // Filtrar filas totalmente vacías
  return rows.filter((r) => r.some((c) => c.trim().length > 0));
}

/* ─────────────────────── CSV → PrefillLink ─────────────────────── */

/** Campos soportados del CSV — ignora cualquier columna extra. */
const PREFILL_FIELDS: Array<keyof PrefillData> = [
  "first_name", "last_name", "email", "phone", "curp", "birth_date",
  "nationality", "marital_status", "legal_name", "tax_id", "ciec", "address",
  "street", "neighborhood", "postal_code", "city", "state",
  "clabe", "bank_name", "account_type", "account_holder",
];

interface ParsedRow {
  merchant_id: string | null;
  base_amount: number | null;
  offers: PrefillOffer[];
  prefill: PrefillData;
}

/**
 * Convierte una fila ya parseada en un objeto estructurado. Soporta:
 *  - Columna `merchant_id`, `base_amount` (opcionales)
 *  - Cualquier campo de PREFILL_FIELDS
 *  - Hasta 3 ofertas RBF con prefijo `offer1_`, `offer2_`, `offer3_` y
 *    subcampos `amount`, `retention`, `total`, `fee`, `monthly`, `term`
 */
function rowToPrefill(headers: string[], row: string[]): ParsedRow {
  const record: Record<string, string> = {};
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i].trim().toLowerCase();
    const v = (row[i] ?? "").trim();
    if (h && v !== "") record[h] = v;
  }

  const merchant_id = record["merchant_id"] ?? null;

  const base_amount = record["base_amount"]
    ? parseInt(record["base_amount"].replace(/[^\d]/g, ""), 10) || null
    : null;

  const prefill: PrefillData = {};
  for (const f of PREFILL_FIELDS) {
    if (record[f] !== undefined) {
      (prefill as Record<string, string>)[f] = record[f];
    }
  }

  // Parseo de ofertas: offerN_amount, offerN_retention, offerN_total, etc.
  const offers: PrefillOffer[] = [];
  for (let n = 1; n <= 3; n++) {
    const amountStr = record[`offer${n}_amount`];
    if (!amountStr) continue;
    const receive = parseInt(amountStr.replace(/[^\d]/g, ""), 10);
    if (!Number.isFinite(receive) || receive <= 0) continue;

    const offer: PrefillOffer = {
      id: `oferta${n}`,
      receive,
    };
    const ret   = record[`offer${n}_retention`];
    const tot   = record[`offer${n}_total`];
    const fee   = record[`offer${n}_fee`];
    const mon   = record[`offer${n}_monthly`];
    const term  = record[`offer${n}_term`];
    if (ret)  offer.retention = parseFloat(ret.replace(/[^\d.]/g, ""));
    if (tot)  offer.totalToPay = parseInt(tot.replace(/[^\d]/g, ""), 10);
    if (fee)  offer.fixedFee = parseInt(fee.replace(/[^\d]/g, ""), 10);
    if (mon)  offer.monthlyMin = parseInt(mon.replace(/[^\d]/g, ""), 10);
    if (term) offer.maxTerm = term;
    offers.push(offer);
  }

  return { merchant_id, base_amount, offers, prefill };
}

/* ─────────────────────── Persistence helpers ─────────────────────── */

function rowFromDb(r: Record<string, unknown>): PrefillLinkDoc {
  const toIso = (v: unknown): string | null => {
    if (v === null || v === undefined) return null;
    if (v instanceof Date) return v.toISOString();
    return String(v);
  };
  return {
    token: String(r.token),
    merchant_id: r.merchant_id === null ? null : String(r.merchant_id),
    offers: r.offers as PrefillOffer[] | null,
    base_amount: r.base_amount === null ? null : Number(r.base_amount),
    prefill: r.prefill as PrefillData | null,
    expires_at: toIso(r.expires_at),
    opened_at: toIso(r.opened_at),
    used_at: toIso(r.used_at),
    created_at: toIso(r.created_at) ?? new Date().toISOString(),
  };
}

async function insert(doc: PrefillLinkDoc): Promise<void> {
  if (!isPgEnabled()) {
    memStore.set(doc.token, doc);
    return;
  }
  await query(
    `INSERT INTO prefill_links (token, merchant_id, offers, base_amount, prefill, expires_at, created_at)
     VALUES ($1, $2, $3::jsonb, $4, $5::jsonb, $6, $7)`,
    [
      doc.token,
      doc.merchant_id,
      doc.offers === null ? null : JSON.stringify(doc.offers),
      doc.base_amount,
      doc.prefill === null ? null : JSON.stringify(doc.prefill),
      doc.expires_at,
      doc.created_at,
    ]
  );
}

/* ─────────────────────── Public API ─────────────────────── */

export interface BulkResult {
  total: number;
  created: number;
  errors: Array<{ row: number; error: string }>;
  links: Array<{
    token: string;
    merchant_id: string | null;
    url: string;
  }>;
}

/**
 * Procesa un CSV completo y crea un link por cada fila válida.
 *
 * @param csvText  Contenido completo del CSV (con headers en la primera fila).
 * @param baseUrl  URL pública del frontend. Los links se generan como
 *                 `${baseUrl}/offers?t=${token}`.
 * @param expiresInDays  Días hasta expiración (default 30).
 */
export async function createBulkFromCsv(
  csvText: string,
  baseUrl: string,
  expiresInDays = 30
): Promise<BulkResult> {
  const rows = parseCsv(csvText);
  if (rows.length < 2) {
    return {
      total: 0,
      created: 0,
      errors: [{ row: 0, error: "CSV vacío o sin filas de datos" }],
      links: [],
    };
  }

  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const dataRows = rows.slice(1);

  const result: BulkResult = {
    total: dataRows.length,
    created: 0,
    errors: [],
    links: [],
  };

  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();
  const normalizedBase = baseUrl.replace(/\/+$/, "");

  for (let i = 0; i < dataRows.length; i++) {
    try {
      const parsed = rowToPrefill(headers, dataRows[i]);
      const token = generateToken();
      const doc: PrefillLinkDoc = {
        token,
        merchant_id: parsed.merchant_id,
        offers: parsed.offers.length > 0 ? parsed.offers : null,
        base_amount: parsed.base_amount,
        prefill: Object.keys(parsed.prefill).length > 0 ? parsed.prefill : null,
        expires_at: expiresAt,
        opened_at: null,
        used_at: null,
        created_at: new Date().toISOString(),
      };
      await insert(doc);
      result.created++;
      result.links.push({
        token,
        merchant_id: parsed.merchant_id,
        url: `${normalizedBase}/offers?t=${token}`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push({ row: i + 2, error: msg }); // +2: headers + 1-indexed
      logger.warn("prefill_row_failed", { row: i + 2, error: msg });
    }
  }

  return result;
}

export async function getByToken(token: string): Promise<PrefillLinkDoc | null> {
  if (!isPgEnabled()) {
    const doc = memStore.get(token);
    if (!doc) return null;
    // Mark opened_at on first fetch
    if (!doc.opened_at) {
      doc.opened_at = new Date().toISOString();
      memStore.set(token, doc);
    }
    return doc;
  }
  const res = await query(
    `UPDATE prefill_links
       SET opened_at = COALESCE(opened_at, NOW())
     WHERE token = $1
     RETURNING *`,
    [token]
  );
  if (res.rowCount === 0) return null;
  return rowFromDb(res.rows[0] as Record<string, unknown>);
}

export async function listAll(limit = 500): Promise<PrefillLinkDoc[]> {
  if (!isPgEnabled()) {
    return Array.from(memStore.values())
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit);
  }
  const res = await query(
    `SELECT * FROM prefill_links ORDER BY created_at DESC LIMIT $1`,
    [limit]
  );
  return res.rows.map((r) => rowFromDb(r as Record<string, unknown>));
}

export async function markUsed(token: string): Promise<void> {
  if (!isPgEnabled()) {
    const doc = memStore.get(token);
    if (doc && !doc.used_at) {
      doc.used_at = new Date().toISOString();
      memStore.set(token, doc);
    }
    return;
  }
  await query(
    `UPDATE prefill_links SET used_at = COALESCE(used_at, NOW()) WHERE token = $1`,
    [token]
  );
}
