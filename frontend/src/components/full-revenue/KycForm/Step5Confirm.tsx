"use client";

import { useState } from "react";
import type { Step1PersonalValues } from "./Step1Personal";
import type { Step2AddressValues } from "./Step2Address";
import type { Step3BankValues } from "./Step3BankAccount";

interface Props {
  personal: Step1PersonalValues;
  address: Step2AddressValues;
  bank: Step3BankValues;
  onConfirm: () => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 shrink-0">{label}</span>
      <span className="text-xs font-medium text-gray-800 text-right">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
      </div>
      <div className="px-4 py-1">{children}</div>
    </div>
  );
}

export function Step5Confirm({ personal, address, bank, onConfirm, onBack, isSubmitting }: Props) {
  const [authorized, setAuthorized] = useState(false);
  const [authError,  setAuthError]  = useState(false);

  function handleConfirm() {
    if (!authorized) { setAuthError(true); return; }
    onConfirm();
  }

  const MARITAL_LABELS: Record<string, string> = {
    soltero: "Soltero/a", casado: "Casado/a", divorciado: "Divorciado/a",
    viudo: "Viudo/a", union_libre: "Unión libre",
  };

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <Section title="Datos personales">
        <Row label="Nombre completo"   value={`${personal.first_name} ${personal.last_name}`} />
        <Row label="Fecha de nacimiento" value={personal.birth_date} />
        <Row label="RFC"               value={personal.cedula} />
        <Row label="Nacionalidad"      value={personal.nationality} />
        <Row label="Estado civil"      value={MARITAL_LABELS[personal.marital_status] ?? personal.marital_status} />
      </Section>

      <Section title="Domicilio">
        <Row label="Dirección"  value={`${address.street}, ${address.neighborhood}`} />
        <Row label="CP / Ciudad" value={`${address.postal_code} · ${address.city}`} />
        <Row label="Estado"     value={address.state} />
      </Section>

      <Section title="Cuenta bancaria">
        <Row label="CLABE"   value={`••••••••••••${bank.clabe.slice(-6)}`} />
        <Row label="Banco"   value={bank.bank_name} />
        <Row label="Tipo"    value={bank.account_type === "debito" ? "Débito" : "Cheques"} />
        <Row label="Titular" value={bank.account_holder} />
      </Section>

      {/* Documentos — solo checkmarks, no re-mostramos los archivos */}
      <Section title="Documentos">
        <Row label="INE — Frente"  value="✅ Cargado" />
        <Row label="INE — Reverso" value="✅ Cargado" />
      </Section>

      {/* Autorización */}
      <div className="space-y-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={authorized}
            onChange={(e) => { setAuthorized(e.target.checked); setAuthError(false); }}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-rappi-orange focus:ring-rappi-orange flex-shrink-0"
          />
          <span className="text-xs text-gray-600 leading-relaxed">
            Confirmo que la información proporcionada es correcta y autorizo a Rappi a verificar mi identidad,
            consultar mi historial crediticio en el Buró de Crédito y realizar el débito automático según las
            condiciones del crédito pre-aprobado.
          </span>
        </label>
        {authError && (
          <p className="text-xs text-red-500 ml-7">Debés autorizar para continuar</p>
        )}
      </div>

      <div className="flex gap-3 pt-2 pb-6">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex-1 bg-white border-2 border-gray-300 text-gray-700 font-bold py-3.5 rounded-2xl text-base active:scale-95 transition-all duration-150 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none"
        >
          Atrás
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isSubmitting}
          className="flex-1 bg-rappi-orange text-white font-bold py-3.5 rounded-2xl text-base shadow-md shadow-orange-200 active:scale-95 transition-all duration-150 hover:bg-rappi-orange-dark disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none"
        >
          {isSubmitting ? "Enviando..." : "Enviar solicitud"}
        </button>
      </div>
    </div>
  );
}
