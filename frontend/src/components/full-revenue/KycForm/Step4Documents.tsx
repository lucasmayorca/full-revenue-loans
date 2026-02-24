"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export interface Step4DocsValues {
  id_front: File | null;
  id_back: File | null;
  proof_of_address: File | null;
}

interface Props {
  onComplete: (data: Step4DocsValues) => void;
  onBack: () => void;
}

interface FileUploadProps {
  label: string;
  sublabel: string;
  icon: string;
  accept?: string;
  file: File | null;
  onChange: (f: File | null) => void;
  error?: string;
}

function FileUpload({ label, sublabel, icon, accept = "image/*,.pdf", file, onChange, error }: FileUploadProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-2xl p-5 cursor-pointer transition-colors ${file ? "border-green-400 bg-green-50" : "border-gray-200 bg-gray-50 hover:bg-gray-100"}`}>
        <input
          type="file"
          accept={accept}
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
              Subir archivo
            </span>
          </>
        )}
      </label>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

export function Step4Documents({ onComplete, onBack }: Props) {
  const [idFront,   setIdFront]   = useState<File | null>(null);
  const [idBack,    setIdBack]    = useState<File | null>(null);
  const [proofAddr, setProofAddr] = useState<File | null>(null);
  const [errors,    setErrors]    = useState<Record<string, string>>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!idFront)   newErrors.id_front        = "Subí el frente de tu INE/pasaporte";
    if (!idBack)    newErrors.id_back          = "Subí el reverso de tu INE/pasaporte";
    if (!proofAddr) newErrors.proof_of_address = "Subí un comprobante de domicilio";

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }
    onComplete({ id_front: idFront, id_back: idBack, proof_of_address: proofAddr });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Aviso */}
      <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 flex items-start gap-2">
        <span className="text-base flex-shrink-0">📸</span>
        <p className="text-xs text-orange-800 leading-relaxed">
          Asegurate de que las fotos sean legibles, sin reflejos y que todos los datos sean visibles.
          Formatos aceptados: JPG, PNG o PDF.
        </p>
      </div>

      {/* Documento de identidad */}
      <div className="border border-gray-200 rounded-2xl p-4 space-y-3">
        <p className="text-sm font-semibold text-gray-800">🪪 Identificación oficial</p>
        <p className="text-xs text-gray-400">INE (vigente) o pasaporte mexicano</p>
        <FileUpload
          label="Frente"
          sublabel="Foto o escaneo del frente"
          icon="🪪"
          file={idFront}
          onChange={setIdFront}
          error={errors.id_front}
        />
        <FileUpload
          label="Reverso"
          sublabel="Foto o escaneo del reverso"
          icon="🔄"
          file={idBack}
          onChange={setIdBack}
          error={errors.id_back}
        />
      </div>

      {/* Comprobante de domicilio */}
      <div className="border border-gray-200 rounded-2xl p-4 space-y-3">
        <p className="text-sm font-semibold text-gray-800">🏠 Comprobante de domicilio</p>
        <p className="text-xs text-gray-400">No mayor a 3 meses — recibo de luz, agua, teléfono o gas</p>
        <FileUpload
          label="Comprobante"
          sublabel="Foto, escaneo o PDF"
          icon="📄"
          file={proofAddr}
          onChange={setProofAddr}
          error={errors.proof_of_address}
          accept="image/*,.pdf"
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
