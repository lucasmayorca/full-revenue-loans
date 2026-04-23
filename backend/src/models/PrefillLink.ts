/**
 * Modelo de un link pre-completado. Se usa para generar URLs personalizadas
 * por merchant con sus ofertas vigentes y campos ya pre-llenados, evitando
 * sesgo en experimentos por mostrar ofertas genéricas.
 */

/** Oferta RBF custom que se muestra en /offers cuando se abre con token. */
export interface PrefillOffer {
  id?: string;
  receive: number;
  retention?: number;
  totalToPay?: number;
  fixedFee?: number;
  monthlyMin?: number;
  maxTerm?: string;
}

/** Datos del merchant que el frontend usa para pre-llenar formularios. */
export interface PrefillData {
  // Identidad / contacto
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  curp?: string;
  birth_date?: string;
  nationality?: string;
  marital_status?: string;

  // Negocio / fiscal
  legal_name?: string;
  tax_id?: string;       // RFC
  ciec?: string;
  address?: string;      // domicilio fiscal en un campo

  // Dirección estructurada (KYC)
  street?: string;
  neighborhood?: string;
  postal_code?: string;
  city?: string;
  state?: string;

  // Banco
  clabe?: string;
  bank_name?: string;
  account_type?: string;
  account_holder?: string;
}

export interface PrefillLinkDoc {
  token: string;
  merchant_id: string | null;
  offers: PrefillOffer[] | null;
  base_amount: number | null;
  prefill: PrefillData | null;
  expires_at: string | null;
  opened_at: string | null;
  used_at: string | null;
  created_at: string;
}
