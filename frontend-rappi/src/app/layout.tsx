import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { RappiHeader } from "@/components/layout/RappiHeader";
import { RappiSidebar } from "@/components/layout/RappiSidebar";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RappiPresta | Préstamo MÁS",
  description:
    "Accede a crédito para tu negocio directamente desde RappiPresta.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={poppins.variable}>
      <body className="bg-[#F7F3F1]">
        <div className="flex h-screen overflow-hidden">
          <RappiSidebar />
          <div className="flex flex-col flex-1 min-w-0">
            <RappiHeader />
            <main className="flex-1 overflow-auto bg-[#F7F3F1]">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
