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

export function useAllData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      d3.csv(DATA_PATHS.production),
      d3.csv(DATA_PATHS.wastePerCapita),
      d3.csv(DATA_PATHS.mismanagedPerCapita),
    ])
      .then(([production, wastePerCapita, mismanagedPerCapita]) => {
        setData({ production, wastePerCapita, mismanagedPerCapita });
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, []);

  return { data, loading, error };
}
