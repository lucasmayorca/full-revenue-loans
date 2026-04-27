import axios from "axios";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { FacebookResult, InstagramResult } from "../models/Application";

const GRAPH_BASE = "https://graph.facebook.com/v19.0";

// ── Stubs demo ────────────────────────────────────────────────────────────────

const DEMO_FACEBOOK_STUB: FacebookResult = {
  connected: true,
  // Identidad enriquecida (demo)
  user_id: "10001234567890",
  user_name: "Juan Pérez Demo",
  user_email: "juan.demo@example.com",
  user_picture_url: "https://graph.facebook.com/10001234567890/picture?type=large",
  user_verified: false,
  user_profile_link: "https://www.facebook.com/juan.demo.123",
  // Page
  page_id: "100066543210987",
  page_name: "Panadería Demo",
  fan_count: 3200,
  rating: 4.5,
  review_count: 87,
  is_verified: false,
  website: "https://panaderiademo.mx",
  page_created_time: "2018-03-12T10:00:00+0000",
  page_age_years: 8,
  category: "Bakery",
  category_list: ["Bakery", "Coffee Shop"],
  page_phone: "+52 222 234 5678",
  page_emails: ["contacto@panaderiademo.mx"],
  page_address: "Av. Juárez 1234, Centro, 72000 Puebla, Pue.",
  page_location: {
    city: "Puebla",
    state: "Puebla",
    country: "Mexico",
    zip: "72000",
    latitude: 19.0414,
    longitude: -98.2063,
  },
  // Tracción
  checkins: 412,
  talking_about_count: 184,
  were_here_count: 936,
  posts_last_30d: 12,
  // Status
  is_published: true,
  is_permanently_closed: false,
  parent_page_id: undefined,
  payment_options: ["cash", "debit", "credit"],
  price_range: "$$",
  restaurant_specialties: ["Panadería", "Repostería"],
  fetched_at: new Date().toISOString(),
};

const DEMO_INSTAGRAM_STUB: InstagramResult = {
  connected: true,
  username: "panaderia_demo",
  name: "Panadería Demo",
  biography: "🍞 Pan artesanal · Repostería · Pedidos al WhatsApp",
  website: "https://panaderiademo.mx",
  profile_picture_url: "https://scontent.cdninstagram.com/v/demo.jpg",
  followers_count: 1850,
  media_count: 142,
  is_business: true,
  // Engagement demo
  recent_media: [
    { id: "m1", like_count: 145, comments_count: 12, timestamp: "2026-04-15T10:00:00Z" },
    { id: "m2", like_count: 98,  comments_count: 7,  timestamp: "2026-04-12T10:00:00Z" },
    { id: "m3", like_count: 210, comments_count: 18, timestamp: "2026-04-08T10:00:00Z" },
  ],
  avg_likes_per_post: 151,
  avg_comments_per_post: 12,
  engagement_rate: 0.088,    // (151+12)/1850
  posts_last_30d: 9,
  insights: {
    reach_28d: 8400,
    impressions_28d: 21500,
    profile_views_28d: 612,
  },
  shopping_product_tag_eligibility: false,
  fetched_at: new Date().toISOString(),
};

// ── Facebook Pages ────────────────────────────────────────────────────────────

class FacebookClient {
  /**
   * Trae datos de la Facebook Page vinculada al access_token del usuario.
   * El token se obtiene tras el OAuth flow de Facebook Login.
   */
  /**
   * Trae datos básicos del usuario autenticado (public_profile + email).
   * No requiere permisos avanzados.
   */
  private async getUserProfile(
    userAccessToken: string
  ): Promise<{
    id?: string;
    name?: string;
    email?: string;
    picture_url?: string;
    verified?: boolean;
    profile_link?: string;
  }> {
    try {
      const meResp = await axios.get(`${GRAPH_BASE}/me`, {
        params: {
          access_token: userAccessToken,
          // verified/link requieren scopes adicionales — si no están aprobados Graph
          // los devuelve como undefined sin romper el resto de la respuesta.
          fields: "id,name,email,picture.type(large),verified,link",
        },
        timeout: 8000,
      });
      return {
        id: meResp.data.id,
        name: meResp.data.name,
        email: meResp.data.email,
        picture_url: meResp.data.picture?.data?.url,
        verified: meResp.data.verified,
        profile_link: meResp.data.link,
      };
    } catch (err) {
      logger.warn("facebook_me_fetch_failed", { error: String(err) });
      return {};
    }
  }

