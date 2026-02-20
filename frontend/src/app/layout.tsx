import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rappi | Créditos para tu negocio",
  description: "Expandí tu crédito hasta cinco veces con Rappi",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-rappi-surface">
        <div className="flex h-screen overflow-hidden">
          {/* Sidebar izquierdo — estilo Rappi MX */}
          <aside className="w-16 bg-rappi-sidebar flex flex-col items-center py-4 gap-1 flex-shrink-0 z-20">
            {/* Logo Rappi */}
            <div className="w-10 h-10 bg-rappi-orange rounded-xl flex items-center justify-center mb-4">
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
              </svg>
            </div>

            {/* Nav icons */}
            <SidebarIcon label="Inicio" active={false}>
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 3l9 6.75V21a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75v-4.5h-4.5V21a.75.75 0 01-.75.75H3.75A.75.75 0 013 21V9.75z" />
              </svg>
            </SidebarIcon>

            <SidebarIcon label="Pedidos" active={false}>
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </SidebarIcon>

            <SidebarIcon label="Créditos" active={true}>
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </SidebarIcon>

            <SidebarIcon label="Estadísticas" active={false}>
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </SidebarIcon>

            <SidebarIcon label="Configuración" active={false}>
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </SidebarIcon>

            {/* Avatar abajo */}
            <div className="mt-auto">
              <div className="w-9 h-9 rounded-full bg-rappi-orange-mid flex items-center justify-center text-white text-sm font-bold">
                R
              </div>
            </div>
          </aside>

          {/* Contenido principal */}
          <div className="flex flex-col flex-1 min-w-0">
            {/* Header superior */}
            <header className="h-14 bg-white border-b border-rappi-card-border flex items-center px-6 gap-4 flex-shrink-0 z-10">
              {/* Nombre app */}
              <div className="flex items-center gap-2 mr-4">
                <span className="text-sm font-semibold text-rappi-dark">Portal de Socios</span>
                <span className="text-rappi-muted text-sm">/ Créditos</span>
              </div>

              {/* Barra de búsqueda (decorativa) */}
              <div className="flex-1 max-w-md">
                <div className="flex items-center gap-2 bg-rappi-surface rounded-lg px-3 py-2 border border-rappi-card-border">
                  <svg className="w-4 h-4 text-rappi-muted flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx="11" cy="11" r="8" />
                    <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
                  </svg>
                  <span className="text-sm text-rappi-muted">Buscar...</span>
                </div>
              </div>

              {/* Derecha: notificaciones + avatar */}
              <div className="ml-auto flex items-center gap-3">
                <button className="w-9 h-9 rounded-lg hover:bg-rappi-surface flex items-center justify-center transition-colors" aria-label="Notificaciones">
                  <svg className="w-5 h-5 text-rappi-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                  </svg>
                </button>
                <div className="w-9 h-9 rounded-full bg-rappi-orange flex items-center justify-center text-white text-sm font-bold">
                  N
                </div>
              </div>
            </header>

            {/* Área de contenido scrollable */}
            <main className="flex-1 overflow-auto bg-rappi-surface">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}

// Componente del ícono de sidebar
function SidebarIcon({
  label,
  active,
  children,
}: {
  label: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative group w-full flex justify-center">
      <button
        className={[
          "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
          active
            ? "bg-rappi-orange text-white"
            : "text-gray-400 hover:bg-rappi-sidebar-hover hover:text-white",
        ].join(" ")}
        aria-label={label}
      >
        {children}
      </button>
      {/* Tooltip */}
      <span className="absolute left-14 top-1/2 -translate-y-1/2 bg-rappi-dark text-white text-xs rounded-md px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        {label}
      </span>
    </div>
  );
}
