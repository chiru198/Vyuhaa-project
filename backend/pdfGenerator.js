import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";

export const generateLBCReport = (data, stream) => {
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

  const reportDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  // --- 1. HEADER (Logos & Contact Info) ---
  try {
    const vyuhaaLogo = path.resolve(process.cwd(), "assets", "vyuhaa.png");
    const cerviLogo = path.resolve(process.cwd(), "assets", "cerviai.png");
    if (fs.existsSync(vyuhaaLogo))
      doc.image(vyuhaaLogo, margin, 20, { height: 45 });
    if (fs.existsSync(cerviLogo)) doc.image(cerviLogo, 460, 25, { height: 32 });
  } catch (e) {
    console.log("Logos missing");
  }

  // Address and Contact Bar
  const addressBarY = 80;
  doc.rect(margin, addressBarY, contentWidth, 42).fill(lightBlueBg);

  doc
    .fontSize(8)
    .fillColor("black")
    .font("Helvetica")
    .text(
      "C15, First floor, BioValley Incubation Center I-Hub, AMTZ Campus, Vizag, AP 530031",
      margin,
      addressBarY + 8,
      { align: "center", width: contentWidth },
    );

  const contactLineY = addressBarY + 24;
  doc.fontSize(7.5).text("Phone: +91-9840582365", margin + 15, contactLineY);
  doc
    .font("Helvetica-Bold")
    .text(`Report Date: ${reportDate}`, margin, contactLineY, {
      align: "center",
      width: contentWidth,
    });
  doc
    .font("Helvetica")
    .text("Email: admin@vyuhaadata.com", margin, contactLineY, {
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
  drawField("Patient Name:", data.patient_name, margin + 20, margin + 100, rY);
  drawField(
    "Age / Sex:",
    `${data.age || "N/A"} / ${data.gender || "N/A"}`,
    margin + 310,
    margin + 410,
    rY,
  );

  rY += 16;
  drawField(
    "Patient MR# / Barcode:",
    data.barcode || data.mr_number,
    margin + 20,
    margin + 135,
    rY,
  );
  drawField(
    "Hospital/Camp:",
    data.hospital_name,
    margin + 310,
    margin + 410,
    rY,
  );

  rY += 16;
  drawField("Ordered by:", data.doctor_name, margin + 20, margin + 135, rY);
  drawField(
    "Specimen Type:",
    data.specimen_type || "LBC",
    margin + 310,
    margin + 410,
    rY,
  );

  rY += 16;
  drawField(
    "Collection Date:",
    data.collection_date || "N/A",
    margin + 20,
    margin + 135,
    rY,
  );
  drawField("Report Status:", "Final", margin + 310, margin + 410, rY);

  // --- 3. MICROSCOPY & CLINICAL IMPRESSION ---
  let currentY = 250;

  const drawSection = (title, content, y, isBold = false) => {
    doc
      .fillColor(sectionHeaderColor)
      .font("Helvetica-Bold")
      .fontSize(9)
      .text(title, margin + 10, y);
    doc
      .fillColor("black")
      .font(isBold ? "Helvetica-Bold" : "Helvetica")
      .fontSize(8.5)
      .text(content || "N/A", margin + 15, y + 12, {
        width: contentWidth - 40,
      });
    return doc.y + 12;
  };

  currentY = drawSection("SPECIMEN ADEQUACY", data.specimen_adequacy, currentY);
  currentY = drawSection("CLINICAL HISTORY", data.clinical_history, currentY);

  // Microscopic Description Section (6 points)
  doc
    .fillColor(sectionHeaderColor)
    .font("Helvetica-Bold")
    .fontSize(9)
    .text("MICROSCOPIC DESCRIPTION", margin + 10, currentY);
  currentY += 14;

  if (data.microscopy_list && Array.isArray(data.microscopy_list)) {
    data.microscopy_list.forEach((item) => {
      doc
        .fillColor("black")
        .font("Helvetica")
        .fontSize(8.5)
        .text("•", margin + 15, currentY);
      doc.text(item, margin + 25, currentY, { width: contentWidth - 40 });
      currentY = doc.y + 4;
    });
  }
  currentY += 10;

  // Clinical Impression / Result Box
  doc
    .fillColor(sectionHeaderColor)
    .font("Helvetica-Bold")
    .fontSize(9)
    .text("CLINICAL IMPRESSION / RESULT", margin + 10, currentY);
  currentY += 14;

  doc
    .rect(margin + 10, currentY, contentWidth - 20, 26)
    .fill("#fcfcfc")
    .stroke("#dddddd");
  doc
    .fillColor("black")
    .font("Helvetica-Bold")
    .fontSize(10)
    .text(data.result || "NILM", margin + 20, currentY + 8);
  currentY += 38;

  // Recommendations
  doc
    .fillColor(sectionHeaderColor)
    .font("Helvetica-Bold")
    .fontSize(9)
    .text("FOLLOW-UP RECOMMENDATION", margin + 10, currentY);
  currentY += 14;
  const followUps = Array.isArray(data.recommendations_list)
    ? data.recommendations_list
    : ["Routine screening."];
  followUps.forEach((item) => {
    doc
      .fillColor("black")
      .font("Helvetica")
      .fontSize(8.5)
      .text(`• ${item}`, margin + 15, currentY);
    currentY = doc.y + 4;
  });

  // --- 4. DIGITAL IMAGES ---
  currentY += 15;
  const imgWidth = 180;
  const imgHeight = 110;
  doc
    .fillColor(sectionHeaderColor)
    .font("Helvetica-Bold")
    .fontSize(9)
    .text("LBC DIGITAL IMAGES:", margin + 10, currentY);

  const addReportImage = (dbPath, xPos, yPos) => {
    if (!dbPath) return;
    const cleanPath = dbPath.startsWith("/") ? dbPath.substring(1) : dbPath;
    const absolutePath = path.resolve(process.cwd(), cleanPath);
    if (fs.existsSync(absolutePath)) {
      doc.image(absolutePath, xPos, yPos + 12, {
        width: imgWidth,
        height: imgHeight,
      });
      doc
        .rect(xPos, yPos + 12, imgWidth, imgHeight)
        .strokeColor("#cccccc")
        .lineWidth(0.5)
        .stroke();
    }
  };

  addReportImage(data.image1_path, margin + 40, currentY);
  addReportImage(data.image2_path, margin + 40 + imgWidth + 40, currentY);
  currentY += imgHeight + 35;

  // --- 5. SIGNATURE & NOTES ---
  const notesWidth = 260;
  const notesX = pageWidth - margin - notesWidth;

  doc.rect(notesX, currentY, notesWidth, 100).fill("#f8fbff").stroke("#e3f2fd");
  doc
    .fillColor("black")
    .font("Helvetica-Bold")
    .fontSize(7.6)
    .text("IMPORTANT NOTE", notesX + 10, currentY + 8);

  const notes = [
    "Clinical correlation: Please correlate clinically.",
    "Adequacy Standards: Minimum 5,000 squamous cells for LBC.",
    "Quality Assurance: Transformation zone sample requires >=10 endocervical cells.",
    "Note: Cervix smear cytology is a screening test. Associated false results may occur.",
    "Reference: BETHESDA System, 3rd Edition.",
  ];

  let noteY = currentY + 18;
  notes.forEach((note) => {
    doc
      .fillColor("#444444")
      .font("Helvetica")
      .fontSize(6.5)
      .text(`• ${note}`, notesX + 10, noteY, {
        width: notesWidth - 20,
        lineGap: 1,
      });
    noteY = doc.y + 2.5;
  });

  try {
    const sigPath = path.resolve(process.cwd(), "assets", "sunita_sig.png");
    if (fs.existsSync(sigPath)) {
      doc.image(sigPath, margin + 10, currentY, { width: 80 });
      doc
        .fillColor("black")
        .font("Helvetica-Bold")
        .fontSize(9)
        .text("Dr. Sunita Samleti", margin + 10, currentY + 55);
      doc
        .font("Helvetica")
        .fontSize(7.5)
        .text("Consultant Pathologist", margin + 10, currentY + 65);
    }
  } catch (e) {}

  // --- 6. FOOTER ---
  const footerY = 785;
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
    .text(
      "ISO 13485 & ISO 15189:2012 Certified facilities | NABL Accredited Lab Services | AI-Enhanced Accuracy",
      margin,
      footerY + 10,
      { align: "center", width: contentWidth },
    );

  setTimeout(() => {
    doc.end();
  }, 200);
};
