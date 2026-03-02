export const DECOMPOSITION_TIMES = {
  plasticBag: {
    label: 'Plastic Bag',
    years: 20,
    source: 'NOAA Marine Debris Program',
    url: 'https://marinedebris.noaa.gov',
  },
  plasticBottle: {
    label: 'Plastic Bottle',
    years: 450,
    source: 'UNESCO Ocean Literacy Portal',
    url: 'https://oceanliteracy.unesco.org',
  },
  fishingLine: {
    label: 'Fishing Line',
    years: 600,
    source: 'NOAA Marine Debris Program',
    url: 'https://marinedebris.noaa.gov',
  },
  styrofoamCup: {
    label: 'Styrofoam Cup',
    years: 50,
    source: 'EPA',
    url: 'https://www.epa.gov',
  },
  plasticStraw: {
    label: 'Plastic Straw',
    years: 200,
    source: 'National Park Service',
    url: 'https://www.nps.gov',
  },
};

export const PHYSICAL_REFERENCES = {
  garbageTruckKg: 9000,
  bowlingBallKg: 7,
  plasticBottleKg: 0.02,
  avgBodyWeightKg: 70,
  creditCardGrams: 5,
};

export const HISTORICAL_MARKERS = [
  { year: 1776, label: 'US Founded' },
  { year: 1945, label: 'WWII Ends' },
  { year: 1969, label: 'Moon Landing' },
];

// Exact CSV column names from Our World in Data exports
export const CSV_COLUMNS = {
  production: 'Annual plastic production between 1950 and 2019',
  wastePerCapita: 'Per capita plastic waste',
  mismanagedPerCapita: 'Mismanaged plastic waste per capita',
  oceanAccumulation: 'Plastic leakage to aquatic environment - Leakage type: Accumulated stock in oceans',
};

// Paths relative to the Vite base (src/data is served as static assets via import)
export const DATA_PATHS = {
  production: new URL('../data/global-plastics-production.csv', import.meta.url).href,
  wastePerCapita: new URL('../data/plastic-waste-per-capita.csv', import.meta.url).href,
  mismanagedPerCapita: new URL('../data/mismanaged-plastic-waste-per-capita.csv', import.meta.url).href,
  oceanAccumulation: new URL('../data/plastic-waste-accumulated-in-oceans.csv', import.meta.url).href,
};

export const WORLD_MAP_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';
