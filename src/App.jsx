import Header from './components/Layout/Header';
import ScrollySection from './components/Layout/ScrollySection';
import PlasticClock from './components/PlasticClock/PlasticClock';
import PersonalCalculator from './components/PersonalCalculator/PersonalCalculator';
import Timeline from './components/DecompositionTimeline/Timeline';
import WorldMap from './components/WorldMap/WorldMap';

function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center px-6 pt-14">
      <div className="max-w-6xl mx-auto w-full">
        <p className="animate-fade-up text-xs tracking-widest uppercase text-slate-500 mb-6" style={{ animationDelay: '0.05s' }}>
          An interactive data visualization
        </p>
        <h1 className="animate-fade-up text-6xl md:text-8xl font-semibold leading-none tracking-tight text-slate-100 mb-8" style={{ animationDelay: '0.2s' }}>
          Plastic in
          <br />
          <span className="text-ocean-400">Perspective</span>
        </h1>
        <p className="animate-fade-up text-xl md:text-2xl font-light text-slate-400 max-w-2xl leading-relaxed mb-12" style={{ animationDelay: '0.35s' }}>
          Plastic was engineered to be permanent. We decided to use it
          for things we throw away.
        </p>
        <div className="animate-fade-up text-sm text-slate-600" style={{ animationDelay: '0.5s' }}>
          <span>Production &amp; waste data from Our World in Data · Decomposition times from NOAA, EPA &amp; NPS</span>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="animate-fade-up absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2" style={{ animationDelay: '0.9s' }}>
        <div className="w-px h-10 bg-gradient-to-b from-slate-600 to-transparent" />
      </div>
    </section>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-100">
      <Header />
      <main>
        <Hero />

        <ScrollySection id="clock" label="Section 01">
          <h2 className="text-4xl md:text-5xl font-semibold mb-3 text-slate-100">
            The Plastic Clock
          </h2>
          <p className="text-slate-400 text-lg mb-10 max-w-xl">
            Global plastic production, measured in real time.
          </p>
          <PlasticClock />
        </ScrollySection>

        <ScrollySection id="calculator" label="Section 02">
          <h2 className="text-4xl md:text-5xl font-semibold mb-3 text-slate-100">
            Your Plastic Life
          </h2>
          <p className="text-slate-400 text-lg mb-10 max-w-xl">
            How does your lifetime plastic footprint compare?
          </p>
          <PersonalCalculator />
        </ScrollySection>

        <ScrollySection id="timeline" label="Section 03">
          <h2 className="text-4xl md:text-5xl font-semibold mb-3 text-slate-100">
            Decomposition Timeline
          </h2>
          <p className="text-slate-400 text-lg mb-10 max-w-xl">
            The items you throw away will outlast everything you know.
          </p>
          <Timeline />
        </ScrollySection>

        <ScrollySection id="map" label="Section 04">
          <h2 className="text-4xl md:text-5xl font-semibold mb-3 text-slate-100">
            Where Does It Go?
          </h2>
          <p className="text-slate-400 text-lg mb-10 max-w-xl">
            Plastic waste generation and mismanaged waste, by country.
          </p>
          <WorldMap />
        </ScrollySection>

        <section className="border-t border-white/5 py-20 px-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-4xl md:text-5xl font-semibold text-slate-100">Screencast</h2>
            <p className="text-slate-400 text-lg max-w-xl">A walkthrough of the project.</p>
            <div className="relative w-full rounded-lg overflow-hidden border border-white/5" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute inset-0 w-full h-full"
                src="https://www.youtube.com/embed/tH-qrhgpIb8"
                title="Plastic in Perspective Screencast"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </section>

        <footer className="border-t border-white/5 py-12 px-6">
          <div className="max-w-6xl mx-auto text-center space-y-4">
            <div className="flex justify-center gap-8 text-sm text-slate-400">
              <a href="https://github.com/sctrautz/plastic-in-perspective/blob/main/Process%20Book%20Outline.pdf" target="_blank" rel="noreferrer" className="hover:text-slate-100 transition-colors">Process Book</a>
              <a href="https://github.com/sctrautz/plastic-in-perspective/tree/main/public/data" target="_blank" rel="noreferrer" className="hover:text-slate-100 transition-colors">Data</a>
              <a href="https://github.com/sctrautz/plastic-in-perspective" target="_blank" rel="noreferrer" className="hover:text-slate-100 transition-colors">GitHub</a>
            </div>
            <div className="text-xs text-slate-600 space-y-1">
              <p>Production &amp; waste data: Our World in Data — Ritchie &amp; Roser (2018) · Decomposition times: NOAA Marine Debris Program, EPA, National Park Service, UNESCO</p>
              <p>Built with React, D3.js, and Tailwind CSS</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
