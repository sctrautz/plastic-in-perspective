import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { useAllData } from '../../hooks/useData';
import {
  getCountryWaste,
  getCountryList,
  calculatePersonalImpact,
} from '../../utils/dataProcessing';

const MAX_AGE = 80;
const BODY_KG = 70;
const BODY_R = 40;
const MAX_R = 148;
const SVG_W = 700;
const SVG_H = 360;
const BODY_CX = 155;
const PLASTIC_CX = 490;
const CY = 172;

function circleR(bodyWeights) {
  return Math.min(MAX_R, Math.max(16, BODY_R * Math.sqrt(Math.max(0.01, bodyWeights))));
}

function CircleViz({ impact }) {
  const svgRef = useRef();
  const prevKgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !impact) return;

    const svg = d3.select(svgRef.current);
    const r = circleR(impact.bodyWeights);

    if (svg.selectAll('.body-circle').empty()) {
      const defs = svg.append('defs');
      const glow = defs.append('filter').attr('id', 'circ-glow').attr('x', '-40%').attr('y', '-40%').attr('width', '180%').attr('height', '180%');
      glow.append('feGaussianBlur').attr('in', 'SourceGraphic').attr('stdDeviation', '8').attr('result', 'blur');
      const m = glow.append('feMerge');
      m.append('feMergeNode').attr('in', 'blur');
      m.append('feMergeNode').attr('in', 'SourceGraphic');

      svg.append('circle').attr('class', 'body-circle')
        .attr('cx', BODY_CX).attr('cy', CY).attr('r', BODY_R)
        .attr('fill', '#0d1f3c').attr('stroke', '#1a3f72').attr('stroke-width', 1.5);

      svg.append('text').attr('class', 'body-kg')
        .attr('x', BODY_CX).attr('y', CY).attr('dy', '0.35em')
        .attr('text-anchor', 'middle').attr('fill', '#4a90d9').attr('font-size', 12)
        .text(`${BODY_KG} kg`);

      svg.append('text').attr('class', 'body-label')
        .attr('x', BODY_CX).attr('y', CY + BODY_R + 18)
        .attr('text-anchor', 'middle').attr('fill', '#484f58').attr('font-size', 10)
        .attr('letter-spacing', '0.1em').text('YOUR BODY');

      svg.append('circle').attr('class', 'plastic-circle')
        .attr('cx', PLASTIC_CX).attr('cy', CY).attr('r', r)
        .attr('fill', '#1e5799').attr('fill-opacity', 0.55)
        .attr('stroke', '#4a90d9').attr('stroke-width', 1.5).attr('stroke-opacity', 0.6)
        .attr('filter', 'url(#circ-glow)');

      svg.append('text').attr('class', 'plastic-kg')
        .attr('x', PLASTIC_CX).attr('y', CY).attr('dy', '0.35em')
        .attr('text-anchor', 'middle').attr('fill', '#7db5e8').attr('font-size', 14)
        .text(`${d3.format(',.0f')(impact.lifetimeKg)} kg`);

      svg.append('text').attr('class', 'plastic-label')
        .attr('x', PLASTIC_CX).attr('y', CY + r + 18)
        .attr('text-anchor', 'middle').attr('fill', '#484f58').attr('font-size', 10)
        .attr('letter-spacing', '0.1em').text('LIFETIME PLASTIC');

      prevKgRef.current = impact.lifetimeKg;
    } else {
      const prevKg = prevKgRef.current ?? impact.lifetimeKg;

      svg.select('.plastic-circle')
        .transition().duration(700).ease(d3.easeCubicOut)
        .attr('r', r);

      svg.select('.plastic-label')
        .transition().duration(700).ease(d3.easeCubicOut)
        .attr('y', CY + r + 18);

      svg.select('.plastic-kg')
        .transition().duration(700)
        .tween('text', function () {
          const interp = d3.interpolateNumber(prevKg, impact.lifetimeKg);
          return (t) => d3.select(this).text(`${d3.format(',.0f')(interp(t))} kg`);
        });

      prevKgRef.current = impact.lifetimeKg;
    }
  }, [impact]);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      preserveAspectRatio="xMidYMid meet"
      className="w-full"
      style={{ maxHeight: '300px' }}
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
    return <div className="h-96 flex items-center justify-center text-slate-600 text-sm tracking-widest uppercase">Loading</div>;
  }

  return (
    <div className="space-y-8">

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-6">
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

        <div className="flex flex-col gap-2 flex-1 max-w-xs">
          <label className="text-xs uppercase tracking-widest text-slate-600">
            Age — <span className="text-slate-300">{age}</span>
          </label>
          <input
            type="range" min={1} max={MAX_AGE} value={age}
            onChange={(e) => setAge(+e.target.value)}
            className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer mt-1.5
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
              [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-ocean-400 [&::-webkit-slider-thumb]:cursor-pointer
              [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4
              [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-ocean-400
              [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
          />
          <div className="flex justify-between text-xs text-slate-700"><span>1</span><span>80</span></div>
        </div>
      </div>

      {/* Headline stat */}
      {impact && (
        <div className="text-center py-2">
          <div className="text-[clamp(3.5rem,10vw,6.5rem)] font-bold tabular-nums leading-none text-slate-100 tracking-tight">
            {d3.format(',.1f')(impact.bodyWeights)}
            <span className="text-2xl font-light text-slate-500 ml-2">×</span>
          </div>
          <p className="mt-3 text-slate-400 font-light">
            your body weight in plastic waste by age {age}
          </p>
        </div>
      )}

      {/* Circle comparison */}
      {kgPerDay ? (
        <div className="border border-white/5 rounded-lg bg-white/[0.015] px-4 py-2">
          <CircleViz impact={impact} />
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center text-slate-600 text-sm border border-white/5 rounded-lg">
          No data for {country}
        </div>
      )}

      {/* Stats strip */}
      {impact && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 border border-white/5 rounded-lg overflow-hidden">
          {[
            { value: d3.format(',.0f')(impact.kgPerYear), unit: 'kg / year', label: 'Waste generated' },
            { value: d3.format(',.0f')(impact.lifetimeKg), unit: 'kg total', label: `By age ${age}` },
            { value: d3.format(',.0f')(impact.bottlesPerYear), unit: 'bottles', label: 'Equivalent per year' },
            { value: d3.format(',.3f')(impact.kgPerDay), unit: 'kg / day', label: 'Daily waste' },
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
      )}

    </div>
  );
}
