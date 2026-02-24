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

interface Props {
  applicationId: string;
  prefillData?: Record<string, string>;
}

/**
 * Pre-fill personal data from Rappi API (form_data).
 * Rappi comparte: nombre, apellido, fecha de nacimiento, nacionalidad.
 * Rappi NO comparte: cédula (el usuario la completa).
 */
function derivePersonalPrefill(data?: Record<string, string>): Partial<Step1PersonalValues> {
  return {
    first_name:  data?.owner_first_name ?? "Guillermo",
    last_name:   data?.owner_last_name  ?? "Bravo",
    birth_date:  data?.birth_date       ?? "1986-05-01",
    nationality: "Mexicana",
    cedula:      "",   // RFC — el usuario lo llena, Rappi no lo comparte
  };
}

function deriveAddressPrefill(data?: Record<string, string>): Partial<Step2AddressValues> {
  if (!data?.address) return {};
  return { street: data.address };
}

/** Titular de cuenta = nombre + apellido del representante, no el nombre comercial */
function deriveBankPrefill(personal: Step1PersonalValues | null, data?: Record<string, string>): Partial<Step3BankValues> {
  if (personal) {
    return { account_holder: `${personal.first_name} ${personal.last_name}`.trim() };
  }
  const owner = [data?.owner_first_name ?? "Guillermo", data?.owner_last_name ?? "Bravo"].join(" ").trim();
  return { account_holder: owner };
}

export function KycForm({ applicationId, prefillData }: Props) {
  const router = useRouter();

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

      {prefillData?.legal_name && step <= 3 && (
        <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-2.5">
          <svg className="w-4 h-4 text-green-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
          </svg>
          <p className="text-xs text-green-700">
            <span className="font-semibold">Datos pre-cargados</span> de tu solicitud — revisá y editá si es necesario
          </p>
        </div>
      )}

      {error && (
        <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Paso 1 — Datos personales */}
      {step === 1 && (
        <Step1Personal
          defaultValues={personal ?? derivePersonalPrefill(prefillData)}
          onComplete={handleStep1}
        />
      )}

      {/* Paso 2 — Dirección del negocio */}
      {step === 2 && (
        <Step2Address
          defaultValues={address ?? deriveAddressPrefill(prefillData)}
          onComplete={handleStep2}
          onBack={() => setStep(1)}
        />
      )}

      {/* Paso 3 — Cuenta bancaria */}
      {step === 3 && (
        <Step3BankAccount
          defaultValues={bank ?? deriveBankPrefill(personal, prefillData)}
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
