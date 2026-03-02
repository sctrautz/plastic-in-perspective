import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { DECOMPOSITION_TIMES } from '../../utils/constants';

const CURRENT_YEAR = 2026;
const HALF_SPAN = 660;

// Longest to shortest so the chart fans inward
const ITEMS = [
  {
    key: 'fishingLine',
    label: 'Fishing line',
    years: DECOMPOSITION_TIMES.fishingLine.years,
    historicalLabel: 'Pre-printing press',
    color: '#2272c3',
  },
  {
    key: 'plasticBottle',
    label: 'Plastic bottle',
    years: DECOMPOSITION_TIMES.plasticBottle.years,
    historicalLabel: 'Ottoman Empire',
    color: '#4a90d9',
  },
  {
    key: 'plasticStraw',
    label: 'Plastic straw',
    years: DECOMPOSITION_TIMES.plasticStraw.years,
    historicalLabel: 'First photograph taken',
    color: '#7db5e8',
  },
  {
    key: 'styrofoamCup',
    label: 'Styrofoam cup',
    years: DECOMPOSITION_TIMES.styrofoamCup.years,
    historicalLabel: null,
    color: '#b3d4f2',
  },
  {
    key: 'plasticBag',
    label: 'Plastic bag',
    years: DECOMPOSITION_TIMES.plasticBag.years,
    historicalLabel: null,
    color: '#deedfb',
  },
];

const W = 1060;
const H = 340;
const M = { top: 60, right: 30, bottom: 72, left: 145 };
const IW = W - M.left - M.right;
const IH = H - M.top - M.bottom;

export default function Timeline() {
  const svgRef = useRef();

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const x = d3.scaleLinear()
      .domain([CURRENT_YEAR - HALF_SPAN, CURRENT_YEAR + HALF_SPAN])
      .range([0, IW]);

    const g = svg.append('g').attr('transform', `translate(${M.left},${M.top})`);
    const todayX = x(CURRENT_YEAR);
    const ROW_H = IH / ITEMS.length;
    const BAR_H = 12;

    // Section labels
    g.append('text')
      .attr('x', todayX / 2)
      .attr('y', -38)
      .attr('text-anchor', 'middle')
      .attr('fill', '#484f58')
      .attr('font-size', 10)
      .attr('letter-spacing', '0.12em')
      .text('PAST EQUIVALENT');

    g.append('text')
      .attr('x', todayX + (IW - todayX) / 2)
      .attr('y', -38)
      .attr('text-anchor', 'middle')
      .attr('fill', '#4a90d9')
      .attr('font-size', 10)
      .attr('letter-spacing', '0.12em')
      .text('TIME UNTIL DECOMPOSITION');

    // Dividing line at Today
    g.append('line')
      .attr('x1', todayX).attr('x2', todayX)
      .attr('y1', -28).attr('y2', IH + 6)
      .attr('stroke', '#8b949e')
      .attr('stroke-width', 1);

    g.append('text')
      .attr('x', todayX)
      .attr('y', -33)
      .attr('text-anchor', 'middle')
      .attr('fill', '#8b949e')
      .attr('font-size', 10)
      .attr('letter-spacing', '0.08em')
      .text('TODAY');

    ITEMS.forEach((item, i) => {
      const cy = i * ROW_H + ROW_H / 2;
      const leftX = x(CURRENT_YEAR - item.years);
      const rightX = x(CURRENT_YEAR + item.years);

      // Item name (left margin)
      svg.append('text')
        .attr('x', M.left - 14)
        .attr('y', M.top + cy + 4)
        .attr('text-anchor', 'end')
        .attr('fill', '#8b949e')
        .attr('font-size', 12)
        .text(item.label);

      // Past bar (muted)
      g.append('rect')
        .attr('x', leftX)
        .attr('y', cy - BAR_H / 2)
        .attr('width', todayX - leftX)
        .attr('height', BAR_H)
        .attr('rx', 2)
        .attr('fill', '#21262d');

      // Future bar (colored)
      g.append('rect')
        .attr('x', todayX)
        .attr('y', cy - BAR_H / 2)
        .attr('width', rightX - todayX)
        .attr('height', BAR_H)
        .attr('rx', 2)
        .attr('fill', item.color)
        .attr('opacity', 0.7);

      // Historical label + year (only for the 3 longest)
      if (item.historicalLabel) {
        const labelY = IH + 20;

        g.append('line')
          .attr('x1', leftX).attr('x2', leftX)
          .attr('y1', cy + BAR_H / 2 + 2).attr('y2', IH + 8)
          .attr('stroke', '#30363d')
          .attr('stroke-dasharray', '2,3');

        g.append('text')
          .attr('x', leftX)
          .attr('y', labelY)
          .attr('text-anchor', 'middle')
          .attr('fill', '#484f58')
          .attr('font-size', 10)
          .text(CURRENT_YEAR - item.years);

        g.append('text')
          .attr('x', leftX)
          .attr('y', labelY + 13)
          .attr('text-anchor', 'middle')
          .attr('fill', '#30363d')
          .attr('font-size', 10)
          .text(item.historicalLabel);
      }

      // Future year label (only when bar is wide enough)
      if (rightX - todayX > 55) {
        g.append('text')
          .attr('x', rightX + 6)
          .attr('y', cy + 4)
          .attr('fill', item.color)
          .attr('opacity', 0.75)
          .attr('font-size', 10)
          .text(CURRENT_YEAR + item.years);
      }
    });

    // Baseline
    g.append('line')
      .attr('x1', 0).attr('x2', IW)
      .attr('y1', IH + 6).attr('y2', IH + 6)
      .attr('stroke', '#21262d');

  }, []);

  return (
    <div className="space-y-6">
      {/* Callout stat */}
      <blockquote className="border-l-2 border-ocean-500 pl-5">
        <p className="text-xl font-light text-slate-300 leading-relaxed">
          A plastic bottle thrown away today won't decompose until{' '}
          <span className="text-slate-100 font-normal">2476</span> — the same
          distance into the future as the Ottoman Empire is in the past.
        </p>
      </blockquote>

      {/* Chart */}
      <div className="border border-white/5 rounded-lg bg-white/[0.015] overflow-x-auto">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full"
          style={{ minWidth: '580px', height: 'auto' }}
        />
      </div>

      <p className="text-xs text-slate-700">
        Sources: NOAA Marine Debris Program · UNESCO · EPA · National Park Service
      </p>
    </div>
  );
}
