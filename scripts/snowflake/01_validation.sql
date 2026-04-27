-- Validación de volumen antes del batch
SELECT
  'partner_codes' AS check_name,
  PARTNER_CODE AS dimension,
  COUNT(*) AS cnt
FROM DEV_ANALYTICS.RBF_V3_STG.V_APPLICATIONS_LEVEL1
WHERE PARTNER_CODE ILIKE 'RAPPI%'
  AND DELETED_AT IS NULL
GROUP BY PARTNER_CODE

UNION ALL

SELECT
  'available_offers_mx_regular',
  'total',
  COUNT(*)
FROM dev_analytics.rbf_v3_raw.offers
WHERE STATUS = 'AVAILABLE'
  AND ENVIRONMENT = 'PRODUCTION'
  AND DELETED_AT IS NULL
  AND SUBCATEGORY = 'REGULAR'
  AND FEATURES:currency::STRING = 'MXN'
  AND CURRENT_TIMESTAMP() BETWEEN VALID_FROM AND VALID_TO

UNION ALL

SELECT
  'merchants_with_n_offers',
  n_offers::STRING,
  merchants
FROM (
  SELECT n_offers, COUNT(*) AS merchants
  FROM (
    SELECT MERCHANT_ID, COUNT(*) AS n_offers
    FROM dev_analytics.rbf_v3_raw.offers
    WHERE STATUS = 'AVAILABLE'
      AND ENVIRONMENT = 'PRODUCTION'
      AND DELETED_AT IS NULL
      AND SUBCATEGORY = 'REGULAR'
      AND FEATURES:currency::STRING = 'MXN'
      AND CURRENT_TIMESTAMP() BETWEEN VALID_FROM AND VALID_TO
    GROUP BY MERCHANT_ID
  )
  GROUP BY n_offers
)
ORDER BY check_name, dimension;
