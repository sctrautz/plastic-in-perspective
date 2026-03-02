import { useState, useEffect } from 'react';
import * as d3 from 'd3';
import { DATA_PATHS } from '../utils/constants';

export function useData(csvPath) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!csvPath) return;
    setLoading(true);
    setError(null);
    d3.csv(csvPath)
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, [csvPath]);

  return { data, loading, error };
}

// Loads all four CSVs in parallel. Returns { data, loading, error } where
// data is { production, wastePerCapita, mismanagedPerCapita, oceanAccumulation }.
export function useAllData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      d3.csv(DATA_PATHS.production),
      d3.csv(DATA_PATHS.wastePerCapita),
      d3.csv(DATA_PATHS.mismanagedPerCapita),
      d3.csv(DATA_PATHS.oceanAccumulation),
    ])
      .then(([production, wastePerCapita, mismanagedPerCapita, oceanAccumulation]) => {
        setData({ production, wastePerCapita, mismanagedPerCapita, oceanAccumulation });
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, []);

  return { data, loading, error };
}
