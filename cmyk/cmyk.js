// npm install pdfkit

const PDFDocument = require('pdfkit');
const fs = require('fs');

// --- Unit Conversions (Points) ---
const mmToPt = (mm) => mm * 2.83465;

// Page Dimensions: A4 (210 x 297 mm)
const pageWidth = mmToPt(210);
const pageHeight = mmToPt(297);
const margin = mmToPt(5);

const printableWidth = pageWidth - 2 * margin;
const printableHeight = pageHeight - 2 * margin;

const totalRows = 38;
const rowHeight = printableHeight / totalRows;
const borderWidth = mmToPt(0.5); // 0.5 mm pure white border

// Create PDF document using native CMYK color space
const doc = new PDFDocument({
  size: [pageWidth, pageHeight],
  margins: { top: margin, bottom: margin, left: margin, right: margin }
});

doc.pipe(fs.createWriteStream('cmyk_swatch_a4.pdf'));

// --- Helper Functions ---

/**
 * Converts a Hue angle (0-360) and Saturation (0-1) to CMY (0-100%).
 */
function hueToCMY(hue, saturation = 1) {
  let h = ((hue % 360) + 360) % 360;
  let sector = h / 60;
  let i = Math.floor(sector);
  let f = sector - i;

  let r = 0, g = 0, b = 0;

  switch (i) {
    case 0: r = 1; g = f; b = 0; break;      // Red to Yellow
    case 1: r = 1 - f; g = 1; b = 0; break;  // Yellow to Green
    case 2: r = 0; g = 1; b = f; break;      // Green to Cyan
    case 3: r = 0; g = 1 - f; b = 1; break;  // Cyan to Blue
    case 4: r = f; g = 0; b = 1; break;      // Blue to Magenta
    case 5: r = 1; g = 0; b = 1 - f; break;  // Magenta to Red
  }

  r = r * saturation + (1 - saturation);
  g = g * saturation + (1 - saturation);
  b = b * saturation + (1 - saturation);

  return {
    c: (1 - r) * 100,
    m: (1 - g) * 100,
    y: (1 - b) * 100
  };
}

/**
 * Renders a filled cell with a 0.5mm pure white border around it.
 */
function drawCell(x, y, w, h, c, m, yColor, k, text = null, textOptions = {}) {
  // 1. Fill the cell with CMYK color
  doc.rect(x, y, w, h)
     .fillColor([c, m, yColor, k])
     .fill();

  // 2. Draw 0.5mm pure white border (0, 0, 0, 0 in CMYK) around the cell edges
  doc.rect(x, y, w, h)
     .lineWidth(borderWidth)
     .strokeColor([0, 0, 0, 0]) // 0% CMYK = Pure White
     .stroke();

  // 3. Render optional text label
  if (text !== null) {
    const fontSize = textOptions.fontSize || Math.min(h * 1, 9);
    doc.fontSize(fontSize)
       .font(textOptions.font || 'Helvetica')
       .fillColor(textOptions.color || [0, 0, 0, 100]) // Default text: 100% K Black
       .text(text, x, y + (h - fontSize) / 2, {
         width: w,
         align: 'center'
       });
  }
}

// ============================================================================
// ROW 1: Ink Primaries, Grayscale, and Rich Black Ramp
// ============================================================================
const yRow1 = margin;

const unitWidth = printableWidth / 36;
const widthPart1 = unitWidth * 13;
const widthPart2 = unitWidth * 11;
const widthPart3 = unitWidth * 12;

// Part 2: Grayscale Ramp 10% to 100% K (10 Cells)
const cellW_P2 = widthPart1 / 13;
const xStart_P2 = margin;
for (let i = 1; i <= 10; i++) {
  const kVal = i * 10;
  drawCell(xStart_P2 + (i + 1) * cellW_P2, yRow1, cellW_P2 * (i === 10 ? 2 : 1), rowHeight, 0, 0, 0, kVal);
}

// Part 3: Flat Black to Rich Black Ramp (10 Steps, labeled 1 to 10)
const cellW_P3 = widthPart2 / 11;
const xStart_P3 = margin + widthPart1;
for (let i = 1; i <= 10; i++) {
  const factor = i / 10; // 0.1 to 1.0
  const cVal = 60 * factor;
  const mVal = 40 * factor;
  const yVal = 40 * factor;
  const kVal = 100;

  drawCell(
    xStart_P3 + (i - 1) * cellW_P3,
    yRow1,
    cellW_P3 * (i === 10 ? 2 : 1),
    rowHeight,
    cVal, mVal, yVal, kVal,
    i.toString(),
    { font: 'Helvetica-Bold', color: [0, 0, 0, 0] } // Pure white text
  );
}

