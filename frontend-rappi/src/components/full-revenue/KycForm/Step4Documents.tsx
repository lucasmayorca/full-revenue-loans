"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export interface Step4DocsValues {
  id_front: File | null;
  id_back: File | null;
  proof_of_address: File | null; // kept for API compatibility, always null
}

interface Props {
  onComplete: (data: Step4DocsValues) => void;
  onBack: () => void;
}

interface FileUploadProps {
  label: string;
  sublabel: string;
  icon: string;
  file: File | null;
  onChange: (f: File | null) => void;
  error?: string;
}

function FileUpload({ label, sublabel, icon, file, onChange, error }: FileUploadProps) {
  return (
    <div>
      <label
        className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-2xl p-5 cursor-pointer transition-colors ${
          file ? "border-green-400 bg-green-50" : "border-gray-200 bg-gray-50 hover:bg-gray-100"
        }`}
      >
        <input
          type="file"
          accept="image/*,.pdf"
          className="sr-only"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
        {file ? (
          <>
            <span className="text-2xl">✅</span>
            <p className="text-xs font-medium text-green-700 text-center leading-snug">{file.name}</p>
            <p className="text-xs text-green-500">Tocá para cambiar</p>
          </>
        ) : (
          <>
            <span className="text-3xl">{icon}</span>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>
            </div>
            <span className="text-xs text-rappi-orange font-semibold border border-rappi-orange rounded-lg px-3 py-1">
              Subir foto
            </span>
          </>
        )}
      </label>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

export function Step4Documents({ onComplete, onBack }: Props) {
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack,  setIdBack]  = useState<File | null>(null);
  const [errors,  setErrors]  = useState<Record<string, string>>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!idFront) newErrors.id_front = "Subí el frente de tu INE";
    if (!idBack)  newErrors.id_back  = "Subí el reverso de tu INE";
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }
    onComplete({ id_front: idFront, id_back: idBack, proof_of_address: null });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Header */}
      <div className="pb-1">
        <h2 className="text-base font-bold text-gray-900">Identificación oficial</h2>
        <p className="text-xs text-gray-400 mt-0.5">Solo necesitamos tu INE vigente — frente y reverso</p>
      </div>

      {/* Info tip */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-start gap-2">
        <svg className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
        </svg>
        <p className="text-xs text-blue-700 leading-relaxed">
          Asegurate de que las fotos sean legibles, sin reflejos y con todos los datos visibles.
        </p>
      </div>

      {/* INE frente y reverso */}
      <div className="border border-gray-200 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🪪</span>
          <div>
            <p className="text-sm font-semibold text-gray-800">INE vigente</p>
            <p className="text-xs text-gray-400">Credencial para votar en buen estado</p>
          </div>
        </div>

        <FileUpload
          label="Frente del INE"
          sublabel="Foto con tu nombre, foto y CURP"
          icon="🪪"
          file={idFront}
          onChange={setIdFront}
          error={errors.id_front}
        />
        <FileUpload
          label="Reverso del INE"
          sublabel="Foto con domicilio y código de barras"
          icon="🔄"
          file={idBack}
          onChange={setIdBack}
          error={errors.id_back}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" fullWidth onClick={onBack}>
          Atrás
        </Button>
        <Button type="submit" variant="primary" fullWidth>
          Continuar
        </Button>
      </div>
    </form>
  );
}
