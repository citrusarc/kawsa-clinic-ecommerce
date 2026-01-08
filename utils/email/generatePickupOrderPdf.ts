// /utils/email/generatePickupOrderPdf.ts
// FULL replacement using pdf-lib
// // Changed from pdfkit -> pdf-lib

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type PickupOrderPdfProps = {
  orderNumber: string;
  createdAt: string;
  fullName: string;
  awbNumber: string;
  items: {
    itemName: string;
    itemQuantity: number;
  }[];
};

export async function generatePickupOrderPdf({
  orderNumber,
  createdAt,
  fullName,
  awbNumber,
  items,
}: PickupOrderPdfProps): Promise<Buffer> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create(); // //

  // Add a page
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();

  // Load a standard font (no file needed)
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica); // //

  const fontSizeTitle = 18;
  const fontSizeText = 12;
  const fontSizeHeader = 14;

  let y = height - 50; // start from top

  // Draw title
  page.drawText("Pickup Order", {
    x: 50,
    y,
    size: fontSizeTitle,
    font,
    color: rgb(0, 0, 0),
  });
  y -= fontSizeTitle + 20;

  // Draw order info
  const orderInfo = [
    `Order Number: ${orderNumber}`,
    `Order Created: ${createdAt}`,
    `Customer Name: ${fullName}`,
    `AWB Number: ${awbNumber}`,
  ];

  orderInfo.forEach((line) => {
    page.drawText(line, { x: 50, y, size: fontSizeText, font });
    y -= fontSizeText + 5;
  });

  y -= 10;

  // Items header
  page.drawText("Items", { x: 50, y, size: fontSizeHeader, font });
  y -= fontSizeHeader + 5;

  // Draw items
  items.forEach((item, index) => {
    const line = `${index + 1}. ${item.itemName} - Qty: ${item.itemQuantity}`;
    page.drawText(line, { x: 50, y, size: fontSizeText, font });
    y -= fontSizeText + 3;
  });

  // Serialize PDF to bytes
  const pdfBytes = await pdfDoc.save();

  // Convert to Node Buffer
  return Buffer.from(pdfBytes); // //
}
