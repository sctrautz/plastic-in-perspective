import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { useAllData } from '../../hooks/useData';
import {
  getCountryWaste,
  calculatePersonalImpact,
} from '../../utils/dataProcessing';

const MAX_AGE = 80;
const W = 960;
const H = 540;
const GROUND_Y = 478;

// Log scale: 0.5m → 500km, bottom → top of chart
const LOG_SCALE = d3.scaleLog().domain([0.5, 500000]).range([GROUND_Y, 50]).clamp(true);

const STACK_X = 62;
const STACK_W = 82;
const BOTTLE_KG = 0.02;
const BOTTLE_HEIGHT_M = 0.25;

function stackMeters(lifetimeKg) {
  return (lifetimeKg / BOTTLE_KG) * BOTTLE_HEIGHT_M;
}

// How many log-scale pixels tall a landmark appears (ground to log-scaled top)
function landmarkPx(m) {
  return GROUND_Y - LOG_SCALE(m);
}

function drawScene(svg) {
  svg.selectAll('*').remove();

  const defs = svg.append('defs');

  const pat = defs.append('pattern')
    .attr('id', 'bottle-pat')
    .attr('width', STACK_W).attr('height', 9)
    .attr('patternUnits', 'userSpaceOnUse');
  pat.append('rect')
    .attr('x', 2).attr('y', 1.5).attr('width', STACK_W - 4).attr('height', 6)
    .attr('rx', 2).attr('fill', '#2272c3').attr('opacity', 0.55);
  pat.append('rect')
    .attr('x', STACK_W * 0.28).attr('y', 0).attr('width', STACK_W * 0.44).attr('height', 2)
    .attr('fill', '#7db5e8').attr('opacity', 0.4);

  svg.append('rect').attr('width', W).attr('height', H).attr('fill', '#0d1117');

  // Y-axis scale guide (right side)
  const axisX = W - 28;
  const axisTicks = [1, 10, 100, 1000, 10000, 100000];
  axisTicks.forEach((m) => {
    const y = LOG_SCALE(m);
    svg.append('line')
      .attr('x1', STACK_X - 10).attr('x2', axisX + 8)
      .attr('y1', y).attr('y2', y)
      .attr('stroke', '#161b22').attr('stroke-width', 0.8);
    svg.append('text')
      .attr('x', axisX - 4).attr('y', y + 3.5)
      .attr('fill', '#30363d').attr('font-size', 9).attr('text-anchor', 'end')
      .text(m >= 1000 ? `${m / 1000}km` : `${m}m`);
  });

  // Log scale note
  svg.append('text')
    .attr('x', axisX - 4).attr('y', GROUND_Y + 14)
    .attr('fill', '#21262d').attr('font-size', 8).attr('text-anchor', 'end')
    .text('log scale');


  // Stack ghost (full chart height range)
  svg.append('rect').attr('class', 'stack-ghost')
    .attr('x', STACK_X).attr('y', LOG_SCALE(500000))
    .attr('width', STACK_W).attr('height', GROUND_Y - LOG_SCALE(500000))
    .attr('fill', '#21262d').attr('opacity', 0.25);

  // Stack fill
  svg.append('rect').attr('class', 'stack-fill')
    .attr('x', STACK_X).attr('y', GROUND_Y).attr('width', STACK_W).attr('height', 0)
    .attr('fill', 'url(#bottle-pat)');

  // Stack outline
  svg.append('rect').attr('class', 'stack-outline')
    .attr('x', STACK_X).attr('y', GROUND_Y).attr('width', STACK_W).attr('height', 0)
    .attr('fill', 'none').attr('stroke', '#4a90d9').attr('stroke-width', 1.2).attr('opacity', 0.5);

  // Stack height label (top of stack)
  svg.append('text').attr('class', 'stack-height-label')
    .attr('x', STACK_X + STACK_W / 2).attr('y', GROUND_Y - 6)
    .attr('text-anchor', 'middle').attr('fill', '#4a90d9')
    .attr('font-size', 9).attr('letter-spacing', '0.06em');

  // Stack bottle/kg labels below ground
  svg.append('text').attr('class', 'stack-label-a')
    .attr('x', STACK_X + STACK_W / 2).attr('y', GROUND_Y + 20)
    .attr('text-anchor', 'middle').attr('fill', '#4a90d9').attr('font-size', 10);
  svg.append('text').attr('class', 'stack-label-b')
    .attr('x', STACK_X + STACK_W / 2).attr('y', GROUND_Y + 32)
    .attr('text-anchor', 'middle').attr('fill', '#30363d').attr('font-size', 9);

  // Ground line
  svg.append('line')
    .attr('x1', 0).attr('x2', W).attr('y1', GROUND_Y).attr('y2', GROUND_Y)
    .attr('stroke', '#30363d').attr('stroke-width', 1.5);

  // --- Landmark silhouettes ---

  // Eiffel Tower (330m) at x=720
  const ET_X = 720;
  const et_h = landmarkPx(330);
  const etG = svg.append('g').attr('transform', `translate(${ET_X},${GROUND_Y})`);
  etG.append('polygon')
    .attr('points', `-40,0 -22,-${et_h * 0.175} -14,-${et_h * 0.37} -3,-${et_h} 3,-${et_h} 14,-${et_h * 0.37} 22,-${et_h * 0.175} 40,0`)
    .attr('fill', '#21262d').attr('stroke', '#30363d').attr('stroke-width', 0.8);
  etG.append('rect')
    .attr('x', -22).attr('y', -et_h * 0.175 - 4).attr('width', 44).attr('height', 7)
    .attr('fill', '#2d333b');
  etG.append('rect')
    .attr('x', -14).attr('y', -et_h * 0.37 - 3).attr('width', 28).attr('height', 6)
    .attr('fill', '#2d333b');
  etG.append('text').attr('y', 18).attr('text-anchor', 'middle').attr('fill', '#484f58').attr('font-size', 10).attr('letter-spacing', '0.08em').text('EIFFEL TOWER');
  etG.append('text').attr('y', 29).attr('text-anchor', 'middle').attr('fill', '#30363d').attr('font-size', 9).text('330m');

  // Big Ben (96m) at x=530
  const BB_X = 530;
  const bb_h = landmarkPx(96);
  const bbG = svg.append('g').attr('transform', `translate(${BB_X},${GROUND_Y})`);
  bbG.append('rect')
    .attr('x', -22).attr('y', -bb_h * 0.60).attr('width', 44).attr('height', bb_h * 0.60)
    .attr('fill', '#21262d').attr('stroke', '#30363d').attr('stroke-width', 0.8);
  bbG.append('rect')
    .attr('x', -13).attr('y', -bb_h).attr('width', 26).attr('height', bb_h * 0.40)
    .attr('fill', '#21262d').attr('stroke', '#30363d').attr('stroke-width', 0.8);
  bbG.append('circle')
    .attr('cx', 0).attr('cy', -bb_h * 0.78).attr('r', 8)
    .attr('fill', '#0d1117').attr('stroke', '#484f58').attr('stroke-width', 1.5);
  bbG.append('polygon')
    .attr('points', `-5,-${bb_h} 5,-${bb_h} 0,-${bb_h + 16}`)
    .attr('fill', '#30363d');
  bbG.append('text').attr('y', 18).attr('text-anchor', 'middle').attr('fill', '#484f58').attr('font-size', 10).attr('letter-spacing', '0.08em').text('BIG BEN');
  bbG.append('text').attr('y', 29).attr('text-anchor', 'middle').attr('fill', '#30363d').attr('font-size', 9).text('96m');

  // Statue of Liberty (93m) at x=370
  const SL_X = 370;
  const sl_h = landmarkPx(93);
  const slG = svg.append('g').attr('transform', `translate(${SL_X},${GROUND_Y})`);
  slG.append('rect')
    .attr('x', -20).attr('y', -sl_h * 0.38).attr('width', 40).attr('height', sl_h * 0.38)
    .attr('fill', '#21262d').attr('stroke', '#30363d').attr('stroke-width', 0.8);
  slG.append('rect')
    .attr('x', -12).attr('y', -sl_h * 0.84).attr('width', 24).attr('height', sl_h * 0.46)
    .attr('fill', '#21262d').attr('stroke', '#30363d').attr('stroke-width', 0.8);
  slG.append('circle')
    .attr('cx', 0).attr('cy', -sl_h * 0.90).attr('r', 7)
    .attr('fill', '#21262d').attr('stroke', '#30363d').attr('stroke-width', 0.8);
  [-7, 0, 7].forEach((dx) => {
    slG.append('line')
      .attr('x1', dx).attr('y1', -sl_h * 0.90 - 7)
      .attr('x2', dx * 0.7).attr('y2', -sl_h * 0.90 - 15)
      .attr('stroke', '#30363d').attr('stroke-width', 2).attr('stroke-linecap', 'round');
  });
  slG.append('line')
    .attr('x1', 10).attr('y1', -sl_h * 0.74)
    .attr('x2', 22).attr('y2', -sl_h)
    .attr('stroke', '#30363d').attr('stroke-width', 3).attr('stroke-linecap', 'round');
  slG.append('circle').attr('cx', 22).attr('cy', -sl_h).attr('r', 4).attr('fill', '#c97b3a').attr('opacity', 0.9);
  slG.append('text').attr('y', 18).attr('text-anchor', 'middle').attr('fill', '#484f58').attr('font-size', 10).attr('letter-spacing', '0.08em').text('STATUE OF LIBERTY');
  slG.append('text').attr('y', 29).attr('text-anchor', 'middle').attr('fill', '#30363d').attr('font-size', 9).text('93m');

  // Human (log-scaled visual height ~38px) at x=240
  const HU_X = 240;
  const hu_h = landmarkPx(1.7);
  const huG = svg.append('g').attr('transform', `translate(${HU_X},${GROUND_Y})`);
  huG.append('circle').attr('cy', -hu_h + 5).attr('r', 4).attr('fill', '#30363d');
  huG.append('rect').attr('x', -3).attr('y', -hu_h + 9).attr('width', 6).attr('height', Math.max(6, hu_h - 14)).attr('rx', 1).attr('fill', '#30363d');
  huG.append('line').attr('x1', -3).attr('y1', -8).attr('x2', -5).attr('y2', 0).attr('stroke', '#30363d').attr('stroke-width', 2).attr('stroke-linecap', 'round');
  huG.append('line').attr('x1', 3).attr('y1', -8).attr('x2', 5).attr('y2', 0).attr('stroke', '#30363d').attr('stroke-width', 2).attr('stroke-linecap', 'round');
  huG.append('text').attr('y', 14).attr('text-anchor', 'middle').attr('fill', '#484f58').attr('font-size', 10).attr('letter-spacing', '0.08em').text('HUMAN');
  huG.append('text').attr('y', 25).attr('text-anchor', 'middle').attr('fill', '#30363d').attr('font-size', 9).text('1.7m');
}

