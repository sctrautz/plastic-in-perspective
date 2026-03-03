import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { DECOMPOSITION_TIMES } from '../../utils/constants';

const CURRENT_YEAR = 2026;
const HALF_SPAN = 660;

const ITEMS = [
  { key: 'fishingLine',   label: 'Fishing line',   years: DECOMPOSITION_TIMES.fishingLine.years,   color: '#2272c3' },
  { key: 'plasticBottle', label: 'Plastic bottle', years: DECOMPOSITION_TIMES.plasticBottle.years, color: '#4a90d9' },
  { key: 'plasticStraw',  label: 'Plastic straw',  years: DECOMPOSITION_TIMES.plasticStraw.years,  color: '#7db5e8' },
  { key: 'styrofoamCup',  label: 'Styrofoam cup',  years: DECOMPOSITION_TIMES.styrofoamCup.years,  color: '#b3d4f2' },
  { key: 'plasticBag',    label: 'Plastic bag',    years: DECOMPOSITION_TIMES.plasticBag.years,    color: '#deedfb' },
];

const CIVS = [
  { label: 'Human lifespan', years: 80,  color: '#6b7280', note: '~80 years'  },
  { label: 'Ming Dynasty',   years: 276, color: '#7a8c5e', note: '1368–1644'  },
  { label: 'British Empire', years: 400, color: '#5e7a8c', note: '1583–1997' },
  { label: 'Roman Empire',   years: 503, color: '#8c7a5e', note: '27BC–476AD' },
  { label: 'Ottoman Empire', years: 623, color: '#8c5e5e', note: '1299–1922'  },
];

const W = 1060;
const SVG_H = 460;
const H = 340;
const M = { top: 60, right: 30, bottom: 72, left: 145 };
const IW = W - M.left - M.right;
const IH = H - M.top - M.bottom;

const CIV_ROW_H = 30;
const CIV_BAR_H = 9;
const CIV_START_Y = IH + 38;

const x = d3.scaleLinear()
  .domain([CURRENT_YEAR - HALF_SPAN, CURRENT_YEAR + HALF_SPAN])
  .range([0, IW]);
const todayX = x(CURRENT_YEAR);
const ROW_H = IH / ITEMS.length;
const BAR_H = 13;

