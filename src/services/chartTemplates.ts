export interface BarChartData {
  oldKwh: number;
  newKwh: number;
  unitPrice: number;
  savingsKwh: number;
  savingsYen: number;
  roomSize: string;
}

export interface LineChartData extends BarChartData {
  oldMonthly: number[];
  newMonthly: number[];
}

function fmtN(n: number): string {
  return n.toLocaleString('ja-JP');
}

export function buildBarChart(data: BarChartData): string {
  const maxVal = Math.ceil(data.oldKwh * 1.1 / 100) * 100;
  const chartH = 160;
  const baseline = 200;

  const oldH = Math.round((data.oldKwh / maxVal) * chartH);
  const newH = Math.round((data.newKwh / maxVal) * chartH);
  const oldY = baseline - oldH;
  const newY = baseline - newH;

  const step = maxVal / 4;
  const grids = [1, 2, 3, 4].map(i => ({
    val: Math.round(step * i),
    y: Math.round(baseline - (step * i / maxVal) * chartH),
  }));

  const gridLinesStr = grids.map(g =>
    `      <line x1="40" y1="${g.y}" x2="520" y2="${g.y}" stroke="#e2e8f0" strokeWidth="1" />\n` +
    `      <text x="35" y="${g.y + 4}" textAnchor="end" fontSize="10" fill="#94a3b8">${g.val}</text>`
  ).join('\n');

  return `const App = () => (
  <div style={{ fontFamily: 'system-ui, sans-serif', padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>
    <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', color: '#1e293b', textAlign: 'center' }}>
      年間消費電力量比較（${data.roomSize}）
    </h2>
    <svg viewBox="0 0 560 240" style={{ width: '100%', display: 'block', marginBottom: '20px' }}>
${gridLinesStr}
      <line x1="40" y1="200" x2="520" y2="200" stroke="#94a3b8" strokeWidth="1.5" />
      <rect x="160" y="${oldY}" width="80" height="${oldH}" rx="4" fill="#f43f5e" />
      <rect x="320" y="${newY}" width="80" height="${newH}" rx="4" fill="#06b6d4" />
      <text x="200" y="${oldY - 6}" textAnchor="middle" fontSize="12" fill="#1e293b" fontWeight="600">${fmtN(data.oldKwh)} kWh</text>
      <text x="360" y="${newY - 6}" textAnchor="middle" fontSize="12" fill="#1e293b" fontWeight="600">${fmtN(data.newKwh)} kWh</text>
      <text x="200" y="222" textAnchor="middle" fontSize="13" fill="#64748b">旧型（${data.roomSize}）</text>
      <text x="360" y="222" textAnchor="middle" fontSize="13" fill="#64748b">新型（${data.roomSize}）</text>
      <text x="35" y="204" textAnchor="end" fontSize="10" fill="#94a3b8">0</text>
    </svg>
    <div style={{ display: 'flex', gap: '16px' }}>
      <div style={{ flex: 1, background: '#fff', borderRadius: '12px', padding: '16px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>旧型年間電力量</div>
        <div style={{ fontSize: '20px', fontWeight: 700, color: '#f43f5e' }}>${fmtN(data.oldKwh)} kWh</div>
      </div>
      <div style={{ flex: 1, background: '#fff', borderRadius: '12px', padding: '16px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>新型年間電力量</div>
        <div style={{ fontSize: '20px', fontWeight: 700, color: '#06b6d4' }}>${fmtN(data.newKwh)} kWh</div>
      </div>
      <div style={{ flex: 1, background: '#fff', borderRadius: '12px', padding: '16px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>年間節約額</div>
        <div style={{ fontSize: '20px', fontWeight: 700, color: '#10b981' }}>${fmtN(data.savingsYen)}円</div>
      </div>
    </div>
  </div>
);`;
}

