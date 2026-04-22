import { env } from "../config/env";
import { logger } from "../utils/logger";
import { PlatformResult } from "../models/Application";

export interface PlatformData {
  avg_platform_gmv_6m: number;       // MXN/mes — GMV promedio en Rappi últimos 6 meses
  tenure_months: number;              // Meses activo como comercio en Rappi
  pre_approved_amount: number;        // Oferta de crédito pre-aprobada basada en ventas Rappi
  // Volatilidad & tendencia
  platform_gmv_volatility_6m?: number;
  gmv_growth_3m?: number;
  gmv_growth_12m?: number;
  // Calidad operativa
  cancellation_rate?: number;
  refund_rate?: number;
  // Mix volumen vs ticket
  avg_ticket_size?: number;
  orders_per_day?: number;
  repeat_customer_rate?: number;
  // Historial de repago (refills)
  previous_loans_count?: number;
  previous_loans_repaid_on_time_rate?: number;
  split_pay_capacity_utilization?: number;
  // Estacionalidad
  weekday_vs_weekend_ratio?: number;
  peak_hour_concentration?: number;
  fetched_at: string;
}

// Stub demo: base pre-aprobada de $50k
const DEMO_STUB: PlatformData = {
  avg_platform_gmv_6m: 900_000,     // 900K MXN/mes en Rappi
  tenure_months: 36,                 // 3 años en la plataforma
  pre_approved_amount: 50_000,       // Oferta base pre-aprobada
  // Volatilidad & tendencia
  platform_gmv_volatility_6m: 0.14,  // 14% coef variación — bajo
  gmv_growth_3m: 0.08,                // +8% último trimestre
  gmv_growth_12m: 0.22,               // +22% interanual
  // Calidad operativa
  cancellation_rate: 0.04,            // 4% cancelaciones
  refund_rate: 0.02,                  // 2% reembolsos
  // Mix volumen vs ticket
  avg_ticket_size: 285,               // ticket promedio MXN
  orders_per_day: 105,
  repeat_customer_rate: 0.46,         // 46% clientes recurrentes
  // Historial de repago
  previous_loans_count: 2,
  previous_loans_repaid_on_time_rate: 1.0,  // 100% a tiempo
  split_pay_capacity_utilization: 0.35,     // 35% del cap usado
  // Estacionalidad
  weekday_vs_weekend_ratio: 0.78,     // weekend > weekday
  peak_hour_concentration: 0.52,      // 52% del GMV en 4 horas pico
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
        platform_gmv_volatility_6m: DEMO_STUB.platform_gmv_volatility_6m,
        gmv_growth_3m: DEMO_STUB.gmv_growth_3m,
        gmv_growth_12m: DEMO_STUB.gmv_growth_12m,
        cancellation_rate: DEMO_STUB.cancellation_rate,
        refund_rate: DEMO_STUB.refund_rate,
        avg_ticket_size: DEMO_STUB.avg_ticket_size,
        orders_per_day: DEMO_STUB.orders_per_day,
        repeat_customer_rate: DEMO_STUB.repeat_customer_rate,
        previous_loans_count: DEMO_STUB.previous_loans_count,
        previous_loans_repaid_on_time_rate: DEMO_STUB.previous_loans_repaid_on_time_rate,
        split_pay_capacity_utilization: DEMO_STUB.split_pay_capacity_utilization,
        weekday_vs_weekend_ratio: DEMO_STUB.weekday_vs_weekend_ratio,
        peak_hour_concentration: DEMO_STUB.peak_hour_concentration,
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
      platform_gmv_volatility_6m: DEMO_STUB.platform_gmv_volatility_6m,
      gmv_growth_3m: DEMO_STUB.gmv_growth_3m,
      gmv_growth_12m: DEMO_STUB.gmv_growth_12m,
      cancellation_rate: DEMO_STUB.cancellation_rate,
      refund_rate: DEMO_STUB.refund_rate,
      avg_ticket_size: DEMO_STUB.avg_ticket_size,
      orders_per_day: DEMO_STUB.orders_per_day,
      repeat_customer_rate: DEMO_STUB.repeat_customer_rate,
      previous_loans_count: DEMO_STUB.previous_loans_count,
      previous_loans_repaid_on_time_rate: DEMO_STUB.previous_loans_repaid_on_time_rate,
      split_pay_capacity_utilization: DEMO_STUB.split_pay_capacity_utilization,
      weekday_vs_weekend_ratio: DEMO_STUB.weekday_vs_weekend_ratio,
      peak_hour_concentration: DEMO_STUB.peak_hour_concentration,
      fetched_at: new Date().toISOString(),
    };
  }
}

export const platformClient = new PlatformClient();
