function svgWrap(inner, width = 900, height = 220) {
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <rect x="0" y="0" width="100%" height="100%" fill="#ffffff"/>
    ${inner}
  </svg>`;
}

function numberLineSVG(spec = {}) {
  const min = Number(spec.min ?? -3);
  const max = Number(spec.max ?? 3);
  const points = Array.isArray(spec.points) ? spec.points : [];
  const w = 900, h = 220;
  const pad = 70;
  const y = 120;
  const scale = (w - pad * 2) / (max - min);

  const axis = `<line x1="${pad}" y1="${y}" x2="${w - pad}" y2="${y}" stroke="#111" stroke-width="3"/>`;

  const ticks = [];
  for (let v = min; v <= max; v += 1) {
    const x = pad + (v - min) * scale;
    ticks.push(`
      <line x1="${x}" y1="${y - 10}" x2="${x}" y2="${y + 10}" stroke="#111" stroke-width="2"/>
      <text x="${x}" y="${y + 38}" font-size="18" text-anchor="middle" fill="#111">${v}</text>
    `);
  }

  const plotted = points.map(p => {
    const val = Number(p.value);
    const x = pad + (val - min) * scale;
    const label = String(p.label ?? "");
    return `
      <circle cx="${x}" cy="${y}" r="8" fill="#2563eb"/>
      <text x="${x}" y="${y - 18}" font-size="18" text-anchor="middle" fill="#111">${label}</text>
    `;
  }).join("");

  return svgWrap(`
    <text x="${pad}" y="40" font-size="22" font-weight="700" fill="#111">Number Line</text>
    ${axis}
    ${ticks.join("")}
    ${plotted}
  `, w, h);
}

function barChartSVG(spec = {}) {
  const labels = Array.isArray(spec.labels) ? spec.labels : [];
  const values = Array.isArray(spec.values) ? spec.values : [];
  const title = String(spec.title ?? "Bar Chart");

  const w = 900, h = 260, pad = 80;
  const maxVal = Math.max(1, ...values.map(v => Number(v || 0)));
  const chartW = w - pad * 2;
  const chartH = 130;
  const baseY = 190;

  const bars = labels.map((lbl, i) => {
    const v = Number(values[i] || 0);
    const bw = chartW / Math.max(1, labels.length) - 20;
    const x = pad + i * (chartW / Math.max(1, labels.length)) + 10;
    const bh = (v / maxVal) * chartH;
    const y = baseY - bh;

    return `
      <rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="10" fill="#2563eb"/>
      <text x="${x + bw/2}" y="${baseY + 26}" font-size="16" text-anchor="middle" fill="#111">${String(lbl)}</text>
    `;
  }).join("");

  return svgWrap(`
    <text x="${pad}" y="40" font-size="22" font-weight="700" fill="#111">${title}</text>
    <line x1="${pad}" y1="${baseY}" x2="${w-pad}" y2="${baseY}" stroke="#111" stroke-width="3"/>
    <line x1="${pad}" y1="${baseY-chartH}" x2="${pad}" y2="${baseY}" stroke="#111" stroke-width="3"/>
    ${bars}
  `, w, h);
}

function tableSVG(spec = {}) {
  const title = String(spec.title ?? "Data Table");
  const columns = Array.isArray(spec.columns) ? spec.columns : [];
  const rows = Array.isArray(spec.rows) ? spec.rows : [];
  const w = 900;
  const pad = 40;
  const colW = columns.length > 0 ? (w - pad * 2) / columns.length : 200;
  const rowH = 32;
  const headerY = 60;
  const tableH = headerY + rowH * (rows.length + 1) + 20;

  const headerCells = columns.map((col, i) => {
    const x = pad + i * colW;
    return `
      <rect x="${x}" y="${headerY}" width="${colW}" height="${rowH}" fill="#3B5BDB" stroke="#1E3A8A" stroke-width="1"/>
      <text x="${x + colW/2}" y="${headerY + 22}" font-size="16" font-weight="700" text-anchor="middle" fill="#fff">${String(col)}</text>
    `;
  }).join("");

  const dataCells = rows.map((row, ri) => {
    const cells = Array.isArray(row) ? row : [];
    return cells.map((val, ci) => {
      const x = pad + ci * colW;
      const y = headerY + rowH * (ri + 1);
      const bg = ri % 2 === 0 ? "#f8f9fa" : "#ffffff";
      return `
        <rect x="${x}" y="${y}" width="${colW}" height="${rowH}" fill="${bg}" stroke="#dee2e6" stroke-width="1"/>
        <text x="${x + colW/2}" y="${y + 22}" font-size="15" text-anchor="middle" fill="#111">${String(val)}</text>
      `;
    }).join("");
  }).join("");

  return svgWrap(`
    <text x="${pad}" y="40" font-size="22" font-weight="700" fill="#111">${title}</text>
    ${headerCells}
    ${dataCells}
  `, w, tableH);
}

function coordinatePlaneSVG(spec = {}) {
  const points = Array.isArray(spec.points) ? spec.points : [];
  const title = String(spec.title ?? "Coordinate Plane");
  const w = 900, h = 400;
  const pad = 80;
  const cx = w / 2;
  const cy = h / 2 + 20;
  const gridSize = 140;
  const unit = gridSize / 5;

  let grid = "";
  for (let i = -5; i <= 5; i++) {
    const gx = cx + i * unit;
    const gy = cy - i * unit;
    grid += `<line x1="${gx}" y1="${cy - gridSize}" x2="${gx}" y2="${cy + gridSize}" stroke="#e5e7eb" stroke-width="1"/>`;
    grid += `<line x1="${cx - gridSize}" y1="${gy}" x2="${cx + gridSize}" y2="${gy}" stroke="#e5e7eb" stroke-width="1"/>`;
    if (i !== 0) {
      grid += `<text x="${gx}" y="${cy + gridSize + 20}" font-size="13" text-anchor="middle" fill="#555">${i}</text>`;
      grid += `<text x="${cx - gridSize - 15}" y="${gy + 5}" font-size="13" text-anchor="middle" fill="#555">${i}</text>`;
    }
  }

  const axes = `
    <line x1="${cx - gridSize}" y1="${cy}" x2="${cx + gridSize}" y2="${cy}" stroke="#111" stroke-width="2"/>
    <line x1="${cx}" y1="${cy - gridSize}" x2="${cx}" y2="${cy + gridSize}" stroke="#111" stroke-width="2"/>
    <text x="${cx + gridSize + 10}" y="${cy + 5}" font-size="16" fill="#111">x</text>
    <text x="${cx + 5}" y="${cy - gridSize - 10}" font-size="16" fill="#111">y</text>
  `;

  const plotted = points.map(p => {
    const px = cx + Number(p.x) * unit;
    const py = cy - Number(p.y) * unit;
    const label = p.label ? `<text x="${px + 10}" y="${py - 10}" font-size="14" fill="#111">${String(p.label)}</text>` : "";
    return `
      <circle cx="${px}" cy="${py}" r="6" fill="#dc2626"/>
      ${label}
    `;
  }).join("");

  return svgWrap(`
    <text x="${pad}" y="30" font-size="22" font-weight="700" fill="#111">${title}</text>
    ${grid}
    ${axes}
    ${plotted}
  `, w, h);
}

module.exports = { numberLineSVG, barChartSVG, tableSVG, coordinatePlaneSVG };
