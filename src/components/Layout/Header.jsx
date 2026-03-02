export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0d1117]/80 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <span className="text-sm font-semibold tracking-widest uppercase text-slate-400 select-none">
          Plastic in Perspective
        </span>
        <nav className="hidden md:flex items-center gap-8 text-xs tracking-wider uppercase text-slate-500">
          <a href="#clock" className="hover:text-slate-200 transition-colors">The Clock</a>
          <a href="#calculator" className="hover:text-slate-200 transition-colors">Your Impact</a>
          <a href="#timeline" className="hover:text-slate-200 transition-colors">Timeline</a>
          <a href="#map" className="hover:text-slate-200 transition-colors">World Map</a>
        </nav>
      </div>
    </header>
  );
}