function LandmarkStack({ impact }) {
  const svgRef = useRef();
  const sceneReady = useRef(false);

  useEffect(() => {
    drawScene(d3.select(svgRef.current));
    sceneReady.current = true;
  }, []);

  useEffect(() => {
    if (!impact || !sceneReady.current) return;
    const svg = d3.select(svgRef.current);
    if (svg.select('.stack-fill').empty()) return;

    const sm = Math.max(0.5, stackMeters(impact.lifetimeKg));
    const topY = LOG_SCALE(sm);
    const fillH = GROUND_Y - topY;
    const bottleCount = Math.round(impact.lifetimeKg / BOTTLE_KG);
    const heightLabel = `${d3.format(',.0f')(sm)} m`;

    svg.select('.stack-fill')
      .transition().duration(600).ease(d3.easeCubicOut)
      .attr('y', topY).attr('height', fillH);

    svg.select('.stack-outline')
      .transition().duration(600).ease(d3.easeCubicOut)
      .attr('y', topY).attr('height', fillH);

    svg.select('.stack-height-label')
      .transition().duration(600)
      .attr('y', topY - 6)
      .text(heightLabel);

    svg.select('.stack-label-a').text(`${d3.format(',.0f')(bottleCount)} bottles`);
    svg.select('.stack-label-b').text(`${heightLabel} tall`);

  }, [impact]);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      className="w-full"
      style={{ height: 'auto' }}
    />
  );
}

