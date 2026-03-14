import PDFDocument from "pdfkit";
import path from "path";

export const generateLBCReport = (data, stream) => {
  // Reduced bottom margin to squeeze more content in
  const doc = new PDFDocument({
    size: "A4",
    margin: { top: 30, left: 30, right: 30, bottom: 20 },
  });
  doc.pipe(stream);

  const blueColor = "#1565c0";
  const lightBlueBg = "#e3f2fd";
  const sectionHeaderColor = [0, 102, 102];
  const margin = 30;
  const pageWidth = 595;
  const contentWidth = pageWidth - margin * 2;

  // --- 1. HEADER (Tightened) ---
  const vyuhaaLogo = path.join("assets", "vyuhaa.png");
  const cerviLogo = path.join("assets", "cerviai.png");
  doc.image(vyuhaaLogo, margin, 25, { height: 40 });
  doc.image(cerviLogo, 475, 30, { height: 29 });

  const addressBarY = 80; // Moved up
  doc.rect(margin, addressBarY, contentWidth, 35).fill(lightBlueBg);
  doc.fontSize(8).fillColor("black").font("Helvetica");
  doc.text(
    "C15, First floor, BioValley Incubation Center I-Hub, AMTZ Campus, Vizag, AP 530031",
    margin,
    addressBarY + 8,
    { align: "center", width: contentWidth },
  );
  doc.text(
    "Phone: +91-9840582365   |   Email: admin@vyuhaadata.com",
    margin,
    addressBarY + 20,
    { align: "center", width: contentWidth },
  );

  doc
    .fillColor(blueColor)
    .font("Helvetica-Bold")
    .fontSize(13)
    .text("LIQUID BASED CYTOLOGY REPORT", margin, 130, { align: "center" });

  // --- 2. PATIENT INFO (Compact) ---
  const gridY = 155;
  doc.rect(margin, gridY, contentWidth, 70).fill(lightBlueBg);

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

  let rY = gridY + 8;
  drawField("Patient:", data.patient_name, margin + 15, margin + 90, rY);
  drawField(
    "Age/Gender:",
    `${data.age || "--"} / ${data.gender || "--"}`,
    margin + 300,
    margin + 390,
    rY,
  );
  rY += 15;
  drawField("MR#:", data.mr_number, margin + 15, margin + 90, rY);
  drawField(
    "Hospital/Camp:",
    data.hospital_name,
    margin + 300,
    margin + 390,
    rY,
  );
  rY += 15;
  drawField("Ordered by:", data.doctor_name, margin + 15, margin + 90, rY);
  drawField(
    "Collection Date:",
    data.collection_date,
    margin + 300,
    margin + 390,
    rY,
  );

  // --- 3. BULLETED SECTION HELPER (Reduced Line Gaps) ---
  const drawBulletedSection = (title, list, yStart) => {
    doc
      .fillColor(sectionHeaderColor)
      .font("Helvetica-Bold")
      .fontSize(9.5)
      .text(title, margin + 10, yStart);
    let bulletY = yStart + 13;
    if (!list || list.length === 0) {
      doc
        .fillColor("black")
        .font("Helvetica")
        .fontSize(8.5)
        .text("• None identified", margin + 15, bulletY);
      return bulletY + 15;
    }
    list.forEach((item) => {
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
  let currentY = 240;

  doc
    .fillColor(sectionHeaderColor)
    .font("Helvetica-Bold")
    .fontSize(9.5)
    .text("CLINICAL HISTORY", margin + 10, currentY);
  currentY += 12;
  doc
    .fillColor("black")
    .font("Helvetica")
    .fontSize(8.5)
    .text(data.clinical_history || "Not provided.", margin + 15, currentY, {
      width: 500,
    });
  currentY +=
    doc.heightOfString(data.clinical_history || "Not provided.", {
      width: 500,
    }) + 15;

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

  currentY = drawBulletedSection(
    "MICROSCOPIC DESCRIPTION",
    data.microscopy_list,
    currentY,
  );

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

  currentY = drawBulletedSection(
    "FOLLOW-UP RECOMMENDATION",
    data.recommendations_list,
    currentY,
  );

  // --- 5. COMPACT SIDEBAR ---
  const sidebarY = 600; // Fixed position to stay on page 1
  const sidebarX = pageWidth - margin - 170;
  doc.rect(sidebarX, sidebarY, 170, 90).fill("#f8fbff").stroke("#e3f2fd");
  doc
    .fillColor("black")
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .text("IMPORTANT NOTES", sidebarX + 5, sidebarY + 6);
  const sidebarNotes = [
    "Correlate clinically.",
    "Adequacy: Min 5k cells.",
    "QA: TZ requires >10 endocervical cells.",
    "Ref: BETHESDA 3rd Ed.",
  ];
  let nY = sidebarY + 18;
  sidebarNotes.forEach((n) => {
    doc
      .fillColor("#555555")
      .font("Helvetica")
      .fontSize(7)
      .text(`• ${n}`, sidebarX + 5, nY);
    nY += 10;
  });

  // --- 6. SIGNATURE (Moved Up) ---
  const signatureY = 680;
  const sigPath = path.join("assets", "sunita_sig.png");
  try {
    doc.image(sigPath, margin + 10, signatureY, { width: 100 });
  } catch (e) {
    console.log("Signature image missing");
  }

  // --- 7. FOOTER (Bottom Center) ---
  const footerY = 790;
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
