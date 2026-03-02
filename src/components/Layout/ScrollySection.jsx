import { useInView } from '../../hooks/useInView';

export default function ScrollySection({ id, label, children }) {
  const [ref, inView] = useInView();

  return (
    <section
      id={id}
      className="min-h-screen flex flex-col justify-center py-24 px-6 border-t border-white/5"
    >
      <div
        ref={ref}
        className={`max-w-6xl mx-auto w-full transition-all duration-700 ease-out ${
          inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        {label && (
          <p className="text-xs tracking-widest uppercase text-slate-600 mb-4 select-none">
            {label}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}