export default function PersonalCalculator() {
  const { data, loading } = useAllData();
  const [age, setAge] = useState(30);

  const kgPerDay = useMemo(() => {
    if (!data?.wastePerCapita) return null;
    return getCountryWaste(data.wastePerCapita, 'United States');
  }, [data]);

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
    <div className="space-y-6">
      <div className="flex flex-col gap-2 max-w-xs">
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
              [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-ocean-400 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
          />
          <div className="flex justify-between text-xs text-slate-700"><span>1</span><span>80</span></div>
      </div>

      <div className="border border-white/5 rounded-lg overflow-hidden bg-[#0d1117]">
        <LandmarkStack impact={impact} />
      </div>

      {impact && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 border border-white/5 rounded-lg overflow-hidden">
          {[
            { value: d3.format(',.0f')(impact.kgPerYear), unit: 'kg / year', label: 'Waste generated' },
            { value: d3.format(',.0f')(impact.lifetimeKg), unit: 'kg total', label: `By age ${age}` },
            { value: d3.format(',.0f')(impact.bottlesPerYear), unit: 'bottles', label: 'Equivalent per year' },
            {
              value: d3.format(',.0f')(stackMeters(impact.lifetimeKg)),
              unit: 'm tall',
              label: 'Stack height',
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
      )}
    </div>
  );
}
