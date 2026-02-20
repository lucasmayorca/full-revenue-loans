import axios from "axios";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { PlacesResult } from "../models/Application";

// Datos demo realistas — "Los Aguacates", Puebla MX
const DEMO_PLACES_STUB: PlacesResult = {
  connected: true,
  place_id: "ChIJM8FgMXnHxYURW1vYTA2hgcg",
  business_name: "Los Aguacates",
  rating: 4.2,
  total_review_count: 143,
  rating_trend_3m: +0.1,
  listing_age_years: 6,
  location_count: 1,
  price_level_index: 2,
  is_verified: true,
  categories: ["Mexican restaurant", "Taquería"],
  has_website: false,
  business_status: "OPERATIONAL",
  signals_score: 72,
  fetched_at: new Date().toISOString(),
};

/**
 * Extrae el Place ID de una URL de Google Maps.
 *
 * Soporta los formatos más comunes:
 *  - /maps/place/NOMBRE/...data=...!1sChIJ<PLACE_ID>  → Place ID ChIJ en segmento !1s
 *  - /maps/place/NOMBRE/...data=...!1s0x<hex>:<hex>   → hex encode en segmento !1s
 *  - maps.google.com/?cid=<CID>                       → CID numérico
 *  - Nombre del negocio en la URL                     → fallback para Text Search
 */
function extractPlaceId(mapsUrl: string): string | null {
  try {
    // Formato más común: !1sChIJ... (Place ID en base64-like, URL-encoded)
    const chijMatch = mapsUrl.match(/!1s(ChIJ[^!&?]+)/);
    if (chijMatch) {
      return decodeURIComponent(chijMatch[1]);
    }

    // Formato CID: ?cid=12345678
    const cidMatch = mapsUrl.match(/[?&]cid=(\d+)/);
    if (cidMatch) {
      return cidMatch[1];
    }

    // Formato hex (!1s0x...) o cualquier otro: usar el nombre del negocio
    // de la URL para hacer Text Search — es más confiable que pasar el hex
    const nameMatch = mapsUrl.match(/\/maps\/place\/([^/@?]+)/);
    if (nameMatch) {
      return decodeURIComponent(nameMatch[1].replace(/\+/g, " "));
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Determina si el identificador extraído es un Place ID real o un nombre de texto.
 */
function isRealPlaceId(identifier: string): boolean {
  // Place ID real: empieza con ChIJ, es hex 0x..., o es un CID numérico largo
  return identifier.startsWith("ChIJ") || identifier.startsWith("0x") || /^\d{15,}$/.test(identifier);
}

class GooglePlacesClient {
  private readonly baseUrl = "https://maps.googleapis.com/maps/api/place";

  /**
   * Obtiene datos del negocio desde Google Places API usando la URL de Maps.
   * En DEMO_MODE devuelve datos stub sin consumir la API.
   */
  async getPlacesData(mapsUrl: string): Promise<PlacesResult> {
    if (env.DEMO_MODE || !env.GOOGLE_PLACES_API_KEY) {
      logger.info("google_places_demo_mode", { url: mapsUrl });
      await new Promise((r) => setTimeout(r, 300));
      return { ...DEMO_PLACES_STUB, fetched_at: new Date().toISOString() };
    }

    const identifier = extractPlaceId(mapsUrl);
    if (!identifier) {
      logger.warn("google_places_invalid_url", { url: mapsUrl });
      return { connected: false, fetched_at: new Date().toISOString() };
    }

    try {
      let placeId = identifier;

      // Si NO es un Place ID ChIJ directo, resolver primero con Text Search
      // (aplica para: nombres de texto, hex 0x..., CID numérico)
      if (!identifier.startsWith("ChIJ")) {
        const searchResp = await axios.get(`${this.baseUrl}/findplacefromtext/json`, {
          params: {
            input: identifier,
            inputtype: "textquery",
            fields: "place_id",
            key: env.GOOGLE_PLACES_API_KEY,
          },
          timeout: 8000,
        });
        placeId = searchResp.data.candidates?.[0]?.place_id;
        if (!placeId) {
          logger.warn("google_places_not_found", { identifier });
          return { connected: false, fetched_at: new Date().toISOString() };
        }
      }

      // Place Details — obtener todos los campos útiles para underwriting
      const detailsResp = await axios.get(`${this.baseUrl}/details/json`, {
        params: {
          place_id: placeId,
          fields: [
            "name",
            "rating",
            "user_ratings_total",
            "price_level",
            "types",
            "website",
            "opening_hours",
            "business_status",
            "geometry",
            "permanently_closed",
          ].join(","),
          key: env.GOOGLE_PLACES_API_KEY,
          language: "es-419",
        },
        timeout: 8000,
      });

      const p = detailsResp.data.result;
      if (!p) {
        return { connected: false, fetched_at: new Date().toISOString() };
      }

      const result: PlacesResult = {
        connected: true,
        place_id: placeId,
        business_name: p.name,
        rating: p.rating,
        total_review_count: p.user_ratings_total,
        price_level_index: p.price_level,
        categories: p.types ?? [],
        has_website: !!p.website,
        business_status: p.business_status ?? "UNKNOWN",
        is_verified: true, // Place Details solo devuelve negocios verificados
        fetched_at: new Date().toISOString(),
      };

      result.signals_score = this.computeSignalsScore(result);

      logger.info("google_places_fetched", {
        place_id: placeId,
        business_name: result.business_name,
        rating: result.rating,
        review_count: result.total_review_count,
        signals_score: result.signals_score,
      });

      return result;
    } catch (err) {
      logger.error("google_places_fetch_failed", { error: String(err), url: mapsUrl });
      return { connected: false, fetched_at: new Date().toISOString() };
    }
  }

  /**
   * Score compuesto 0–100 basado en señales públicas de Google Places.
   * Tabla de pesos alineada con la tabla consolidada de underwriting.
   */
  computeSignalsScore(data: PlacesResult): number {
    let score = 0;

    // Rating — Operational Quality (25 pts)
    if (data.rating) {
      if (data.rating >= 4.5) score += 25;
      else if (data.rating >= 4.0) score += 20;
      else if (data.rating >= 3.5) score += 12;
      else score += 5;
    }

    // Reseñas — Business Scale (20 pts)
    if (data.total_review_count) {
      if (data.total_review_count >= 200) score += 20;
      else if (data.total_review_count >= 100) score += 15;
      else if (data.total_review_count >= 50) score += 10;
      else if (data.total_review_count >= 10) score += 5;
    }

    // Verificado en Google (10 pts)
    if (data.is_verified) score += 10;

    // Tiene sitio web — señal de formalidad (10 pts)
    if (data.has_website) score += 10;

    // Negocio operativo (10 pts)
    if (data.business_status === "OPERATIONAL") score += 10;

    // Categoría es comercio real, no domicilio (10 pts)
    const commercialTypes = ["restaurant", "food", "store", "bakery", "cafe", "bar", "supermarket", "pharmacy"];
    const hasCommercialType = data.categories?.some((c) =>
      commercialTypes.some((t) => c.toLowerCase().includes(t))
    );
    if (hasCommercialType) score += 10;

    // Price level 3–4 → mayor ticket promedio, mejor margen (5 pts)
    if (data.price_level_index && data.price_level_index >= 3) score += 5;

    return Math.min(score, 100);
  }
}

export const googlePlacesClient = new GooglePlacesClient();
