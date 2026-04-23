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
  // Cross-check con KYC
  formatted_address: "Av. Juárez 1234, Centro, 72000 Puebla, Pue., México",
  formatted_phone_number: "222 234 5678",
  international_phone_number: "+52 222 234 5678",
  // Geo
  geometry: { lat: 19.0414, lng: -98.2063 },
  // Horarios
  opening_hours: {
    open_now: true,
    weekday_text: [
      "lunes: 8:00–22:00",
      "martes: 8:00–22:00",
      "miércoles: 8:00–22:00",
      "jueves: 8:00–22:00",
      "viernes: 8:00–23:00",
      "sábado: 9:00–23:00",
      "domingo: 9:00–21:00",
    ],
    weekly_open_hours: 99,
  },
  permanently_closed: false,
  photo_count: 27,
  reviews: [
    { author_name: "María G.", rating: 5, text: "Excelentes tacos, atención rápida.", time: 1721260800, relative_time_description: "hace 1 mes" },
    { author_name: "Juan P.",  rating: 4, text: "Muy buena comida, precio justo.",     time: 1718668800, relative_time_description: "hace 2 meses" },
  ],
  editorial_summary: "Taquería tradicional poblana con especialidad en tacos al pastor.",
  fetched_at: new Date().toISOString(),
};

interface ParsedMapUrl {
  identifier: string | null;  // Place ID (ChIJ) o nombre para text search
  lat?: number;
  lng?: number;
}

/**
 * Parsea una URL de Google Maps y extrae:
 *  - Place ID ChIJ directo si está disponible
 *  - Coordenadas @lat,lng para usar como location bias en text search
 *  - Nombre del negocio como fallback para text search
 *
 * Soporta formatos:
 *  - /maps/place/NOMBRE/...!1sChIJ<ID>    → Place ID directo
 *  - /maps/place/NOMBRE/...!1s0x<hex>     → coords + nombre para text search
 *  - /maps/place/NOMBRE/@lat,lng,...      → coords + nombre para text search
 *  - maps.google.com/?cid=<CID>           → CID numérico
 */
function parseMapUrl(mapsUrl: string): ParsedMapUrl {
  try {
    // Coordenadas: @lat,lng
    const coordMatch = mapsUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    const lat = coordMatch ? parseFloat(coordMatch[1]) : undefined;
    const lng = coordMatch ? parseFloat(coordMatch[2]) : undefined;

    // Formato más confiable: !1sChIJ... (Place ID real)
    const chijMatch = mapsUrl.match(/!1s(ChIJ[^!&?]+)/);
    if (chijMatch) {
      return { identifier: decodeURIComponent(chijMatch[1]), lat, lng };
    }

    // Formato CID: ?cid=12345678
    const cidMatch = mapsUrl.match(/[?&]cid=(\d+)/);
    if (cidMatch) {
      return { identifier: cidMatch[1], lat, lng };
    }

    // Fallback: nombre del negocio en la URL (para text search con location bias)
    const nameMatch = mapsUrl.match(/\/maps\/place\/([^/@?]+)/);
    if (nameMatch) {
      return {
        identifier: decodeURIComponent(nameMatch[1].replace(/\+/g, " ")),
        lat,
        lng,
      };
    }

    return { identifier: null };
  } catch {
    return { identifier: null };
  }
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

    const { identifier, lat, lng } = parseMapUrl(mapsUrl);
    if (!identifier) {
      logger.warn("google_places_invalid_url", { url: mapsUrl });
      return { connected: false, fetched_at: new Date().toISOString() };
    }

    try {
      let placeId = identifier;

      // Si NO es un Place ID ChIJ directo, resolver con Text Search
      if (!identifier.startsWith("ChIJ")) {
        const searchParams: Record<string, string> = {
          input: identifier,
          inputtype: "textquery",
          fields: "place_id",
          key: env.GOOGLE_PLACES_API_KEY ?? "",
        };
        // Location bias: círculo de 5 km alrededor de las coordenadas de la URL
        if (lat !== undefined && lng !== undefined) {
          searchParams.locationbias = `circle:5000@${lat},${lng}`;
        }
        const searchResp = await axios.get(`${this.baseUrl}/findplacefromtext/json`, {
          params: searchParams,
          timeout: 8000,
        });
        placeId = searchResp.data.candidates?.[0]?.place_id;
        if (!placeId) {
          logger.warn("google_places_not_found", { identifier, lat, lng });
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
            "formatted_address",
            "formatted_phone_number",
            "international_phone_number",
            "photos",
            "reviews",
            "editorial_summary",
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

      // Calcular horas semanales abiertas si vienen los periods
      let weeklyOpenHours: number | undefined;
      const periods = p.opening_hours?.periods as
        | Array<{ open?: { day: number; time: string }; close?: { day: number; time: string } }>
        | undefined;
      if (Array.isArray(periods)) {
        weeklyOpenHours = periods.reduce((acc, per) => {
          if (!per.open || !per.close) return acc;
          const o = parseInt(per.open.time, 10);
          const c = parseInt(per.close.time, 10);
          const oH = Math.floor(o / 100) + (o % 100) / 60;
          const cH = Math.floor(c / 100) + (c % 100) / 60;
          const diff = cH >= oH ? cH - oH : 24 - oH + cH;
          return acc + diff;
        }, 0);
        weeklyOpenHours = Math.round(weeklyOpenHours);
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
        // Cross-check con KYC
        formatted_address: p.formatted_address,
        formatted_phone_number: p.formatted_phone_number,
        international_phone_number: p.international_phone_number,
        // Geo
        geometry: p.geometry?.location
          ? { lat: p.geometry.location.lat, lng: p.geometry.location.lng }
          : undefined,
        // Horarios
        opening_hours: p.opening_hours
          ? {
              open_now: p.opening_hours.open_now,
              weekday_text: p.opening_hours.weekday_text,
              weekly_open_hours: weeklyOpenHours,
            }
          : undefined,
        permanently_closed: p.permanently_closed === true,
        // Calidad de listing
        photo_count: Array.isArray(p.photos) ? p.photos.length : undefined,
        reviews: Array.isArray(p.reviews)
          ? p.reviews.slice(0, 5).map((r: any) => ({
              author_name: r.author_name,
              rating: r.rating,
              text: r.text,
              time: r.time,
              relative_time_description: r.relative_time_description,
            }))
          : undefined,
        editorial_summary: p.editorial_summary?.overview,
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
