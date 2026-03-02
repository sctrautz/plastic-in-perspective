import { useState, useEffect } from 'react';
import * as d3 from 'd3';

export function useData(csvPath) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!csvPath) return;
    setLoading(true);
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
