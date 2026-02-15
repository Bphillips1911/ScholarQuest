function esc(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function svgWrap(inner, w = 520, h = 130) {
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect x="0" y="0" width="${w}" height="${h}" rx="10" fill="#ffffff" stroke="#CBD5E1" />
    ${inner}
  </svg>`;
}

function svgTitle(title) {
  return `<text x="16" y="26" font-family="Inter, Arial" font-size="14" font-weight="600" fill="#0F172A">${esc(title)}</text>`;
}

function svgNote(note) {
  return `<text x="16" y="48" font-family="Inter, Arial" font-size="11" fill="#334155">${esc(note)}</text>`;
}

function renderTable({ title = "Table", columns = [], rows = [] } = {}) {
  const w = 520, h = Math.max(130, 60 + (rows.length + 1) * 22);
  const x0 = 16, y0 = 58;
  const tableW = w - 32;
  const colCount = Math.max(1, columns.length);
  const colW = tableW / colCount;
  let inner = svgTitle(title);
  inner += `<rect x="${x0}" y="${y0}" width="${tableW}" height="22" fill="#F1F5F9" stroke="#CBD5E1" />`;
  columns.forEach((c, i) => {
    const x = x0 + i * colW;
    inner += `<line x1="${x}" y1="${y0}" x2="${x}" y2="${y0 + 22 + rows.length * 22}" stroke="#CBD5E1" />`;
    inner += `<text x="${x + 8}" y="${y0 + 15}" font-family="Inter, Arial" font-size="11" font-weight="600" fill="#0F172A">${esc(c)}</text>`;
  });
  inner += `<line x1="${x0 + tableW}" y1="${y0}" x2="${x0 + tableW}" y2="${y0 + 22 + rows.length * 22}" stroke="#CBD5E1" />`;
  rows.forEach((r, idx) => {
    const y = y0 + 22 + idx * 22;
    inner += `<rect x="${x0}" y="${y}" width="${tableW}" height="22" fill="#ffffff" stroke="#CBD5E1" />`;
    r.forEach((cell, i) => {
      const x = x0 + i * colW;
      inner += `<text x="${x + 8}" y="${y + 15}" font-family="Inter, Arial" font-size="11" fill="#0F172A">${esc(cell)}</text>`;
    });
  });
  return svgWrap(inner, w, h);
}

function renderBarChart({ title = "Bar Chart", labels = [], values = [] } = {}) {
  const w = 520, h = 170;
  const chartX = 46, chartY = 52, chartW = 450, chartH = 96;
  const maxV = Math.max(1, ...values.map(v => Number(v) || 0));
  const barCount = Math.max(1, labels.length);
  const gap = 12;
  const barW = (chartW - gap * (barCount - 1)) / barCount;
  let inner = svgTitle(title);
  inner += `<line x1="${chartX}" y1="${chartY}" x2="${chartX}" y2="${chartY + chartH}" stroke="#94A3B8" />`;
  inner += `<line x1="${chartX}" y1="${chartY + chartH}" x2="${chartX + chartW}" y2="${chartY + chartH}" stroke="#94A3B8" />`;
  labels.forEach((lab, i) => {
    const v = Number(values[i]) || 0;
    const bh = (v / maxV) * (chartH - 10);
    const x = chartX + i * (barW + gap);
    const y = chartY + chartH - bh;
    inner += `<rect x="${x}" y="${y}" width="${barW}" height="${bh}" rx="6" fill="#2563EB" opacity="0.85" />`;
    inner += `<text x="${x + barW / 2}" y="${chartY + chartH + 16}" text-anchor="middle" font-family="Inter, Arial" font-size="11" fill="#0F172A">${esc(lab)}</text>`;
  });
  return svgWrap(inner, w, h);
}

function renderNumberLine({ title = "Number Line", min = -3, max = 3, points = [] } = {}) {
  const w = 520, h = 140;
  const x0 = 46, x1 = 486, y = 82;
  const span = max - min || 1;
  let inner = svgTitle(title);
  inner += `<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="#0F172A" stroke-width="2" />`;
  for (let n = min; n <= max; n++) {
    const x = x0 + ((n - min) / span) * (x1 - x0);
    inner += `<line x1="${x}" y1="${y - 8}" x2="${x}" y2="${y + 8}" stroke="#0F172A" />`;
    inner += `<text x="${x}" y="${y + 26}" text-anchor="middle" font-family="Inter, Arial" font-size="11" fill="#0F172A">${n}</text>`;
  }
  points.forEach(p => {
    const val = Number(p.value);
    if (Number.isNaN(val)) return;
    const x = x0 + ((val - min) / span) * (x1 - x0);
    inner += `<circle cx="${x}" cy="${y}" r="5" fill="#DC2626" />`;
    inner += `<text x="${x}" y="${y - 12}" text-anchor="middle" font-family="Inter, Arial" font-size="11" font-weight="600" fill="#DC2626">${esc(p.label || "")}</text>`;
  });
  return svgWrap(inner, w, h);
}

function renderCoordinatePlane({ title = "Coordinate Plane", points = [] } = {}) {
  const w = 520, h = 180;
  const cx = 260, cy = 98;
  let inner = svgTitle(title);
  inner += `<line x1="60" y1="${cy}" x2="460" y2="${cy}" stroke="#94A3B8" />`;
  inner += `<line x1="${cx}" y1="52" x2="${cx}" y2="160" stroke="#94A3B8" />`;
  for (let i = 0; i < 9; i++) {
    const x = 60 + i * 50;
    inner += `<line x1="${x}" y1="52" x2="${x}" y2="160" stroke="#E2E8F0" />`;
  }
  for (let i = 0; i < 3; i++) {
    const y = 52 + i * 54;
    inner += `<line x1="60" y1="${y}" x2="460" y2="${y}" stroke="#E2E8F0" />`;
  }
  points.forEach(p => {
    const xVal = Number(p.x);
    const yVal = Number(p.y);
    if (Number.isNaN(xVal) || Number.isNaN(yVal)) return;
    const x = cx + (xVal * 50);
    const y = cy - (yVal * 27);
    inner += `<circle cx="${x}" cy="${y}" r="5" fill="#2563EB" />`;
    inner += `<text x="${x + 8}" y="${y - 8}" font-family="Inter, Arial" font-size="11" fill="#0F172A">(${xVal}, ${yVal})</text>`;
  });
  return svgWrap(inner, w, h);
}

function renderGenericVisualCard({ title = "Visual", description = "" } = {}) {
  const inner = [svgTitle(title), svgNote(description || "Visual generated for this item.")].join("");
  return svgWrap(inner, 520, 110);
}

function buildVisualSVG(item = {}) {
  const v = item.visual || null;
  if (v && v.type) {
    const t = String(v.type).toLowerCase();
    if (t === "table") return renderTable(v);
    if (t === "bar_chart" || t === "bargraph") return renderBarChart(v);
    if (t === "number_line" || t === "numberline") return renderNumberLine(v);
    if (t === "coordinate_plane" || t === "coordinateplane") return renderCoordinatePlane(v);
    return renderGenericVisualCard({ title: "Visual", description: v.title || "Visual provided." });
  }
  const desc = item.visualDescription || item.visualText || item.diagramDescription || "";
  if (desc) return renderGenericVisualCard({ title: "Visual", description: desc.slice(0, 140) + (desc.length > 140 ? "..." : "") });
  return null;
}

module.exports = { buildVisualSVG };
