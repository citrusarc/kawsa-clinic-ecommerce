import { EmailSendOrderTemplateProps } from "@/types";

export function emailSendOrderTemplate({
  orderNumber,
  createdAt,
  fullName,
  email,
  phoneNumber,
  address,
  courierName,
  awbNumber,
  trackingUrl,
  awbPdfUrl,
  subTotalPrice,
  shippingFee,
  totalPrice,
  items,
}: EmailSendOrderTemplateProps) {
  const getAbsoluteImageUrl = (src: string) => {
    if (!src) return "";
    if (src.startsWith("http://") || src.startsWith("https://")) {
      return src;
    }
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://kawsa-clinic-ecommerce.vercel.app";
    return `${baseUrl}${src.startsWith("/") ? "" : "/"}${src}`;
  };

  return `
  <div style="margin: 0; padding: 12px; font-family: Arial, sans-serif; background-color: #fafafa;">
  <div style="max-width: 600px; margin: 0 auto; padding: 0; background: #fff; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;">
    <div style="padding: 24px;">
      <img 
        src="https://kawsa-clinic-ecommerce.vercel.app/Images/brand-logo-black.png" 
        alt="Kawsa MD Formula Logo" 
        style="width: 120px; height: auto; margin: 0 0 16px 0;" 
      />
      
      <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: bold;">
        New Order ${orderNumber}
      </h2>
      
      <table style="width:100%; border-collapse:collapse; margin: 12px 0 24px 0; font-size:14px;">
        <tbody>
          <tr style="background-color:#ffffff;">
            <td style="padding:8px; font-weight:bold; width:40%;">Order Number</td>
            <td style="padding:8px;">${orderNumber}</td>
          </tr>
          <tr style="background-color:#f9f9f9;">
            <td style="padding:8px; font-weight:bold;">Order Created</td>
            <td style="padding:8px;">${createdAt}</td>
          </tr>
          <tr style="background-color:#ffffff;">
            <td style="padding:8px; font-weight:bold;">Name</td>
            <td style="padding:8px;">${fullName}</td>
          </tr>
          <tr style="background-color:#f9f9f9;">
            <td style="padding:8px; font-weight:bold;">Email</td>
            <td style="padding:8px;">${email}</td>
          </tr>
          <tr style="background-color:#ffffff;">
            <td style="padding:8px; font-weight:bold;">Phone Number</td>
            <td style="padding:8px;">${phoneNumber}</td>
          </tr>
          <tr style="background-color:#f9f9f9;">
            <td style="padding:8px; font-weight:bold;">Address</td>
            <td style="padding:8px;">${address}</td>
          </tr>
          <tr style="background-color:#ffffff;">
            <td style="padding:8px; font-weight:bold;">Courier Name</td>
            <td style="padding:8px;">${courierName}</td>
          </tr>
          <tr style="background-color:#f9f9f9;">
            <td style="padding:8px; font-weight:bold;">Tracking Number</td>
            <td style="padding:8px;"><a href="${trackingUrl}" target="_blank" rel="noopener noreferrer" style="color: #0000EE; text-decoration: none; font-weight: normal">${awbNumber}</a></td>
          </tr>
          <tr style="background-color:#ffffff;">
            <td style="padding:8px; font-weight:bold;">Air Waybill</td>
            <td style="padding:8px;"><a href="${awbPdfUrl}" target="_blank" rel="noopener noreferrer" style="color: #0000EE; text-decoration: none; font-weight: normal">Download Air Waybill</a></td>
          </tr>
        </tbody>
      </table>
      
      <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: bold;">Order Items</h3>
      
      <div>
        ${items
          .map(
            (item) => `
          <div style="margin: 0 0 16px 0; display: flex; align-items: flex-start;">
            <div style="width: 96px; min-width: 96px; height: 96px; min-height: 96px; margin: 0 16px 0 0; flex-shrink: 0; border-radius: 12px; overflow: hidden;">
              <img 
                src="${getAbsoluteImageUrl(item.itemSrc)}" 
                alt="${item.itemName}" 
                style="width: 96px; height: 96px; object-fit: cover; display: block;"
              />
            </div>
            <div style="flex: 1; min-width: 0;">
              <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold; word-wrap: break-word;">${
                item.itemName
              }</p>
              <p style="margin: 0 0 4px 0; font-size: 14px; color: #6b7280;">Quantity: ${
                item.itemQuantity
              }</p>
              <p style="margin: 0; font-size: 14px; font-weight: bold; color: #7c3aed;">RM${item.itemTotalPrice.toFixed(
                2
              )}</p>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
      
      <div style="margin: 16px 0 0 0; padding: 16px 0 0 0; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0 0 4px 0; font-size: 14px; color: #6b7280;">Sub Total: RM${subTotalPrice.toFixed(
          2
        )}</p>
        <p style="margin: 0 0 4px 0; font-size: 14px; color: #6b7280;">Shipping Fee: RM${shippingFee.toFixed(
          2
        )}</p>
        <p style="margin: 8px 0 0 0; font-size: 16px; font-weight: bold;">Total: RM${totalPrice.toFixed(
          2
        )}</p>
      </div>
      </p>
    </div>
  </div>
  </div>
  `;
}

export function generatePickupPdfHtml({
  orderNumber,
  createdAt,
  fullName,
  awbNumber,
  items,
}: {
  orderNumber: string;
  createdAt: string;
  fullName: string;
  awbNumber: string;
  items: { itemName: string; itemQuantity: number }[];
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    h1 {
      margin-bottom: 24px;
      font-size: 20px;
    }
    .info-table {
      width: 100%;
      margin-bottom: 24px;
    }
    .info-table td {
      font-size: 14px;
      padding: 4px 0;
      
    }
    .info-table td:first-child {
      font-weight: bold;
      width: 140px;
    }
    .item {
      font-size: 16px;
      padding: 12px 0;
      border-bottom: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <h1>Pickup Order Details</h1>
  
  <table class="info-table">
    <tr>
      <td>Date Created:</td>
      <td>${createdAt}</td>
    </tr>
    <tr>
      <td>Order Number:</td>
      <td>${orderNumber}</td>
    </tr>
    <tr>
      <td>AWB Number:</td>
      <td>${awbNumber}</td>
    </tr>
    <tr>
      <td>Customer Name:</td>
      <td>${fullName}</td>
    </tr>
  </table>
  
  <div class="items-list">
    <h2 style="font-size: 16px; margin-bottom: 12px;">Items:</h2>
    ${items
      .map(
        (item) => `
      <div class="item">
        ${item.itemName} - Qty: ${item.itemQuantity}
      </div>
    `
      )
      .join("")}
  </div>
</body>
</html>
  `;
}
