import axios from "axios";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { GoogleBusinessData } from "../models/Application";

export interface GoogleTokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
}

// Datos demo realistas para DEMO_MODE
const DEMO_BUSINESS_DATA: GoogleBusinessData = {
  // Google Business Profile
  business_name: "Restaurante Demo MX",
  rating: 4.3,
  review_count: 187,
  is_verified: true,
  categories: ["Restaurante mexicano", "Comida para llevar"],
  // Performance últimos 90 días
  profile_views: 3240,
  search_impressions: 8900,
  direction_requests: 412,
  phone_calls: 98,
  website_clicks: 560,
  // Google Analytics (GA4)
  ga4_monthly_sessions: 1850,
  ga4_monthly_users: 1200,
  ga4_estimated_revenue: 38000, // MXN/mes — ingresos digitales estimados
  data_points: 90,
  fetched_at: new Date().toISOString(),
};

class GoogleClient {
  buildAuthUrl(applicationId: string): string {
    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: env.GOOGLE_REDIRECT_URI,
      response_type: "code",
      scope: [
        // Business Profile — reseñas, performance, verificación
        "https://www.googleapis.com/auth/business.manage",
        // Analytics — tráfico y tendencias
        "https://www.googleapis.com/auth/analytics.readonly",
        "profile",
        "email",
      ].join(" "),
      access_type: "offline",
      prompt: "consent",
      state: applicationId,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<GoogleTokens> {
    if (env.DEMO_MODE) {
      logger.info("google_demo_mode_exchange");
      return {
        access_token: "demo_access_token_" + Date.now(),
        refresh_token: "demo_refresh_token_" + Date.now(),
        expiry_date: Date.now() + 3600 * 1000,
      };
    }

    const response = await axios.post(
      "https://oauth2.googleapis.com/token",
      new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: env.GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }).toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    logger.info("google_token_exchanged", {
      has_refresh_token: !!response.data.refresh_token,
    });

    return {
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
      expiry_date: Date.now() + response.data.expires_in * 1000,
    };
  }

  /**
   * Obtiene todos los datos útiles para underwriting:
   * - Google Business Profile: reseñas, rating, categorías, verificación
   * - Business Performance API: vistas, búsquedas, solicitudes de ruta, llamadas
   * - Google Analytics GA4: sesiones, usuarios, ingresos estimados
   */
  async getBusinessData(accessToken: string): Promise<GoogleBusinessData> {
    if (env.DEMO_MODE || accessToken.startsWith("demo_")) {
      logger.info("google_demo_mode_business_data");
      await new Promise((r) => setTimeout(r, 300)); // simular latencia
      return { ...DEMO_BUSINESS_DATA, fetched_at: new Date().toISOString() };
    }

    const now = new Date().toISOString();
    let businessData: GoogleBusinessData = {
      data_points: 0,
      fetched_at: now,
    };

    // 1. Google Business Profile — info básica y reseñas
    try {
      const accountsResp = await axios.get(
        "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
        { headers: { Authorization: `Bearer ${accessToken}` }, timeout: 8000 }
      );
      const accountName = accountsResp.data.accounts?.[0]?.name;

      if (accountName) {
        const locationsResp = await axios.get(
          `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title,categories,metadata`,
          { headers: { Authorization: `Bearer ${accessToken}` }, timeout: 8000 }
        );
        const location = locationsResp.data.locations?.[0];
        if (location) {
          businessData.business_name = location.title;
          businessData.is_verified = location.metadata?.mapsUri ? true : false;
          businessData.categories = location.categories?.additionalCategories?.map(
            (c: { displayName: string }) => c.displayName
          ) ?? [];

          // Reviews
          const reviewsResp = await axios.get(
            `https://mybusiness.googleapis.com/v4/${location.name}/reviews?pageSize=1`,
            { headers: { Authorization: `Bearer ${accessToken}` }, timeout: 8000 }
          );
          businessData.rating = reviewsResp.data.averageRating;
          businessData.review_count = reviewsResp.data.totalReviewCount;
          businessData.data_points += 1;
        }

        // 2. Business Performance API — últimos 90 días
        try {
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - 90);
          const perfResp = await axios.post(
            `https://businessprofileperformance.googleapis.com/v1/${accountName}/locations:fetchMultiDailyMetricsTimeSeries`,
            {
              dailyMetrics: [
                "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
                "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
                "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
                "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
                "BUSINESS_DIRECTION_REQUESTS",
                "CALL_CLICKS",
                "WEBSITE_CLICKS",
              ],
              dailyRange: {
                startDate: {
                  year: startDate.getFullYear(),
                  month: startDate.getMonth() + 1,
                  day: startDate.getDate(),
                },
                endDate: {
                  year: new Date().getFullYear(),
                  month: new Date().getMonth() + 1,
                  day: new Date().getDate(),
                },
              },
            },
            { headers: { Authorization: `Bearer ${accessToken}` }, timeout: 10000 }
          );

          const sumMetric = (metricName: string): number => {
            const series = perfResp.data.multiDailyMetricTimeSeries?.find(
              (s: { dailyMetric: string }) => s.dailyMetric === metricName
            );
            return (
              series?.timeSeries?.datedValues?.reduce(
                (acc: number, v: { value?: string }) => acc + Number(v.value ?? 0),
                0
              ) ?? 0
            );
          };

          businessData.profile_views =
            sumMetric("BUSINESS_IMPRESSIONS_DESKTOP_MAPS") +
            sumMetric("BUSINESS_IMPRESSIONS_MOBILE_MAPS");
          businessData.search_impressions =
            sumMetric("BUSINESS_IMPRESSIONS_DESKTOP_SEARCH") +
            sumMetric("BUSINESS_IMPRESSIONS_MOBILE_SEARCH");
          businessData.direction_requests = sumMetric("BUSINESS_DIRECTION_REQUESTS");
          businessData.phone_calls = sumMetric("CALL_CLICKS");
          businessData.website_clicks = sumMetric("WEBSITE_CLICKS");
          businessData.data_points += 1;
        } catch (perfErr) {
          logger.warn("google_performance_api_failed", { error: String(perfErr) });
        }
      }
    } catch (bpErr) {
      logger.warn("google_business_profile_failed", { error: String(bpErr) });
    }

