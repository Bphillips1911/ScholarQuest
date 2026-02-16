import { Resvg } from "@resvg/resvg-js";

export function svgToPngBuffer(svg: string): Buffer {
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 900 } });
  const pngData = resvg.render();
  return pngData.asPng();
}
