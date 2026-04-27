-- Smoke test: 5 merchants Rappi MX con teléfono y 2+ ofertas REGULAR
WITH ranked_offers AS (
  SELECT
    o.MERCHANT_ID,
    o.FEATURES:amount::NUMBER                 AS offer_amount,
    o.FEATURES:repayment_rate::NUMBER         AS offer_retention,
    o.FEATURES:total_repayment_amount::NUMBER AS offer_total,
    o.FEATURES:fixed_fee::NUMBER              AS offer_fee,
    o.FEATURES:payment_baseline::NUMBER       AS offer_monthly,
    o.FEATURES:term::STRING                   AS offer_term,
    ROW_NUMBER() OVER (
      PARTITION BY o.MERCHANT_ID
      ORDER BY o.FEATURES:amount::NUMBER DESC, o.CREATED_AT DESC
    ) AS rn
  FROM dev_analytics.rbf_v3_raw.offers o
  WHERE o.STATUS = 'AVAILABLE'
    AND o.ENVIRONMENT = 'PRODUCTION'
    AND o.DELETED_AT IS NULL
    AND o.SUBCATEGORY = 'REGULAR'
    AND o.FEATURES:currency::STRING = 'MXN'
    AND CURRENT_TIMESTAMP() BETWEEN o.VALID_FROM AND o.VALID_TO
),
offers_pivoted AS (
  SELECT
    MERCHANT_ID,
    MAX(CASE WHEN rn = 1 THEN offer_amount    END) AS offer1_amount,
    MAX(CASE WHEN rn = 1 THEN offer_retention END) AS offer1_retention,
    MAX(CASE WHEN rn = 1 THEN offer_total     END) AS offer1_total,
    MAX(CASE WHEN rn = 1 THEN offer_fee       END) AS offer1_fee,
    MAX(CASE WHEN rn = 1 THEN offer_monthly   END) AS offer1_monthly,
    MAX(CASE WHEN rn = 1 THEN offer_term      END) AS offer1_term,
    MAX(CASE WHEN rn = 2 THEN offer_amount    END) AS offer2_amount,
    MAX(CASE WHEN rn = 2 THEN offer_retention END) AS offer2_retention,
    MAX(CASE WHEN rn = 2 THEN offer_total     END) AS offer2_total,
    MAX(CASE WHEN rn = 2 THEN offer_fee       END) AS offer2_fee,
    MAX(CASE WHEN rn = 2 THEN offer_monthly   END) AS offer2_monthly,
    MAX(CASE WHEN rn = 2 THEN offer_term      END) AS offer2_term
  FROM ranked_offers
  WHERE rn <= 2
  GROUP BY MERCHANT_ID
),
rappi_mx_app AS (
  SELECT
    a.MERCHANT_ID,
    a.NAME                                           AS legal_name,
    a.EMAIL                                          AS email,
    a.LEGAL_REPRESENTATIVE_NAME__FIRST_NAME          AS first_name,
    a.LEGAL_REPRESENTATIVE_NAME__PATERNAL_LAST_NAME  AS last_name,
    a.BANK__NAME                                     AS bank_name,
    a.BANK__ACCOUNT_NUMBER                           AS clabe,
    a.BANK__ACCOUNT_TYPE                             AS account_type,
    a.BANK__HOLDER_NAME                              AS account_holder,
    a.BANK__RUT                                      AS tax_id,
    ROW_NUMBER() OVER (PARTITION BY a.MERCHANT_ID ORDER BY a.CREATED_AT DESC) AS rn
  FROM DEV_ANALYTICS.RBF_V3_STG.V_APPLICATIONS_LEVEL1 a
  WHERE a.DELETED_AT IS NULL
    AND a.PARTNER_CODE = 'RAPPI_MX'
),
phones AS (
  SELECT MERCHANT_ID, PHONE_NUMBER,
    ROW_NUMBER() OVER (PARTITION BY MERCHANT_ID ORDER BY UPDATED_AT DESC) AS rn
  FROM DEV_ANALYTICS.RBF_V3_RAW.MERCHANTS_BY_PHONES
  WHERE DELETED_AT IS NULL
    AND PHONE_NUMBER IS NOT NULL
    AND TRIM(PHONE_NUMBER) <> ''
)
SELECT
  op.MERCHANT_ID                  AS merchant_id,
  a.first_name,
  a.last_name,
  a.email,
  p.PHONE_NUMBER                  AS phone,
  a.legal_name,
  a.tax_id,
  a.clabe,
  a.bank_name,
  a.account_type,
  a.account_holder,
  op.offer1_amount                AS base_amount,
  op.offer1_amount,
  op.offer1_retention,
  op.offer1_total,
  op.offer1_fee,
  op.offer1_monthly,
  op.offer1_term || ' días'       AS offer1_term,
  op.offer2_amount,
  op.offer2_retention,
  op.offer2_total,
  op.offer2_fee,
  op.offer2_monthly,
  op.offer2_term || ' días'       AS offer2_term
FROM offers_pivoted op
INNER JOIN rappi_mx_app a ON a.MERCHANT_ID = op.MERCHANT_ID AND a.rn = 1
INNER JOIN phones       p ON p.MERCHANT_ID = op.MERCHANT_ID AND p.rn = 1
WHERE op.offer1_amount IS NOT NULL
  AND op.offer2_amount IS NOT NULL          -- smoke test: forzamos 2 ofertas
  AND a.email IS NOT NULL
  AND a.first_name IS NOT NULL
ORDER BY op.offer1_amount DESC
LIMIT 5;
