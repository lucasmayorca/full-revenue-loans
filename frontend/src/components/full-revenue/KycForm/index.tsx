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
}

/**
 * Este prototipo NO pre-llena PII — los merchants la capturan manualmente
 * porque no estamos jalando datos desde Uber Eats. Titular bancario puede
 * sugerirse a partir del nombre ingresado en Step 1 para reducir fricción,
 * pero arranca vacío si el usuario aún no llenó Step 1.
 */
function deriveBankPrefill(personal: Step1PersonalValues | null): Partial<Step3BankValues> {
  if (personal?.first_name || personal?.last_name) {
    return {
      account_holder: `${personal.first_name ?? ""} ${personal.last_name ?? ""}`.trim(),
    };
  }
  return {};
}

export function KycForm({ applicationId }: Props) {
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

      {error && (
        <div className="mb-5 p-3 bg-uber-danger-bg border border-uber-danger rounded-btn text-uber-danger text-[14px]">
          {error}
        </div>
      )}

      {/* Paso 1 — Datos personales */}
      {step === 1 && (
        <Step1Personal
          defaultValues={personal ?? {}}
          onComplete={handleStep1}
        />
      )}

      {/* Paso 2 — Dirección del negocio */}
      {step === 2 && (
        <Step2Address
          defaultValues={address ?? {}}
          onComplete={handleStep2}
          onBack={() => setStep(1)}
        />
      )}

      {/* Paso 3 — Cuenta bancaria */}
      {step === 3 && (
        <Step3BankAccount
          defaultValues={bank ?? deriveBankPrefill(personal)}
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
