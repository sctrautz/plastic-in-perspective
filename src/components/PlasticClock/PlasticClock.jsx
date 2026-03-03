import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { useAllData } from '../../hooks/useData';
import { calculatePlasticRate } from '../../utils/dataProcessing';

const W = 960;
const H = 460;
const SKY_H = 100;
const FLOOR_H = 58;
const WAVE_Y = SKY_H;
const WATER_BOTTOM = H - FLOOR_H;
const WATER_H = WATER_BOTTOM - WAVE_Y;
const BOAT_X = 680;

const MAX_PARTICLES = 480;
const VISUAL_RATE = 0.5;

const PARTICLE_COLORS = ['#f0eeea', '#e2ddd6', '#c8d8e2', '#d6cfc4', '#a8c8d8', '#dedad2'];

const SHAPES = [
  (r) => `M${-r},0 L${r * 0.3},${-r * 1.1} L${r},${r * 0.4} L${-r * 0.5},${r * 0.9} Z`,
  (r) => `M0,${-r} Q${r * 1.2},${-r * 0.3} ${r * 0.6},${r * 0.7} Q${-r * 0.8},${r * 1.1} ${-r * 0.8},${-r * 0.2} Z`,
  (r) => `M${-r * 0.8},${-r * 0.5} L${r * 0.8},${-r * 0.8} L${r},${r * 0.6} L${-r * 0.6},${r * 0.8} Z`,
];

function randomBehavior() {
  const roll = Math.random();
  if (roll < 0.35) return 'float';
  if (roll < 0.75) return 'sink';
  return 'suspend';
}

function makeSeaweedPath(h, segments) {
  const segH = h / segments;
  let d = 'M 0,0';
  for (let i = 0; i < segments; i++) {
    const y = -segH * (i + 1);
    const cx = i % 2 === 0 ? -9 : 9;
    d += ` Q ${cx},${-segH * i - segH * 0.6} 0,${y}`;
  }
  return d;
}

function makeCoralPath(h, branches) {
  let d = `M 0,0 L 0,${-h}`;
  for (let i = 0; i < branches; i++) {
    const t = (i + 1) / (branches + 1);
    const ty = -h * t;
    const dir = i % 2 === 0 ? 1 : -1;
    const bLen = h * 0.45;
    d += ` M 0,${ty} Q ${dir * bLen * 0.35},${ty - bLen * 0.4} ${dir * bLen * 0.85},${ty - bLen * 0.75}`;
    d += ` M ${dir * bLen * 0.45},${ty - bLen * 0.5} Q ${dir * bLen * 0.7},${ty - bLen * 0.25} ${dir * bLen * 1.0},${ty - bLen * 0.1}`;
  }
  return d;
}

const SEAWEEDS = [
  { x: 55,  h: 48, segments: 7, color: '#2a6e4a' },
  { x: 190, h: 34, segments: 5, color: '#1e5c3c' },
  { x: 375, h: 54, segments: 8, color: '#2d7a52' },
  { x: 510, h: 38, segments: 6, color: '#246040' },
  { x: 770, h: 44, segments: 7, color: '#2a6e4a' },
  { x: 905, h: 28, segments: 4, color: '#1e5c3c' },
];

const CORALS = [
  { x: 130, h: 32, branches: 2, color: '#d4634e', strokeColor: '#a03828' },
  { x: 310, h: 44, branches: 3, color: '#e07858', strokeColor: '#b05030' },
  { x: 490, h: 28, branches: 2, color: '#c96850', strokeColor: '#9a4030' },
  { x: 700, h: 38, branches: 2, color: '#d97055', strokeColor: '#a84030' },
  { x: 860, h: 24, branches: 2, color: '#c87060', strokeColor: '#9a4038' },
];

const ROCKS = [
  { x: 22,  ry: 10, rx: 30, color: '#8a7055' },
  { x: 260, ry: 8,  rx: 20, color: '#7a6048' },
  { x: 450, ry: 13, rx: 38, color: '#8a7055' },
  { x: 635, ry: 9,  rx: 24, color: '#7a6048' },
  { x: 930, ry: 11, rx: 28, color: '#8a7055' },
];

