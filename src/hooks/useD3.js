import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

export function useD3(renderFn, dependencies = []) {
  const ref = useRef();

  useEffect(() => {
    if (ref.current) {
      renderFn(d3.select(ref.current));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return ref;
}