  async getPageData(userAccessToken: string): Promise<FacebookResult> {
    if (env.DEMO_MODE || !env.FACEBOOK_APP_ID) {
      logger.info("facebook_demo_mode");
      await new Promise((r) => setTimeout(r, 200));
      return { ...DEMO_FACEBOOK_STUB, fetched_at: new Date().toISOString() };
    }

    // 1) Identidad básica — siempre se intenta primero (alcanza con public_profile + email)
    const profile = await this.getUserProfile(userAccessToken);
    const baseResult: FacebookResult = {
      connected: !!profile.id,
      user_id: profile.id,
      user_name: profile.name,
      user_email: profile.email,
      user_picture_url: profile.picture_url,
      user_verified: profile.verified,
      user_profile_link: profile.profile_link,
      fetched_at: new Date().toISOString(),
    };

    if (!profile.id) {
      logger.warn("facebook_no_profile_data");
      return { connected: false, fetched_at: new Date().toISOString() };
    }

    // 2) Datos de Page — opcional, requiere pages_show_list + pages_read_engagement.
    // Si la app aún no tiene esos permisos aprobados, /me/accounts devuelve [] sin error.
    try {
      const pageFields = [
        "id",
        "name",
        "fan_count",
        "overall_star_rating",
        "rating_count",
        "verification_status",
        "website",
        "created_time",
        "category",
        "category_list",
        "phone",
        "emails",
        "single_line_address",
        "location",
        "checkins",
        "talking_about_count",
        "were_here_count",
        "is_published",
        "is_permanently_closed",
        "parent_page",
        "payment_options",
        "price_range",
        "restaurant_specialties",
      ].join(",");

      const pagesResp = await axios.get(`${GRAPH_BASE}/me/accounts`, {
        params: { access_token: userAccessToken, fields: pageFields },
        timeout: 8000,
      });

      const page = pagesResp.data.data?.[0];
      if (!page) {
        logger.info("facebook_identity_only", {
          user_id: profile.id,
          has_email: !!profile.email,
        });
        return baseResult;
      }

      // Years since creation
      let pageAgeYears: number | undefined;
      if (page.created_time) {
        const ageMs = Date.now() - Date.parse(page.created_time);
        pageAgeYears = ageMs > 0 ? Math.floor(ageMs / (365.25 * 86400_000)) : undefined;
      }

      // Posts last 30d — best-effort (requiere pages_read_engagement)
      let postsLast30d: number | undefined;
      try {
        const since = Math.floor((Date.now() - 30 * 86400_000) / 1000);
        const postsResp = await axios.get(`${GRAPH_BASE}/${page.id}/posts`, {
          params: { access_token: userAccessToken, since, limit: 100, fields: "id" },
          timeout: 6000,
        });
        postsLast30d = Array.isArray(postsResp.data?.data) ? postsResp.data.data.length : undefined;
      } catch {
        // sin permiso → undefined
      }

      const result: FacebookResult = {
        ...baseResult,
        page_id: page.id,
        page_name: page.name,
        fan_count: page.fan_count,
        rating: page.overall_star_rating,
        review_count: page.rating_count,
        is_verified: page.verification_status === "blue_verified" || page.verification_status === "gray_verified",
        website: page.website ?? "",
        page_created_time: page.created_time,
        page_age_years: pageAgeYears,
        category: page.category,
        category_list: Array.isArray(page.category_list)
          ? page.category_list.map((c: { name: string }) => c.name)
          : undefined,
        page_phone: page.phone,
        page_emails: Array.isArray(page.emails) ? page.emails : undefined,
        page_address: page.single_line_address,
        page_location: page.location
          ? {
              city: page.location.city,
              state: page.location.state,
              country: page.location.country,
              zip: page.location.zip,
              latitude: page.location.latitude,
              longitude: page.location.longitude,
            }
          : undefined,
        checkins: page.checkins,
        talking_about_count: page.talking_about_count,
        were_here_count: page.were_here_count,
        posts_last_30d: postsLast30d,
        is_published: page.is_published,
        is_permanently_closed: page.is_permanently_closed,
        parent_page_id: page.parent_page?.id,
        payment_options:
          page.payment_options && typeof page.payment_options === "object"
            ? Object.keys(page.payment_options).filter((k) => page.payment_options[k] === 1)
            : undefined,
        price_range: page.price_range,
        restaurant_specialties:
          page.restaurant_specialties && typeof page.restaurant_specialties === "object"
            ? Object.keys(page.restaurant_specialties).filter((k) => page.restaurant_specialties[k] === 1)
            : undefined,
      };

      logger.info("facebook_data_fetched", {
        page_name: result.page_name,
        fan_count: result.fan_count,
        rating: result.rating,
      });

      return result;
    } catch (err) {
      // Page fetch falló (probable: sin permiso aprobado). No romper el flow,
      // devolvemos la identidad que ya validamos.
      logger.warn("facebook_pages_unavailable", { error: String(err) });
      return baseResult;
    }
  }

