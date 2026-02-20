import axios, { AxiosInstance } from "axios";
import { env } from "../config/env";
import { logger } from "../utils/logger";

export interface SyntageRevenueData {
  merchant_id: string;
  annual_revenue: number;
  months_active: number;
  currency: string;
  last_updated: string;
  // Campos fiscales adicionales (tabla consolidada de underwriting)
  tax_regime?: string;               // Régimen fiscal SAT
  cfdi_count_last_12m?: number;      // CFDIs emitidos últimos 12 meses
  tax_compliance?: boolean;          // true = sin deuda activa con SAT
}

const DEMO_STUB: SyntageRevenueData = {
  merchant_id: "DEMO-MERCHANT",
  annual_revenue: 720000,            // 60k MXN/mes
  months_active: 36,
  currency: "MXN",
  last_updated: new Date().toISOString(),
  tax_regime: "Régimen Simplificado de Confianza",
  cfdi_count_last_12m: 847,
  tax_compliance: true,
};

class SyntageClient {
  private http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: env.SYNTAGE_BASE_URL ?? "https://api.syntage.com",
      headers: {
        Authorization: `Bearer ${env.SYNTAGE_API_KEY ?? ""}`,
        "Content-Type": "application/json",
        "X-Client": "rappi-full-revenue/1.0",
      },
      timeout: env.SYNTAGE_TIMEOUT_MS,
    });

    this.http.interceptors.request.use((config) => {
      logger.info("syntage_request", {
        method: config.method,
        url: config.url,
      });
      return config;
    });

    this.http.interceptors.response.use(
      (response) => {
        logger.info("syntage_response", {
          status: response.status,
          url: response.config.url,
        });
        return response;
      },
      (error) => {
        logger.error("syntage_error", {
          message: error.message,
          status: error.response?.status,
          url: error.config?.url,
        });
        throw error;
      }
    );
  }

  async getRevenueData(merchantId: string): Promise<SyntageRevenueData> {
    if (env.DEMO_MODE || !env.SYNTAGE_API_KEY) {
      logger.info("syntage_demo_mode", { merchant_id: merchantId });
      await new Promise((r) => setTimeout(r, 200));
      return { ...DEMO_STUB, merchant_id: merchantId };
    }

    const response = await this.http.get<SyntageRevenueData>(
      `/merchants/${merchantId}/revenue`
    );
    return response.data;
  }
}

export const syntageClient = new SyntageClient();
