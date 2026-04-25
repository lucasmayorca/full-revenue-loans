"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  badge?: string;
  disabled?: boolean;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

/* ── Iconos SVG ── */
const Ico = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] shrink-0" fill="currentColor">
    <path d={d} />
  </svg>
);

const IconHome       = <Ico d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />;
const IconBell       = <Ico d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />;
const IconHelp       = <Ico d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" />;
const IconStar       = <Ico d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />;
const IconChart      = <Ico d="M3 3v18h18v-2H5V3H3zm16 4h-4v10h4V7zm-6 3H9v7h4v-7zm-6 2H3v5h4v-5z" />;
const IconReview     = <Ico d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />;
const IconSales      = <Ico d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />;
const IconAds        = <Ico d="M18 11v2h4v-2h-4zm-2 6.61c.96.71 2.21 1.65 3.2 2.39.4-.53.8-1.07 1.2-1.6-.99-.74-2.24-1.68-3.2-2.4-.4.54-.8 1.08-1.2 1.61zM20.4 5.6c-.4-.53-.8-1.07-1.2-1.6-.99.74-2.24 1.68-3.2 2.4.4.53.8 1.07 1.2 1.6.96-.72 2.21-1.65 3.2-2.4zM4 9c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1v4h2v-4h1l5 3V6L8 9H4zm11.5 3c0-1.33-.58-2.53-1.5-3.35v6.69c.92-.81 1.5-2.01 1.5-3.34z" />;
const IconPromo      = <Ico d="M12.79 21L3 11.21v2c0 .53.21 1.04.59 1.41l7.79 7.79c.78.78 2.05.78 2.83 0l6.21-6.21c.78-.78.78-2.05 0-2.83L12.79 21zm-2.83 0L2.17 13.21c-.39-.38-.59-.89-.59-1.41V9.41c0-.53.21-1.04.59-1.41l.01-.01C2.59 7.58 3.1 7.38 3.62 7.4L13 16.79l6.21-6.21c.78-.78 2.05-.78 2.83 0 .78.78.78 2.05 0 2.83l-6.21 6.21c-.78.78-2.05.78-2.83 0z" />;
const IconLink       = <Ico d="M17 7h-4v2h4c1.65 0 3 1.35 3 3s-1.35 3-3 3h-4v2h4c2.76 0 5-2.24 5-5s-2.24-5-5-5zm-6 8H7c-1.65 0-3-1.35-3-3s1.35-3 3-3h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-2zm-3-4h8v2H8z" />;
const IconOrders     = <Ico d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2z" />;
const IconPayment    = <Ico d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />;
const IconMenu       = <Ico d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1z" />;
const IconStore      = <Ico d="M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z" />;
const IconSchedule   = <Ico d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />;
const IconWallet     = <Ico d="M21 7.28V5c0-1.1-.9-2-2-2H5C3.89 3 3 3.9 3 5v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-2.28c.59-.35 1-.98 1-1.72V9c0-.74-.41-1.38-1-1.72zM20 9v6h-7V9h7zM5 19V5h14v2h-6c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h6v2H5z" />;

const SECTIONS: NavSection[] = [
  {
    title: "INICIO",
    items: [
      { label: "Visión general",    href: "#", icon: IconHome,     disabled: true },
      { label: "Notificaciones",    href: "#", icon: IconBell,     badge: "22", disabled: true },
      { label: "Centro de ayuda",   href: "#", icon: IconHelp,     disabled: true },
    ],
  },
  {
    title: "ANÁLISIS",
    items: [
      { label: "RappiAwards",       href: "#", icon: IconStar,     disabled: true },
      { label: "Nivel de servicio", href: "#", icon: IconChart,    disabled: true },
      { label: "Reseñas",           href: "#", icon: IconReview,   disabled: true },
      { label: "Ventas",            href: "#", icon: IconSales,    disabled: true },
    ],
  },
  {
    title: "MARKETING",
    items: [
      { label: "RappiAds",          href: "#", icon: IconAds,      disabled: true },
      { label: "Promociones",       href: "#", icon: IconPromo,    disabled: true },
    ],
  },
  {
    title: "ADMINISTRACIÓN",
    items: [
      { label: "Conectividad",      href: "#", icon: IconLink,     disabled: true },
      { label: "Ordenes",           href: "#", icon: IconOrders,   disabled: true },
      { label: "Pagos",             href: "#", icon: IconPayment,  disabled: true },
      { label: "Menú - Carta",      href: "#", icon: IconMenu,     disabled: true },
      { label: "Mis tiendas",       href: "#", icon: IconStore,    disabled: true },
      { label: "Horarios",          href: "#", icon: IconSchedule, disabled: true },
      {
        label: "Préstamos para ti",
        href: "/offers",
        icon: IconWallet,
        badge: "¡Nuevo!",
      },
    ],
  },
];

export function RappiSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[172px] flex flex-col py-3 overflow-y-auto flex-shrink-0 z-20 bg-white border-r border-[#E8E8E8]">
      {SECTIONS.map((section) => (
        <div key={section.title} className="mb-1">
          {section.title && (
            <p
              className="px-4 pt-3 pb-1 text-[10px] font-semibold tracking-wider uppercase"
              style={{ color: "#ADADAD" }}
            >
              {section.title}
            </p>
          )}
          {section.items.map((item) => {
            const isActive =
              item.href === "/offers"
                ? pathname?.startsWith("/offers") || pathname?.startsWith("/full-revenue")
                : false;

            const content = (
              <>
                <span style={{ color: isActive ? "#FF441F" : "#5C5C5C" }}>
                  {item.icon}
                </span>
                <span
                  className="text-[12px] leading-[18px] truncate"
                  style={{
                    color: isActive ? "#1A1A1A" : "#5C5C5C",
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {item.label}
                </span>
                {item.badge && (
                  <span
                    className="ml-auto shrink-0 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none"
                    style={{ background: "#FF441F" }}
                  >
                    {item.badge}
                  </span>
                )}
              </>
            );

            const baseClasses = "flex items-center gap-2 px-4 py-[7px] w-full transition-colors";

            const activeStyle = isActive
              ? { borderLeft: "3px solid #FF441F", paddingLeft: "13px", background: "#FFF5F3" }
              : {};

            if (item.disabled) {
              return (
                <div
                  key={item.label}
                  className={baseClasses}
                  style={{ opacity: 0.5, cursor: "default", ...activeStyle }}
                  aria-disabled
                >
                  {content}
                </div>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className={[
                  baseClasses,
                  !isActive ? "hover:bg-[#F5F5F5]" : "",
                ].join(" ")}
                style={activeStyle}
              >
                {content}
              </Link>
            );
          })}
        </div>
      ))}
    </aside>
  );
}
