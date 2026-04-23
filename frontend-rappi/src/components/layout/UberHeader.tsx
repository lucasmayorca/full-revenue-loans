export function UberHeader() {
  return (
    <header className="h-14 bg-white border-b border-uber-gray-200 flex items-center justify-between px-4 flex-shrink-0 z-10">
      <div className="flex items-baseline gap-2">
        <span className="font-bold text-[25px] leading-6 text-black tracking-tight">
          Uber
        </span>
        <span className="font-bold text-[25px] leading-6 text-uber-green tracking-tight">
          Eats
        </span>
        <span className="font-bold text-[25px] leading-6 text-black tracking-tight">
          Manager
        </span>
      </div>
      <nav className="flex items-center gap-6">
        <a
          href="#"
          className="text-[16px] font-medium text-black opacity-50 hover:opacity-100 transition-opacity"
        >
          Help
        </a>
        <a
          href="#"
          className="text-[16px] font-medium text-black opacity-50 hover:opacity-100 transition-opacity"
        >
          Sign out
        </a>
      </nav>
    </header>
  );
}
