import { env } from "../config/env";
import { logger } from "../utils/logger";
import { PlatformResult } from "../models/Application";

export interface PlatformData {
  avg_platform_gmv_6m: number;      // MXN/mes — GMV promedio en Rappi últimos 6 meses
  tenure_months: number;             // Meses activo como comercio en Rappi
  pre_approved_amount: number;       // Oferta de crédito pre-aprobada basada en ventas Rappi
  fetched_at: string;
}

// Stub demo: base pre-aprobada de $50k
const DEMO_STUB: PlatformData = {
  avg_platform_gmv_6m: 900_000,     // 900K MXN/mes en Rappi
  tenure_months: 36,                 // 3 años en la plataforma
  pre_approved_amount: 50_000,       // Oferta base pre-aprobada
  fetched_at: new Date().toISOString(),
};

class PlatformClient {
  /**
   * Obtiene datos internos de la plataforma Rappi para un merchant dado.
   *
   * En DEMO_MODE devuelve datos stub (900K MXN/mes, 36 meses).
   * En producción, consultar la DB interna de Rappi (Merchant Data Platform).
   */
  async getMerchantData(merchantId: string): Promise<PlatformResult> {
    if (env.DEMO_MODE) {
      logger.info("platform_demo_mode", { merchant_id: merchantId });
      await new Promise((r) => setTimeout(r, 100));
      return {
        avg_platform_gmv_6m: DEMO_STUB.avg_platform_gmv_6m,
        tenure_months: DEMO_STUB.tenure_months,
        pre_approved_amount: DEMO_STUB.pre_approved_amount,
        fetched_at: new Date().toISOString(),
      };
    }

    // Producción: consultar Merchant Data Platform de Rappi
    // Endpoint interno: GET /merchants/{merchantId}/analytics/gmv
    // Por ahora devuelve stub hasta que se configure la integración real
    logger.warn("platform_production_not_configured", { merchant_id: merchantId });
    return {
      avg_platform_gmv_6m: DEMO_STUB.avg_platform_gmv_6m,
      tenure_months: DEMO_STUB.tenure_months,
      pre_approved_amount: DEMO_STUB.pre_approved_amount,
      fetched_at: new Date().toISOString(),
    };
  }
}

export const platformClient = new PlatformClient();
