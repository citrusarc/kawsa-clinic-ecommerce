// // NEW FILE
import PDFDocument from "pdfkit";

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
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 40 });
    const buffers: Buffer[] = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {
      resolve(Buffer.concat(buffers));
    });

    doc.fontSize(18).text("Pickup Order", { align: "center" }).moveDown();

    doc.fontSize(12);
    doc.text(`Order Number: ${orderNumber}`);
    doc.text(`Order Created: ${createdAt}`);
    doc.text(`Customer Name: ${fullName}`);
    doc.text(`AWB Number: ${awbNumber}`);
    doc.moveDown();

    doc.fontSize(14).text("Items", { underline: true }).moveDown(0.5);

    items.forEach((item, index) => {
      doc
        .fontSize(12)
        .text(`${index + 1}. ${item.itemName} - Qty: ${item.itemQuantity}`);
    });

    doc.end();
  });
}