  /**
   * Construye la URL de autorización OAuth de Facebook.
   * Scopes: pages_show_list, pages_read_engagement, instagram_basic
   */
  buildAuthUrl(applicationId: string): string {
    const params = new URLSearchParams({
      client_id: env.FACEBOOK_APP_ID,
      redirect_uri: `${env.BACKEND_URL}/full-revenue/oauth/facebook/callback`,
      // Camino B (sin App Review): solo public_profile + email.
      // pages_show_list, pages_read_engagement, instagram_basic requieren App Review aprobado.
      scope: "public_profile,email",
      state: applicationId,
      response_type: "code",
    });
    return `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
  }

  /**
   * Intercambia el code de autorización por un access_token.
   */
  async exchangeCode(code: string): Promise<string> {
    const resp = await axios.get(`${GRAPH_BASE}/oauth/access_token`, {
      params: {
        client_id: env.FACEBOOK_APP_ID,
        client_secret: env.FACEBOOK_APP_SECRET,
        redirect_uri: `${env.BACKEND_URL}/full-revenue/oauth/facebook/callback`,
        code,
      },
      timeout: 8000,
    });
    return resp.data.access_token;
  }
}

// ── Instagram Business ────────────────────────────────────────────────────────

class InstagramClient {
  /**
   * Trae datos del perfil de Instagram Business vinculado a la Facebook Page.
   * Requiere el Page Access Token (no el User Token).
   */
  async getProfileData(userAccessToken: string): Promise<InstagramResult> {
    if (env.DEMO_MODE || !env.FACEBOOK_APP_ID) {
      logger.info("instagram_demo_mode");
      await new Promise((r) => setTimeout(r, 150));
      return { ...DEMO_INSTAGRAM_STUB, fetched_at: new Date().toISOString() };
    }

    try {
      // Obtener el Instagram Business Account vinculado a la primera Page
      const pagesResp = await axios.get(`${GRAPH_BASE}/me/accounts`, {
        params: { access_token: userAccessToken, fields: "id,instagram_business_account" },
        timeout: 8000,
      });

      const igAccountId = pagesResp.data.data?.[0]?.instagram_business_account?.id;
      if (!igAccountId) {
        logger.warn("instagram_no_business_account");
        return { connected: false, fetched_at: new Date().toISOString() };
      }

      // Datos del perfil de Instagram (campos enriquecidos)
      const igResp = await axios.get(`${GRAPH_BASE}/${igAccountId}`, {
        params: {
          access_token: userAccessToken,
          fields: [
            "username",
            "name",
            "biography",
            "website",
            "profile_picture_url",
            "followers_count",
            "media_count",
            "account_type",
            "shopping_product_tag_eligibility",
          ].join(","),
        },
        timeout: 8000,
      });

      const ig = igResp.data;

      // Engagement: traer hasta 25 posts recientes con like/comment count
      let recentMedia: Array<{ id?: string; like_count?: number; comments_count?: number; timestamp?: string }> = [];
      let avgLikes: number | undefined;
      let avgComments: number | undefined;
      let engagementRate: number | undefined;
      let postsLast30d: number | undefined;
      try {
        const mediaResp = await axios.get(`${GRAPH_BASE}/${igAccountId}/media`, {
          params: {
            access_token: userAccessToken,
            fields: "id,like_count,comments_count,timestamp",
            limit: 25,
          },
          timeout: 6000,
        });
        recentMedia = Array.isArray(mediaResp.data?.data) ? mediaResp.data.data : [];

        const likes = recentMedia.map((m) => m.like_count ?? 0);
        const comments = recentMedia.map((m) => m.comments_count ?? 0);
        if (recentMedia.length > 0) {
          avgLikes = Math.round(likes.reduce((a, b) => a + b, 0) / recentMedia.length);
          avgComments = Math.round(comments.reduce((a, b) => a + b, 0) / recentMedia.length);
          if (ig.followers_count) {
            engagementRate = Number(((avgLikes + avgComments) / ig.followers_count).toFixed(4));
          }
        }
        const cutoff = Date.now() - 30 * 86400_000;
        postsLast30d = recentMedia.filter(
          (m) => m.timestamp && Date.parse(m.timestamp) >= cutoff
        ).length;
      } catch {
        // sin permiso → métricas quedan undefined
      }

      // Insights (requiere instagram_manage_insights — best-effort)
      let insights: { reach_28d?: number; impressions_28d?: number; profile_views_28d?: number } | undefined;
      try {
        const insResp = await axios.get(`${GRAPH_BASE}/${igAccountId}/insights`, {
          params: {
            access_token: userAccessToken,
            metric: "reach,impressions,profile_views",
            period: "days_28",
          },
          timeout: 6000,
        });
        const arr = insResp.data?.data ?? [];
        const pick = (name: string): number | undefined => {
          const item = arr.find((x: { name: string }) => x.name === name);
          return item?.values?.[0]?.value;
        };
        insights = {
          reach_28d: pick("reach"),
          impressions_28d: pick("impressions"),
          profile_views_28d: pick("profile_views"),
        };
      } catch {
        // sin permiso
      }

      const result: InstagramResult = {
        connected: true,
        username: ig.username,
        name: ig.name,
        biography: ig.biography,
        website: ig.website,
        profile_picture_url: ig.profile_picture_url,
        followers_count: ig.followers_count,
        media_count: ig.media_count,
        is_business: ig.account_type === "BUSINESS" || ig.account_type === "CREATOR",
        recent_media: recentMedia.length > 0 ? recentMedia : undefined,
        avg_likes_per_post: avgLikes,
        avg_comments_per_post: avgComments,
        engagement_rate: engagementRate,
        posts_last_30d: postsLast30d,
        insights,
        shopping_product_tag_eligibility: ig.shopping_product_tag_eligibility,
        fetched_at: new Date().toISOString(),
      };

      logger.info("instagram_data_fetched", {
        username: result.username,
        followers: result.followers_count,
        media_count: result.media_count,
      });

      return result;
    } catch (err) {
      logger.error("instagram_fetch_failed", { error: String(err) });
      return { connected: false, fetched_at: new Date().toISOString() };
    }
  }
}

export const facebookClient = new FacebookClient();
export const instagramClient = new InstagramClient();
