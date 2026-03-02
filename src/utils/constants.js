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

export const CSV_COLUMNS = {
  production: 'Annual plastic production between 1950 and 2019',
  wastePerCapita: 'Per capita plastic waste',
  mismanagedPerCapita: 'Mismanaged plastic waste per capita',
  oceanAccumulation: 'Plastic leakage to aquatic environment - Leakage type: Accumulated stock in oceans',
};

const BASE = import.meta.env.BASE_URL;
export const DATA_PATHS = {
  production: `${BASE}data/global-plastics-production.csv`,
  wastePerCapita: `${BASE}data/plastic-waste-per-capita.csv`,
  mismanagedPerCapita: `${BASE}data/mismanaged-plastic-waste-per-capita.csv`,
  oceanAccumulation: `${BASE}data/plastic-waste-accumulated-in-oceans.csv`,
};

export const WORLD_MAP_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';
