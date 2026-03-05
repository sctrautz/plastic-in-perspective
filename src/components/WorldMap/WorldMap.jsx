import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { useAllData } from '../../hooks/useData';
import { mergeCountryData } from '../../utils/dataProcessing';
import { WORLD_MAP_URL } from '../../utils/constants';
import { ISO_A3_TO_NUM } from '../../utils/isoLookup';

const W = 960;
const H = 460;
const R = 195;              // globe radius
const CX_L = 237, CX_R = 723, CY = 240;

// Graticule computed once
const GRATICULE = d3.geoGraticule().step([30, 30])();

// A point [lon, lat] is on the front hemisphere of a projection if the
// great-circle distance from its center is < 90°.
function isVisible(proj, coords) {
  const r = proj.rotate();
  return d3.geoDistance(coords, [-r[0], -r[1]]) < Math.PI / 2 - 0.01;
}

export default function WorldMap() {
  const svgRef       = useRef();
  const containerRef = useRef();
  const projLRef     = useRef(null);
  const projRRef     = useRef(null);
  const pathLRef     = useRef(null);
  const pathRRef     = useRef(null);
  const timerRef     = useRef(null);

  const [geoData, setGeoData] = useState(null);
  const [tooltip,  setTooltip]  = useState(null);
  const [mousePos, setMousePos] = useState(null);
  const { data, loading } = useAllData();

  const mergedData = useMemo(() => {
    if (!data) return null;
    return mergeCountryData(data.wastePerCapita, data.mismanagedPerCapita);
  }, [data]);

  // Load TopoJSON
  useEffect(() => { d3.json(WORLD_MAP_URL).then(setGeoData); }, []);

  // ── Effect 1: build static SVG skeleton
  useEffect(() => {
    if (!geoData || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Initialise projections + path generators
    projLRef.current = d3.geoOrthographic().scale(R).translate([CX_L, CY]).clipAngle(90).rotate([0, -20]);
    projRRef.current = d3.geoOrthographic().scale(R).translate([CX_R, CY]).clipAngle(90).rotate([0, -20]);
    pathLRef.current = d3.geoPath(projLRef.current);
    pathRRef.current = d3.geoPath(projRRef.current);

    const countries = topojson.feature(geoData, geoData.objects.countries);

    const SIDES = [
      { cls: 'l', cx: CX_L, proj: projLRef.current, path: pathLRef.current,
        label: 'Waste Generated',   sub: 'kg / person / day',           color: '#4a90d9' },
      { cls: 'r', cx: CX_R, proj: projRRef.current, path: pathRRef.current,
        label: 'Mismanaged Waste',  sub: 'mismanaged kg / person / year', color: '#e05c40' },
    ];

    SIDES.forEach(({ cls, cx, proj, path, label, sub, color }) => {
      const g = svg.append('g').attr('class', `globe-${cls}`);

      g.append('path').attr('class', `sphere-${cls}`)
        .datum({ type: 'Sphere' }).attr('d', path)
        .attr('fill', '#050d1a').attr('stroke', '#1a2d4a').attr('stroke-width', 1.2);

      g.append('path').attr('class', `graticule-${cls}`)
        .datum(GRATICULE).attr('d', path)
        .attr('fill', 'none').attr('stroke', '#0d1e30').attr('stroke-width', 0.5);

      g.append('g').attr('class', `countries-${cls}`)
        .selectAll('path')
        .data(countries.features)
        .join('path').attr('class', `country-${cls}`)
        .attr('d', path)
        .attr('fill', '#0e1f36').attr('stroke', '#1a2d4a').attr('stroke-width', 0.3);

      g.append('g').attr('class', `bubbles-${cls}`);

      // Labels above each globe
      svg.append('text').attr('x', cx).attr('y', CY - R - 20)
        .attr('text-anchor', 'middle').attr('fill', color)
        .attr('font-size', 12).attr('letter-spacing', '0.1em')
        .text(label.toUpperCase());

      svg.append('text').attr('x', cx).attr('y', CY - R - 7)
        .attr('text-anchor', 'middle').attr('fill', '#484f58')
        .attr('font-size', 9).attr('letter-spacing', '0.07em')
        .text(sub.toUpperCase());
    });

    // Thin vertical divider between globes
    svg.append('line')
      .attr('x1', W / 2).attr('x2', W / 2)
      .attr('y1', CY - R).attr('y2', CY + R)
      .attr('stroke', '#1a2d4a').attr('stroke-width', 0.8);

  }, [geoData]);

  // ── Effect 2:
  useEffect(() => {
    if (!geoData || !mergedData || !svgRef.current) return;
    if (!projLRef.current || !projRRef.current) return;

    const svg = d3.select(svgRef.current);
    const countries = topojson.feature(geoData, geoData.objects.countries);

    // Geographic centroids [lon, lat] by numeric ID
    const geoCentroids = {};
    countries.features.forEach(f => {
      const c = d3.geoCentroid(f);
      if (c && !isNaN(c[0])) geoCentroids[+f.id] = c;
    });

    const bubbleData = mergedData
      .map(d => {
        const num = ISO_A3_TO_NUM[d.code];
        const gc = num ? geoCentroids[num] : null;
        return gc ? { ...d, gc } : null;
      })
      .filter(Boolean);

    const wasteVals = bubbleData.map(d => d.wastePerCapita).filter(v => v > 0).sort(d3.ascending);
    const mismVals  = bubbleData.map(d => d.mismanagedPerCapita).filter(v => v != null && v > 0).sort(d3.ascending);

    const rWaste = d3.scaleSqrt().domain([0, d3.quantile(wasteVals, 0.97)]).range([0, 24]).clamp(true);
    const rMism  = d3.scaleSqrt().domain([0, d3.quantile(mismVals,  0.95)]).range([0, 24]).clamp(true);

    const SIDES = [
      { cls: 'l', proj: projLRef.current, field: 'wastePerCapita',      rScale: rWaste, color: '#4a90d9',
        fmt: d => `${d3.format(',.3f')(d.wastePerCapita)} kg / person / day` },
      { cls: 'r', proj: projRRef.current, field: 'mismanagedPerCapita', rScale: rMism,  color: '#e05c40',
        fmt: d => `${d3.format(',.1f')(d.mismanagedPerCapita)} kg / person / year` },
    ];

    SIDES.forEach(({ cls, proj, field, rScale, color, fmt }) => {
      const filtered = bubbleData.filter(d => d[field] != null && d[field] > 0);
      svg.select(`.bubbles-${cls}`)
        .selectAll('circle')
        .data(filtered, d => d.code)
        .join('circle')
        .attr('class', `bubble-${cls}`)
        .attr('cx', d => { const p = proj(d.gc); return p ? p[0] : 0; })
        .attr('cy', d => { const p = proj(d.gc); return p ? p[1] : 0; })
        .attr('r',  d => rScale(d[field]))
        .attr('fill', color).attr('fill-opacity', 0.5)
        .attr('stroke', color).attr('stroke-width', 0.5).attr('stroke-opacity', 0.4)
        .attr('visibility', d => isVisible(proj, d.gc) ? 'visible' : 'hidden')
        .style('cursor', 'pointer')
        .on('mouseenter', (_, d) => setTooltip({ entity: d.entity, metric: fmt(d), color }))
        .on('mouseleave', () => setTooltip(null));
    });
  }, [geoData, mergedData]);

  // ── Effect 3: rotation timer
  useEffect(() => {
    if (!geoData || !mergedData || !svgRef.current) return;
    if (!projLRef.current || !projRRef.current) return;

    if (timerRef.current) timerRef.current.stop();

    const svg = d3.select(svgRef.current);
    let lastTick = -1;

    timerRef.current = d3.timer(elapsed => {
      // Cap at ~24 fps to keep CPU load reasonable
      if (elapsed - lastTick < 42) return;
      lastTick = elapsed;

      const rot = [elapsed * 0.006, -20];

      [
        { cls: 'l', proj: projLRef.current, path: pathLRef.current },
        { cls: 'r', proj: projRRef.current, path: pathRRef.current },
      ].forEach(({ cls, proj, path }) => {
        proj.rotate(rot);

        svg.select(`.sphere-${cls}`).attr('d', path({ type: 'Sphere' }));
        svg.select(`.graticule-${cls}`).attr('d', path(GRATICULE));
        svg.selectAll(`.country-${cls}`).attr('d', path);

        svg.selectAll(`.bubble-${cls}`).each(function (d) {
          const p   = proj(d.gc);
          const vis = isVisible(proj, d.gc);
          const sel = d3.select(this);
          if (vis && p) sel.attr('cx', p[0]).attr('cy', p[1]).attr('visibility', 'visible');
          else          sel.attr('visibility', 'hidden');
        });
      });
    });

    return () => { if (timerRef.current) timerRef.current.stop(); };
  }, [geoData, mergedData]);

  const isReady = !loading && geoData && mergedData;

  return (
    <div className="space-y-4">
      <blockquote className="border-l-2 border-ocean-500 pl-5">
        <p className="text-xl font-light text-slate-300 leading-relaxed">
          Rich countries generate the most plastic waste.{' '}
          <span className="text-slate-100 font-normal">Poor countries</span>{' '}
          have the least capacity to manage it.
        </p>
      </blockquote>

      <div
        ref={containerRef}
        className="map-container relative border border-white/5 rounded-lg bg-white/[0.015] overflow-hidden"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }}
        onMouseLeave={() => { setTooltip(null); setMousePos(null); }}
      >
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-600 text-sm tracking-widest uppercase">
            Loading
          </div>
        )}
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full"
          style={{ height: 'auto', display: isReady ? 'block' : 'none' }}
        />

        {tooltip && mousePos && (
          <div
            className="pointer-events-none absolute bg-[#161b22] border border-white/10 rounded px-3 py-2 text-xs"
            style={{
              left: Math.min(mousePos.x + 14, (containerRef.current?.offsetWidth ?? 600) - 200),
              top: Math.max(8, mousePos.y - 56),
              maxWidth: 190,
            }}
          >
            <div className="text-slate-200 font-medium mb-1">{tooltip.entity}</div>
            <div style={{ color: tooltip.color }}>{tooltip.metric}</div>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-700">
        Data: Our World in Data — Jambeck et al. (2015) · Mismanaged waste: 2019 · Waste generated: 2010
      </p>
    </div>
  );
}
