import { PHYSICAL_REFERENCES, CSV_COLUMNS } from './constants';

const {
  production: COL_PRODUCTION,
  wastePerCapita: COL_WASTE,
  mismanagedPerCapita: COL_MISMANAGED,
  oceanAccumulation: COL_OCEAN,
} = CSV_COLUMNS;

// Returns per-second/minute/truck rates derived from the production CSV.
// Filters to the World aggregate row and picks the latest year.
export function calculatePlasticRate(productionData) {
  const worldRows = productionData
    .filter((d) => d.Entity === 'World')
    .sort((a, b) => +a.Year - +b.Year);
  const latest = worldRows[worldRows.length - 1];
  const tonnesPerYear = +latest[COL_PRODUCTION];
  const tonnesPerSecond = tonnesPerYear / (365 * 24 * 60 * 60);
  return {
    year: +latest.Year,
    tonnesPerYear,
    tonnesPerSecond,
    tonnesPerMinute: tonnesPerSecond * 60,
    trucksPerMinute: (tonnesPerSecond * 60) / PHYSICAL_REFERENCES.garbageTruckKg,
  };
}

// Returns sorted array of { year, tonnes } for the World production time series.
export function getProductionTimeSeries(productionData) {
  return productionData
    .filter((d) => d.Entity === 'World' && d[COL_PRODUCTION])
    .map((d) => ({ year: +d.Year, tonnes: +d[COL_PRODUCTION] }))
    .sort((a, b) => a.year - b.year);
}

// Returns kg/person/year of plastic waste for a given country (2010 snapshot).
export function getCountryWaste(wasteData, countryName) {
  const row = wasteData.find((d) => d.Entity === countryName);
  return row ? +row[COL_WASTE] : null;
}

// Returns kg/person/year of mismanaged plastic waste for a given country.
export function getCountryMismanaged(mismanagedData, countryName) {
  const row = mismanagedData.find((d) => d.Entity === countryName);
  return row ? +row[COL_MISMANAGED] : null;
}

// Returns sorted array of { year, tonnes } for global ocean accumulation.
export function getOceanTimeSeries(oceanData) {
  return oceanData
    .filter((d) => d.Entity === 'World' && d[COL_OCEAN])
    .map((d) => ({ year: +d.Year, tonnes: +d[COL_OCEAN] }))
    .sort((a, b) => a.year - b.year);
}

// Returns a flat array of all countries with both waste and mismanaged values,
// keyed by ISO3 code for joining to TopoJSON.
export function mergeCountryData(wasteData, mismanagedData) {
  const mismanagedByCode = {};
  mismanagedData.forEach((d) => {
    if (d.Code) mismanagedByCode[d.Code] = +d[COL_MISMANAGED];
  });

  return wasteData
    .filter((d) => d.Code && d[COL_WASTE])
    .map((d) => ({
      entity: d.Entity,
      code: d.Code,
      wastePerCapita: +d[COL_WASTE],
      mismanagedPerCapita: mismanagedByCode[d.Code] ?? null,
    }));
}

// Returns per-person lifetime plastic stats given country kg/year and age.
export function calculatePersonalImpact(kgPerYear, age) {
  const lifetimeKg = kgPerYear * age;
  return {
    kgPerYear,
    lifetimeKg,
    bowlingBalls: Math.round(lifetimeKg / PHYSICAL_REFERENCES.bowlingBallKg),
    bodyWeights: +(lifetimeKg / PHYSICAL_REFERENCES.avgBodyWeightKg).toFixed(1),
    bottlesPerYear: Math.round(kgPerYear / PHYSICAL_REFERENCES.plasticBottleKg),
  };
}

// Returns a sorted list of country names from the waste CSV for dropdowns.
export function getCountryList(wasteData) {
  return wasteData
    .filter((d) => d.Code && d.Entity)
    .map((d) => d.Entity)
    .sort();
}
