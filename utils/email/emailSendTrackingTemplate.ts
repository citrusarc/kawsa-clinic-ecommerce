import { EmailSendTrackingTemplateProps } from "@/types";

export function emailSendTrackingTemplate({
  orderNumber,
  fullName,
  courierName,
  trackingUrl,
  awbNumber,
  items,
  subTotalPrice,
  shippingFee,
  totalPrice,
}: EmailSendTrackingTemplateProps) {
  return `
  <div style="background-color:#f4f4f4; padding:24px; font-family:Arial;">
    <h2>Order Confirmed 🎉</h2>

    <p>Hi ${fullName},</p>

    <p>
      Your order <strong>${orderNumber}</strong> has been shipped.
    </p>

    <p>
      <strong>Courier:</strong> ${courierName}<br/>
      <strong>Tracking Number:</strong>
      ${
        trackingUrl && awbNumber
          ? `<a href="${trackingUrl}" target="_blank">${awbNumber}</a>` // //
          : awbNumber || "-" // //
      }
    </p>

    <hr />

    <h3>Order Summary</h3>
    <ul>
      ${items
        .map(
          (item) => `<li>${item.itemName} × ${item.itemQuantity}</li>` // //
        )
        .join("")}
    </ul>

    <p>Sub Total: RM ${subTotalPrice.toFixed(2)}</p>
    <p>Shipping Fee: RM ${shippingFee.toFixed(2)}</p>
    <p><strong>Total: RM ${totalPrice.toFixed(2)}</strong></p>

    <p>Thank you for shopping with us ❤️</p>
  </div>
  `;
}
