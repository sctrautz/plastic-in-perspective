import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { useAllData } from '../../hooks/useData';
import { calculatePlasticRate, getProductionTimeSeries } from '../../utils/dataProcessing';

const TRUCK_TONNES = 9; // 9,000 kg
const VIEWBOX_W = 1000;
const VIEWBOX_H = 260;
const MAX_PARTICLES = 450;

// SVG particle field — each dot represents one garbage truck of plastic.
// Dots appear at the real production rate via d3.interval().
function ParticleField({ trucksPerSecond }) {
  const svgRef = useRef();
  const stateRef = useRef({ particles: [], nextId: 0 });

  useEffect(() => {
    if (!trucksPerSecond || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const intervalMs = 1000 / trucksPerSecond;

    const interval = d3.interval(() => {
      const state = stateRef.current;

      // Evict oldest dot once we hit the cap
      if (state.particles.length >= MAX_PARTICLES) {
        const evicted = state.particles.shift();
        svg.select(`#pk-${evicted}`)
          .transition().duration(300).attr('opacity', 0).remove();
      }

      const id = ++state.nextId;
      state.particles.push(id);

      const x = Math.random() * (VIEWBOX_W - 20) + 10;
      const y = Math.random() * (VIEWBOX_H - 20) + 10;

      svg.append('circle')
        .attr('id', `pk-${id}`)
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', 0)
        .attr('fill', '#4a90d9')
        .attr('opacity', 0)
        .transition()
        .duration(500)
        .ease(d3.easeCubicOut)
        .attr('r', 3.5)
        .attr('opacity', 0.55);
    }, intervalMs);

    return () => {
      interval.stop();
      svg.selectAll('circle').remove();
      stateRef.current = { particles: [], nextId: 0 };
    };
  }, [trucksPerSecond]);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
      preserveAspectRatio="none"
      className="w-full h-full"
    />
  );
}

// Small area sparkline showing global production 1950–2019.
function ProductionSparkline({ timeSeries }) {
  const ref = useRef();

  useEffect(() => {
    if (!timeSeries?.length || !ref.current) return;

    const W = 1000;
    const H = 80;
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    const x = d3.scaleLinear()
      .domain(d3.extent(timeSeries, (d) => d.year))
      .range([0, W]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(timeSeries, (d) => d.tonnes)])
      .range([H, 0]);

    const area = d3.area()
      .x((d) => x(d.year))
      .y0(H)
      .y1((d) => y(d.tonnes))
      .curve(d3.curveCatmullRom);

    const line = d3.line()
      .x((d) => x(d.year))
      .y((d) => y(d.tonnes))
      .curve(d3.curveCatmullRom);

    // Gradient fill
    const defs = svg.append('defs');
    const grad = defs.append('linearGradient')
      .attr('id', 'spark-grad')
      .attr('x1', 0).attr('x2', 0)
      .attr('y1', 0).attr('y2', 1);
    grad.append('stop').attr('offset', '0%').attr('stop-color', '#2272c3').attr('stop-opacity', 0.25);
    grad.append('stop').attr('offset', '100%').attr('stop-color', '#2272c3').attr('stop-opacity', 0);

    svg.append('path')
      .datum(timeSeries)
      .attr('d', area)
      .attr('fill', 'url(#spark-grad)');

    // Animate the line drawing
    const path = svg.append('path')
      .datum(timeSeries)
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', '#4a90d9')
      .attr('stroke-width', 1.5)
      .attr('opacity', 0.8);

    const totalLength = path.node().getTotalLength();
    path
      .attr('stroke-dasharray', totalLength)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(1800)
      .ease(d3.easeLinear)
      .attr('stroke-dashoffset', 0);

    // Year axis labels
    [1950, 1970, 1990, 2010, 2019].forEach((yr) => {
      svg.append('text')
        .attr('x', x(yr))
        .attr('y', H - 4)
        .attr('text-anchor', 'middle')
        .attr('font-size', 11)
        .attr('fill', '#484f58')
        .text(yr);
    });
  }, [timeSeries]);

  return (
    <svg
      ref={ref}
      viewBox={`0 0 1000 80`}
      preserveAspectRatio="none"
      className="w-full"
      style={{ height: '64px' }}
    />
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

  // Start the running clock once rate is ready
  useEffect(() => {
    if (!rate) return;
    startRef.current = Date.now();
    const timer = setInterval(() => {
      setElapsed((Date.now() - startRef.current) / 1000);
    }, 50);
    return () => clearInterval(timer);
  }, [rate]);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center text-slate-600 text-sm tracking-widest uppercase">
        Loading
      </div>
    );
  }

  const tonnesSinceLoad = rate ? elapsed * rate.tonnesPerSecond : 0;
  const trucksSinceLoad = Math.floor(tonnesSinceLoad / TRUCK_TONNES);
  const trucksPerSecond = rate ? rate.tonnesPerSecond / TRUCK_TONNES : 0;

  return (
    <div className="space-y-8">

      {/* Running counter */}
      <div>
        <div className="text-[clamp(3rem,8vw,6rem)] font-semibold tabular-nums leading-none text-slate-100 tracking-tight">
          {d3.format(',.0f')(tonnesSinceLoad)}
          <span className="text-2xl font-light text-slate-500 ml-3">tonnes</span>
        </div>
        <p className="mt-3 text-slate-400 text-lg font-light">
          of plastic produced since you opened this page
        </p>
        {trucksSinceLoad > 0 && (
          <p className="mt-1 text-slate-600 text-sm">
            {d3.format(',.0f')(trucksSinceLoad)} garbage truck{trucksSinceLoad !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Particle field */}
      <div
        className="relative border border-white/5 rounded-lg bg-white/[0.015] overflow-hidden"
        style={{ height: '260px' }}
      >
        <ParticleField trucksPerSecond={trucksPerSecond} />
        <div className="absolute bottom-3 right-4 text-xs text-slate-700 select-none pointer-events-none">
          each dot = 1 garbage truck of plastic
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-px bg-white/5 rounded-lg overflow-hidden border border-white/5">
        {[
          {
            value: d3.format(',.2f')(rate?.tonnesPerSecond ?? 0),
            unit: 'tonnes',
            label: 'per second',
          },
          {
            value: d3.format(',.0f')(rate?.trucksPerMinute ?? 0),
            unit: 'trucks',
            label: 'per minute',
          },
          {
            value: d3.format(',.0f')((rate?.tonnesPerYear ?? 0) / 1e6) + 'M',
            unit: 'tonnes',
            label: `produced in ${rate?.year ?? ''}`,
          },
        ].map(({ value, unit, label }) => (
          <div key={label} className="bg-[#0d1117] px-6 py-5">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold tabular-nums text-slate-100">{value}</span>
              <span className="text-sm text-slate-500">{unit}</span>
            </div>
            <div className="text-xs text-slate-600 mt-1 uppercase tracking-wider">{label}</div>
          </div>
        ))}
      </div>

      {/* Production history sparkline */}
      <div>
        <p className="text-xs uppercase tracking-widest text-slate-600 mb-3">
          Global plastic production 1950 – 2019
        </p>
        <ProductionSparkline timeSeries={timeSeries} />
      </div>

    </div>
  );
}
