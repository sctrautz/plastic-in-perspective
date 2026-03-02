import { useEffect, useState } from 'react';

const NAV = [
  { id: 'clock', label: 'The Clock' },
  { id: 'calculator', label: 'Your Impact' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'map', label: 'World Map' },
];

export default function Header() {
  const [active, setActive] = useState('');

  useEffect(() => {
    const observers = NAV.map(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(id); },
        { threshold: 0.35 }
      );
      obs.observe(el);
      return obs;
    });
    return () => observers.forEach((obs) => obs?.disconnect());
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0d1117]/80 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <span className="text-sm font-semibold tracking-widest uppercase text-slate-400 select-none">
          Plastic in Perspective
        </span>
        <nav className="hidden md:flex items-center gap-8 text-xs tracking-wider uppercase">
          {NAV.map(({ id, label }) => (
            <a
              key={id}
              href={`#${id}`}
              className={`transition-colors duration-200 ${
                active === id ? 'text-slate-200' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
