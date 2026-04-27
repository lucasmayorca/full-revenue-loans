-- Mapear PARTNER_ID → PARTNER_CODE usando V_APPLICATIONS_LEVEL1
-- + ver score_tag en offers para entender qué partners están en la tabla
WITH partner_map AS (
  SELECT
    PARTNER_ID,
    PARTNER_CODE,
    COUNT(*) AS apps
  FROM DEV_ANALYTICS.RBF_V3_STG.V_APPLICATIONS_LEVEL1
  WHERE DELETED_AT IS NULL
  GROUP BY PARTNER_ID, PARTNER_CODE
),
offers_by_partner AS (
  SELECT
    o.PARTNER_ID,
    SPLIT_PART(o.FEATURES:score_tag::STRING, '_', 1) AS partner_from_tag,
    o.FEATURES:currency::STRING AS currency,
    COUNT(*) AS available_offers,
    COUNT(DISTINCT o.MERCHANT_ID) AS merchants
  FROM dev_analytics.rbf_v3_raw.offers o
  WHERE o.STATUS = 'AVAILABLE'
    AND o.ENVIRONMENT = 'PRODUCTION'
    AND o.DELETED_AT IS NULL
    AND o.SUBCATEGORY = 'REGULAR'
    AND CURRENT_TIMESTAMP() BETWEEN o.VALID_FROM AND o.VALID_TO
  GROUP BY 1, 2, 3
)
SELECT
  o.PARTNER_ID,
  o.partner_from_tag,
  pm.PARTNER_CODE,
  o.currency,
  o.available_offers,
  o.merchants
FROM offers_by_partner o
LEFT JOIN partner_map pm USING (PARTNER_ID)
ORDER BY o.available_offers DESC;
