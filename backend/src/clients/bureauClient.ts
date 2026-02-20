import { env } from "../config/env";
import { logger } from "../utils/logger";
import { BureauResult } from "../models/Application";

export interface BureauData {
  bureau_score: number;        // 300–850 (estilo FICO México)
  active_debt_amount: number;  // MXN — deuda activa en buró
  fetched_at: string;
}

// Stub demo realista: score saludable, sin deuda activa
const DEMO_STUB: BureauData = {
  bureau_score: 720,
  active_debt_amount: 0,
  fetched_at: new Date().toISOString(),
};

class BureauClient {
  /**
   * Consulta el score del Buró de Crédito para un RFC dado.
   *
   * En DEMO_MODE devuelve datos stub (score 720, sin deuda).
   * En producción, conectar con proveedor real (Círculo de Crédito, Buró de Crédito MX API).
   */
  async getScore(taxId: string): Promise<BureauResult> {
    if (env.DEMO_MODE) {
      logger.info("bureau_demo_mode", { tax_id: taxId });
      await new Promise((r) => setTimeout(r, 150));
      return {
        bureau_score: DEMO_STUB.bureau_score,
        active_debt_amount: DEMO_STUB.active_debt_amount,
        fetched_at: new Date().toISOString(),
      };
    }

    // Producción: integrar con Círculo de Crédito o Buró de Crédito México
    // Requiere: certificado .pem, contraseña, RFC del consultante
    // Por ahora devuelve stub hasta que se configure la integración real
    logger.warn("bureau_production_not_configured", { tax_id: taxId });
    return {
      bureau_score: DEMO_STUB.bureau_score,
      active_debt_amount: DEMO_STUB.active_debt_amount,
      fetched_at: new Date().toISOString(),
    };
  }
}

export const bureauClient = new BureauClient();
