export function RappiHeader() {
  return (
    <header className="h-[80px] bg-white border-b border-[#E8E8E8] flex items-center justify-between px-6 flex-shrink-0 z-10">
      {/* Logo Rappi */}
      <div className="flex items-center">
        <svg width="75" height="26" viewBox="0 0 75 26" fill="none" xmlns="http://www.w3.org/2000/svg">
          <text
            x="0" y="22"
            fontFamily="'Poppins', sans-serif"
            fontWeight="700"
            fontSize="26"
            fill="#FF441F"
            letterSpacing="-1"
          >
            Rappi
          </text>
        </svg>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notification bell */}
        <button className="relative w-10 h-10 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#332927]" fill="currentColor">
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
          </svg>
          <span className="absolute top-0 right-0 w-[18px] h-[18px] bg-[#FF441F] rounded-full flex items-center justify-center text-white text-[10px] font-semibold leading-none">
            1
          </span>
        </button>

        {/* Separator */}
        <div className="w-px h-12 bg-[#E8E8E8]" />

        {/* País */}
        <button className="flex items-center gap-2 bg-white rounded-[8px] shadow-sm px-3 py-2 text-[12px] text-[#706967] font-normal">
          <span className="text-base">🇲🇽</span>
          <span>México</span>
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#706967]" fill="currentColor">
            <path d="M7 10l5 5 5-5H7z" />
          </svg>
        </button>

        {/* User */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-[12px] font-semibold text-black leading-5">carolina.gomezcastillo</p>
            <p className="text-[12px] font-normal text-[#706967] leading-5">KAM</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#FF441F] flex items-center justify-center">
            <span className="text-white text-[14px] font-semibold">CG</span>
          </div>
        </div>
      </div>
    </header>
  );
}
