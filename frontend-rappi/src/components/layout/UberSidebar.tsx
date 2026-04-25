"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  disabled?: boolean;
}

/* Material Symbols — filled, estilo usado en Uber Eats Manager */

const IconHome = (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
  </svg>
);

const IconStorefront = (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M21.9 8.89l-1.05-4.37c-.22-.9-1-1.52-1.91-1.52H5.05c-.9 0-1.69.63-1.9 1.52L2.1 8.89c-.24 1.02-.02 2.06.62 2.88.08.11.19.19.28.29V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-6.94c.09-.09.2-.18.28-.28.64-.82.87-1.87.62-2.89zM5.03 4.99h13.93l1.05 4.37c.1.42.01.84-.25 1.17-.14.18-.44.47-.94.47-.61 0-1.18-.51-1.26-1.21l-.69-4.7L14.11 9c-.1.71-.66 1.25-1.41 1.25-.8 0-1.45-.65-1.45-1.5V5.54l-.64 4.05c-.05.42-.26.79-.57 1.03-.32.23-.71.34-1.1.28-.75-.11-1.3-.82-1.3-1.62l.01-.11L6.17 5.6 5.46 9.79c-.12.7-.72 1.21-1.33 1.21-.43 0-.82-.2-1.09-.45-.27-.33-.38-.76-.28-1.18l.81-4.37z" />
  </svg>
);

const IconOrders = (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
  </svg>
);

const IconAnalytics = (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M3 3v18h18v-2H5V3H3zm16 4h-4v10h4V7zm-6 3H9v7h4v-7zm-6 2H3v5h4v-5z" />
  </svg>
);

const IconCampaign = (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M18 11v2h4v-2h-4zm-2 6.61c.96.71 2.21 1.65 3.2 2.39.4-.53.8-1.07 1.2-1.6-.99-.74-2.24-1.68-3.2-2.4-.4.54-.8 1.08-1.2 1.61zM20.4 5.6c-.4-.53-.8-1.07-1.2-1.6-.99.74-2.24 1.68-3.2 2.4.4.53.8 1.07 1.2 1.6.96-.72 2.21-1.65 3.2-2.4zM4 9c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1v4h2v-4h1l5 3V6L8 9H4zm11.5 3c0-1.33-.58-2.53-1.5-3.35v6.69c.92-.81 1.5-2.01 1.5-3.34z" />
  </svg>
);

const IconMenuBook = (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z" />
  </svg>
);

const IconCreditCard = (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
  </svg>
);

const IconGroup = (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
  </svg>
);

const IconSettings = (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94 0 .31.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
  </svg>
);

const IconWallet = (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M21 7.28V5c0-1.1-.9-2-2-2H5C3.89 3 3 3.9 3 5v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-2.28c.59-.35 1-.98 1-1.72V9c0-.74-.41-1.38-1-1.72zM20 9v6h-7V9h7zM5 19V5h14v2h-6c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h6v2H5z" />
    <circle cx="16" cy="12" r="1.5" />
  </svg>
);

const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "#", icon: IconHome, disabled: true },
  { label: "Stores", href: "#", icon: IconStorefront, disabled: true },
  { label: "Orders", href: "#", icon: IconOrders, disabled: true },
  { label: "Performance", href: "#", icon: IconAnalytics, disabled: true },
  { label: "Marketing", href: "#", icon: IconCampaign, disabled: true },
  { label: "Menu", href: "#", icon: IconMenuBook, disabled: true },
  { label: "Payments", href: "#", icon: IconCreditCard, disabled: true },
  { label: "Users", href: "#", icon: IconGroup, disabled: true },
  { label: "Settings", href: "#", icon: IconSettings, disabled: true },
  { label: "Financiamiento MÁS", href: "/offers", icon: IconWallet },
];

export function UberSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[200px] bg-white border-r border-uber-gray-200 flex flex-col py-6 px-2 gap-1 flex-shrink-0 z-20">
      {NAV_ITEMS.map((item) => {
        const isFinanciamiento = item.href === "/offers";
        const active = isFinanciamiento
          ? pathname?.startsWith("/offers") ||
            pathname?.startsWith("/full-revenue")
          : false;

        const content = (
          <>
            <span
              className={[
                "shrink-0",
                active ? "text-rappi-orange" : "text-uber-gray-700",
              ].join(" ")}
            >
              {item.icon}
            </span>
            <span
              className={[
                "text-[14px] leading-6",
                active ? "font-bold text-rappi-orange" : "font-medium text-uber-gray-900",
              ].join(" ")}
            >
              {item.label}
            </span>
          </>
        );

        const baseClasses =
          "flex items-center gap-3 px-3 py-2 rounded-sm w-full transition-colors";
        const stateClasses = active
          ? "bg-rappi-orange-light border-l-2 border-rappi-orange -ml-[2px] pl-[14px]"
          : item.disabled
          ? "opacity-70 cursor-default"
          : "hover:bg-uber-gray-100";

        if (item.disabled) {
          return (
            <div
              key={item.label}
              className={[baseClasses, stateClasses].join(" ")}
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
            className={[baseClasses, stateClasses].join(" ")}
          >
            {content}
          </Link>
        );
      })}
    </aside>
  );
}
