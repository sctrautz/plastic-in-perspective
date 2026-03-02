import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { useAllData } from '../../hooks/useData';
import { mergeCountryData } from '../../utils/dataProcessing';
import { WORLD_MAP_URL } from '../../utils/constants';
import { ISO_A3_TO_NUM } from '../../utils/isoLookup';

const MAP_W = 960;
const MAP_H = 500;
const NO_DATA_COLOR = '#21262d';

const MODES = [
  {
    id: 'waste',
    label: 'Waste Generated',
    field: 'wastePerCapita',
    unit: 'kg / person / day',
    percentile: 0.98,
    interpolator: d3.interpolateBlues,
  },
  {
    id: 'mismanaged',
    label: 'Pollution Emitted',
    field: 'mismanagedPerCapita',
    unit: 'kg / person / year',
    percentile: 0.95,
    interpolator: d3.interpolateBlues,
  },
];

const LEGEND_W = 140;
const LEGEND_H = 8;

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

  useEffect(() => {
    if (!geoData || !byNumeric || !svgRef.current) return;

    const cfg = MODES.find((m) => m.id === mode);
    const { field, percentile, interpolator, unit } = cfg;

    const svg = d3.select(svgRef.current);

    const projection = d3.geoNaturalEarth1()
      .scale(153)
      .translate([MAP_W / 2, MAP_H / 2 - 10]);

    const path = d3.geoPath(projection);
    const countries = topojson.feature(geoData, geoData.objects.countries);

    const values = Object.values(byNumeric)
      .map((d) => d[field])
      .filter((v) => v != null && v > 0)
      .sort(d3.ascending);
    const maxVal = d3.quantile(values, percentile);

    const colorScale = d3.scaleSequential()
      .domain([0, maxVal])
      .interpolator(interpolator);

    // Country fills
    const paths = svg.selectAll('.country')
      .data(countries.features, (d) => d.id)
      .join('path')
      .attr('class', 'country')
      .attr('d', path)
      .attr('stroke', '#0d1117')
      .attr('stroke-width', 0.3)
      .style('cursor', 'pointer')
      .on('mousemove', function (event, d) {
        const country = byNumeric[d.id];
        if (!country) return;
        const [mx, my] = d3.pointer(event, svgRef.current.closest('.map-container'));
        setTooltip({ x: mx, y: my, country });
      })
      .on('mouseleave', () => setTooltip(null));

    paths.transition().duration(500)
      .attr('fill', (d) => {
        const country = byNumeric[d.id];
        if (!country || country[field] == null) return NO_DATA_COLOR;
        return colorScale(country[field]);
      });

    // Philippines annotation (mismanaged mode only)
    svg.selectAll('.annotation').remove();
    if (mode === 'mismanaged') {
      const [px, py] = projection([122, 12]);
      const ann = svg.append('g').attr('class', 'annotation');
      ann.append('circle')
        .attr('cx', px).attr('cy', py).attr('r', 3)
        .attr('fill', '#c97b3a').attr('pointer-events', 'none');
      ann.append('line')
        .attr('x1', px).attr('y1', py)
        .attr('x2', px - 55).attr('y2', py - 28)
        .attr('stroke', '#c97b3a').attr('stroke-width', 0.8)
        .attr('pointer-events', 'none');
      ann.append('text')
        .attr('x', px - 58).attr('y', py - 31)
        .attr('text-anchor', 'end')
        .attr('fill', '#c97b3a')
        .attr('font-size', 10)
        .attr('pointer-events', 'none')
        .text('Philippines — highest mismanaged waste per capita');
    }

    // Legend
    svg.selectAll('.legend').remove();
    const lg = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(16, ${MAP_H - 36})`);

    const defs = svg.select('defs').empty() ? svg.append('defs') : svg.select('defs');
    defs.selectAll('#map-grad').remove();
    const grad = defs.append('linearGradient').attr('id', 'map-grad');
    grad.append('stop').attr('offset', '0%').attr('stop-color', colorScale(0));
    grad.append('stop').attr('offset', '100%').attr('stop-color', colorScale(maxVal));

    lg.append('rect')
      .attr('width', LEGEND_W).attr('height', LEGEND_H).attr('rx', 2)
      .attr('fill', 'url(#map-grad)');

    lg.append('text')
      .attr('y', LEGEND_H + 12).attr('fill', '#484f58').attr('font-size', 10)
      .text('0');

    lg.append('text')
      .attr('x', LEGEND_W).attr('y', LEGEND_H + 12)
      .attr('text-anchor', 'end').attr('fill', '#484f58').attr('font-size', 10)
      .text(`${d3.format(',.2f')(maxVal)}+`);

    lg.append('text')
      .attr('x', LEGEND_W / 2).attr('y', -5)
      .attr('text-anchor', 'middle').attr('fill', '#484f58').attr('font-size', 10)
      .text(unit);

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

        {/* Tooltip */}
        {tooltip && (
          <div
            className="pointer-events-none absolute bg-[#161b22] border border-white/10 rounded px-3 py-2 text-xs"
            style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}
          >
            <div className="text-slate-200 font-medium mb-1">{tooltip.country.entity}</div>
            <div className="text-slate-500">
              Waste: {d3.format(',.3f')(tooltip.country.wastePerCapita)} kg/day
            </div>
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
