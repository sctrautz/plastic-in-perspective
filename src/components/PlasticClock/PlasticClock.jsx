import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { useAllData } from '../../hooks/useData';
import { calculatePlasticRate, getProductionTimeSeries } from '../../utils/dataProcessing';

const TRUCK_TONNES = 9;
const RING_R = 128;
const RING_STROKE = 18;
const SVG_SIZE = 340;
const CX = SVG_SIZE / 2;
const CY = SVG_SIZE / 2;

function PulseRing({ rate }) {
  const svgRef = useRef();
  const rafRef = useRef();
  const cycleStartRef = useRef(null);

  useEffect(() => {
    if (!rate || !svgRef.current) return;

    const cycleMs = (TRUCK_TONNES / rate.tonnesPerSecond) * 1000;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const defs = svg.append('defs');

    const filter = defs.append('filter')
      .attr('id', 'ring-glow')
      .attr('x', '-60%').attr('y', '-60%')
      .attr('width', '220%').attr('height', '220%');
    filter.append('feGaussianBlur').attr('in', 'SourceGraphic').attr('stdDeviation', '5').attr('result', 'blur');
    const merge = filter.append('feMerge');
    merge.append('feMergeNode').attr('in', 'blur');
    merge.append('feMergeNode').attr('in', 'SourceGraphic');

    const g = svg.append('g').attr('transform', `translate(${CX},${CY})`);

    g.append('circle')
      .attr('r', RING_R)
      .attr('fill', 'none')
      .attr('stroke', '#0d1f3c')
      .attr('stroke-width', RING_STROKE);

    const arcGen = d3.arc()
      .innerRadius(RING_R - RING_STROKE / 2 + 1)
      .outerRadius(RING_R + RING_STROKE / 2 - 1)
      .startAngle(0);

    const arcPath = g.append('path').attr('filter', 'url(#ring-glow)');

    const tipDot = g.append('circle')
      .attr('r', 7)
      .attr('filter', 'url(#ring-glow)');

    const flashRing = g.append('circle')
      .attr('r', RING_R)
      .attr('fill', 'none')
      .attr('stroke', '#b3d4f2')
      .attr('stroke-width', RING_STROKE)
      .attr('opacity', 0);

    const colorInterp = d3.interpolateRgb('#1a3f72', '#4a90d9');

    function frame(ts) {
      if (cycleStartRef.current === null) cycleStartRef.current = ts;

      const fraction = Math.min((ts - cycleStartRef.current) / cycleMs, 1);

      if (fraction >= 1) {
        cycleStartRef.current = ts;
        flashRing.attr('opacity', 0.6).transition().duration(400).attr('opacity', 0);
      }

      const endAngle = fraction * 2 * Math.PI;
      arcPath
        .attr('fill', colorInterp(fraction))
        .attr('d', arcGen({ endAngle }));

      const tx = RING_R * Math.sin(endAngle);
      const ty = -RING_R * Math.cos(endAngle);
      tipDot
        .attr('cx', tx).attr('cy', ty)
        .attr('fill', '#deedfb')
        .attr('opacity', fraction > 0.01 ? 1 : 0);

      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafRef.current);
      cycleStartRef.current = null;
    };
  }, [rate]);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
      style={{ width: SVG_SIZE, height: SVG_SIZE }}
    />
  );
}

function ProductionSparkline({ timeSeries }) {
  const svgRef = useRef();

  useEffect(() => {
    if (!timeSeries?.length || !svgRef.current) return;

    const W = 1000;
    const H = 80;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const x = d3.scaleLinear().domain(d3.extent(timeSeries, (d) => d.year)).range([0, W]);
    const y = d3.scaleLinear().domain([0, d3.max(timeSeries, (d) => d.tonnes)]).range([H, 0]);

    const area = d3.area().x((d) => x(d.year)).y0(H).y1((d) => y(d.tonnes)).curve(d3.curveCatmullRom);
    const line = d3.line().x((d) => x(d.year)).y((d) => y(d.tonnes)).curve(d3.curveCatmullRom);

    const defs = svg.append('defs');
    const grad = defs.append('linearGradient').attr('id', 'spark-grad').attr('x1', 0).attr('x2', 0).attr('y1', 0).attr('y2', 1);
    grad.append('stop').attr('offset', '0%').attr('stop-color', '#2272c3').attr('stop-opacity', 0.2);
    grad.append('stop').attr('offset', '100%').attr('stop-color', '#2272c3').attr('stop-opacity', 0);

    svg.append('path').datum(timeSeries).attr('d', area).attr('fill', 'url(#spark-grad)');

    const path = svg.append('path')
      .datum(timeSeries)
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', '#4a90d9')
      .attr('stroke-width', 1.5)
      .attr('opacity', 0.7);

    const len = path.node().getTotalLength();
    path.attr('stroke-dasharray', len).attr('stroke-dashoffset', len)
      .transition().duration(1800).ease(d3.easeLinear).attr('stroke-dashoffset', 0);

    [1950, 1970, 1990, 2010, 2019].forEach((yr) => {
      svg.append('text')
        .attr('x', x(yr)).attr('y', H - 4)
        .attr('text-anchor', 'middle').attr('font-size', 11).attr('fill', '#30363d')
        .text(yr);
    });
  }, [timeSeries]);

  return (
    <svg ref={svgRef} viewBox="0 0 1000 80" preserveAspectRatio="none" className="w-full" style={{ height: '60px' }} />
  );
}

