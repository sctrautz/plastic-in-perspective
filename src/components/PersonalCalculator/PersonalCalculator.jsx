import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { useAllData } from '../../hooks/useData';
import {
  getCountryWaste,
  getCountryList,
  calculatePersonalImpact,
} from '../../utils/dataProcessing';

const MAX_AGE = 80;
const W = 900;
const H = 300;
const M = { top: 16, right: 24, bottom: 36, left: 56 };
const IW = W - M.left - M.right;
const IH = H - M.top - M.bottom;

function LifetimeChart({ kgPerDay, age }) {
  const svgRef = useRef();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!svgRef.current || !kgPerDay) return;

    const kgPerYear = kgPerDay * 365;
    const svg = d3.select(svgRef.current);

    const x = d3.scaleLinear().domain([0, MAX_AGE]).range([0, IW]);
    const y = d3.scaleLinear().domain([0, kgPerYear * MAX_AGE]).range([IH, 0]);

    const fullData = d3.range(0, MAX_AGE + 1).map((a) => ({ age: a, kg: a * kgPerYear }));
    const ageData = d3.range(0, age + 1).map((a) => ({ age: a, kg: a * kgPerYear }));

    const areaFn = (data) =>
      d3.area()
        .x((d) => x(d.age))
        .y0(IH)
        .y1((d) => y(d.kg))
        .curve(d3.curveCatmullRom)(data);

    const lineFn = (data) =>
      d3.line()
        .x((d) => x(d.age))
        .y((d) => y(d.kg))
        .curve(d3.curveCatmullRom)(data);

    if (!initializedRef.current) {
      // First render — build the SVG skeleton
      svg.selectAll('*').remove();

      const g = svg.append('g')
        .attr('transform', `translate(${M.left},${M.top})`);

      // Axes
      g.append('g')
        .attr('class', 'axis-x')
        .attr('transform', `translate(0,${IH})`)
        .call(
          d3.axisBottom(x)
            .ticks(8)
            .tickSize(0)
            .tickPadding(10)
        )
        .call((a) => a.select('.domain').attr('stroke', '#30363d'))
        .call((a) => a.selectAll('text').attr('fill', '#484f58').attr('font-size', 11));

      g.append('g')
        .attr('class', 'axis-y')
        .call(
          d3.axisLeft(y)
            .ticks(5)
            .tickSize(-IW)
            .tickFormat((v) => `${d3.format(',.0f')(v)} kg`)
        )
        .call((a) => a.select('.domain').remove())
        .call((a) => a.selectAll('.tick line').attr('stroke', '#21262d').attr('stroke-dasharray', '3,3'))
        .call((a) => a.selectAll('text').attr('fill', '#484f58').attr('font-size', 11));

      // Axis labels
      g.append('text')
        .attr('x', IW / 2)
        .attr('y', IH + 34)
        .attr('text-anchor', 'middle')
        .attr('fill', '#484f58')
        .attr('font-size', 11)
        .text('Age');

      // Gradient
      const defs = svg.append('defs');
      const grad = defs.append('linearGradient')
        .attr('id', 'calc-grad')
        .attr('x1', 0).attr('x2', 0)
        .attr('y1', 0).attr('y2', 1);
      grad.append('stop').attr('offset', '0%').attr('stop-color', '#2272c3').attr('stop-opacity', 0.35);
      grad.append('stop').attr('offset', '100%').attr('stop-color', '#2272c3').attr('stop-opacity', 0.02);

      // Ghost: full 80-year area
      g.append('path')
        .attr('class', 'area-ghost')
        .attr('d', areaFn(fullData))
        .attr('fill', '#21262d');

      // Active: filled to current age
      g.append('path')
        .attr('class', 'area-active')
        .attr('d', areaFn(ageData))
        .attr('fill', 'url(#calc-grad)');

      g.append('path')
        .attr('class', 'line-active')
        .attr('d', lineFn(ageData))
        .attr('fill', 'none')
        .attr('stroke', '#4a90d9')
        .attr('stroke-width', 1.5);

      // Current age marker (vertical line)
      g.append('line')
        .attr('class', 'age-marker')
        .attr('x1', x(age)).attr('x2', x(age))
        .attr('y1', 0).attr('y2', IH)
        .attr('stroke', '#4a90d9')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4,3')
        .attr('opacity', 0.5);

      // Age marker label
      g.append('text')
        .attr('class', 'age-label')
        .attr('x', x(age))
        .attr('y', -4)
        .attr('text-anchor', 'middle')
        .attr('fill', '#4a90d9')
        .attr('font-size', 11)
        .text(`Age ${age}`);

      initializedRef.current = true;
    } else {
      // Update — transition paths and axes
      const g = svg.select('g');

      // Rebuild y scale for new country (kgPerDay may have changed)
      const newY = d3.scaleLinear().domain([0, kgPerYear * MAX_AGE]).range([IH, 0]);

      g.select('.axis-y')
        .transition().duration(600)
        .call(
          d3.axisLeft(newY)
            .ticks(5)
            .tickSize(-IW)
            .tickFormat((v) => `${d3.format(',.0f')(v)} kg`)
        )
        .call((a) => a.select('.domain').remove())
        .call((a) => a.selectAll('.tick line').attr('stroke', '#21262d').attr('stroke-dasharray', '3,3'))
        .call((a) => a.selectAll('text').attr('fill', '#484f58').attr('font-size', 11));

      const areaFnNew = (data) =>
        d3.area()
          .x((d) => x(d.age))
          .y0(IH)
          .y1((d) => newY(d.kg))
          .curve(d3.curveCatmullRom)(data);

      const lineFnNew = (data) =>
        d3.line()
          .x((d) => x(d.age))
          .y((d) => newY(d.kg))
          .curve(d3.curveCatmullRom)(data);

      const fullDataNew = d3.range(0, MAX_AGE + 1).map((a) => ({ age: a, kg: a * kgPerYear }));
      const ageDataNew = d3.range(0, age + 1).map((a) => ({ age: a, kg: a * kgPerYear }));

      g.select('.area-ghost').transition().duration(600).attr('d', areaFnNew(fullDataNew));
      g.select('.area-active').transition().duration(600).attr('d', areaFnNew(ageDataNew));
      g.select('.line-active').transition().duration(600).attr('d', lineFnNew(ageDataNew));

      g.select('.age-marker')
        .transition().duration(400)
        .attr('x1', x(age)).attr('x2', x(age));

      g.select('.age-label')
        .transition().duration(400)
        .attr('x', x(age))
        .text(`Age ${age}`);
    }
  }, [kgPerDay, age]);

  // Reset when kgPerDay changes (new country) so axes rebuild cleanly
  useEffect(() => {
    initializedRef.current = false;
  }, [kgPerDay]);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      className="w-full"
      style={{ height: '260px' }}
    />
  );
}

