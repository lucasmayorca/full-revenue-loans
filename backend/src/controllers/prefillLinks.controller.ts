import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
  createBulkFromCsv,
  getByToken,
  listAll,
} from "../services/prefillLink.service";
import { env } from "../config/env";

/* POST /full-revenue/prefill-links/bulk
 * Body: { csv: string, base_url?: string, expires_in_days?: number }
 * Crea un link por cada fila del CSV y devuelve la lista con URLs listas para compartir.
 */
const bulkSchema = z.object({
  csv: z.string().min(1, "CSV requerido"),
  base_url: z.string().url().optional(),
  expires_in_days: z.number().int().min(1).max(365).optional(),
});

export async function createBulk(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = bulkSchema.parse(req.body);
    const baseUrl = body.base_url ?? env.FRONTEND_URL;
    const result = await createBulkFromCsv(
      body.csv,
      baseUrl,
      body.expires_in_days ?? 30
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/* GET /full-revenue/prefill/:token
 * Endpoint público que el frontend llama cuando se abre /offers?t=xxx.
 * Marca opened_at y devuelve offers + prefill + base_amount.
 */
export async function getPrefill(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { token } = req.params;
    const doc = await getByToken(token);
    if (!doc) {
      res.status(404).json({ error: "Link no encontrado o expirado" });
      return;
    }
    if (doc.expires_at && new Date(doc.expires_at) < new Date()) {
      res.status(410).json({ error: "Link expirado" });
      return;
    }
    res.json({
      token: doc.token,
      merchant_id: doc.merchant_id,
      offers: doc.offers,
      base_amount: doc.base_amount,
      prefill: doc.prefill,
      opened_at: doc.opened_at,
    });
  } catch (err) {
    next(err);
  }
}

/* GET /full-revenue/prefill-links — admin listing */
export async function list(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { limit } = req.query as { limit?: string };
    const parsedLimit = limit ? Math.min(parseInt(limit, 10) || 0, 1000) : 500;
    const all = await listAll(parsedLimit);
    res.json({ count: all.length, links: all });
  } catch (err) {
    next(err);
  }
}
