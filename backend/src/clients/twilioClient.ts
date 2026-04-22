import axios from "axios";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { TwilioResult } from "../models/Application";

const TWILIO_BASE = "https://lookups.twilio.com/v2/PhoneNumbers";

// ── Stubs demo ────────────────────────────────────────────────────────────────

const DEMO_TWILIO_STUB: TwilioResult = {
  connected: true,
  phone_number: "+525512345678",
  // Identity Match — general
  identity_match: true,
  name_match_score: "high",     // "high" | "medium" | "low" | "no_data"
  first_name_match: "high",
  last_name_match: "high",
  date_of_birth_match: "exact",
  national_id_match: "high",    // RFC coincide con titular del número
  // Identity Match — dirección
  address_line_1_match: "high",
  address_city_match: "exact",
  address_state_match: "exact",
  address_postal_code_match: "exact",
  address_country_match: "exact",
  // WhatsApp Business
  whatsapp_business: true,
  // Line Intelligence
  line_type: "mobile",          // mobile | landline | voip | toll_free
  carrier_name: "Telcel",
  caller_name: "JUAN PEREZ DEMO",
  country_code: "MX",
  // Antifraude
  sim_swap_detected: false,
  sim_swap_period: "none",
  call_forwarding_enabled: false,
  // Line intelligence detallado
  prepaid_flag: false,           // post-pago = más estable
  mobile_country_code: "334",    // México
  mobile_network_code: "020",    // Telcel
  // Reassigned
  reassigned_number: false,
  // Validación
  is_valid: true,
  validation_errors: [],
  phone_number_quality_score: 92,
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
        "caller_name",
        "reassigned_number",
        "validation",
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

      // SIM Swap: cambio reciente = señal fuerte de fraude (buckets extendidos)
      const swappedPeriod: string | undefined = data.sim_swap?.last_sim_swap?.swapped_period;
      const simSwap =
        swappedPeriod === "PT24H" ||
        swappedPeriod === "P7D" ||
        swappedPeriod === "P30D" ||
        swappedPeriod === "P90D";

      // Call Forwarding: desvío activo = bandera de account takeover
      const callForwarding =
        data.call_forwarding?.call_forwarding_status === "true" ||
        data.call_forwarding?.call_forwarding_enabled === true;

      // Identity Match — extendido (nombre, apellido, fecha, ID, dirección)
      const im = data.identity_match ?? {};
      const firstNameMatch: string = im.first_name_match ?? "no_data";
      const lastNameMatch: string = im.last_name_match ?? "no_data";
      const dobMatch: string = im.date_of_birth_match ?? "no_data";
      const nationalIdMatch: string = im.national_id_match ?? "no_data";
      const addrLine1Match: string = im.address_line_1_match ?? "no_data";
      const addrCityMatch: string = im.city_match ?? im.address_city_match ?? "no_data";
      const addrStateMatch: string = im.state_match ?? im.address_state_match ?? "no_data";
      const addrPostalMatch: string = im.postal_code_match ?? im.address_postal_code_match ?? "no_data";
      const addrCountryMatch: string = im.country_match ?? im.address_country_match ?? "no_data";

      const nameScore = firstNameMatch;
      const identityMatch = nameScore === "exact" || nameScore === "high";

      // Caller Name (CNAM)
      const callerName: string | undefined = data.caller_name?.caller_name;

      // Reassigned Number
      const reassignedNumber: boolean | undefined =
        data.reassigned_number?.last_verified_date != null
          ? data.reassigned_number?.is_reassigned === true
          : undefined;

      // Validación básica
      const validation = data.validation ?? {};
      const isValid: boolean | undefined =
        validation.is_valid !== undefined ? !!validation.is_valid : undefined;
      const validationErrors: string[] = Array.isArray(validation.validation_errors)
        ? validation.validation_errors
        : [];

      // Quality score nativo de Twilio (algunos planes lo devuelven)
      const qualityScore: number | undefined =
        typeof data.phone_number_quality_score === "number"
          ? data.phone_number_quality_score
          : undefined;

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
      if (simSwap)                          { risk -= 25; flags.push("sim_swap_recent"); }
      if (callForwarding)                   { risk -= 20; flags.push("call_forwarding_on"); }
      if (lineType === "voip")              { risk -= 30; flags.push("voip_number"); }
      if (prepaidFlag === true)             { risk -= 8;  flags.push("prepaid"); }
      if (tenureBucket === "new")           { risk -= 15; flags.push("new_number"); }
      if (nameScore === "no_match")         { risk -= 10; flags.push("identity_mismatch"); }
      if (lastNameMatch === "no_match")     { risk -= 8;  flags.push("last_name_mismatch"); }
      if (nationalIdMatch === "no_match")   { risk -= 15; flags.push("national_id_mismatch"); }
      if (dobMatch === "no_match")          { risk -= 8;  flags.push("dob_mismatch"); }
      if (addrLine1Match === "no_match")    { risk -= 5;  flags.push("address_mismatch"); }
      if (reassignedNumber === true)        { risk -= 20; flags.push("reassigned_number"); }
      if (isValid === false)                { risk -= 30; flags.push("invalid_number"); }
      risk = Math.max(0, Math.min(100, risk));

      const result: TwilioResult = {
        connected: true,
        phone_number: data.phone_number,
        // Identity Match
        identity_match: identityMatch,
        name_match_score: nameScore === "exact" ? "high" : nameScore,
        first_name_match: firstNameMatch,
        last_name_match: lastNameMatch,
        date_of_birth_match: dobMatch,
        national_id_match: nationalIdMatch,
        address_line_1_match: addrLine1Match,
        address_city_match: addrCityMatch,
        address_state_match: addrStateMatch,
        address_postal_code_match: addrPostalMatch,
        address_country_match: addrCountryMatch,
        // WhatsApp
        whatsapp_business: whatsappBusiness,
        // Line intelligence
        line_type: lineType,
        carrier_name: baseCarrier,
        caller_name: callerName,
        country_code: data.country_code,
        // Antifraude
        sim_swap_detected: simSwap,
        sim_swap_period: swappedPeriod ?? "none",
        call_forwarding_enabled: callForwarding,
        prepaid_flag: prepaidFlag,
        mobile_country_code: lti.mobile_country_code,
        mobile_network_code: lti.mobile_network_code,
        // Reassigned + validación
        reassigned_number: reassignedNumber,
        is_valid: isValid,
        validation_errors: validationErrors,
        phone_number_quality_score: qualityScore,
        // Tenure
        number_tenure_days: tenureDays,
        number_tenure_bucket: tenureBucket,
        // Score agregado
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