export default function PlasticClock() {
  const svgRef = useRef();
  const stateRef = useRef({ particles: [], nextId: 0 });
  const boatRef = useRef(null);
  const { data, loading } = useAllData();
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(null);

  const rate = useMemo(() => {
    if (!data?.production) return null;
    return calculatePlasticRate(data.production);
  }, [data]);

  useEffect(() => {
    if (!rate) return;
    startRef.current = Date.now();
    const timer = setInterval(() => setElapsed((Date.now() - startRef.current) / 1000), 100);
    return () => clearInterval(timer);
  }, [rate]);

  useEffect(() => {
    if (!rate || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const defs = svg.append('defs');

    const skyGrad = defs.append('linearGradient').attr('id', 'sky-grad').attr('x1', 0).attr('x2', 0).attr('y1', 0).attr('y2', 1);
    skyGrad.append('stop').attr('offset', '0%').attr('stop-color', '#b8d0e0');
    skyGrad.append('stop').attr('offset', '100%').attr('stop-color', '#8ab8ce');

    const waterGrad = defs.append('linearGradient').attr('id', 'water-grad').attr('x1', 0).attr('x2', 0).attr('y1', 0).attr('y2', 1);
    waterGrad.append('stop').attr('offset', '0%').attr('stop-color', '#1a5276').attr('stop-opacity', 0.92);
    waterGrad.append('stop').attr('offset', '100%').attr('stop-color', '#0b1e30').attr('stop-opacity', 1);

    // Sky
    svg.append('rect').attr('width', W).attr('height', SKY_H).attr('fill', 'url(#sky-grad)');

    // Water body
    svg.append('rect').attr('x', 0).attr('y', WAVE_Y).attr('width', W).attr('height', WATER_H).attr('fill', 'url(#water-grad)');

    // Ocean floor
    svg.append('rect').attr('x', 0).attr('y', WATER_BOTTOM).attr('width', W).attr('height', FLOOR_H).attr('fill', '#c4a876');

    // Sand ripples + rocks on floor
    for (let i = 0; i < 9; i++) {
      svg.append('ellipse')
        .attr('cx', 50 + i * 108).attr('cy', WATER_BOTTOM + 16)
        .attr('rx', 42).attr('ry', 5)
        .attr('fill', '#aa9260').attr('opacity', 0.35);
    }
    ROCKS.forEach(({ x, rx, ry, color }) => {
      svg.append('ellipse')
        .attr('cx', x).attr('cy', WATER_BOTTOM + 4)
        .attr('rx', rx).attr('ry', ry)
        .attr('fill', color).attr('opacity', 0.85);
    });

    // Floor decorations: seaweed and coral (behind particles)
    const floorDeco = svg.append('g').attr('class', 'floor-deco');

    SEAWEEDS.forEach(({ x, h, segments, color }) => {
      floorDeco.append('path')
        .attr('d', makeSeaweedPath(h, segments))
        .attr('transform', `translate(${x},${WATER_BOTTOM})`)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 2.5)
        .attr('stroke-linecap', 'round')
        .attr('opacity', 0.9);

      // Second blade slightly offset
      floorDeco.append('path')
        .attr('d', makeSeaweedPath(h * 0.75, segments - 1))
        .attr('transform', `translate(${x + 7},${WATER_BOTTOM})`)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 1.8)
        .attr('stroke-linecap', 'round')
        .attr('opacity', 0.65);
    });

    CORALS.forEach(({ x, h, branches, color, strokeColor }) => {
      floorDeco.append('path')
        .attr('d', makeCoralPath(h, branches))
        .attr('transform', `translate(${x},${WATER_BOTTOM})`)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 3)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .attr('opacity', 0.9);
      // Darker outline for depth
      floorDeco.append('path')
        .attr('d', makeCoralPath(h, branches))
        .attr('transform', `translate(${x},${WATER_BOTTOM})`)
        .attr('fill', 'none')
        .attr('stroke', strokeColor)
        .attr('stroke-width', 1.2)
        .attr('stroke-linecap', 'round')
        .attr('opacity', 0.5);
    });

    // Particle layer (in front of floor deco)
    const particleLayer = svg.append('g').attr('class', 'particle-layer');

    // Wave surface (in front of particles)
    const wavePath = svg.append('path').attr('fill', '#1a5276').attr('opacity', 0.55);

    // Boat group (top layer)
    const boat = svg.append('g').attr('class', 'boat');
    boatRef.current = boat;

    // Hull
    boat.append('path')
      .attr('d', 'M -44,-14 L 44,-14 L 48,0 Q 0,11 -48,0 Z')
      .attr('fill', '#c8956a')
      .attr('stroke', '#7a5030')
      .attr('stroke-width', 1.2);

    // Hull stripe
    boat.append('path')
      .attr('d', 'M -40,-14 L 40,-14 L 40,-8 L -40,-8 Z')
      .attr('fill', '#a87050')
      .attr('opacity', 0.5);

    // Cabin
    boat.append('rect')
      .attr('x', -20).attr('y', -38).attr('width', 40).attr('height', 24)
      .attr('rx', 2)
      .attr('fill', '#deb87a')
      .attr('stroke', '#7a5030')
      .attr('stroke-width', 1);

    // Windows
    [{ x: -15, y: -32 }, { x: 5, y: -32 }].forEach(({ x, y }) => {
      boat.append('rect')
        .attr('x', x).attr('y', y).attr('width', 9).attr('height', 8)
        .attr('rx', 1.5)
        .attr('fill', '#a8d4ea')
        .attr('opacity', 0.8);
    });

    // Mast
    boat.append('line')
      .attr('x1', 0).attr('y1', -38).attr('x2', 0).attr('y2', -78)
      .attr('stroke', '#5a3820').attr('stroke-width', 2.5).attr('stroke-linecap', 'round');

    // Flag
    boat.append('path')
      .attr('d', 'M 0,-78 L 14,-70 L 0,-62 Z')
      .attr('fill', '#c97b3a');

    // Small boom
    boat.append('line')
      .attr('x1', 0).attr('y1', -55).attr('x2', 18).attr('y2', -48)
      .attr('stroke', '#5a3820').attr('stroke-width', 1.5).attr('stroke-linecap', 'round');

    boat.attr('transform', `translate(${BOAT_X},${WAVE_Y})`);

    // Spawn particles
    const intervalMs = 1000 / (rate.tonnesPerSecond * VISUAL_RATE);

    const interval = d3.interval(() => {
      const state = stateRef.current;

      if (state.particles.length >= MAX_PARTICLES) {
        const evicted = state.particles.shift();
        particleLayer.select(`#op-${evicted}`)
          .transition().duration(400).attr('opacity', 0).remove();
      }

      const id = ++state.nextId;
      state.particles.push(id);

      const behavior = randomBehavior();
      const px = Math.random() * (W - 40) + 20;
      const color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
      const size = 2 + Math.random() * 3.5;
      const shapeIdx = Math.floor(Math.random() * SHAPES.length);
      const rotation = Math.random() * 360;
      const startY = WAVE_Y + 4 + Math.random() * 18;

      let targetY, duration;
      if (behavior === 'float') {
        targetY = startY + 8 + Math.random() * 20;
        duration = 4000 + Math.random() * 5000;
      } else if (behavior === 'sink') {
        targetY = WATER_BOTTOM - 6 - Math.random() * 16;
        duration = 8000 + Math.random() * 12000;
      } else {
        targetY = WAVE_Y + WATER_H * (0.25 + Math.random() * 0.5);
        duration = 6000 + Math.random() * 8000;
      }

      particleLayer.append('path')
        .attr('id', `op-${id}`)
        .attr('d', SHAPES[shapeIdx](size))
        .attr('transform', `translate(${px},${startY}) rotate(${rotation})`)
        .attr('fill', color)
        .attr('opacity', 0)
        .transition().duration(600)
        .attr('opacity', behavior === 'float' ? 0.7 : behavior === 'sink' ? 0.55 : 0.45)
        .transition().duration(duration).ease(d3.easeLinear)
        .attr('transform', `translate(${px},${targetY}) rotate(${rotation + 15})`);
    }, intervalMs);

    // Wave + boat animation
    let wavePhase = 0;
    const waveTimer = d3.timer(() => {
      wavePhase += 0.018;

      const pts = d3.range(0, W + 30, 18).map((xi) => [
        xi,
        WAVE_Y + Math.sin(xi * 0.016 + wavePhase) * 4 + Math.sin(xi * 0.035 + wavePhase * 1.3) * 2,
      ]);
      const linePts = d3.line().x((d) => d[0]).y((d) => d[1]).curve(d3.curveCatmullRom)(pts);
      wavePath.attr('d', `${linePts} L${W},${H} L0,${H} Z`);

      // Boat follows wave at BOAT_X
      const boatY = WAVE_Y
        + Math.sin(BOAT_X * 0.016 + wavePhase) * 4
        + Math.sin(BOAT_X * 0.035 + wavePhase * 1.3) * 2;
      const boatTilt = (Math.cos(BOAT_X * 0.016 + wavePhase) * 0.016 * 4
        + Math.cos(BOAT_X * 0.035 + wavePhase * 1.3) * 0.035 * 2) * 12;
      boatRef.current?.attr('transform', `translate(${BOAT_X},${boatY}) rotate(${boatTilt})`);
    });

    return () => {
      interval.stop();
      waveTimer.stop();
      particleLayer.selectAll('*').interrupt().remove();
      stateRef.current = { particles: [], nextId: 0 };
      boatRef.current = null;
    };
  }, [rate]);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center text-slate-600 text-sm tracking-widest uppercase">
        Loading
      </div>
    );
  }

  const tonnesSinceLoad = rate ? elapsed * rate.tonnesPerSecond : 0;

  return (
    <div className="space-y-6">
      <div className="relative border border-white/5 rounded-lg overflow-hidden bg-[#0b1e30]">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full"
          style={{ height: 'auto', display: 'block' }}
        />

        {/* Counter — positioned over the sky area, top-left */}
        <div className="absolute top-3 left-4 pointer-events-none select-none">
          <div className="bg-[#0a1628]/65 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
            <div
              className="text-3xl leading-none text-slate-100 tabular-nums"
              style={{ fontFamily: '"SFMono-Regular", "Courier New", Courier, monospace', letterSpacing: '-0.01em' }}
            >
              {d3.format(',.0f')(tonnesSinceLoad)}
            </div>
            <div className="text-[10px] text-slate-400 mt-1.5 uppercase tracking-widest">
              tonnes produced since you arrived
            </div>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-px bg-white/5 rounded-lg overflow-hidden border border-white/5">
        {[
          { value: d3.format(',.2f')(rate?.tonnesPerSecond ?? 0), unit: 'tonnes', label: 'per second' },
          { value: d3.format(',.0f')(rate?.trucksPerMinute ?? 0), unit: 'trucks', label: 'per minute' },
          {
            value: d3.format(',.0f')((rate?.tonnesPerYear ?? 0) / 1e6) + 'M',
            unit: 'tonnes',
            label: `produced in ${rate?.year ?? ''}`,
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
    </div>
  );
}