// Part 1: Primary CMY Inks (3 Cells)
const cellW_P1 = widthPart3 / 3;
const xStart_P1 = margin + widthPart1 + widthPart2;
drawCell(xStart_P1 + 0 * cellW_P1, yRow1, cellW_P1, rowHeight, 100, 0, 0, 0);   // Cyan
drawCell(xStart_P1 + 1 * cellW_P1, yRow1, cellW_P1, rowHeight, 0, 100, 0, 0);   // Magenta
drawCell(xStart_P1 + 2 * cellW_P1, yRow1, cellW_P1, rowHeight, 0, 0, 100, 0);   // Yellow

// ============================================================================
// ROW 2: Headers
// ============================================================================
{
  const rowIndex = 1;
  const yPos = margin + rowIndex * rowHeight;
  const numCols = 36;
  const colW = printableWidth / numCols;
  let colIdx = 2;
  const D = [-2,2,4,6,8,-4,2,4,6,-6,2,4,-8,2]
  // 2. Density Variations: 0% to 100% (step 10%)
  for (let d = 1; d <= 35; d++) {
    const txt = d <= 19 ? d == 10 ? 10 : d % 10 : D[d-20];
    drawCell(margin + colIdx * colW, yPos, colW * (d === 10 ? 2 : 1), rowHeight, 0, 0, 0, 0, txt, {
      font: 'Helvetica-Bold',
      color: [0, 0, 0, 100]
    });
    colIdx+=(d === 10 ? 2 : 1);
  }
  colIdx++;
}

// ============================================================================
// ROWS 3 to 38: Hue Swatch Rows (0° to 350° in steps of 10°)
// ============================================================================

for (let r = 0; r < 36; r++) {
  const hue = r * 10;
  const rowIndex = r + 2; // Rows 3 to 38
  const yPos = margin + rowIndex * rowHeight;

  const baseCMY = hueToCMY(hue, 1.0);

  const numCols = 36;
  const colW = printableWidth / numCols;

  let colIdx = 0;

  // 1. First Cell: Hue Label
  drawCell(margin + colIdx * colW, yPos, colW * 2, rowHeight, 0, 0, 0, 0, `${hue}°`, {
    font: 'Helvetica-Bold',
    color: [0, 0, 0, 100]
  });
  colIdx+=2;

  // 2. Density Variations: 0% to 100% (step 10%)
  for (let d = 1; d <= 10; d++) {
    const density = d / 10;
    drawCell(
      margin + colIdx * colW,
      yPos,
      colW * (d === 10 ? 2 : 1),
      rowHeight,
      baseCMY.c * density,
      baseCMY.m * density,
      baseCMY.y * density,
      0
    );
    colIdx++;
  }
  colIdx++;

  // 3. Key Ramp: Increase K by 10% up to 90%
  for (let step = 1; step <= 9; step++) {
    const kVal = step * 10;
    const density = (100 - kVal) / 100;
    drawCell(
      margin + colIdx * colW,
      yPos,
      colW,
      rowHeight,
      baseCMY.c * density,
      baseCMY.m * density,
      baseCMY.y * density,
      kVal
    );
    colIdx++;
  }

  // Helper for Density Ramp variations with fixed K steps
  const drawDensityKRamp = (baseDensity, kSteps) => {
    for (let kVal of kSteps) {
      const effectiveDensity = baseDensity * ((100 - kVal) / 100);
      drawCell(
        margin + colIdx * colW,
        yPos,
        colW,
        rowHeight,
        baseCMY.c * effectiveDensity,
        baseCMY.m * effectiveDensity,
        baseCMY.y * effectiveDensity,
        kVal
      );
      colIdx++;
    }
  };

  // 4. Density 80% with K ramp 0% -> 80% (step 20%)
  drawDensityKRamp(0.8, [0, 20, 40, 60, 80]);

  // 5. Density 60% with K ramp 0% -> 60% (step 20%)
  drawDensityKRamp(0.6, [0, 20, 40, 60]);

  // 6. Density 40% with K ramp 0% -> 40% (step 20%)
  drawDensityKRamp(0.4, [0, 20, 40]);

  // 7. Density 20% with K ramp 0% -> 20% (step 20%)
  drawDensityKRamp(0.2, [0, 20]);
}

doc.end();
console.log('PDF updated with 0.5mm white cell borders: cmyk_swatch_a4.pdf');