export default function PersonalCalculator() {
  const { data, loading } = useAllData();
  const [country, setCountry] = useState('United States');
  const [age, setAge] = useState(30);

  const countries = useMemo(() => {
    if (!data?.wastePerCapita) return [];
    return getCountryList(data.wastePerCapita);
  }, [data]);

  const kgPerDay = useMemo(() => {
    if (!data?.wastePerCapita) return null;
    return getCountryWaste(data.wastePerCapita, country);
  }, [data, country]);

  const impact = useMemo(() => {
    if (!kgPerDay) return null;
    return calculatePersonalImpact(kgPerDay, age);
  }, [kgPerDay, age]);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center text-slate-600 text-sm tracking-widest uppercase">
        Loading
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Country dropdown */}
        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase tracking-widest text-slate-600">Country</label>
          <div className="relative">
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="appearance-none bg-white/[0.04] border border-white/10 text-slate-200 text-sm rounded-md px-4 py-2.5 pr-9 focus:outline-none focus:border-ocean-500 cursor-pointer min-w-48"
            >
              {countries.map((c) => (
                <option key={c} value={c} className="bg-[#161b22]">{c}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Age slider */}
        <div className="flex flex-col gap-2 flex-1 max-w-xs">
          <label className="text-xs uppercase tracking-widest text-slate-600">
            Age — <span className="text-slate-300">{age}</span>
          </label>
          <input
            type="range"
            min={1}
            max={MAX_AGE}
            value={age}
            onChange={(e) => setAge(+e.target.value)}
            className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-4
              [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-ocean-400
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-moz-range-thumb]:w-4
              [&::-moz-range-thumb]:h-4
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-ocean-400
              [&::-moz-range-thumb]:border-0
              [&::-moz-range-thumb]:cursor-pointer"
            style={{ marginTop: '6px' }}
          />
          <div className="flex justify-between text-xs text-slate-700">
            <span>1</span><span>80</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="border border-white/5 rounded-lg bg-white/[0.015] px-4 pt-4 pb-2">
        {kgPerDay ? (
          <LifetimeChart kgPerDay={kgPerDay} age={age} />
        ) : (
          <div className="h-64 flex items-center justify-center text-slate-600 text-sm">
            No data for {country}
          </div>
        )}
        <p className="text-xs text-slate-700 text-right mt-1 pr-1">
          cumulative plastic waste generated by age
        </p>
      </div>

      {/* Stats grid */}
      {impact && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 border border-white/5 rounded-lg overflow-hidden">
          {[
            { value: d3.format(',.0f')(impact.kgPerYear), unit: 'kg/year', label: 'Waste generated' },
            { value: d3.format(',.0f')(impact.lifetimeKg), unit: 'kg total', label: `By age ${age}` },
            { value: d3.format(',.0f')(impact.bottlesPerYear), unit: 'bottles', label: 'Per year' },
            { value: d3.format(',.1f')(impact.bodyWeights) + '×', unit: 'your body weight', label: `By age ${age}` },
          ].map(({ value, unit, label }) => (
            <div key={label + unit} className="bg-[#0d1117] px-5 py-5">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold tabular-nums text-slate-100">{value}</span>
                <span className="text-xs text-slate-500">{unit}</span>
              </div>
              <div className="text-xs text-slate-600 mt-1 uppercase tracking-wider">{label}</div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
