"use client";

export default function KycSuccessPage() {

  return (
    <div className="px-4 py-10 flex flex-col items-center text-center space-y-6 max-w-sm mx-auto">
      {/* Ícono */}
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
        <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      {/* Título */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">¡Solicitud enviada!</h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          Tu solicitud de crédito está siendo revisada por nuestro equipo.
          Te notificaremos por email y WhatsApp en las próximas <span className="font-semibold text-gray-700">24–48 horas</span>.
        </p>
      </div>

      {/* Pasos siguientes */}
      <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4 text-left">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">¿Qué sigue?</p>
        {[
          { icon: "📧", title: "Revisión de documentos", desc: "Verificamos tu INE y comprobante de domicilio." },
          { icon: "🏦", title: "Validación bancaria", desc: "Confirmamos tu CLABE interbancaria." },
          { icon: "✅", title: "Activación del crédito", desc: "Una vez aprobado, el monto queda disponible en tu cuenta." },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0">{icon}</span>
            <div>
              <p className="text-sm font-medium text-gray-800">{title}</p>
              <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400">
        ¿Dudas? Escribinos a{" "}
        <a href="mailto:prestamos@rappi.com" className="text-rappi-orange font-medium">
          prestamos@rappi.com
        </a>
      </p>
    </div>
  );
}