    // 3. Google Analytics GA4 — tráfico e ingresos digitales
    try {
      const propertiesResp = await axios.get(
        "https://analyticsadmin.googleapis.com/v1beta/properties?filter=parent:accounts/-",
        { headers: { Authorization: `Bearer ${accessToken}` }, timeout: 8000 }
      );
      const propertyId = propertiesResp.data.properties?.[0]?.name?.replace(
        "properties/",
        ""
      );

      if (propertyId) {
        const gaResp = await axios.post(
          `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
          {
            dateRanges: [{ startDate: "90daysAgo", endDate: "today" }],
            metrics: [
              { name: "sessions" },
              { name: "activeUsers" },
              { name: "purchaseRevenue" },
            ],
          },
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            timeout: 10000,
          }
        );

        const row = gaResp.data.rows?.[0]?.metricValues;
        if (row) {
          businessData.ga4_monthly_sessions = Math.round(Number(row[0]?.value ?? 0) / 3);
          businessData.ga4_monthly_users = Math.round(Number(row[1]?.value ?? 0) / 3);
          businessData.ga4_estimated_revenue = Math.round(Number(row[2]?.value ?? 0) / 3);
          businessData.data_points += 1;
        }
      }
    } catch (gaErr) {
      logger.warn("google_analytics_failed", { error: String(gaErr) });
    }

    businessData.fetched_at = new Date().toISOString();
    return businessData;
  }

  /**
   * Calcula un score compuesto 0–100 basado en señales de negocio de Google.
   * Usado como input al underwriting (no reemplaza ventas SAT, sino que las complementa).
   */
  computeSignalsScore(data: GoogleBusinessData): number {
    let score = 0;

    // Rating: hasta 25 pts (4.5+ = 25, 4.0 = 20, 3.5 = 12, <3 = 0)
    if (data.rating) {
      if (data.rating >= 4.5) score += 25;
      else if (data.rating >= 4.0) score += 20;
      else if (data.rating >= 3.5) score += 12;
      else score += 5;
    }

    // Cantidad de reseñas: hasta 15 pts
    if (data.review_count) {
      if (data.review_count >= 200) score += 15;
      else if (data.review_count >= 100) score += 10;
      else if (data.review_count >= 50) score += 6;
      else if (data.review_count >= 10) score += 3;
    }

    // Negocio verificado: 10 pts
    if (data.is_verified) score += 10;

    // Vistas de perfil (90 días): hasta 15 pts
    if (data.profile_views) {
      if (data.profile_views >= 5000) score += 15;
      else if (data.profile_views >= 2000) score += 10;
      else if (data.profile_views >= 500) score += 5;
    }

    // Solicitudes de dirección (señal de tráfico físico): hasta 10 pts
    if (data.direction_requests) {
      if (data.direction_requests >= 500) score += 10;
      else if (data.direction_requests >= 200) score += 7;
      else if (data.direction_requests >= 50) score += 3;
    }

    // Llamadas + clicks web: hasta 10 pts
    const engagement = (data.phone_calls ?? 0) + (data.website_clicks ?? 0);
    if (engagement >= 500) score += 10;
    else if (engagement >= 200) score += 6;
    else if (engagement >= 50) score += 3;

    // GA4 — sesiones mensuales: hasta 10 pts
    if (data.ga4_monthly_sessions) {
      if (data.ga4_monthly_sessions >= 2000) score += 10;
      else if (data.ga4_monthly_sessions >= 500) score += 6;
      else if (data.ga4_monthly_sessions >= 100) score += 3;
    }

    // GA4 — ingresos digitales: hasta 5 pts
    if (data.ga4_estimated_revenue && data.ga4_estimated_revenue > 0) score += 5;

    return Math.min(score, 100);
  }
}

export const googleClient = new GoogleClient();
