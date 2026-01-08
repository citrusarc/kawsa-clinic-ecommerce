import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import { PickOrderPdfProps } from "@/types";

export async function generatePickOrderPdf({
  orderNumber,
  createdAt,
  fullName,
  awbNumber,
  items,
}: PickOrderPdfProps): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const fontSizeTitle = 18;
  const fontSizeText = 12;
  const fontSizeHeader = 14;

  let y = height - 50;

  page.drawText(`PICK ORDER - ${orderNumber}`, {
    x: 50,
    y,
    size: fontSizeTitle,
    font,
    color: rgb(0, 0, 0),
  });
  y -= fontSizeTitle + 20;

  const orderInfo = [
    { label: "Order Number: ", value: orderNumber },
    { label: "Order Created: ", value: createdAt },
    { label: "AWB Number: ", value: awbNumber },
    { label: "Customer Name: ", value: fullName },
  ];

  orderInfo.forEach(({ label, value }) => {
    page.drawText(label, { x: 50, y, size: fontSizeText, font: fontBold });
    const labelWidth = fontBold.widthOfTextAtSize(label, fontSizeText);
    page.drawText(value, { x: 50 + labelWidth, y, size: fontSizeText, font });
    y -= fontSizeText + 5;
  });

  y -= 20;

  page.drawText("Items", { x: 50, y, size: fontSizeHeader, font: fontBold });
  y -= fontSizeHeader + 5;

  items.forEach((item, index) => {
    const line = `${index + 1}. ${item.itemName} - Qty: ${item.itemQuantity}`;
    page.drawText(line, { x: 50, y, size: fontSizeText, font });
    y -= fontSizeText + 5;
  });

  const pdfBytes = await pdfDoc.save();

  return Buffer.from(pdfBytes);
}
