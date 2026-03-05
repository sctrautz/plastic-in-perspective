# Plastic in Perspective

**Team Waste** — Spencer Trautz, Brendan Reilly, Asha Buchanan

An interactive scrollytelling data visualization about plastic pollution, built as a WPI CS final project.

---

## Links

- **Live Site:** https://sctrautz.github.io/plastic-in-perspective/
- **Screencast:** https://youtu.be/tH-qrhgpIb8
- **Process Book:** [Process Book Outline.pdf](./Process%20Book%20Outline.pdf)

---

## Overview

Plastic pollution statistics are widely available but rarely felt — the numbers are too large and abstract to register meaningfully. This project presents four interactive visualizations, each built around a data analogy that gives the numbers physical context:

1. **The Plastic Clock** — global plastic production visualized as debris falling through an ocean scene in real time
2. **Your Plastic Life** — your lifetime plastic footprint as a stack of bottles compared against real-world landmarks
3. **Decomposition Timeline** — how long common plastic items persist in the environment, compared against civilization lifespans
4. **Where Does It Go?** — two simultaneous rotating globes showing who generates plastic waste and who is left managing it

---

## Repository Contents

```
src/
  App.jsx                          — page layout and section structure
  components/
    PlasticClock/PlasticClock.jsx  — ocean scene visualization
    PersonalCalculator/            — landmark stack visualization
    DecompositionTimeline/         — timeline bar chart
    WorldMap/WorldMap.jsx          — two-globe visualization
    Layout/                        — header and scroll section wrapper
  hooks/
    useData.js                     — CSV loading hooks
    useInView.js                   — IntersectionObserver scroll trigger
    useD3.js                       — D3 ref utility
  utils/
    constants.js                   — decomposition times, data paths, CSV column names
    dataProcessing.js              — all data transformation and derived calculations
    isoLookup.js                   — ISO alpha-3 to TopoJSON numeric ID mapping

public/data/
  global-plastics-production.csv
  plastic-waste-per-capita.csv
  mismanaged-plastic-waste-per-capita.csv

Process Book Outline (1).pdf
```

---

## Outside Libraries

- [React 19](https://react.dev) — UI framework
- [D3 v7](https://d3js.org) — all SVG rendering and data visualization
- [Tailwind CSS v4](https://tailwindcss.com) — page styling
- [topojson-client](https://github.com/topojson/topojson-client) — parsing world geometry for the globe section
- [Vite](https://vite.dev) — build tooling
- [world-atlas](https://github.com/topojson/world-atlas) — TopoJSON world geometry, loaded via CDN
- [Inter](https://fonts.google.com/specimen/Inter) — typeface, loaded via Google Fonts

All visualization code is original. D3 Observable notebooks were used as reference for globe rotation and particle field techniques.

---

## Non-Obvious Interface Features

- **Scroll animations play once.** Each section animates in when it first enters the viewport and does not restart if you scroll back up.
- **Timeline tooltip.** The hover tooltip on the Decomposition Timeline only activates when your cursor is directly over a bar, not the empty space in the row.
- **Globe visibility.** On the Two Earths section, bubbles automatically hide as countries rotate to the back of the globe and reappear as they rotate to the front.
- **Log scale on landmark stack.** The Personal Calculator uses a logarithmic y-axis so the stack height remains readable across all ages — the range spans multiple orders of magnitude from age 1 to age 80.
- **Plastic particle behaviors.** In the Plastic Clock, each piece of debris is randomly assigned one of three behaviors on spawn: float near the surface, suspend mid-water, or sink to the ocean floor.

---

## Data Sources

- **Our World in Data** — global plastic production (1950–2019), plastic waste per capita (2010), mismanaged plastic waste per capita (2019)
- **NOAA Marine Debris Program** — decomposition times for fishing line and plastic bags
- **EPA** — decomposition time for styrofoam cups
- **National Park Service** — decomposition time for plastic straws
- **UNESCO Ocean Literacy Portal** — decomposition time for plastic bottles
