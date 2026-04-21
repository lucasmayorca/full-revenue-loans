import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { UberHeader } from "@/components/layout/UberHeader";
import { UberSidebar } from "@/components/layout/UberSidebar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Uber Eats Manager | Financiamiento",
  description:
    "Accede a crédito para tu negocio directamente desde Uber Eats Manager.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="bg-white">
        <div className="flex h-screen overflow-hidden">
          <UberSidebar />
          <div className="flex flex-col flex-1 min-w-0">
            <UberHeader />
            <main className="flex-1 overflow-auto bg-white">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