export function buildBarChartSvgXml(data: BarChartData): string {
  const maxVal = Math.ceil(data.oldKwh * 1.1 / 100) * 100;
  const chartH = 160;
  const baseline = 220;

  const oldH = Math.round((data.oldKwh / maxVal) * chartH);
  const newH = Math.round((data.newKwh / maxVal) * chartH);
  const oldY = baseline - oldH;
  const newY = baseline - newH;

  const step = maxVal / 4;
  const grids = [1, 2, 3, 4].map(i => ({
    val: Math.round(step * i),
    y: Math.round(baseline - (step * i / maxVal) * chartH),
  }));

  const gridLines = grids.map(g =>
    `<line x1="40" y1="${g.y}" x2="520" y2="${g.y}" stroke="#e2e8f0" stroke-width="1"/>` +
    `<text x="35" y="${g.y + 4}" text-anchor="end" font-size="10" fill="#94a3b8" font-family="system-ui,sans-serif">${g.val}</text>`
  ).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 260" width="560" height="260">` +
    `<rect width="560" height="260" fill="#f8fafc"/>` +
    `<text x="280" y="22" text-anchor="middle" font-size="14" font-weight="700" fill="#1e293b" font-family="system-ui,sans-serif">年間消費電力量比較（${data.roomSize}）</text>` +
    gridLines +
    `<line x1="40" y1="${baseline}" x2="520" y2="${baseline}" stroke="#94a3b8" stroke-width="1.5"/>` +
    `<rect x="160" y="${oldY}" width="80" height="${oldH}" rx="4" fill="#f43f5e"/>` +
    `<rect x="320" y="${newY}" width="80" height="${newH}" rx="4" fill="#06b6d4"/>` +
    `<text x="200" y="${oldY - 6}" text-anchor="middle" font-size="12" fill="#1e293b" font-weight="600" font-family="system-ui,sans-serif">${fmtN(data.oldKwh)} kWh</text>` +
    `<text x="360" y="${newY - 6}" text-anchor="middle" font-size="12" fill="#1e293b" font-weight="600" font-family="system-ui,sans-serif">${fmtN(data.newKwh)} kWh</text>` +
    `<text x="200" y="${baseline + 18}" text-anchor="middle" font-size="13" fill="#64748b" font-family="system-ui,sans-serif">旧型（${data.roomSize}）</text>` +
    `<text x="360" y="${baseline + 18}" text-anchor="middle" font-size="13" fill="#64748b" font-family="system-ui,sans-serif">新型（${data.roomSize}）</text>` +
    `<text x="35" y="${baseline + 4}" text-anchor="end" font-size="10" fill="#94a3b8" font-family="system-ui,sans-serif">0</text>` +
    `<text x="140" y="252" text-anchor="middle" font-size="11" fill="#10b981" font-weight="600" font-family="system-ui,sans-serif">節約: ${fmtN(data.savingsYen)}円/年</text>` +
    `</svg>`;
}

export function buildLineChartSvgXml(data: LineChartData): string {
  const padL = 40, padR = 20, padT = 55, padB = 30;
  const svgW = 560, svgH = 260;
  const usableW = svgW - padL - padR;
  const chartH = svgH - padT - padB;
  const baseline = padT + chartH;

  const maxV = Math.ceil(Math.max(...data.oldMonthly, ...data.newMonthly) * 1.1 / 10) * 10;
  const xStep = usableW / (data.oldMonthly.length - 1);

  const calcPts = (arr: number[]) =>
    arr.map((v, i) => ({
      x: Math.round(padL + i * xStep),
      y: Math.round(baseline - (v / maxV) * chartH),
    }));

  const oldPts = calcPts(data.oldMonthly);
  const newPts = calcPts(data.newMonthly);

  const ptsStr = (pts: { x: number; y: number }[]) => pts.map(p => `${p.x},${p.y}`).join(' ');
  const fillPts = [...oldPts, ...[...newPts].reverse()].map(p => `${p.x},${p.y}`).join(' ');

  const gridStepV = maxV / 5;
  const grids = [1, 2, 3, 4, 5].map(i => ({
    val: Math.round(gridStepV * i),
    y: Math.round(baseline - (gridStepV * i / maxV) * chartH),
  }));

  const gridLines = grids.map(g =>
    `<line x1="${padL}" y1="${g.y}" x2="${svgW - padR}" y2="${g.y}" stroke="#e2e8f0" stroke-width="1"/>` +
    `<text x="${padL - 5}" y="${g.y + 4}" text-anchor="end" font-size="10" fill="#94a3b8" font-family="system-ui,sans-serif">${g.val}</text>`
  ).join('');

  const months = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
  const monthLabels = oldPts.map((pt, i) =>
    `<text x="${pt.x}" y="${svgH - 4}" text-anchor="middle" font-size="9" fill="#94a3b8" font-family="system-ui,sans-serif">${months[i]}</text>`
  ).join('');

  const oldCircles = oldPts.map(pt => `<circle cx="${pt.x}" cy="${pt.y}" r="3.5" fill="#f43f5e"/>`).join('');
  const newCircles = newPts.map(pt => `<circle cx="${pt.x}" cy="${pt.y}" r="3.5" fill="#06b6d4"/>`).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgW} ${svgH}" width="${svgW}" height="${svgH}">` +
    `<rect width="${svgW}" height="${svgH}" fill="#f8fafc"/>` +
    `<text x="280" y="20" text-anchor="middle" font-size="14" font-weight="700" fill="#1e293b" font-family="system-ui,sans-serif">月別消費電力量比較（${data.roomSize}）</text>` +
    `<circle cx="168" cy="36" r="5" fill="#f43f5e"/>` +
    `<text x="176" y="40" font-size="11" fill="#f43f5e" font-family="system-ui,sans-serif">旧型</text>` +
    `<circle cx="218" cy="36" r="5" fill="#06b6d4"/>` +
    `<text x="226" y="40" font-size="11" fill="#06b6d4" font-family="system-ui,sans-serif">新型</text>` +
    gridLines +
    monthLabels +
    `<polygon points="${fillPts}" fill="rgba(16,185,129,0.12)"/>` +
    `<polyline points="${ptsStr(oldPts)}" fill="none" stroke="#f43f5e" stroke-width="2.5" stroke-linejoin="round"/>` +
    `<polyline points="${ptsStr(newPts)}" fill="none" stroke="#06b6d4" stroke-width="2.5" stroke-linejoin="round"/>` +
    oldCircles +
    newCircles +
    `</svg>`;
}

