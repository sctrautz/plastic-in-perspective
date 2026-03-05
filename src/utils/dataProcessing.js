import { PHYSICAL_REFERENCES, CSV_COLUMNS } from './constants';

const {
  production: COL_PRODUCTION,
  wastePerCapita: COL_WASTE,
  mismanagedPerCapita: COL_MISMANAGED,
} = CSV_COLUMNS;

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
    trucksPerMinute: (tonnesPerSecond * 1000 * 60) / PHYSICAL_REFERENCES.garbageTruckKg,
  };
}

export function getCountryWaste(wasteData, countryName) {
  const row = wasteData.find((d) => d.Entity === countryName);
  return row ? +row[COL_WASTE] : null;
}

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

export function calculatePersonalImpact(kgPerDay, age) {
  const kgPerYear = kgPerDay * 365;
  const lifetimeKg = kgPerYear * age;
  return {
    kgPerDay,
    kgPerYear,
    lifetimeKg,
    bowlingBalls: Math.round(lifetimeKg / PHYSICAL_REFERENCES.bowlingBallKg),
    bodyWeights: +(lifetimeKg / PHYSICAL_REFERENCES.avgBodyWeightKg).toFixed(1),
    bottlesPerYear: Math.round(kgPerYear / PHYSICAL_REFERENCES.plasticBottleKg),
  };
}
