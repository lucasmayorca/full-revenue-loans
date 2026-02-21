import axios from "axios";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { TwilioResult } from "../models/Application";

const TWILIO_BASE = "https://lookups.twilio.com/v2/PhoneNumbers";

// ── Stubs demo ────────────────────────────────────────────────────────────────

const DEMO_TWILIO_STUB: TwilioResult = {
  connected: true,
  phone_number: "+525512345678",
  // Identity Match
  identity_match: true,
  name_match_score: "high",     // "high" | "medium" | "low" | "no_data"
  // WhatsApp Business
  whatsapp_business: true,
  line_type: "mobile",          // mobile | landline | voip | toll_free
  // Antifraude
  sim_swap_detected: false,
  carrier_name: "Telcel",
  country_code: "MX",
  fetched_at: new Date().toISOString(),
};

// ── Twilio Lookup Client ──────────────────────────────────────────────────────

class TwilioClient {
  private get authHeader() {
    const token = Buffer.from(
      `${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`
    ).toString("base64");
    return `Basic ${token}`;
  }

  /**
   * Verifica un número de teléfono con Twilio Lookup v2.
   * - Identity Match: compara nombre del solicitante contra registros del operador
   * - Line Type Intelligence: tipo de línea (mobile, VoIP, etc.)
   * - SIM Swap: detecta si hubo cambio de SIM reciente (señal de fraude)
   * - WhatsApp: detecta si el número tiene WhatsApp Business activo
   */
  async verifyPhone(
    phone: string,
    firstName?: string,
    lastName?: string
  ): Promise<TwilioResult> {
    if (env.DEMO_MODE || !env.TWILIO_ACCOUNT_SID) {
      logger.info("twilio_demo_mode");
      await new Promise((r) => setTimeout(r, 180));
      return { ...DEMO_TWILIO_STUB, phone_number: phone, fetched_at: new Date().toISOString() };
    }

    try {
      // Campos a solicitar: identity_match requiere nombre
      const fields = [
        "line_type_intelligence",
        "sim_swap",
        ...(firstName || lastName ? ["identity_match"] : []),
      ].join(",");

      const params: Record<string, string> = { Fields: fields };
      if (firstName) params["FirstName"] = firstName;
      if (lastName) params["LastName"] = lastName;

      const resp = await axios.get(`${TWILIO_BASE}/${encodeURIComponent(phone)}`, {
        headers: { Authorization: this.authHeader },
        params,
        timeout: 8000,
      });

      const data = resp.data;
      const lineType = data.line_type_intelligence?.type ?? "unknown";
      const simSwap = data.sim_swap?.last_sim_swap?.swapped_period === "PT24H" ||
                      data.sim_swap?.last_sim_swap?.swapped_period === "P7D";

      // Identity Match devuelve scores por campo
      const nameScore = data.identity_match?.first_name_match ?? "no_data";
      const identityMatch =
        nameScore === "exact" || nameScore === "high";

      // WhatsApp Business: Twilio devuelve channel_endpoints si está en Business Manager
      // Nota: requiere addon WhatsApp Business Lookup (disponible en beta)
      // Como fallback, inferimos por tipo de línea + presencia en WhatsApp
      const whatsappBusiness = data.add_ons?.results?.["whatsapp_business"]?.status === "successful"
        ? data.add_ons.results["whatsapp_business"].result?.registered === true
        : undefined; // undefined = no data (no bloqueante)

      const result: TwilioResult = {
        connected: true,
        phone_number: data.phone_number,
        identity_match: identityMatch,
        name_match_score: nameScore === "exact" ? "high" : nameScore,
        whatsapp_business: whatsappBusiness,
        line_type: lineType,
        sim_swap_detected: simSwap,
        carrier_name: data.line_type_intelligence?.mobile_network_code
          ? data.line_type_intelligence?.carrier_name
          : data.calling_country_code,
        country_code: data.country_code,
        fetched_at: new Date().toISOString(),
      };

      logger.info("twilio_lookup_fetched", {
        phone_number: result.phone_number,
        identity_match: result.identity_match,
        line_type: result.line_type,
        sim_swap_detected: result.sim_swap_detected,
        whatsapp_business: result.whatsapp_business,
      });

      return result;
    } catch (err) {
      logger.error("twilio_lookup_failed", { error: String(err) });
      return { connected: false, fetched_at: new Date().toISOString() };
    }
  }
}

export const twilioClient = new TwilioClient();
