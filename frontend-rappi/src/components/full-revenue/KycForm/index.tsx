"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { StepIndicatorKyc } from "./StepIndicatorKyc";
import { Step1Personal, type Step1PersonalValues } from "./Step1Personal";
import { Step2Address, type Step2AddressValues } from "./Step2Address";
import { Step3BankAccount, type Step3BankValues } from "./Step3BankAccount";
import { Step4Documents, type Step4DocsValues } from "./Step4Documents";
import { Step5Contract } from "./Step5Contract";
import { Step6Confirm } from "./Step6Confirm";

const TOTAL_STEPS = 6;
const SS_PREFILL = "fr_prefill";

interface Props {
  applicationId: string;
}

interface PrefillSnapshot {
  first_name?: string;
  last_name?: string;
  birth_date?: string;
  tax_id?: string;          // mapea a `cedula` (RFC) en el form
  nationality?: string;
  marital_status?: string;
  street?: string;
  neighborhood?: string;
  postal_code?: string;
  city?: string;
  state?: string;
  address?: string;         // fallback si no hay campos estructurados
  clabe?: string;
  bank_name?: string;
  account_type?: string;
  account_holder?: string;
}

/** Lee el prefill del sessionStorage (seteado desde /offers?t=...). */
function readPrefill(): PrefillSnapshot {
  if (typeof window === "undefined") return {};
  const raw = sessionStorage.getItem(SS_PREFILL);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function personalDefaults(p: PrefillSnapshot): Partial<Step1PersonalValues> {
  const d: Partial<Step1PersonalValues> = {};
  if (p.first_name)  d.first_name = p.first_name;
  if (p.last_name)   d.last_name = p.last_name;
  if (p.birth_date)  d.birth_date = p.birth_date;
  if (p.tax_id)      d.cedula = p.tax_id;
  if (p.nationality) d.nationality = p.nationality;
  if (p.marital_status) {
    const allowed = ["soltero", "casado", "divorciado", "viudo", "union_libre"] as const;
    const lower = p.marital_status.toLowerCase().replace(/[\s-]/g, "_");
    if ((allowed as readonly string[]).includes(lower)) {
      d.marital_status = lower as Step1PersonalValues["marital_status"];
    }
  }
  return d;
}

function addressDefaults(p: PrefillSnapshot): Partial<Step2AddressValues> {
  const d: Partial<Step2AddressValues> = {};
  if (p.street)       d.street = p.street;
  else if (p.address) d.street = p.address;
  if (p.neighborhood) d.neighborhood = p.neighborhood;
  if (p.postal_code)  d.postal_code = p.postal_code;
  if (p.city)         d.city = p.city;
  if (p.state)        d.state = p.state;
  return d;
}

function bankDefaults(
  p: PrefillSnapshot,
  personal: Step1PersonalValues | null
): Partial<Step3BankValues> {
  const d: Partial<Step3BankValues> = {};
  if (p.clabe)     d.clabe = p.clabe;
  if (p.bank_name) d.bank_name = p.bank_name;
  if (p.account_type === "debito" || p.account_type === "cheques") {
    d.account_type = p.account_type;
  }
  if (p.account_holder) {
    d.account_holder = p.account_holder;
  } else if (personal?.first_name || personal?.last_name) {
    d.account_holder = `${personal.first_name ?? ""} ${personal.last_name ?? ""}`.trim();
  } else if (p.first_name || p.last_name) {
    d.account_holder = `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim();
  }
  return d;
}

export function KycForm({ applicationId }: Props) {
  const router = useRouter();

  const [prefillSnapshot] = useState<PrefillSnapshot>(readPrefill);
  const [step,         setStep]        = useState(1);
  const [personal,     setPersonal]    = useState<Step1PersonalValues | null>(null);
  const [address,      setAddress]     = useState<Step2AddressValues | null>(null);
  const [bank,         setBank]        = useState<Step3BankValues | null>(null);
  const [docs,         setDocs]        = useState<Step4DocsValues | null>(null);
  const [isSubmitting, setIsSubmitting]= useState(false);
  const [error,        setError]       = useState<string | null>(null);

  // Step 1 → 2
  function handleStep1(data: Step1PersonalValues) { setPersonal(data); setStep(2); }
  // Step 2 → 3
  function handleStep2(data: Step2AddressValues)  { setAddress(data);  setStep(3); }
  // Step 3 → 4
  function handleStep3(data: Step3BankValues)     { setBank(data);     setStep(4); }
  // Step 4 → 5 (Firma/Contrato)
  function handleStep4(data: Step4DocsValues)     { setDocs(data);     setStep(5); }
  // Step 5 (Firma) → 6 (Resumen/Confirm)
  function handleContractSigned()                 { setStep(6); }

  async function handleConfirm() {
    if (!personal || !address || !bank || !docs) return;
    if (!docs.id_front || !docs.id_back) {
      setError("Faltan documentos requeridos.");
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      await api.submitKyc(
        applicationId,
        personal,
        address,
        bank,
        {
          id_front: docs.id_front,
          id_back: docs.id_back,
          proof_of_address: docs.proof_of_address,
        }
      );
      router.push(`/full-revenue/kyc/${applicationId}/success`);
    } catch {
      setError("Error al enviar la solicitud KYC. Intentá de nuevo.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="px-4 py-6">
      <StepIndicatorKyc current={step} total={TOTAL_STEPS} />

      {error && (
        <div className="mb-5 p-3 bg-uber-danger-bg border border-uber-danger rounded-btn text-uber-danger text-[14px]">
          {error}
        </div>
      )}

      {/* Paso 1 — Datos personales */}
      {step === 1 && (
        <Step1Personal
          defaultValues={personal ?? personalDefaults(prefillSnapshot)}
          onComplete={handleStep1}
        />
      )}

      {/* Paso 2 — Dirección del negocio */}
      {step === 2 && (
        <Step2Address
          defaultValues={address ?? addressDefaults(prefillSnapshot)}
          onComplete={handleStep2}
          onBack={() => setStep(1)}
        />
      )}

      {/* Paso 3 — Cuenta bancaria */}
      {step === 3 && (
        <Step3BankAccount
          defaultValues={bank ?? bankDefaults(prefillSnapshot, personal)}
          onComplete={handleStep3}
          onBack={() => setStep(2)}
        />
      )}

      {/* Paso 4 — Documentos */}
      {step === 4 && (
        <Step4Documents onComplete={handleStep4} onBack={() => setStep(3)} />
      )}

      {/* Paso 5 — Firma del contrato */}
      {step === 5 && (
        <Step5Contract
          applicationId={applicationId}
          personal={personal}
          onSigned={handleContractSigned}
          onBack={() => setStep(4)}
        />
      )}

      {/* Paso 6 — Resumen y confirmar */}
      {step === 6 && personal && address && bank && (
        <Step6Confirm
          personal={personal}
          address={address}
          bank={bank}
          onConfirm={handleConfirm}
          onBack={() => setStep(5)}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
