export default function ScrollySection({ id, label, children }) {
  return (
    <section
      id={id}
      className="min-h-screen flex flex-col justify-center py-24 px-6"
    >
      <div className="max-w-6xl mx-auto w-full">
        {label && (
          <p className="text-xs tracking-widest uppercase text-slate-500 mb-4 select-none">
            {label}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}
