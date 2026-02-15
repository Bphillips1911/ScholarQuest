import PDFDocument from "pdfkit";

export async function renderWorksheetPdf(opts: {
  title: string;
  subject: string;
  grade: number;
  standardCode: string;
  dokLevel: number;
  items: Array<{ stem: string; options: Record<string, string>; correctAnswer: string; rationale?: string }>;
  includeAnswerKey: boolean;
}): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 48 });
  const chunks: Buffer[] = [];
  doc.on("data", (d: Buffer) => chunks.push(d));
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  doc.fontSize(18).text("EduCAP\u2122 Worksheet", { align: "left" });
  doc.moveDown(0.2);
  doc.fontSize(12).fillColor("#444").text(opts.title);
  doc.fillColor("#000");
  doc.moveDown(0.5);
  doc.fontSize(10).text(`Subject: ${opts.subject}   Grade: ${opts.grade}   DOK: ${opts.dokLevel}`);
  doc.fontSize(10).text(`Standard: ${opts.standardCode}`);
  doc.moveDown(0.3);

  doc.moveTo(48, doc.y).lineTo(doc.page.width - 48, doc.y).stroke("#ccc");
  doc.moveDown(0.5);

  doc.fontSize(10).fillColor("#666").text("Name: ________________________   Date: ____________   Period: ______");
  doc.moveDown(0.8);
  doc.fillColor("#000");

  opts.items.forEach((it, idx) => {
    if (doc.y > doc.page.height - 120) {
      doc.addPage();
    }
    doc.fontSize(11).font("Helvetica-Bold").text(`${idx + 1}. ${it.stem}`);
    doc.font("Helvetica");
    doc.moveDown(0.25);
    Object.entries(it.options || {}).forEach(([k, v]) => {
      doc.fontSize(10).text(`   ${k}) ${v}`);
    });
    doc.moveDown(0.6);
  });

  if (opts.includeAnswerKey) {
    doc.addPage();
    doc.fontSize(16).font("Helvetica-Bold").text("Answer Key");
    doc.font("Helvetica");
    doc.moveDown(0.6);
    opts.items.forEach((it, idx) => {
      if (doc.y > doc.page.height - 80) {
        doc.addPage();
      }
      doc.fontSize(11).font("Helvetica-Bold").text(`${idx + 1}. ${it.correctAnswer}`, { continued: true });
      doc.font("Helvetica").text(`  \u2014  ${it.rationale || ""}`);
      doc.moveDown(0.3);
    });
  }

  doc.end();
  return done;
}
