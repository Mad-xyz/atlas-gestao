import React from 'react'

export default function SiteFooter() {
  return (
    <footer className="w-full border-t border-white/5 py-2 !mt-2 flex items-center justify-center">
      <div className="flex items-center justify-center gap-1.5 md:gap-2">
        <img 
          src="/logo.webp" 
          alt="Logo" 
          className="w-3.5 h-3.5 rounded-full" 
        />

        <span className="text-gray-400 text-[9px] md:text-[10px] uppercase font-medium tracking-[0.2em] whitespace-nowrap">
          R.S TOP TEAM
        </span>

        <span className="text-white/10 mx-1">|</span>

        <a 
          href="https://www.instagram.com/mad.exe/" 
          target="_blank" 
          rel="noreferrer" 
          className="text-gray-600 hover:text-white transition-all text-[8px] md:text-[10px] uppercase tracking-tighter"
        >
          Desenvolvido por @Mad.exe
        </a>
      </div>
    </footer>
  )
}
