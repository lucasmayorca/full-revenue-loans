"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

// Schema local: URL de Maps + consentimiento
const schema = z.object({
  google_business_url: z
    .string()
    .url("Ingresá una URL válida")
    .optional()
    .or(z.literal("")),
  consent_given: z.literal(true, {
    errorMap: () => ({ message: "Debés aceptar los términos para continuar" }),
  }),
});
type FormValues = z.infer<typeof schema>;

// Tooltip Maps
function MapsTooltip() {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex items-center ml-1.5">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="w-4 h-4 rounded-full bg-gray-200 text-gray-500 text-[10px] font-bold flex items-center justify-center hover:bg-gray-300 focus:outline-none"
        aria-label="Cómo obtener la URL">?</button>
      {open && (
        <>
          <span className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <span className="absolute left-6 top-0 z-20 w-64 bg-gray-900 text-white text-xs rounded-xl p-3 shadow-xl space-y-2">
            <p className="font-semibold">¿Cómo obtener la URL?</p>
            <ol className="list-decimal list-inside space-y-1 text-gray-300 leading-relaxed">
              <li>Abrí <span className="text-white font-medium">Google Maps</span></li>
              <li>Buscá el nombre de tu negocio</li>
              <li>Tocá <span className="text-white font-medium">Compartir</span> → <span className="text-white font-medium">Copiar enlace</span></li>
              <li>Pegá el enlace acá abajo</li>
            </ol>
          </span>
        </>
      )}
    </span>
  );
}

// Tooltip Qué evaluamos
function WhatWeEvaluateTooltip() {
  const [open, setOpen] = useState(false);
  const items = [
    { icon: "🏛️", text: "Historial fiscal en el SAT (CIEC)" },
    { icon: "📋", text: "Score de Buró de Crédito" },
    { icon: "🛍️", text: "Ventas históricas en Rappi" },
    { icon: "📍", text: "Reputación en Google Maps" },
    { icon: "💬", text: "Presencia en redes sociales" },
    { icon: "🔐", text: "Verificación de identidad vía Twilio" },
  ];
  return (
    <span className="relative inline-flex items-center ml-1">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="text-rappi-orange underline underline-offset-2 text-xs font-medium focus:outline-none">
        ¿Qué evaluamos?
      </button>
      {open && (
        <>
          <span className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <span className="absolute left-0 bottom-6 z-20 w-64 bg-gray-900 text-white text-xs rounded-xl p-3 shadow-xl space-y-2">
            <p className="font-semibold text-white mb-1">Lo que vamos a evaluar</p>
            {items.map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-2">
                <span className="w-4 text-center flex-shrink-0">{icon}</span>
                <span className="text-gray-300">{text}</span>
              </div>
            ))}
          </span>
        </>
      )}
    </span>
  );
}

// Botón conexión social
interface SocialButtonProps {
  platform: "facebook" | "instagram";
  connected: boolean;
  onConnect: () => void;
}

function SocialConnectButton({ platform, connected, onConnect }: SocialButtonProps) {
  const config = {
    facebook: {
      label: "Facebook",
      sublabel: "Página del negocio — seguidores y reseñas",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#1877F2">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      bgColor: "bg-blue-50",
      connectedText: "Facebook conectado",
    },
    instagram: {
      label: "Instagram",
      sublabel: "Perfil de negocio — seguidores y publicaciones",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5">
          <defs>
            <linearGradient id="ig-s2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F58529"/>
              <stop offset="50%" stopColor="#DD2A7B"/>
              <stop offset="100%" stopColor="#515BD4"/>
            </linearGradient>
          </defs>
          <path fill="url(#ig-s2)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
        </svg>
      ),
      bgColor: "bg-pink-50",
      connectedText: "Instagram conectado",
    },
  }[platform];

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-start gap-3 flex-1">
        <div className={`w-8 h-8 ${config.bgColor} rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5`}>
          {config.icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{config.label}</p>
          <p className="text-xs text-gray-400">{config.sublabel}</p>
        </div>
      </div>
      {connected ? (
        <div className="flex items-center gap-1.5 text-green-600 text-xs font-medium bg-green-50 rounded-lg px-2.5 py-1.5 flex-shrink-0">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
          </svg>
          {config.connectedText}
        </div>
      ) : (
        <button type="button" onClick={onConnect}
          className="flex-shrink-0 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
          Conectar
        </button>
      )}
    </div>
  );
}

// Props
export interface Step2Result {
  google_business_url?: string;
  consent_given: true;
}

interface Props {
  defaultGoogleUrl?: string;
  facebookConnected: boolean;
  instagramConnected: boolean;
  onFacebookConnect: (currentUrl: string) => void;
  onInstagramConnect: (currentUrl: string) => void;
  onComplete: (data: Step2Result) => void;
  onBack: () => void;
  isSubmitting?: boolean;
  applicationId?: string;
}

