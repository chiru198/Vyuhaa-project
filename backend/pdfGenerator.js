import PDFDocument from "pdfkit";
import path from "path";

export const generateLBCReport = (data, stream) => {
  const doc = new PDFDocument({
    size: "A4",
    margin: { top: 30, left: 30, right: 30, bottom: 20 },
  });

  // CRITICAL: Pipe MUST happen before any text is drawn
  doc.pipe(stream);

  const blueColor = "#1565c0";
  const lightBlueBg = "#e3f2fd";
  const sectionHeaderColor = [0, 102, 102];
  const margin = 30;
  const pageWidth = 595;
  const contentWidth = pageWidth - margin * 2;

  // Generate Date once to use everywhere
  const reportDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  // --- 1. HEADER ---
  const vyuhaaLogo = path.join("assets", "vyuhaa.png");
  const cerviLogo = path.join("assets", "cerviai.png");

  try {
    doc.image(vyuhaaLogo, margin, 20, { height: 45 });
    doc.image(cerviLogo, 460, 25, { height: 32 });
  } catch (e) {
    console.log("Logos missing");
  }

  const addressBarY = 80;
  doc.rect(margin, addressBarY, contentWidth, 40).fill(lightBlueBg);
  doc.fontSize(8).fillColor("black").font("Helvetica");

  doc.text(
    "C15, First floor, BioValley Incubation Center I-Hub, AMTZ Campus, Vizag, AP 530031",
    margin,
    addressBarY + 8,
    { align: "center", width: contentWidth },
  );

  const line2Y = addressBarY + 24;
  doc.text("Phone: +91-9840582365", margin + 15, line2Y);
  doc
    .font("Helvetica-Bold")
    .text(`Report Date: ${reportDate}`, margin, line2Y, {
      align: "center",
      width: contentWidth,
    });
  doc
    .font("Helvetica")
    .text("Email: admin@vyuhaadata.com", margin, line2Y, {
      align: "right",
      width: contentWidth - 15,
    });

  doc
    .fillColor(blueColor)
    .font("Helvetica-Bold")
    .fontSize(13)
    .text("LIQUID BASED CYTOLOGY REPORT", margin, 135, { align: "center" });

  // --- 2. PATIENT INFO GRID ---
  const gridY = 160;
  doc.rect(margin, gridY, contentWidth, 75).fill(lightBlueBg);

  const drawField = (label, value, xL, xV, y) => {
    doc
      .fillColor(blueColor)
      .font("Helvetica-Bold")
      .fontSize(8.5)
      .text(label, xL, y);
    doc
      .fillColor("black")
      .font("Helvetica-Bold")
      .fontSize(8.5)
      .text(value || "N/A", xV, y);
  };

  let rY = gridY + 10;
  drawField("Patient:", data.patient_name, margin + 15, margin + 90, rY);
  drawField(
    "Age/Gender:",
    `${data.age || "--"} / ${data.gender || "--"}`,
    margin + 300,
    margin + 390,
    rY,
  );
  rY += 16;
  drawField("MR#:", data.mr_number, margin + 15, margin + 90, rY);
  drawField(
    "Hospital/Camp:",
    data.hospital_name,
    margin + 300,
    margin + 390,
    rY,
  );
  rY += 16;
  drawField("Ordered by:", data.doctor_name, margin + 15, margin + 90, rY);
  drawField("Report Date:", reportDate, margin + 300, margin + 390, rY);
  rY += 16;
  drawField(
    "Collection Date:",
    data.collection_date,
    margin + 15,
    margin + 90,
    rY,
  );
  drawField(
    "Specimen Type:",
    data.specimen_type || "LBC",
    margin + 300,
    margin + 390,
    rY,
  );

  // --- 3. BULLETED HELPER ---
  const drawBulletedSection = (title, list, yStart) => {
    doc
      .fillColor(sectionHeaderColor)
      .font("Helvetica-Bold")
      .fontSize(9.5)
      .text(title, margin + 10, yStart);
    let bulletY = yStart + 13;
    const items = Array.isArray(list) ? list : [];

    if (items.length === 0) {
      doc
        .fillColor("black")
        .font("Helvetica")
        .fontSize(8.5)
        .text("• None identified", margin + 15, bulletY);
      return bulletY + 15;
    }
    items.forEach((item) => {
      doc
        .fillColor("black")
        .font("Helvetica-Bold")
        .fontSize(8.5)
        .text("•", margin + 15, bulletY);
      doc
        .font("Helvetica")
        .fontSize(8.5)
        .text(item, margin + 25, bulletY, { width: 320, lineGap: 1 });
      bulletY += doc.heightOfString(item, { width: 320, lineGap: 1 }) + 4;
    });
    return bulletY + 8;
  };

  // --- 4. FINDINGS ---
  let currentY = 250;

  // Clinical History
  doc
    .fillColor(sectionHeaderColor)
    .font("Helvetica-Bold")
    .fontSize(9.5)
    .text("CLINICAL HISTORY", margin + 10, currentY);
  currentY += 12;
  const historyText = data.clinical_history || "Not provided.";
  doc
    .fillColor("black")
    .font("Helvetica")
    .fontSize(8.5)
    .text(historyText, margin + 15, currentY, { width: 500 });
  currentY += doc.heightOfString(historyText, { width: 500 }) + 15;

  // Adequacy
  doc
    .fillColor(sectionHeaderColor)
    .font("Helvetica-Bold")
    .fontSize(9.5)
    .text("SPECIMEN ADEQUACY", margin + 10, currentY);
  currentY += 12;
  doc
    .fillColor("black")
    .font("Helvetica")
    .fontSize(8.5)
    .text(data.specimen_adequacy || "---", margin + 15, currentY);
  currentY += 20;

  // Microscopy
  currentY = drawBulletedSection(
    "MICROSCOPIC DESCRIPTION",
    data.microscopy_list,
    currentY,
  );

  // Result
  doc
    .fillColor(sectionHeaderColor)
    .font("Helvetica-Bold")
    .fontSize(9.5)
    .text("INTERPRETATION / RESULT", margin + 10, currentY);
  currentY += 12;
  doc
    .fillColor("black")
    .font("Helvetica-Bold")
    .fontSize(9)
    .text(data.result || "---", margin + 15, currentY, { width: 330 });
  currentY += doc.heightOfString(data.result || "---", { width: 330 }) + 15;

  // Recommendations
  currentY = drawBulletedSection(
    "FOLLOW-UP RECOMMENDATION",
    data.recommendations_list,
    currentY,
  );

  // --- 5. SIDEBAR & FOOTER ---
  const sidebarY = 600;
  const sidebarX = pageWidth - margin - 170;
  doc.rect(sidebarX, sidebarY, 170, 90).fill("#f8fbff").stroke("#e3f2fd");
  doc
    .fillColor("black")
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .text("IMPORTANT NOTES", sidebarX + 5, sidebarY + 6);
  [
    "Correlate clinically.",
    "Adequacy: Min 5k cells.",
    "QA: TZ requires >10 endocervical cells.",
    "Ref: BETHESDA 3rd Ed.",
  ].forEach((n, i) => {
    doc
      .fillColor("#555555")
      .font("Helvetica")
      .fontSize(7)
      .text(`• ${n}`, sidebarX + 5, sidebarY + 18 + i * 10);
  });

  // Signature
  try {
    doc.image(path.join("assets", "sunita_sig.png"), margin + 10, 680, {
      width: 100,
    });
  } catch (e) {
    console.log("Sig missing");
  }

  // Centered Footer
  const footerY = 795;
  doc
    .moveTo(margin, footerY - 5)
    .lineTo(pageWidth - margin, footerY - 5)
    .strokeColor("#eeeeee")
    .lineWidth(0.5)
    .stroke();
  doc
    .fillColor("#777777")
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .text(
      "This report has been generated by CerviAI, Vyuhaa Med Data Private Limited, Vishakhapatnam",
      margin,
      footerY,
      { align: "center", width: contentWidth },
    );
  doc
    .font("Helvetica")
    .fontSize(6.5)
    .text(
      "ISO 13485 & ISO 15189:2012 Certified | NABL Accredited | AI-Enhanced Accuracy",
      margin,
      footerY + 10,
      { align: "center", width: contentWidth },
    );

  doc.end();
};
