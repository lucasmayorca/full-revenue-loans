/**
 * Sub-layout del dashboard admin — rompe el shell Uber Eats y aplica look R2
 * (dark navy con acento blue). Es un dashboard interno, no parte del
 * prototipo embebido en Uber Manager.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // z-50 para tapar sidebar/header Uber del root layout; fixed full-screen
    <div className="fixed inset-0 z-50 overflow-auto bg-[#0C101B] text-white">
      {children}
    </div>
  );
}
