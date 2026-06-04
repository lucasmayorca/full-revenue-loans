#!/usr/bin/env node
/**
 * seed_social_data.js
 *
 * Patches existing applications that lack page-level Facebook/Instagram data
 * with realistic mock profiles. Also recomputes composite scores for the
 * decision_payload using the same formula as underwriting.service.ts.
 *
 * Usage (from project root):
 *   cd backend && DATABASE_URL=postgres://... node scripts/seed_social_data.js
 *   -- or via Railway env injection --
 *   cd backend && npx --yes @railway/cli run node scripts/seed_social_data.js
 */

const { Pool } = require("pg");

// ── Mock profiles ──────────────────────────────────────────────────────────────
// 4 realistic Mexican food-business profiles. Assigned deterministically per app.
const FB_PROFILES = [
  {
    // Thriving restaurant — fuerte presencia digital
    page_name: "El Buen Taco MX",
    fan_count: 2847,
    rating: 4.6,
    review_count: 312,
    is_verified: true,
    page_age_years: 8,
    checkins: 1240,
    were_here_count: 980,
    posts_last_30d: 14,
    avg_reactions_per_post: 47,
    avg_comments_per_post: 8,
    is_permanently_closed: false,
    category: "Restaurante",
    price_range: "$$",
  },
  {
    // Sólido negocio mediano
    page_name: "Mariscos Don Pepe",
    fan_count: 890,
    rating: 4.2,
    review_count: 87,
    is_verified: false,
    page_age_years: 4,
    checkins: 230,
    were_here_count: 315,
    posts_last_30d: 8,
    avg_reactions_per_post: 23,
    avg_comments_per_post: 4,
    is_permanently_closed: false,
    category: "Mariscos",
    price_range: "$$",
  },
  {
    // Negocio de barrio, presencia modesta
    page_name: "Pizza Express Local",
    fan_count: 210,
    rating: 3.8,
    review_count: 42,
    is_verified: false,
    page_age_years: 2,
    checkins: 47,
    were_here_count: 63,
    posts_last_30d: 4,
    avg_reactions_per_post: 9,
    avg_comments_per_post: 2,
    is_permanently_closed: false,
    category: "Pizzería",
    price_range: "$",
  },
  {
    // Presencia digital mínima
    page_name: "Cocina Casera MX",
    fan_count: 85,
    rating: 4.1,
    review_count: 18,
    is_verified: false,
    page_age_years: 1,
    checkins: 12,
    were_here_count: 28,
    posts_last_30d: 2,
    avg_reactions_per_post: 4,
    avg_comments_per_post: 1,
    is_permanently_closed: false,
    category: "Cocina mexicana",
    price_range: "$",
  },
];

const IG_PROFILES = [
  {
    connected: true,
    username: "elbuenstaco_mx",
    name: "El Buen Taco MX",
    is_business: true,
    followers_count: 3200,
    media_count: 186,
    posts_last_30d: 12,
    avg_likes_per_post: 152,
    avg_comments_per_post: 11,
    engagement_rate: 0.052, // 5.2%
  },
  {
    connected: true,
    username: "mariscos_donpepe_oficial",
    name: "Mariscos Don Pepe",
    is_business: true,
    followers_count: 1140,
    media_count: 94,
    posts_last_30d: 8,
    avg_likes_per_post: 34,
    avg_comments_per_post: 5,
    engagement_rate: 0.034, // 3.4%
  },
  {
    // Pizza Express no conectó Instagram
    connected: false,
  },
  {
    connected: true,
    username: "cocinacasera_mx",
    name: "Cocina Casera MX",
    is_business: true,
    followers_count: 380,
    media_count: 38,
    posts_last_30d: 4,
    avg_likes_per_post: 7,
    avg_comments_per_post: 1,
    engagement_rate: 0.021, // 2.1%
  },
];

// ── Scoring (espejo exacto de underwriting.service.ts) ────────────────────────

function computeFacebookScore(fb) {
  if (!fb.connected || fb.is_permanently_closed) return 0;
  let score = 0;

  if (fb.fan_count !== undefined) {
    if (fb.fan_count >= 50000)      score += 25;
    else if (fb.fan_count >= 10000) score += 20;
    else if (fb.fan_count >= 5000)  score += 15;
    else if (fb.fan_count >= 1000)  score += 10;
    else if (fb.fan_count >= 200)   score += 5;
  }
  if (fb.rating !== undefined && fb.rating > 0) {
    score += Math.round(((fb.rating - 1) / 4) * 20);
  }
  if (fb.review_count !== undefined) {
    if (fb.review_count >= 500)      score += 10;
    else if (fb.review_count >= 200) score += 8;
    else if (fb.review_count >= 50)  score += 5;
    else if (fb.review_count >= 10)  score += 2;
  }
  if (fb.page_age_years !== undefined) {
    if (fb.page_age_years >= 5)      score += 10;
    else if (fb.page_age_years >= 3) score += 7;
    else if (fb.page_age_years >= 1) score += 4;
  }
  const physical = (fb.were_here_count ?? 0) + (fb.checkins ?? 0);
  if (physical >= 1000)     score += 10;
  else if (physical >= 200) score += 7;
  else if (physical >= 50)  score += 4;

  const avgReactions = fb.avg_reactions_per_post ?? 0;
  if (avgReactions >= 100)     score += 10;
  else if (avgReactions >= 30) score += 7;
  else if (avgReactions >= 10) score += 4;
  else if (avgReactions >= 1)  score += 1;

  if (fb.posts_last_30d !== undefined) {
    if (fb.posts_last_30d >= 12)     score += 10;
    else if (fb.posts_last_30d >= 6) score += 7;
    else if (fb.posts_last_30d >= 2) score += 4;
    else if (fb.posts_last_30d >= 1) score += 2;
  }
  if (fb.is_verified) score += 5;

  return Math.min(score, 100);
}

