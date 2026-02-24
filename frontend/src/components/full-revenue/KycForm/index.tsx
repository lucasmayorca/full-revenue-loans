"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { StepIndicatorKyc } from "./StepIndicatorKyc";
import { Step1Personal, type Step1PersonalValues } from "./Step1Personal";
import { Step2Address, type Step2AddressValues } from "./Step2Address";
import { Step3BankAccount, type Step3BankValues } from "./Step3BankAccount";
import { Step4Documents, type Step4DocsValues } from "./Step4Documents";
import { Step5Confirm } from "./Step5Confirm";

const TOTAL_STEPS = 5;

interface Props {
  applicationId: string;
}

export function KycForm({ applicationId }: Props) {
  const router = useRouter();

  const [step,        setStep]        = useState(1);
  const [personal,    setPersonal]    = useState<Step1PersonalValues | null>(null);
  const [address,     setAddress]     = useState<Step2AddressValues | null>(null);
  const [bank,        setBank]        = useState<Step3BankValues | null>(null);
  const [docs,        setDocs]        = useState<Step4DocsValues | null>(null);
  const [isSubmitting,setIsSubmitting]= useState(false);
  const [error,       setError]       = useState<string | null>(null);

  function handleStep1(data: Step1PersonalValues) {
    setPersonal(data);
    setStep(2);
  }
  function handleStep2(data: Step2AddressValues) {
    setAddress(data);
    setStep(3);
  }
  function handleStep3(data: Step3BankValues) {
    setBank(data);
    setStep(4);
  }
  function handleStep4(data: Step4DocsValues) {
    setDocs(data);
    setStep(5);
  }

  async function handleConfirm() {
    if (!personal || !address || !bank || !docs) return;
    if (!docs.id_front || !docs.id_back || !docs.proof_of_address) {
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
        <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {step === 1 && (
        <Step1Personal defaultValues={personal ?? undefined} onComplete={handleStep1} />
      )}
      {step === 2 && (
        <Step2Address
          defaultValues={address ?? undefined}
          onComplete={handleStep2}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <Step3BankAccount
          defaultValues={bank ?? undefined}
          onComplete={handleStep3}
          onBack={() => setStep(2)}
        />
      )}
      {step === 4 && (
        <Step4Documents onComplete={handleStep4} onBack={() => setStep(3)} />
      )}
      {step === 5 && personal && address && bank && (
        <Step5Confirm
          personal={personal}
          address={address}
          bank={bank}
          onConfirm={handleConfirm}
          onBack={() => setStep(4)}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
