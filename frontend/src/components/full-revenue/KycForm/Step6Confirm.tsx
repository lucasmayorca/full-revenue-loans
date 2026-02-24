"use client";

import { useState, useEffect } from "react";
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

function fmt(n: number) {
  return n.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function computeConditions(amount: number) {
  const rate = 0.034;
  const installments = 12;
  const monthlyPayment = Math.round((amount * rate) / (1 - Math.pow(1 + rate, -installments)));
  return { rate, installments, monthlyPayment };
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

export function Step6Confirm({ personal, address, bank, onConfirm, onBack, isSubmitting }: Props) {
  const [authorized, setAuthorized] = useState(false);
  const [authError,  setAuthError]  = useState(false);
  const [loanAmount, setLoanAmount] = useState(0);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("fr_offer_amounts");
      if (raw) {
        const amounts = JSON.parse(raw);
        setLoanAmount(amounts.fiscal ?? amounts.social ?? amounts.bureau ?? 75_000);
      } else {
        setLoanAmount(75_000);
      }
    } catch {
      setLoanAmount(75_000);
    }
  }, []);

  function handleConfirm() {
    if (!authorized) { setAuthError(true); return; }
    onConfirm();
  }

  const MARITAL_LABELS: Record<string, string> = {
    soltero: "Soltero/a", casado: "Casado/a", divorciado: "Divorciado/a",
    viudo: "Viudo/a", union_libre: "Unión libre",
  };

  const fullName = `${personal.first_name} ${personal.last_name}`.trim();
  const conditions = loanAmount > 0 ? computeConditions(loanAmount) : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="pb-1">
        <h2 className="text-base font-bold text-gray-900">Confirmá tu solicitud</h2>
        <p className="text-xs text-gray-400 mt-0.5">Revisá que todo esté correcto antes de enviar</p>
      </div>

      {/* Monto solicitado + condiciones */}
      {loanAmount > 0 && conditions && (
        <div className="bg-gradient-to-br from-rappi-orange to-rappi-orange-mid rounded-2xl p-5 text-white relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-28 h-28 bg-white opacity-5 rounded-full" />
          <div className="absolute -left-3 -bottom-4 w-20 h-20 bg-white opacity-5 rounded-full" />
          <div className="relative">
            <p className="text-xs opacity-70 uppercase tracking-wider mb-1">Monto a solicitar</p>
            <p className="text-4xl font-black leading-none mb-0.5">${fmt(loanAmount)}</p>
            <p className="text-sm opacity-80 mb-4">MXN</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white bg-opacity-15 rounded-xl px-2 py-2">
                <p className="text-[10px] opacity-70 mb-0.5">Tasa mensual</p>
                <p className="text-sm font-bold">{(conditions.rate * 100).toFixed(1)}%</p>
              </div>
              <div className="bg-white bg-opacity-15 rounded-xl px-2 py-2">
                <p className="text-[10px] opacity-70 mb-0.5">Plazo</p>
                <p className="text-sm font-bold">{conditions.installments} meses</p>
              </div>
              <div className="bg-white bg-opacity-15 rounded-xl px-2 py-2">
                <p className="text-[10px] opacity-70 mb-0.5">Cuota mensual</p>
                <p className="text-sm font-bold">${fmt(conditions.monthlyPayment)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <Section title="Datos personales">
        <Row label="Nombre completo"     value={fullName} />
        <Row label="Fecha de nacimiento" value={personal.birth_date} />
        <Row label="RFC"                 value={personal.cedula} />
        <Row label="Nacionalidad"        value={personal.nationality} />
        <Row label="Estado civil"        value={MARITAL_LABELS[personal.marital_status] ?? personal.marital_status} />
      </Section>

      <Section title="Dirección del negocio">
        <Row label="Dirección"   value={address.street} />
        <Row label="CP / Ciudad" value={`${address.postal_code} · ${address.city}`} />
        <Row label="Estado"      value={address.state} />
      </Section>

      <Section title="Cuenta bancaria">
        <Row label="CLABE"   value={`••••••••••••${bank.clabe.slice(-6)}`} />
        <Row label="Banco"   value={bank.bank_name} />
        <Row label="Tipo"    value={bank.account_type === "debito" ? "Débito" : "Cheques"} />
        <Row label="Titular" value={bank.account_holder} />
      </Section>

      <Section title="Documentos">
        <Row label="INE — Frente"  value="✅ Cargado" />
        <Row label="INE — Reverso" value="✅ Cargado" />
      </Section>

      {/* Nota firma ya realizada */}
      <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-2.5">
        <svg className="w-4 h-4 text-green-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
        </svg>
        <p className="text-xs text-green-700">
          <span className="font-semibold">Contrato firmado digitalmente</span> por {fullName}
        </p>
      </div>

      {/* Autorización final */}
      <div className="space-y-2">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={authorized}
            onChange={(e) => { setAuthorized(e.target.checked); setAuthError(false); }}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-rappi-orange focus:ring-rappi-orange flex-shrink-0 accent-rappi-orange"
          />
          <span className="text-xs text-gray-600 leading-relaxed">
            Confirmo que la información es correcta y autorizo a Rappi a verificar mi identidad,
            consultar el Buró de Crédito y realizar el débito automático según las condiciones del crédito aprobado.
          </span>
        </label>
        {authError && (
          <p className="text-xs text-red-500 ml-7">Debés autorizar para enviar</p>
        )}
      </div>

      <div className="flex gap-3 pt-2 pb-6">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex-1 bg-white border-2 border-gray-300 text-gray-700 font-bold py-3.5 rounded-2xl text-base active:scale-95 transition-all duration-150 hover:bg-gray-50 disabled:opacity-60 focus:outline-none"
        >
          Atrás
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isSubmitting}
          className="flex-1 bg-rappi-orange text-white font-bold py-3.5 rounded-2xl text-base shadow-md shadow-orange-200 active:scale-95 transition-all duration-150 hover:bg-rappi-orange-dark disabled:opacity-60 focus:outline-none"
        >
          {isSubmitting ? "Enviando..." : "Enviar solicitud"}
        </button>
      </div>
    </div>
  );
}
