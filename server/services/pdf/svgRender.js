const { Resvg } = require("@resvg/resvg-js");

function svgToPngBuffer(svg) {
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 900 } });
  const pngData = resvg.render();
  return pngData.asPng();
}

module.exports = { svgToPngBuffer };
