import PDFDocument from "pdfkit";
import * as fs from "fs";
import * as path from "path";

const BRAND_BLUE = "#3B5BDB";
const BRAND_LIGHT = "#E8EDFF";
const BRAND_DARK = "#1E3A8A";

function getLogoPath(): string | null {
  const candidates = [
    path.join(process.cwd(), "client/public/branding/educap-logo.png"),
    path.join(process.cwd(), "attached_assets/EduCAP_Logo_1770605575063.png"),
    path.join(process.cwd(), "attached_assets/EduCAP_Logo_1770600608817.png"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

export async function renderWorksheetPdf(opts: {
  title: string;
  subject: string;
  grade: number;
  standardCode: string;
  dokLevel: number;
  items: Array<{
    stem: string;
    passage?: string;
    diagramDescription?: string;
    options: Record<string, string>;
    correctAnswer: string;
    rationale?: string;
    type?: string;
    sampleAnswer?: string;
    rubric?: string;
    linesProvided?: number;
    passageReference?: string;
    visual?: any;
    correctAnswers?: string[];
  }>;
  includeAnswerKey: boolean;
}): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 48, size: "LETTER" });
  const chunks: Buffer[] = [];
  doc.on("data", (d: Buffer) => chunks.push(d));
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  const logoPath = getLogoPath();
  const pageWidth = doc.page.width;
  const marginLeft = 48;
  const marginRight = 48;
  const contentWidth = pageWidth - marginLeft - marginRight;

  doc.rect(0, 0, pageWidth, 80).fill(BRAND_BLUE);

  let headerTextX = marginLeft;
  if (logoPath) {
    try {
      doc.image(logoPath, marginLeft, 10, { height: 60, fit: [60, 60] });
      headerTextX = marginLeft + 70;
    } catch (e) {
      console.warn("[PDF] Could not embed logo:", e);
    }
  }

  doc.fillColor("#FFFFFF").fontSize(20).font("Helvetica-Bold")
    .text("EduCAP\u2122 Worksheet", headerTextX, 18, { width: contentWidth - 70 });
  doc.fontSize(10).font("Helvetica")
    .text("Alabama Comprehensive Assessment Program", headerTextX, 42, { width: contentWidth - 70 });

  doc.fillColor("#FFFFFF").fontSize(8).font("Helvetica")
    .text("Bush Hills STEAM Academy", pageWidth - marginRight - 160, 18, { width: 160, align: "right" });
  doc.text("Full STEAM Ahead", pageWidth - marginRight - 160, 30, { width: 160, align: "right" });

  doc.y = 90;
  doc.fillColor("#000");

  doc.rect(marginLeft, doc.y, contentWidth, 40).fill(BRAND_LIGHT);
  doc.fillColor(BRAND_DARK).fontSize(12).font("Helvetica-Bold")
    .text(opts.title, marginLeft + 10, doc.y + 5, { width: contentWidth - 20 });
  doc.fontSize(9).font("Helvetica").fillColor("#444")
    .text(`Subject: ${opts.subject}   |   Grade: ${opts.grade}   |   DOK Level: ${opts.dokLevel}   |   Standard: ${opts.standardCode}`, marginLeft + 10, doc.y + 22, { width: contentWidth - 20 });

  doc.y += 48;
  doc.fillColor("#000");

  doc.moveTo(marginLeft, doc.y).lineTo(pageWidth - marginRight, doc.y).lineWidth(0.5).stroke(BRAND_BLUE);
  doc.moveDown(0.4);

  doc.fontSize(10).fillColor("#555").font("Helvetica")
    .text("Name: ___________________________   Date: ______________   Period: ________");
  doc.moveDown(0.8);
  doc.fillColor("#000");

  const passageText = getSharedPassage(opts.items);
  if (passageText) {
    if (doc.y > doc.page.height - 250) doc.addPage();

    doc.rect(marginLeft, doc.y, contentWidth, 18).fill(BRAND_BLUE);
    doc.fillColor("#FFF").fontSize(10).font("Helvetica-Bold")
      .text("  \u{1F4D6}  Reading Passage", marginLeft + 6, doc.y + 3);
    doc.y += 22;
    doc.fillColor("#000");

    doc.rect(marginLeft, doc.y, contentWidth, 0).fill("#F8F9FA");
    const passageStartY = doc.y;
    doc.fontSize(10).font("Helvetica").fillColor("#333")
      .text(passageText, marginLeft + 10, doc.y + 4, {
        width: contentWidth - 20,
        lineGap: 3,
      });
    const passageEndY = doc.y + 8;
    doc.rect(marginLeft, passageStartY, contentWidth, passageEndY - passageStartY)
      .lineWidth(1).stroke("#D0D5DD");
    doc.y = passageEndY + 8;
    doc.fillColor("#000");
  }

  opts.items.forEach((it, idx) => {
    const itemType = it.type || "multiple_choice";
    const needsSpace = itemType === "text_dependent_writing" ? 300 :
                       itemType === "short_response" ? 200 :
                       (it.diagramDescription ? 200 : 120);
    if (doc.y > doc.page.height - needsSpace) {
      doc.addPage();
    }

    if (it.diagramDescription) {
      doc.rect(marginLeft + 20, doc.y, contentWidth - 40, 0);
      const diagStartY = doc.y;
      doc.fontSize(9).font("Helvetica-Bold").fillColor(BRAND_DARK)
        .text(`[Visual Element for Question ${idx + 1}]`, marginLeft + 26, doc.y + 4);
      doc.fontSize(9).font("Helvetica").fillColor("#555")
        .text(it.diagramDescription, marginLeft + 26, doc.y + 4, { width: contentWidth - 60, lineGap: 2 });
      const diagEndY = doc.y + 6;
      doc.rect(marginLeft + 20, diagStartY, contentWidth - 40, diagEndY - diagStartY)
        .lineWidth(0.5).dash(3, { space: 3 }).stroke("#888");
      doc.undash();
      doc.y = diagEndY + 6;
      doc.fillColor("#000");
    }

    if (itemType === "text_dependent_writing") {
      if (doc.y > doc.page.height - 300) doc.addPage();

      doc.rect(marginLeft, doc.y, contentWidth, 22).fill("#4338CA");
      doc.fillColor("#FFF").fontSize(11).font("Helvetica-Bold")
        .text(`  \u270D  Text-Dependent Writing — Question ${idx + 1}`, marginLeft + 6, doc.y + 4);
      doc.y += 26;
      doc.fillColor("#000");

      doc.fontSize(11).font("Helvetica-Bold").fillColor(BRAND_DARK)
        .text(`${idx + 1}.`, marginLeft, doc.y, { continued: true });
      doc.fillColor("#000").text(` ${it.stem}`);
      doc.moveDown(0.3);

      const lines = it.linesProvided || 20;
      for (let i = 0; i < lines; i++) {
        if (doc.y > doc.page.height - 40) doc.addPage();
        doc.moveTo(marginLeft + 10, doc.y)
          .lineTo(pageWidth - marginRight - 10, doc.y)
          .lineWidth(0.3).stroke("#D1D5DB");
        doc.y += 18;
      }
      doc.moveDown(0.5);
    } else if (itemType === "short_response") {
      doc.fontSize(11).font("Helvetica-Bold").fillColor(BRAND_DARK)
        .text(`${idx + 1}.`, marginLeft, doc.y, { continued: true });
      doc.fillColor("#000").text(` ${it.stem}`);
      doc.font("Helvetica");
      doc.moveDown(0.3);

      const lines = it.linesProvided || 6;
      for (let i = 0; i < lines; i++) {
        if (doc.y > doc.page.height - 40) doc.addPage();
        doc.moveTo(marginLeft + 10, doc.y)
          .lineTo(pageWidth - marginRight - 10, doc.y)
          .lineWidth(0.3).stroke("#D1D5DB");
        doc.y += 18;
      }
      doc.moveDown(0.5);
    } else if (itemType === "multiple_select") {
      doc.fontSize(11).font("Helvetica-Bold").fillColor(BRAND_DARK)
        .text(`${idx + 1}.`, marginLeft, doc.y, { continued: true });
      doc.fillColor("#000").text(` ${it.stem}`);
      doc.font("Helvetica").fontSize(9).fillColor("#666")
        .text("     (Select ALL that apply)", { indent: 10 });
      doc.moveDown(0.2);
      Object.entries(it.options || {}).forEach(([k, v]) => {
        doc.fontSize(10).fillColor("#333").text(`     \u25A1  ${k})  ${v}`, { indent: 10 });
      });
      doc.moveDown(0.5);
    } else {
      doc.fontSize(11).font("Helvetica-Bold").fillColor(BRAND_DARK)
        .text(`${idx + 1}.`, marginLeft, doc.y, { continued: true });
      doc.fillColor("#000").text(` ${it.stem}`);
      doc.font("Helvetica");
      doc.moveDown(0.2);

      Object.entries(it.options || {}).forEach(([k, v]) => {
        doc.fontSize(10).fillColor("#333").text(`     ${k})  ${v}`, { indent: 10 });
      });
      doc.moveDown(0.5);
    }

    doc.moveTo(marginLeft + 20, doc.y).lineTo(pageWidth - marginRight - 20, doc.y)
      .lineWidth(0.3).stroke("#E5E7EB");
    doc.moveDown(0.3);
  });

  if (opts.includeAnswerKey) {
    doc.addPage();

    doc.rect(0, 0, pageWidth, 50).fill(BRAND_BLUE);
    doc.fillColor("#FFF").fontSize(16).font("Helvetica-Bold")
      .text("Answer Key", marginLeft, 14);
    doc.fontSize(9).font("Helvetica")
      .text(`${opts.title}  |  ${opts.standardCode}`, marginLeft, 34);

    doc.y = 60;
    doc.fillColor("#000");
    doc.moveDown(0.4);

    opts.items.forEach((it, idx) => {
      const itemType = it.type || "multiple_choice";
      if (doc.y > doc.page.height - 100) doc.addPage();

      const rowY = doc.y;
      if (idx % 2 === 0) {
        doc.rect(marginLeft, rowY - 2, contentWidth, 20).fill("#F8F9FA");
      }

      if (itemType === "text_dependent_writing" || itemType === "short_response") {
        doc.fillColor(BRAND_DARK).fontSize(11).font("Helvetica-Bold")
          .text(`${idx + 1}. [${itemType === "text_dependent_writing" ? "Text-Dependent Writing" : "Short Response"}]`, marginLeft + 6, rowY);
        doc.moveDown(0.2);

        if (it.rubric) {
          doc.fillColor("#333").fontSize(9).font("Helvetica-Bold").text("Rubric:", marginLeft + 16, doc.y);
          doc.font("Helvetica").fillColor("#555").text(it.rubric, marginLeft + 16, doc.y, { width: contentWidth - 32, lineGap: 2 });
          doc.moveDown(0.3);
        }

        if (it.sampleAnswer) {
          doc.fillColor("#333").fontSize(9).font("Helvetica-Bold").text("Sample Response:", marginLeft + 16, doc.y);
          doc.font("Helvetica").fillColor("#555").text(it.sampleAnswer, marginLeft + 16, doc.y, { width: contentWidth - 32, lineGap: 2 });
          doc.moveDown(0.3);
        }
      } else {
        doc.fillColor(BRAND_DARK).fontSize(11).font("Helvetica-Bold")
          .text(`${idx + 1}. ${it.correctAnswer}`, marginLeft + 6, rowY, { continued: true });
        doc.font("Helvetica").fillColor("#555")
          .text(`   \u2014  ${it.rationale || ""}`);
        doc.moveDown(0.2);
      }
    });
  }

  const footerY = doc.page.height - 30;
  doc.fontSize(7).fillColor("#999").font("Helvetica")
    .text("EduCAP\u2122 \u2014 Bush Hills STEAM Academy  |  Full STEAM Ahead  |  Generated by AI  |  For instructional use only", marginLeft, footerY, {
      width: contentWidth,
      align: "center",
    });

  doc.end();
  return done;
}

function getSharedPassage(items: any[]): string | null {
  for (const it of items) {
    if (it.passage) {
      return typeof it.passage === 'object' ? it.passage.text : it.passage;
    }
  }
  return null;
}
