export function RappiHeader() {
  return (
    <header className="h-[60px] bg-white border-b border-[#E8E8E8] flex items-center justify-between px-6 flex-shrink-0 z-10">
      {/* Logo Rappi */}
      <div className="flex items-center">
        <svg width="70" height="24" viewBox="0 0 70 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <text
            x="0" y="20"
            fontFamily="'Poppins', sans-serif"
            fontWeight="700"
            fontSize="24"
            fill="#FF441F"
            letterSpacing="-0.5"
          >
            Rappi
          </text>
        </svg>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#F5F5F5] transition-colors">
          <svg viewBox="0 0 24 24" className="w-[20px] h-[20px]" style={{ color: "#5C5C5C" }} fill="currentColor">
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
          </svg>
          <span className="absolute top-[2px] right-[2px] w-[16px] h-[16px] bg-[#FF441F] rounded-full flex items-center justify-center text-white text-[9px] font-bold leading-none">
            1
          </span>
        </button>

        {/* Separator */}
        <div className="w-px h-8 bg-[#E8E8E8]" />

        {/* País */}
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] text-[12px] hover:bg-[#F5F5F5] transition-colors" style={{ color: "#5C5C5C" }}>
          <span className="text-[14px]">🇲🇽</span>
          <span className="font-medium">México</span>
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
            <path d="M7 10l5 5 5-5H7z" />
          </svg>
        </button>

        {/* Separator */}
        <div className="w-px h-8 bg-[#E8E8E8]" />

        {/* User */}
        <div className="flex items-center gap-2.5">
          <div className="text-right">
            <p className="text-[12px] font-semibold leading-4" style={{ color: "#1A1A1A" }}>carolina.gomezcastillo</p>
            <p className="text-[11px] font-normal leading-4" style={{ color: "#9E9E9E" }}>KAM</p>
          </div>
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #FF441F, #FF6B4A)" }}
          >
            <span className="text-white text-[13px] font-bold">CG</span>
          </div>
        </div>
      </div>
    </header>
  );
}