export default function Timeline() {
  const svgRef = useRef();
  const containerRef = useRef();
  const animatedRef = useRef(false);
  const [hovered, setHovered] = useState(null);
  const [mousePos, setMousePos] = useState(null);
  const [containerInView, setContainerInView] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setContainerInView(true); },
      { threshold: 0.1 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g').attr('transform', `translate(${M.left},${M.top})`);

    g.append('text')
      .attr('x', todayX + (IW - todayX) / 2).attr('y', -38)
      .attr('text-anchor', 'middle').attr('fill', '#4a90d9')
      .attr('font-size', 10).attr('letter-spacing', '0.12em')
      .text('TIME UNTIL DECOMPOSITION');

    // TODAY line extended through civ section
    const civBottom = CIV_START_Y + CIVS.length * CIV_ROW_H;
    g.append('line')
      .attr('x1', todayX).attr('x2', todayX)
      .attr('y1', -28).attr('y2', civBottom)
      .attr('stroke', '#8b949e').attr('stroke-width', 1);

    g.append('text')
      .attr('x', todayX).attr('y', -33)
      .attr('text-anchor', 'middle').attr('fill', '#8b949e')
      .attr('font-size', 10).attr('letter-spacing', '0.08em')
      .text('TODAY');

    ITEMS.forEach((item, i) => {
      const cy = i * ROW_H + ROW_H / 2;
      const leftX = x(CURRENT_YEAR - item.years);
      const rightX = x(CURRENT_YEAR + item.years);

      svg.append('text')
        .attr('x', M.left - 14).attr('y', M.top + cy + 4)
        .attr('text-anchor', 'end').attr('fill', '#8b949e').attr('font-size', 12)
        .text(item.label);

      g.append('rect').attr('class', `past-${i}`)
        .attr('x', todayX).attr('y', cy - BAR_H / 2)
        .attr('width', 0).attr('height', BAR_H)
        .attr('rx', 2).attr('fill', '#21262d');

      g.append('rect').attr('class', `future-${i}`)
        .attr('x', todayX).attr('y', cy - BAR_H / 2)
        .attr('width', 0).attr('height', BAR_H)
        .attr('rx', 2).attr('fill', item.color).attr('opacity', 0.75);

      // Past-side year at left end of bar
      g.append('text').attr('class', `past-yr-${i}`)
        .attr('x', leftX - 5).attr('y', cy + 4)
        .attr('text-anchor', 'end').attr('fill', '#484f58').attr('font-size', 9)
        .attr('opacity', 0).text(CURRENT_YEAR - item.years);

      // Future-side year at right end of bar
      g.append('text').attr('class', `fut-yr-${i}`)
        .attr('x', rightX + 6).attr('y', cy + 4)
        .attr('fill', item.color).attr('opacity', 0).attr('font-size', 10)
        .text(CURRENT_YEAR + item.years);

      // Hover target covers only the actual bar span, not the full row
      g.append('rect').attr('class', `hover-target-${i}`)
        .attr('x', leftX).attr('y', cy - BAR_H / 2 - 4)
        .attr('width', rightX - leftX).attr('height', BAR_H + 8)
        .attr('fill', 'transparent').style('cursor', 'pointer')
        .on('mouseenter', function () { setHovered({ item, index: i }); })
        .on('mouseleave', () => setHovered(null));
    });

    g.append('line')
      .attr('x1', 0).attr('x2', IW)
      .attr('y1', IH + 6).attr('y2', IH + 6)
      .attr('stroke', '#21262d');

    // Civilization section
    g.append('text')
      .attr('x', todayX / 2).attr('y', IH + 22)
      .attr('text-anchor', 'middle').attr('fill', '#484f58')
      .attr('font-size', 9).attr('letter-spacing', '0.12em')
      .text('CIVILIZATIONS FOR SCALE');

    CIVS.forEach((civ, i) => {
      const cy = CIV_START_Y + i * CIV_ROW_H;
      const leftX = x(CURRENT_YEAR - civ.years);

      svg.append('text')
        .attr('x', M.left - 14).attr('y', M.top + cy + 4)
        .attr('text-anchor', 'end').attr('fill', '#484f58').attr('font-size', 10)
        .text(civ.label);

      g.append('rect').attr('class', `civ-${i}`)
        .attr('x', todayX).attr('y', cy - CIV_BAR_H / 2)
        .attr('width', 0).attr('height', CIV_BAR_H)
        .attr('rx', 2)
        .attr('fill', civ.color).attr('fill-opacity', 0.45);

      // Duration + dates label just right of TODAY line
      g.append('text').attr('class', `civ-note-${i}`)
        .attr('x', todayX + 8).attr('y', cy + 4)
        .attr('fill', civ.color).attr('font-size', 9)
        .attr('opacity', 0).text(`${civ.years} yrs  ·  ${civ.note}`);
    });

    g.append('line')
      .attr('x1', 0).attr('x2', IW)
      .attr('y1', civBottom + 4).attr('y2', civBottom + 4)
      .attr('stroke', '#21262d').attr('opacity', 0.4);
  }, []);

  useEffect(() => {
    if (!containerInView || animatedRef.current) return;
    animatedRef.current = true;

    const g = d3.select(svgRef.current).select('g');

    ITEMS.forEach((item, i) => {
      const leftX = x(CURRENT_YEAR - item.years);
      const rightX = x(CURRENT_YEAR + item.years);
      const delay = i * 110;

      g.select(`.past-${i}`)
        .transition().delay(delay).duration(750).ease(d3.easeCubicOut)
        .attr('x', leftX).attr('width', todayX - leftX);

      g.select(`.future-${i}`)
        .transition().delay(delay + 80).duration(750).ease(d3.easeCubicOut)
        .attr('width', rightX - todayX);

      g.select(`.past-yr-${i}`).transition().delay(delay + 650).duration(300).attr('opacity', 0.6);
      g.select(`.fut-yr-${i}`).transition().delay(delay + 500).duration(300).attr('opacity', 0.75);
    });

    const CIV_BASE = 1400;
    CIVS.forEach((civ, i) => {
      const leftX = x(CURRENT_YEAR - civ.years);
      const delay = CIV_BASE + i * 160;

      g.select(`.civ-${i}`)
        .transition().delay(delay).duration(800).ease(d3.easeCubicOut)
        .attr('x', leftX).attr('width', todayX - leftX);

      g.select(`.civ-note-${i}`)
        .transition().delay(delay + 700).duration(350)
        .attr('opacity', 0.5);
    });
  }, [containerInView]);

  const hoveredItem = hovered?.item;

  return (
    <div className="space-y-6">
      <blockquote className="border-l-2 border-ocean-500 pl-5">
        <p className="text-xl font-light text-slate-300 leading-relaxed">
          A plastic bottle thrown away today won't decompose until{' '}
          <span className="text-slate-100 font-normal">2476</span> — long after
          entire civilizations have risen and fallen.
        </p>
      </blockquote>

      <div
        ref={containerRef}
        className="relative border border-white/5 rounded-lg bg-white/[0.015] overflow-x-auto"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }}
        onMouseLeave={() => { setHovered(null); setMousePos(null); }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${SVG_H}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full"
          style={{ minWidth: '580px', height: 'auto' }}
        />

        {hoveredItem && mousePos && (
          <div
            className="pointer-events-none absolute bg-[#161b22] border border-white/10 rounded-lg px-4 py-3 text-xs space-y-1 w-[200px]"
            style={{
              left: Math.min(mousePos.x + 16, (containerRef.current?.offsetWidth ?? 600) - 216),
              top: Math.max(8, mousePos.y - 88),
            }}
          >
            <div className="text-slate-200 font-medium text-sm mb-2">{hoveredItem.label}</div>
            <div className="text-slate-400">
              Decomposes in <span className="text-slate-200">{hoveredItem.years} years</span>
            </div>
            <div className="text-slate-400">
              Until <span className="text-slate-200">{CURRENT_YEAR + hoveredItem.years}</span>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-700">
        Sources: NOAA Marine Debris Program · UNESCO · EPA · National Park Service
      </p>
    </div>
  );
}