export function Step2Connections({
  defaultGoogleUrl = "",
  facebookConnected,
  instagramConnected,
  onFacebookConnect,
  onInstagramConnect,
  onComplete,
  onBack,
  isSubmitting,
  applicationId,
}: Props) {
  // Leer directamente desde sessionStorage al montar — captura el valor guardado
  // antes del redirect OAuth, aunque el prop todavía no llegue actualizado
  const savedUrl =
    typeof window !== "undefined"
      ? (sessionStorage.getItem("fr_google_url") ?? "")
      : "";
  const initialUrl = savedUrl || defaultGoogleUrl;

  const wasPreviouslyAccepted =
    typeof window !== "undefined"
      ? sessionStorage.getItem("fr_consent_given") === "true"
      : false;

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      google_business_url: initialUrl,
      consent_given: wasPreviouslyAccepted ? true : undefined,
    },
  });

  // Si el prop llega después del primer render (ej: estado asincrónico del padre),
  // actualizar el campo sin pisar lo que el usuario haya escrito
  useEffect(() => {
    if (defaultGoogleUrl && !watch("google_business_url")) {
      reset((prev) => ({ ...prev, google_business_url: defaultGoogleUrl }));
    }
  }, [defaultGoogleUrl, reset, watch]);

  const googleUrl = watch("google_business_url");

  // Persistir URL para sobrevivir redirect OAuth
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("fr_google_url", googleUrl ?? "");
    }
  }, [googleUrl]);

  // Persistir consentimiento
  const consentValue = watch("consent_given");
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (consentValue === true) {
        sessionStorage.setItem("fr_consent_given", "true");
      } else {
        sessionStorage.removeItem("fr_consent_given");
      }
    }
  }, [consentValue]);

  function onSubmit(data: FormValues) {
    sessionStorage.removeItem("fr_consent_given");
    sessionStorage.removeItem("fr_google_url");
    onComplete({ google_business_url: data.google_business_url, consent_given: true });
  }

  const anyConnected = facebookConnected || instagramConnected;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Información adicional</h2>
        <p className="text-sm text-gray-500">
          Conectá tus plataformas digitales para maximizar tu monto de crédito.
        </p>
      </div>

      {/* Banner */}
      <div className="bg-orange-50 border border-orange-100 rounded-xl px-3.5 py-2.5 flex items-start gap-2.5">
        <span className="text-base mt-0.5">💡</span>
        <p className="text-xs text-orange-800 leading-relaxed">
          <span className="font-semibold">Cuantas más fuentes conectés, mayor será tu monto.</span>{" "}
          Usamos estos datos para evaluar la salud real de tu negocio.
        </p>
      </div>

      {/* Google Maps */}
      <div className="border border-gray-200 rounded-2xl p-4 space-y-3">
        <div>
          <p className="font-medium text-sm text-gray-900 flex items-center">
            <span className="mr-2">📍</span>
            Google Maps
            <MapsTooltip />
          </p>
          <p className="text-xs text-gray-400 mt-0.5 ml-6">
            Rating, reseñas y presencia verificada — sin necesidad de cuenta
          </p>
        </div>
        <Input
          label=""
          placeholder="https://www.google.com/maps/place/..."
          error={errors.google_business_url?.message}
          {...register("google_business_url")}
        />
      </div>

      {/* Facebook + Instagram */}
      <div className="border border-gray-200 rounded-2xl p-4 space-y-4">
        <SocialConnectButton platform="facebook" connected={facebookConnected}
          onConnect={() => onFacebookConnect(googleUrl ?? "")} />
        <div className="border-t border-gray-100" />
        <SocialConnectButton platform="instagram" connected={instagramConnected}
          onConnect={() => onInstagramConnect(googleUrl ?? "")} />
        {anyConnected && (
          <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
            Tus redes sociales serán consideradas en la evaluación
          </div>
        )}
      </div>

      {/* T&C con tooltip */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Requerido</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="consent_given"
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-rappi-orange focus:ring-rappi-orange cursor-pointer flex-shrink-0"
            {...register("consent_given")}
          />
          <label htmlFor="consent_given" className="text-sm text-gray-700 leading-snug cursor-pointer">
            Acepto los términos y condiciones del Préstamo MÁS y autorizo el uso de mis datos fiscales y digitales para la evaluación crediticia
            <WhatWeEvaluateTooltip />
          </label>
        </div>
        {errors.consent_given && (
          <p className="text-xs text-red-500 ml-7">{errors.consent_given.message}</p>
        )}
      </div>

      {/* Botones */}
      <div className="flex gap-3 pt-1">
        <Button type="button" variant="ghost" onClick={onBack} disabled={isSubmitting} fullWidth>
          Atrás
        </Button>
        <Button type="submit" fullWidth size="lg" isLoading={isSubmitting}>
          Confirmar
        </Button>
      </div>

      {applicationId && (
        <p className="text-xs text-gray-400 text-center">
          Solicitud #{applicationId.slice(0, 8).toUpperCase()}
        </p>
      )}
    </form>
  );
}
