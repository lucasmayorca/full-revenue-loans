import axios from "axios";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { FacebookResult, InstagramResult } from "../models/Application";

const GRAPH_BASE = "https://graph.facebook.com/v19.0";

// ── Stubs demo ────────────────────────────────────────────────────────────────

const DEMO_FACEBOOK_STUB: FacebookResult = {
  connected: true,
  page_name: "Panadería Demo",
  fan_count: 3200,
  rating: 4.5,
  review_count: 87,
  is_verified: false,
  website: "",
  fetched_at: new Date().toISOString(),
};

const DEMO_INSTAGRAM_STUB: InstagramResult = {
  connected: true,
  username: "panaderia_demo",
  followers_count: 1850,
  media_count: 142,
  is_business: true,
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
  ): Promise<{ id?: string; name?: string; email?: string }> {
    try {
      const meResp = await axios.get(`${GRAPH_BASE}/me`, {
        params: { access_token: userAccessToken, fields: "id,name,email" },
        timeout: 8000,
      });
      return {
        id: meResp.data.id,
        name: meResp.data.name,
        email: meResp.data.email,
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
      fetched_at: new Date().toISOString(),
    };

    if (!profile.id) {
      logger.warn("facebook_no_profile_data");
      return { connected: false, fetched_at: new Date().toISOString() };
    }

    // 2) Datos de Page — opcional, requiere pages_show_list + pages_read_engagement.
    // Si la app aún no tiene esos permisos aprobados, /me/accounts devuelve [] sin error.
    try {
      const pagesResp = await axios.get(`${GRAPH_BASE}/me/accounts`, {
        params: {
          access_token: userAccessToken,
          fields: "id,name,fan_count,overall_star_rating,rating_count,verification_status,website",
        },
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

      const result: FacebookResult = {
        ...baseResult,
        page_name: page.name,
        fan_count: page.fan_count,
        rating: page.overall_star_rating,
        review_count: page.rating_count,
        is_verified: page.verification_status === "blue_verified" || page.verification_status === "gray_verified",
        website: page.website ?? "",
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
      // Camino B: scopes básicos. Cuando se aprueben pages_show_list/instagram_basic
      // sumarlos acá: "public_profile,email,pages_show_list,pages_read_engagement,instagram_basic"
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

      // Datos del perfil de Instagram
      const igResp = await axios.get(`${GRAPH_BASE}/${igAccountId}`, {
        params: {
          access_token: userAccessToken,
          fields: "username,followers_count,media_count,account_type",
        },
        timeout: 8000,
      });

      const ig = igResp.data;
      const result: InstagramResult = {
        connected: true,
        username: ig.username,
        followers_count: ig.followers_count,
        media_count: ig.media_count,
        is_business: ig.account_type === "BUSINESS" || ig.account_type === "CREATOR",
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