export default function PlasticClock() {
  const { data, loading } = useAllData();
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(null);

  const rate = useMemo(() => {
    if (!data?.production) return null;
    return calculatePlasticRate(data.production);
  }, [data]);

  const timeSeries = useMemo(() => {
    if (!data?.production) return null;
    return getProductionTimeSeries(data.production);
  }, [data]);

  useEffect(() => {
    if (!rate) return;
    startRef.current = Date.now();
    const timer = setInterval(() => {
      setElapsed((Date.now() - startRef.current) / 1000);
    }, 50);
    return () => clearInterval(timer);
  }, [rate]);

  if (loading) {
    return <div className="h-96 flex items-center justify-center text-slate-600 text-sm tracking-widest uppercase">Loading</div>;
  }

  const tonnesSinceLoad = rate ? elapsed * rate.tonnesPerSecond : 0;
  const trucksSinceLoad = Math.floor(tonnesSinceLoad / TRUCK_TONNES);

  return (
    <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

      {/* Ring + counter */}
      <div className="relative flex-shrink-0" style={{ width: SVG_SIZE, height: SVG_SIZE }}>
        <PulseRing rate={rate} />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
          <span className="text-[clamp(2.4rem,6vw,3.5rem)] font-semibold tabular-nums leading-none text-slate-100 tracking-tight">
            {d3.format(',.0f')(tonnesSinceLoad)}
          </span>
          <span className="text-base text-slate-500 mt-2 font-light">tonnes</span>
          <span className="text-xs text-slate-700 mt-1 uppercase tracking-widest">since you arrived</span>
          {trucksSinceLoad > 0 && (
            <span className="text-xs text-ocean-800 mt-3 tabular-nums">
              {d3.format(',.0f')(trucksSinceLoad)} garbage truck{trucksSinceLoad !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Stats + sparkline */}
      <div className="flex-1 min-w-0 space-y-8 w-full">
        <div className="grid grid-cols-3 gap-px bg-white/5 rounded-lg overflow-hidden border border-white/5">
          {[
            { value: d3.format(',.2f')(rate?.tonnesPerSecond ?? 0), unit: 'tonnes', label: 'per second' },
            { value: d3.format(',.0f')(rate?.trucksPerMinute ?? 0), unit: 'trucks', label: 'per minute' },
            {
              value: d3.format(',.0f')((rate?.tonnesPerYear ?? 0) / 1e6) + 'M',
              unit: 'tonnes',
              label: `in ${rate?.year ?? ''}`,
            },
          ].map(({ value, unit, label }) => (
            <div key={label} className="bg-[#0d1117] px-5 py-5">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl font-semibold tabular-nums text-slate-100">{value}</span>
                <span className="text-xs text-slate-500">{unit}</span>
              </div>
              <div className="text-xs text-slate-600 mt-1 uppercase tracking-wider">{label}</div>
            </div>
          ))}
        </div>

        <div>
          <p className="text-xs uppercase tracking-widest text-slate-700 mb-3">
            Global plastic production 1950 – 2019
          </p>
          <ProductionSparkline timeSeries={timeSeries} />
        </div>

        <p className="text-xs text-slate-700 leading-relaxed">
          Each revolution of the ring represents one garbage truck (9 tonnes) of plastic produced.
          At current rates, a new truck's worth is produced every{' '}
          {rate ? d3.format(',.0f')((TRUCK_TONNES / rate.tonnesPerSecond) * 1000) : '—'}ms.
        </p>
      </div>

    </div>
  );
}