function computeInstagramScore(ig) {
  if (!ig.connected) return 0;
  let score = 0;

  if (ig.engagement_rate !== undefined) {
    if (ig.engagement_rate >= 0.08)      score += 40;
    else if (ig.engagement_rate >= 0.05) score += 32;
    else if (ig.engagement_rate >= 0.03) score += 24;
    else if (ig.engagement_rate >= 0.01) score += 14;
    else                                  score += 5;
  }
  if (ig.followers_count !== undefined) {
    if (ig.followers_count >= 50000)      score += 25;
    else if (ig.followers_count >= 10000) score += 20;
    else if (ig.followers_count >= 5000)  score += 15;
    else if (ig.followers_count >= 1000)  score += 10;
    else if (ig.followers_count >= 200)   score += 4;
  }
  if (ig.posts_last_30d !== undefined) {
    if (ig.posts_last_30d >= 16)     score += 15;
    else if (ig.posts_last_30d >= 8) score += 10;
    else if (ig.posts_last_30d >= 4) score += 6;
    else if (ig.posts_last_30d >= 1) score += 3;
  }
  if (ig.media_count !== undefined) {
    if (ig.media_count >= 200)      score += 10;
    else if (ig.media_count >= 50)  score += 6;
    else if (ig.media_count >= 10)  score += 3;
  }
  if (ig.is_business) score += 5;

  return Math.min(score, 100);
}

// ── Deterministic profile picker ──────────────────────────────────────────────
function pickIdx(appId) {
  let hash = 0;
  for (let i = 0; i < appId.length; i++) {
    hash = (hash * 31 + appId.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % FB_PROFILES.length;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("ERROR: DATABASE_URL not set.");
    console.error("Run with: DATABASE_URL=postgres://... node scripts/seed_social_data.js");
    console.error("Or from Railway: cd backend && npx --yes @railway/cli run node scripts/seed_social_data.js");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: dbUrl.includes("localhost") ? false : { rejectUnauthorized: false },
  });

  const { rows } = await pool.query(
    `SELECT id, data FROM applications ORDER BY created_at ASC`
  );
  console.log(`\nFound ${rows.length} applications\n`);

  let patched = 0;
  let skipped = 0;

  for (const row of rows) {
    const appId = row.id;
    const data  = row.data;

    const hasFbPage  = data.facebook_result?.fan_count != null;
    const hasScores  = data.decision_payload?.facebook_composite_score != null;

    if (hasFbPage && hasScores) {
      console.log(`  — ${appId.slice(0, 8)} already has social data, skipping`);
      skipped++;
      continue;
    }

    const idx       = pickIdx(appId);
    const fbProfile = FB_PROFILES[idx];
    const igProfile = IG_PROFILES[idx];

    // Merge mock page data over existing basic OAuth identity fields
    const existingFb = data.facebook_result ?? {};
    const newFb = {
      ...existingFb,
      connected: true,
      ...fbProfile,
      page_created_time: new Date(
        Date.now() - fbProfile.page_age_years * 365.25 * 24 * 3600 * 1000
      ).toISOString(),
      fetched_at: existingFb.fetched_at ?? new Date().toISOString(),
    };

    const existingIg = data.instagram_result ?? {};
    const newIg = igProfile.connected
      ? {
          ...existingIg,
          ...igProfile,
          fetched_at: existingIg.fetched_at ?? new Date().toISOString(),
        }
      : {
          connected: false,
          fetched_at: existingIg.fetched_at ?? new Date().toISOString(),
        };

    const fbScore = computeFacebookScore(newFb);
    const igScore = computeInstagramScore(newIg);

    const fbEngagementPerPost =
      (newFb.avg_reactions_per_post ?? 0) + (newFb.avg_comments_per_post ?? 0);

    const newPayload = {
      ...(data.decision_payload ?? {}),
      facebook_composite_score:    fbScore,
      facebook_engagement_per_post: fbEngagementPerPost > 0 ? fbEngagementPerPost : undefined,
      instagram_composite_score:   igScore,
      instagram_engagement_rate:   igProfile.connected ? igProfile.engagement_rate : undefined,
    };

    const newData = {
      ...data,
      facebook_result:  newFb,
      instagram_result: newIg,
      decision_payload: newPayload,
    };

    await pool.query(
      `UPDATE applications SET data = $1::jsonb, updated_at = NOW() WHERE id = $2`,
      [JSON.stringify(newData), appId]
    );

    console.log(
      `  ✓ ${appId.slice(0, 8)} → [${idx}] "${fbProfile.page_name}"` +
      `  fb:${fbScore}/100  ig:${igScore}/100` +
      (igProfile.connected ? `  @${igProfile.username}` : "  ig:no-conectado")
    );
    patched++;
  }

  console.log(`\nDone: ${patched} patched, ${skipped} already up-to-date\n`);
  await pool.end();
}

main().catch((err) => {
  console.error("\nFatal error:", err.message);
  process.exit(1);
});
