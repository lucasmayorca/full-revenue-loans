import { env } from "../config/env";
import { logger } from "../utils/logger";
import { BureauResult } from "../models/Application";

export interface BureauData {
  bureau_score: number;        // 300–850 (estilo FICO México)
  active_debt_amount: number;  // MXN — deuda activa en buró
  active_delinquency_flag?: boolean;
  worst_status_24m?: string;
  credit_utilization_ratio?: number;
  total_credit_limit?: number;
  total_balance?: number;
  recent_inquiries_6m?: number;
  oldest_tradeline_age_months?: number;
  total_tradelines?: number;
  mix_of_credit?: {
    consumer?: number;
    mortgage?: number;
    auto?: number;
    business?: number;
  };
  fetched_at: string;
}

// Stub demo realista: score saludable, sin mora activa, mix sano
const DEMO_STUB: BureauData = {
  bureau_score: 720,
  active_debt_amount: 0,
  active_delinquency_flag: false,
  worst_status_24m: "MOP-0",
  credit_utilization_ratio: 0.32,
  total_credit_limit: 180_000,
  total_balance: 57_600,
  recent_inquiries_6m: 1,
  oldest_tradeline_age_months: 84,
  total_tradelines: 5,
  mix_of_credit: { consumer: 3, mortgage: 0, auto: 1, business: 1 },
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
        active_delinquency_flag: DEMO_STUB.active_delinquency_flag,
        worst_status_24m: DEMO_STUB.worst_status_24m,
        credit_utilization_ratio: DEMO_STUB.credit_utilization_ratio,
        total_credit_limit: DEMO_STUB.total_credit_limit,
        total_balance: DEMO_STUB.total_balance,
        recent_inquiries_6m: DEMO_STUB.recent_inquiries_6m,
        oldest_tradeline_age_months: DEMO_STUB.oldest_tradeline_age_months,
        total_tradelines: DEMO_STUB.total_tradelines,
        mix_of_credit: DEMO_STUB.mix_of_credit,
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
      active_delinquency_flag: DEMO_STUB.active_delinquency_flag,
      worst_status_24m: DEMO_STUB.worst_status_24m,
      credit_utilization_ratio: DEMO_STUB.credit_utilization_ratio,
      total_credit_limit: DEMO_STUB.total_credit_limit,
      total_balance: DEMO_STUB.total_balance,
      recent_inquiries_6m: DEMO_STUB.recent_inquiries_6m,
      oldest_tradeline_age_months: DEMO_STUB.oldest_tradeline_age_months,
      total_tradelines: DEMO_STUB.total_tradelines,
      mix_of_credit: DEMO_STUB.mix_of_credit,
      fetched_at: new Date().toISOString(),
    };
  }
}

export const bureauClient = new BureauClient();
