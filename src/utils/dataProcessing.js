import { PHYSICAL_REFERENCES } from './constants';

export function calculatePlasticRate(productionData) {
  const latestYear = productionData[productionData.length - 1];
  const tonnesPerYear = +latestYear.annual_production;
  const tonnesPerSecond = tonnesPerYear / (365 * 24 * 60 * 60);
  return {
    tonnesPerSecond,
    tonnesPerMinute: tonnesPerSecond * 60,
    trucksPerMinute: (tonnesPerSecond * 60) / PHYSICAL_REFERENCES.garbageTruckKg,
  };
}

export function getCountryWaste(wasteData, countryName) {
  const country = wasteData.find((d) => d.Entity === countryName);
  return country ? +country.plastic_waste_per_capita : null;
}

export function calculatePersonalImpact(kgPerYear, age) {
  const lifetimeKg = kgPerYear * age;
  return {
    kgPerYear,
    lifetimeKg,
    bowlingBalls: Math.round(lifetimeKg / PHYSICAL_REFERENCES.bowlingBallKg),
    bodyWeights: (lifetimeKg / PHYSICAL_REFERENCES.avgBodyWeightKg).toFixed(1),
    bottlesPerYear: Math.round(kgPerYear / PHYSICAL_REFERENCES.plasticBottleKg),
  };
}
