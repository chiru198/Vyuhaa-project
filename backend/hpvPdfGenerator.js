import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";

export const generateHPVReport = (data, stream) => {
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

  // --- 1. HEADER (Logos & Contact Info) --- SAME AS LBC ---
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

  // Address line with "Address:" label in bold
  doc
    .fontSize(8)
    .fillColor("black")
    .font("Helvetica-Bold")
    .text("Address: ", margin + 15, addressBarY + 8, { continued: true })
    .font("Helvetica")
    .text(
      "C15, First floor, BioValley Incubation Center I-Hub, AMTZ Campus, Visakhapatnam, Andhra Pradesh 530031",
      { continued: false },
    );

  const contactLineY = addressBarY + 24;

  // Phone — fixed left position
  doc
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .fillColor("black")
    .text("Phone: ", margin + 15, contactLineY, { continued: true })
    .font("Helvetica")
    .text("+91-9840582365", { continued: false });

  // Report Date — fixed center position
  doc
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .text(`Report Date: ${reportDate}`, margin, contactLineY, {
      align: "center",
      width: contentWidth,
    });

  // Email — fixed right position using absolute x
  const emailLabel = "Email: ";
  const emailValue = "admin@vyuhaadata.com";
  const emailX = pageWidth - margin - 120;
  doc
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .text(emailLabel, emailX, contactLineY, { continued: true })
    .font("Helvetica")
    .text(emailValue, { continued: false });

  // Report Title
  doc
    .fillColor(blueColor)
    .font("Helvetica-Bold")
    .fontSize(13)
    .text("HPV DNA - REAL TIME PCR REPORT", margin, 135, { align: "center" });

  // --- 2. PATIENT INFO GRID --- SAME AS LBC ---
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
  drawField("Patient Name:", data.patient_name, margin + 20, margin + 135, rY);
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
  drawField("Specimen Type:", "HPV", margin + 310, margin + 410, rY);

  rY += 16;
  drawField(
    "Collection Date:",
    data.collection_date || "N/A",
    margin + 20,
    margin + 135,
    rY,
  );
  drawField("Report Status:", "Final", margin + 310, margin + 410, rY);

  // --- 3. MOLECULAR BIOLOGY SECTION (DYNAMIC) ---
  let currentY = 255;

  // Big centered MOLECULAR BIOLOGY heading
  doc
    .fillColor(blueColor)
    .font("Helvetica-Bold")
    .fontSize(14)
    .text("MOLECULAR BIOLOGY", margin, currentY, {
      align: "center",
      width: contentWidth,
    });
  currentY += 22;

  // Table setup
  const tableX = margin + 10;
  const tableWidth = contentWidth - 20;
  const col1W = tableWidth * 0.6;

  // Table header row — blue background, white text
  doc.rect(tableX, currentY, tableWidth, 20).fill("#1565c0");
  doc
    .fillColor("white")
    .font("Helvetica-Bold")
    .fontSize(9)
    .text("TEST DESCRIPTION", tableX + tableWidth * 0.3 - 40, currentY + 6, {
      width: col1W,
      align: "center",
    });
  doc
    .fillColor("white")
    .font("Helvetica-Bold")
    .fontSize(9)
    .text("RESULT", tableX + col1W, currentY + 6, {
      width: tableWidth - col1W,
      align: "center",
    });
  currentY += 20;

  // Sub-header row — light blue, "HPV DNA - Real Time PCR" spanning full width
  doc.rect(tableX, currentY, tableWidth, 28).fill("#ddeeff");
  doc
    .fillColor("black")
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .text("HPV DNA - Real Time PCR", tableX + 10, currentY + 5);
  doc
    .fillColor("#555555")
    .font("Helvetica-Oblique")
    .fontSize(7.5)
    .text("(Method: Real Time PCR)", tableX + 10, currentY + 16);
  currentY += 28;

  // Table rows — DYNAMIC from HPVReporting page
  const hpvTests = [
    { test: "HPV - 16", result: data.hpv16 || "NOT DETECTED" },
    { test: "HPV - 18", result: data.hpv18 || "NOT DETECTED" },
    { test: "HPV - OTHER HIGH RISK", result: data.hr_hpv || "NOT DETECTED" },
  ];

  hpvTests.forEach((row, i) => {
    const rowBg = i % 2 === 0 ? "#e8f4fb" : "#f5f9ff";
    doc.rect(tableX, currentY, tableWidth, 20).fill(rowBg).stroke("#d0e4f0");

    // Test name — blue color like screenshot
    doc
      .fillColor(blueColor)
      .font("Helvetica-Bold")
      .fontSize(8.5)
      .text(row.test, tableX + 10, currentY + 6);

    // Result — black bold like screenshot
    doc
      .fillColor("black")
      .font("Helvetica-Bold")
      .fontSize(8.5)
      .text(row.result.toUpperCase(), tableX + col1W, currentY + 6, {
        width: tableWidth - col1W,
        align: "center",
      });

    currentY += 20;
  });
  currentY += 14;

  // --- 4. PCR AMPLIFICATION PLOT (LEFT) + INTERPRETATION TABLE (RIGHT) ---
  const plotX = margin + 10;
  const plotWidth = 250;
  const plotHeight = 170;
  const interpX = plotX + plotWidth + 15;
  const interpWidth = contentWidth - plotWidth - 25;
  const sectionStartY = currentY;

  // LEFT: PCR AMPLIFICATION PLOT heading + image
  doc
    .fillColor(sectionHeaderColor)
    .font("Helvetica-Bold")
    .fontSize(9)
    .text("PCR AMPLIFICATION PLOT", plotX, sectionStartY);

  const plotImgY = sectionStartY + 14;

  if (data.image1_path) {
    const cleanPath = data.image1_path.startsWith("/")
      ? data.image1_path.substring(1)
      : data.image1_path;
    const absolutePath = path.resolve(process.cwd(), cleanPath);
    if (fs.existsSync(absolutePath)) {
      doc.image(absolutePath, plotX, plotImgY, {
        width: plotWidth,
        height: plotHeight,
      });
      doc
        .rect(plotX, plotImgY, plotWidth, plotHeight)
        .strokeColor("#cccccc")
        .lineWidth(0.5)
        .stroke();
    } else {
      doc
        .rect(plotX, plotImgY, plotWidth, plotHeight)
        .fill("#f5f5f5")
        .stroke("#cccccc");
      doc
        .fillColor("#aaaaaa")
        .font("Helvetica-Oblique")
        .fontSize(8)
        .text(
          "[PCR plot image not found]",
          plotX + 10,
          plotImgY + plotHeight / 2 - 5,
          { width: plotWidth - 20 },
        );
    }
  } else {
    doc
      .rect(plotX, plotImgY, plotWidth, plotHeight)
      .fill("#f5f5f5")
      .stroke("#cccccc");
    doc
      .fillColor("#aaaaaa")
      .font("Helvetica-Oblique")
      .fontSize(8)
      .text(
        "[No PCR plot image uploaded]",
        plotX + 10,
        plotImgY + plotHeight / 2 - 5,
        { width: plotWidth - 20 },
      );
  }

  // RIGHT: INTERPRETATION TABLE (STATIC - same for every report)
  doc
    .fillColor(sectionHeaderColor)
    .font("Helvetica-Bold")
    .fontSize(9)
    .text("INTERPRETATION", interpX, sectionStartY);

  let interpY = sectionStartY + 14;

  // Interpretation table header
  doc.rect(interpX, interpY, interpWidth, 16).fill("#1565c0");
  doc
    .fillColor("white")
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .text("RESULT", interpX + 5, interpY + 4);
  doc.text("MEANING", interpX + interpWidth * 0.4, interpY + 4);
  interpY += 16;

  // Interpretation rows - STATIC same for every HPV report
  const interpRows = [
    { result: "Detected", meaning: "Sample contains HPV DNA" },
    {
      result: "Indeterminate",
      meaning: "Presence of inhibitors in the sample",
    },
    {
      result: "Not Detected",
      meaning: "No HPV DNA, or copies below detection limit",
    },
  ];

  interpRows.forEach((row, i) => {
    const rowBg = i % 2 === 0 ? "#f5f9ff" : "#ffffff";
    doc.rect(interpX, interpY, interpWidth, 24).fill(rowBg).stroke("#e0e0e0");
    doc
      .fillColor("black")
      .font("Helvetica-Bold")
      .fontSize(9)
      .text(row.result, interpX + 5, interpY + 7);
    doc
      .fillColor("#333333")
      .font("Helvetica")
      .fontSize(8)
      .text(row.meaning, interpX + interpWidth * 0.4, interpY + 7, {
        width: interpWidth * 0.58,
        lineGap: 1,
      });
    interpY = Math.max(interpY + 24, doc.y + 2);
  });

  // Specifications line below interpretation table
  interpY += 6;
  doc
    .fillColor("#333333")
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .text(
      "Specifications: Real-Time PCR with ROX CY5 VIC FAM channels",
      interpX,
      interpY,
      { width: interpWidth },
    );
  interpY = doc.y + 4;
  doc
    .fillColor("#333333")
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .text("CDSCO Approved: IVD MFG/IVD/2024/000059", interpX, interpY, {
      width: interpWidth,
    });

  // Move currentY below both columns
  currentY = sectionStartY + 14 + plotHeight + 20;

  // --- 5. NOTES (DYNAMIC - from clinical_history/notes field) ---
  doc
    .fillColor(sectionHeaderColor)
    .font("Helvetica-Bold")
    .fontSize(9)
    .text("NOTES:", margin + 10, currentY);
  currentY += 12;

  doc
    .fillColor("#333333")
    .font("Helvetica")
    .fontSize(8.5)
    .text(data.clinical_history || "None provided.", margin + 15, currentY, {
      width: contentWidth - 30,
    });
  currentY = doc.y + 24;

  // --- 6. SIGNATURE ---
  try {
    const sigPath = path.resolve(process.cwd(), "assets", "sunita_sig.png");
    if (fs.existsSync(sigPath)) {
      doc.image(sigPath, margin + 10, currentY, { width: 110 });
      
    }
  } catch (e) {}

  // --- 8. FOOTER --- SAME AS LBC ---
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
