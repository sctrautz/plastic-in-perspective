import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { DECOMPOSITION_TIMES } from '../../utils/constants';

const CURRENT_YEAR = 2026;
const HALF_SPAN = 660;

const ITEMS = [
  { key: 'fishingLine',   label: 'Fishing line',   years: DECOMPOSITION_TIMES.fishingLine.years,   historicalLabel: 'Pre-printing press', color: '#2272c3' },
  { key: 'plasticBottle', label: 'Plastic bottle', years: DECOMPOSITION_TIMES.plasticBottle.years, historicalLabel: 'Ottoman Empire',      color: '#4a90d9' },
  { key: 'plasticStraw',  label: 'Plastic straw',  years: DECOMPOSITION_TIMES.plasticStraw.years,  historicalLabel: 'First photograph',    color: '#7db5e8' },
  { key: 'styrofoamCup',  label: 'Styrofoam cup',  years: DECOMPOSITION_TIMES.styrofoamCup.years,  historicalLabel: null,                  color: '#b3d4f2' },
  { key: 'plasticBag',    label: 'Plastic bag',    years: DECOMPOSITION_TIMES.plasticBag.years,    historicalLabel: null,                  color: '#deedfb' },
];

const W = 1060;
const H = 340;
const M = { top: 60, right: 30, bottom: 72, left: 145 };
const IW = W - M.left - M.right;
const IH = H - M.top - M.bottom;

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

  // Build static SVG skeleton
  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g').attr('transform', `translate(${M.left},${M.top})`);

    g.append('text')
      .attr('x', todayX / 2).attr('y', -38)
      .attr('text-anchor', 'middle').attr('fill', '#484f58')
      .attr('font-size', 10).attr('letter-spacing', '0.12em')
      .text('PAST EQUIVALENT');

    g.append('text')
      .attr('x', todayX + (IW - todayX) / 2).attr('y', -38)
      .attr('text-anchor', 'middle').attr('fill', '#4a90d9')
      .attr('font-size', 10).attr('letter-spacing', '0.12em')
      .text('TIME UNTIL DECOMPOSITION');

    g.append('line')
      .attr('x1', todayX).attr('x2', todayX)
      .attr('y1', -28).attr('y2', IH + 6)
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

      // Past bar — starts at todayX, width 0
      g.append('rect').attr('class', `past-${i}`)
        .attr('x', todayX).attr('y', cy - BAR_H / 2)
        .attr('width', 0).attr('height', BAR_H)
        .attr('rx', 2).attr('fill', '#21262d');

      // Future bar — starts at todayX, width 0
      g.append('rect').attr('class', `future-${i}`)
        .attr('x', todayX).attr('y', cy - BAR_H / 2)
        .attr('width', 0).attr('height', BAR_H)
        .attr('rx', 2).attr('fill', item.color).attr('opacity', 0.75);

      if (item.historicalLabel) {
        const labelY = IH + 20;

        g.append('line').attr('class', `tick-${i}`)
          .attr('x1', leftX).attr('x2', leftX)
          .attr('y1', cy + BAR_H / 2 + 2).attr('y2', IH + 8)
          .attr('stroke', '#30363d').attr('stroke-dasharray', '2,3')
          .attr('opacity', 0);

        g.append('text').attr('class', `hist-yr-${i}`)
          .attr('x', leftX).attr('y', labelY)
          .attr('text-anchor', 'middle').attr('fill', '#484f58').attr('font-size', 10)
          .attr('opacity', 0).text(CURRENT_YEAR - item.years);

        g.append('text').attr('class', `hist-lbl-${i}`)
          .attr('x', leftX).attr('y', labelY + 13)
          .attr('text-anchor', 'middle').attr('fill', '#30363d').attr('font-size', 10)
          .attr('opacity', 0).text(item.historicalLabel);
      }

      if (rightX - todayX > 55) {
        g.append('text').attr('class', `fut-yr-${i}`)
          .attr('x', rightX + 6).attr('y', cy + 4)
          .attr('fill', item.color).attr('opacity', 0).attr('font-size', 10)
          .text(CURRENT_YEAR + item.years);
      }

      // Hover target
      g.append('rect').attr('class', `hover-target-${i}`)
        .attr('x', 0).attr('y', cy - ROW_H / 2)
        .attr('width', IW).attr('height', ROW_H)
        .attr('fill', 'transparent').style('cursor', 'default')
        .on('mouseenter', function (event) {
          const [mx] = d3.pointer(event, svgRef.current);
          setHovered({ item, index: i, mx: mx + M.left });
        })
        .on('mouseleave', () => setHovered(null));
    });

    g.append('line')
      .attr('x1', 0).attr('x2', IW)
      .attr('y1', IH + 6).attr('y2', IH + 6)
      .attr('stroke', '#21262d');
  }, []);

  // Animate bars when container enters view
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

      if (item.historicalLabel) {
        g.select(`.tick-${i}`).transition().delay(delay + 400).duration(300).attr('opacity', 1);
        g.select(`.hist-yr-${i}`).transition().delay(delay + 450).duration(300).attr('opacity', 1);
        g.select(`.hist-lbl-${i}`).transition().delay(delay + 500).duration(300).attr('opacity', 1);
      }

      g.select(`.fut-yr-${i}`).transition().delay(delay + 500).duration(300).attr('opacity', 0.75);
    });
  }, [containerInView]);

  const hoveredItem = hovered?.item;

  return (
    <div className="space-y-6">
      <blockquote className="border-l-2 border-ocean-500 pl-5">
        <p className="text-xl font-light text-slate-300 leading-relaxed">
          A plastic bottle thrown away today won't decompose until{' '}
          <span className="text-slate-100 font-normal">2476</span> — the same
          distance into the future as the Ottoman Empire is in the past.
        </p>
      </blockquote>

      {/* Chart */}
      <div
        ref={containerRef}
        className="relative border border-white/5 rounded-lg bg-white/[0.015] overflow-x-auto"
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full"
          style={{ minWidth: '580px', height: 'auto' }}
        />

        {/* Hover tooltip */}
        {hoveredItem && (
          <div
            className="pointer-events-none absolute top-4 right-4 bg-[#161b22] border border-white/10 rounded-lg px-4 py-3 text-xs space-y-1 max-w-[220px]"
          >
            <div className="text-slate-200 font-medium text-sm mb-2">{hoveredItem.label}</div>
            <div className="text-slate-400">
              Decomposes in <span className="text-slate-200">{hoveredItem.years} years</span>
            </div>
            <div className="text-slate-400">
              Until <span className="text-slate-200">{CURRENT_YEAR + hoveredItem.years}</span>
            </div>
            {hoveredItem.historicalLabel && (
              <div className="text-slate-600 pt-1 border-t border-white/5">
                Equivalent to: {CURRENT_YEAR - hoveredItem.years} ({hoveredItem.historicalLabel})
              </div>
            )}
          </div>
        )}
      </div>

      <p className="text-xs text-slate-700">
        Sources: NOAA Marine Debris Program · UNESCO · EPA · National Park Service
      </p>
    </div>
  );
}
