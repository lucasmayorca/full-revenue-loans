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
  carrier_name: "Telcel",
  country_code: "MX",
  // Antifraude
  sim_swap_detected: false,
  call_forwarding_enabled: false,
  // Line intelligence detallado
  prepaid_flag: false,           // post-pago = más estable
  mobile_country_code: "334",    // México
  mobile_network_code: "020",    // Telcel
  // Tenure
  number_tenure_days: 1820,      // ~5 años
  number_tenure_bucket: "established",
  // Score agregado
  risk_score: 95,
  risk_flags: [],
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
        "call_forwarding",
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
      const lti = data.line_type_intelligence ?? {};
      const lineType: string = lti.type ?? "unknown";

      // SIM Swap: cambio reciente = señal fuerte de fraude
      const swappedPeriod: string | undefined = data.sim_swap?.last_sim_swap?.swapped_period;
      const simSwap = swappedPeriod === "PT24H" || swappedPeriod === "P7D";

      // Call Forwarding: desvío activo = bandera de account takeover
      const callForwarding =
        data.call_forwarding?.call_forwarding_status === "true" ||
        data.call_forwarding?.call_forwarding_enabled === true;

      // Identity Match
      const nameScore = data.identity_match?.first_name_match ?? "no_data";
      const identityMatch = nameScore === "exact" || nameScore === "high";

      // WhatsApp Business (addon beta)
      const whatsappBusiness = data.add_ons?.results?.["whatsapp_business"]?.status === "successful"
        ? data.add_ons.results["whatsapp_business"].result?.registered === true
        : undefined;

      // Prepaid vs Postpaid (Line Type Intelligence detallado)
      const mobileNetworkType: string = String(lti.mobile_network_type ?? "");
      const prepaidFlag: boolean | undefined =
        lineType === "mobile" && mobileNetworkType
          ? /prepag|prepaid/i.test(mobileNetworkType)
          : undefined;

      // Carrier detail
      const baseCarrier = lti.carrier_name ?? data.calling_country_code;
      const carrierDetail = baseCarrier
        ? `${baseCarrier}${
            prepaidFlag === false ? " post-pago" : prepaidFlag === true ? " prepago" : ""
          }`
        : undefined;

      // Number tenure: si SIM swap trae timestamp, lo usamos como proxy superior del piso
      const swappedAt: string | undefined = data.sim_swap?.last_sim_swap?.swapped_at;
      const tenureDays = swappedAt
        ? Math.floor((Date.now() - Date.parse(swappedAt)) / 86400000)
        : undefined;
      const tenureBucket: "new" | "recent" | "established" | undefined =
        tenureDays === undefined
          ? undefined
          : tenureDays < 30
          ? "new"
          : tenureDays < 180
          ? "recent"
          : "established";

      // Risk score compuesto (100 = más seguro)
      const flags: string[] = [];
      let risk = 100;
      if (simSwap)                  { risk -= 25; flags.push("sim_swap_recent"); }
      if (callForwarding)           { risk -= 20; flags.push("call_forwarding_on"); }
      if (lineType === "voip")      { risk -= 30; flags.push("voip_number"); }
      if (prepaidFlag === true)     { risk -= 8;  flags.push("prepaid"); }
      if (tenureBucket === "new")   { risk -= 15; flags.push("new_number"); }
      if (nameScore === "no_match") { risk -= 10; flags.push("identity_mismatch"); }
      risk = Math.max(0, Math.min(100, risk));

      const result: TwilioResult = {
        connected: true,
        phone_number: data.phone_number,
        identity_match: identityMatch,
        name_match_score: nameScore === "exact" ? "high" : nameScore,
        whatsapp_business: whatsappBusiness,
        line_type: lineType,
        carrier_name: baseCarrier,
        country_code: data.country_code,
        sim_swap_detected: simSwap,
        call_forwarding_enabled: callForwarding,
        prepaid_flag: prepaidFlag,
        mobile_country_code: lti.mobile_country_code,
        mobile_network_code: lti.mobile_network_code,
        number_tenure_days: tenureDays,
        number_tenure_bucket: tenureBucket,
        risk_score: risk,
        risk_flags: flags,
        fetched_at: new Date().toISOString(),
      };

      // carrier_detail sólo se loggea; no es campo canónico pero se puede componer en UI
      logger.info("twilio_lookup_fetched", {
        phone_number: result.phone_number,
        identity_match: result.identity_match,
        line_type: result.line_type,
        carrier: carrierDetail,
        sim_swap_detected: result.sim_swap_detected,
        call_forwarding_enabled: result.call_forwarding_enabled,
        prepaid: result.prepaid_flag,
        tenure_bucket: result.number_tenure_bucket,
        whatsapp_business: result.whatsapp_business,
        risk_score: result.risk_score,
        risk_flags: result.risk_flags,
      });

      return result;
    } catch (err) {
      logger.error("twilio_lookup_failed", { error: String(err) });
      return { connected: false, fetched_at: new Date().toISOString() };
    }
  }
}

export const twilioClient = new TwilioClient();
