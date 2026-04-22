import axios, { AxiosInstance } from "axios";
import { env } from "../config/env";
import { logger } from "../utils/logger";

export interface SyntageCounterpartyData {
  rfc: string;
  name?: string;
  invoiced_amount_12m: number;
  share_of_revenue: number;
}

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
  // Cashflow real
  avg_monthly_invoiced_inflows_6m?: number;
  avg_monthly_invoiced_outflows_6m?: number;
  avg_monthly_fiscal_net_flow_6m?: number;
  invoiced_revenue_std_dev_6m?: number;
  // Salud operativa
  fs_operating_margin?: number;
  fs_net_income_year?: number;
  // Compliance fiscal
  active_tax_debt_amount?: number;
  invoice_cancelation_ratio_6m?: number;
  counterparty_tax_fraud_flag_rate?: number;
  // Concentración / mix
  cfdi_top_counterparties?: SyntageCounterpartyData[];
  cfdi_payment_method_split?: { pue_ratio: number; ppd_ratio: number };
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
  // Cashflow demo (60k inflows, 25k outflows = 35k net)
  avg_monthly_invoiced_inflows_6m: 60000,
  avg_monthly_invoiced_outflows_6m: 25000,
  avg_monthly_fiscal_net_flow_6m: 35000,
  invoiced_revenue_std_dev_6m: 8500,
  // Salud operativa
  fs_operating_margin: 0.18,
  fs_net_income_year: 130000,
  // Compliance
  active_tax_debt_amount: 0,
  invoice_cancelation_ratio_6m: 0.03,
  counterparty_tax_fraud_flag_rate: 0.0,
  // Concentración: 3 clientes top, ninguno > 40%
  cfdi_top_counterparties: [
    { rfc: "XAXX010101000", name: "Cliente Demo SA de CV", invoiced_amount_12m: 280000, share_of_revenue: 0.39 },
    { rfc: "XEXX010101000", name: "Distribuidora Ejemplo", invoiced_amount_12m: 150000, share_of_revenue: 0.21 },
    { rfc: "XZXX010101000", name: "Comercial Stub",        invoiced_amount_12m: 90000,  share_of_revenue: 0.13 },
  ],
  cfdi_payment_method_split: { pue_ratio: 0.78, ppd_ratio: 0.22 },
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
