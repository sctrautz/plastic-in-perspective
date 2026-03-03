import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { useAllData } from '../../hooks/useData';
import { mergeCountryData } from '../../utils/dataProcessing';
import { WORLD_MAP_URL } from '../../utils/constants';
import { ISO_A3_TO_NUM } from '../../utils/isoLookup';

const MAP_W = 960;
const MAP_H = 500;

const MODES = [
  { id: 'waste',      label: 'Waste Generated',  field: 'wastePerCapita',      unit: 'kg / person / day',  percentile: 0.97 },
  { id: 'mismanaged', label: 'Pollution Emitted', field: 'mismanagedPerCapita', unit: 'kg / person / year', percentile: 0.95 },
];

export default function WorldMap() {
  const svgRef = useRef();
  const [geoData, setGeoData] = useState(null);
  const [mode, setMode] = useState('waste');
  const [tooltip, setTooltip] = useState(null);
  const { data, loading } = useAllData();

  useEffect(() => {
    d3.json(WORLD_MAP_URL).then(setGeoData);
  }, []);

  const byNumeric = useMemo(() => {
    if (!data) return null;
    const merged = mergeCountryData(data.wastePerCapita, data.mismanagedPerCapita);
    const map = {};
    merged.forEach((d) => {
      const num = ISO_A3_TO_NUM[d.code];
      if (num) map[num] = d;
    });
    return map;
  }, [data]);

  // Draw country outlines once
  useEffect(() => {
    if (!geoData || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const projection = d3.geoNaturalEarth1().scale(153).translate([MAP_W / 2, MAP_H / 2 - 10]);
    const path = d3.geoPath(projection);
    const countries = topojson.feature(geoData, geoData.objects.countries);

    svg.append('g').attr('class', 'outlines')
      .selectAll('path')
      .data(countries.features)
      .join('path')
      .attr('d', path)
      .attr('fill', '#0a1628')
      .attr('stroke', '#1a2d4a')
      .attr('stroke-width', 0.4);
  }, [geoData]);

  // Draw/update bubbles
  useEffect(() => {
    if (!geoData || !byNumeric || !svgRef.current) return;

    const cfg = MODES.find((m) => m.id === mode);
    const { field, percentile } = cfg;

    const svg = d3.select(svgRef.current);
    const projection = d3.geoNaturalEarth1().scale(153).translate([MAP_W / 2, MAP_H / 2 - 10]);
    const path = d3.geoPath(projection);
    const countries = topojson.feature(geoData, geoData.objects.countries);

    const values = Object.values(byNumeric)
      .map((d) => d[field])
      .filter((v) => v != null && v > 0)
      .sort(d3.ascending);
    const maxVal = d3.quantile(values, percentile);

    const rScale = d3.scaleSqrt().domain([0, maxVal]).range([0, 34]);

    const bubbleData = countries.features
      .map((f) => {
        const country = byNumeric[+f.id];
        if (!country || country[field] == null || country[field] <= 0) return null;
        const centroid = path.centroid(f);
        if (!centroid || isNaN(centroid[0]) || isNaN(centroid[1])) return null;
        return { id: +f.id, centroid, value: country[field], entity: country.entity, ...country };
      })
      .filter(Boolean);

    // Ensure bubbles layer is on top of outlines
    let bubblesG = svg.select('.bubbles');
    if (bubblesG.empty()) bubblesG = svg.append('g').attr('class', 'bubbles');

    bubblesG.selectAll('.bubble')
      .data(bubbleData, (d) => d.id)
      .join(
        (enter) =>
          enter.append('circle').attr('class', 'bubble')
            .attr('cx', (d) => d.centroid[0])
            .attr('cy', (d) => d.centroid[1])
            .attr('r', 0),
        (update) => update,
        (exit) => exit.transition().duration(300).attr('r', 0).remove()
      )
      .attr('fill', '#2272c3')
      .attr('fill-opacity', 0.55)
      .attr('stroke', '#7db5e8')
      .attr('stroke-width', 0.7)
      .attr('stroke-opacity', 0.45)
      .style('cursor', 'pointer')
      .on('mousemove', function (event, d) {
        const [mx, my] = d3.pointer(event, svgRef.current.closest('.map-container'));
        setTooltip({ x: mx, y: my, country: d });
      })
      .on('mouseleave', () => setTooltip(null))
      .transition().duration(700).ease(d3.easeCubicOut)
      .attr('r', (d) => rScale(d.value));

    // Bubble size legend
    svg.selectAll('.legend').remove();
    const lg = svg.append('g').attr('class', 'legend')
      .attr('transform', `translate(20, ${MAP_H - 70})`);

    const legendVals = [maxVal * 0.25, maxVal * 0.6, maxVal].filter(Boolean);
    let lx = 0;
    legendVals.forEach((v) => {
      const r = rScale(v);
      lx += r;
      lg.append('circle')
        .attr('cx', lx).attr('cy', 34 - r)
        .attr('r', r)
        .attr('fill', 'none')
        .attr('stroke', '#30363d')
        .attr('stroke-width', 0.8);
      lg.append('text')
        .attr('x', lx).attr('y', 40)
        .attr('text-anchor', 'middle')
        .attr('fill', '#484f58').attr('font-size', 9)
        .text(d3.format(',.2~g')(v));
      lx += r + 8;
    });
    lg.append('text')
      .attr('x', 0).attr('y', 54)
      .attr('fill', '#30363d').attr('font-size', 9)
      .attr('letter-spacing', '0.08em')
      .text(cfg.unit.toUpperCase());
  }, [geoData, byNumeric, mode]);

  const isReady = !loading && geoData && byNumeric;

  return (
    <div className="space-y-4">

      {/* Mode toggle */}
      <div className="flex gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`px-4 py-2 text-sm rounded-md border transition-colors cursor-pointer ${
              mode === m.id
                ? 'bg-ocean-600 border-ocean-500 text-slate-100'
                : 'bg-transparent border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Map */}
      <div className="map-container relative border border-white/5 rounded-lg bg-white/[0.015] overflow-hidden">
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-600 text-sm tracking-widest uppercase">
            Loading
          </div>
        )}
        <svg
          ref={svgRef}
          viewBox={`0 0 ${MAP_W} ${MAP_H}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full"
          style={{ height: 'auto', display: isReady ? 'block' : 'none' }}
        />

        {tooltip && (
          <div
            className="pointer-events-none absolute bg-[#161b22] border border-white/10 rounded px-3 py-2 text-xs"
            style={{ left: tooltip.x + 12, top: tooltip.y - 10, maxWidth: 200 }}
          >
            <div className="text-slate-200 font-medium mb-1">{tooltip.country.entity}</div>
            {tooltip.country.wastePerCapita != null && (
              <div className="text-slate-500">
                Waste: {d3.format(',.3f')(tooltip.country.wastePerCapita)} kg/day
              </div>
            )}
            {tooltip.country.mismanagedPerCapita != null && (
              <div className="text-slate-500">
                Mismanaged: {d3.format(',.1f')(tooltip.country.mismanagedPerCapita)} kg/yr
              </div>
            )}
          </div>
        )}
      </div>

      <p className="text-xs text-slate-700">
        Data: Our World in Data — Jambeck et al. (2015) · Mismanaged waste: 2019 · Waste generated: 2010
      </p>
    </div>
  );
}