export function buildLineChart(data: LineChartData): string {
  const padL = 40, padR = 20, padT = 20, padB = 30;
  const svgW = 560, svgH = 240;
  const usableW = svgW - padL - padR;
  const chartH = svgH - padT - padB;
  const baseline = padT + chartH;

  const maxV = Math.ceil(Math.max(...data.oldMonthly, ...data.newMonthly) * 1.1 / 10) * 10;
  const xStep = usableW / (data.oldMonthly.length - 1);

  const calcPts = (arr: number[]) =>
    arr.map((v, i) => ({
      x: Math.round(padL + i * xStep),
      y: Math.round(baseline - (v / maxV) * chartH),
    }));

  const oldPts = calcPts(data.oldMonthly);
  const newPts = calcPts(data.newMonthly);

  const ptsStr = (pts: { x: number; y: number }[]) => pts.map(p => `${p.x},${p.y}`).join(' ');
  const oldPtsStr = ptsStr(oldPts);
  const newPtsStr = ptsStr(newPts);
  const fillPtsStr = ptsStr([...oldPts, ...[...newPts].reverse()]);

  const gridStepV = maxV / 5;
  const grids = [1, 2, 3, 4, 5].map(i => ({
    val: Math.round(gridStepV * i),
    y: Math.round(baseline - (gridStepV * i / maxV) * chartH),
  }));

  const gridLinesStr = grids.map(g =>
    `      <line x1="${padL}" y1="${g.y}" x2="${svgW - padR}" y2="${g.y}" stroke="#e2e8f0" strokeWidth="1" />\n` +
    `      <text x="${padL - 5}" y="${g.y + 4}" textAnchor="end" fontSize="10" fill="#94a3b8">${g.val}</text>`
  ).join('\n');

  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const monthLabelsStr = oldPts.map((pt, i) =>
    `      <text x="${pt.x}" y="${svgH - 4}" textAnchor="middle" fontSize="9" fill="#94a3b8">${months[i]}</text>`
  ).join('\n');

  const oldCirclesStr = oldPts.map(pt =>
    `      <circle cx="${pt.x}" cy="${pt.y}" r="3.5" fill="#f43f5e" />`
  ).join('\n');

  const newCirclesStr = newPts.map(pt =>
    `      <circle cx="${pt.x}" cy="${pt.y}" r="3.5" fill="#06b6d4" />`
  ).join('\n');

  return `const App = () => (
  <div style={{ fontFamily: 'system-ui, sans-serif', padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>
    <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', color: '#1e293b', textAlign: 'center' }}>
      月別消費電力量比較（${data.roomSize}）
    </h2>
    <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', justifyContent: 'center', fontSize: '12px' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f43f5e' }}>
        <span style={{ display: 'inline-block', width: '24px', height: '3px', background: '#f43f5e', borderRadius: '2px' }}></span>旧型
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#06b6d4' }}>
        <span style={{ display: 'inline-block', width: '24px', height: '3px', background: '#06b6d4', borderRadius: '2px' }}></span>新型
      </span>
    </div>
    <svg viewBox="0 0 ${svgW} ${svgH}" style={{ width: '100%', display: 'block', marginBottom: '20px' }}>
${gridLinesStr}
${monthLabelsStr}
      <polygon points="${fillPtsStr}" fill="rgba(16,185,129,0.12)" />
      <polyline points="${oldPtsStr}" fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinejoin="round" />
      <polyline points="${newPtsStr}" fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinejoin="round" />
${oldCirclesStr}
${newCirclesStr}
    </svg>
    <div style={{ display: 'flex', gap: '16px' }}>
      <div style={{ flex: 1, background: '#fff', borderRadius: '12px', padding: '16px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>旧型年間電力量</div>
        <div style={{ fontSize: '20px', fontWeight: 700, color: '#f43f5e' }}>${fmtN(data.oldKwh)} kWh</div>
      </div>
      <div style={{ flex: 1, background: '#fff', borderRadius: '12px', padding: '16px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>新型年間電力量</div>
        <div style={{ fontSize: '20px', fontWeight: 700, color: '#06b6d4' }}>${fmtN(data.newKwh)} kWh</div>
      </div>
      <div style={{ flex: 1, background: '#fff', borderRadius: '12px', padding: '16px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>年間節約額</div>
        <div style={{ fontSize: '20px', fontWeight: 700, color: '#10b981' }}>${fmtN(data.savingsYen)}円</div>
      </div>
    </div>
  </div>
);`;
}
