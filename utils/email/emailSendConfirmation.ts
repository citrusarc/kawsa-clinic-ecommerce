import { EmailSendConfirmationTemplateProps } from "@/types";

export function emailSendConfirmationTemplate({
  orderNumber,
  fullName,
  items,
  subTotalPrice,
  shippingFee,
  totalPrice,
}: EmailSendConfirmationTemplateProps) {
  // Helper function to ensure absolute URL
  const getAbsoluteImageUrl = (src: string) => {
    if (!src) return "";
    if (src.startsWith("http://") || src.startsWith("https://")) {
      return src; // Already absolute
    }
    // Convert relative URL to absolute
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://kawsa-clinic-ecommerce.vercel.app";
    return `${baseUrl}${src.startsWith("/") ? "" : "/"}${src}`;
  };

  return `
  <div style="background-color:#f4f4f4; padding:24px; font-family:Arial, sans-serif;">
  <img 
    src="https://kawsa-clinic-ecommerce.vercel.app/Images/brand-logo-black.png" 
    alt="Kawsa MD Formula Logo" 
    style="width:120px; height:auto; margin-bottom:16px;" 
  />
  <h2>
    Your Order Has Been Confirmed!
  </h2>
  <p>Hi ${fullName},</p>
  <p>
    Thank you for your purchase!<br/>
    We're happy to let you know that your order 
    <span style="font-weight:bold;">${orderNumber}</span> has been successfully confirmed.
  </p>
  <hr style="margin:16px 0; border:none; border-top:1px solid #ccc;" />
  <h3>Order Summary</h3>
  <div>
    ${items
      .map(
        (item) => `
      <div style="display:flex; gap:12px; margin-bottom:12px; align-items:flex-start;">
        <div style="width:80px; height:80px; overflow:hidden; border-radius:12px; flex-shrink:0;">
          <img src="${getAbsoluteImageUrl(item.itemSrc)}" alt="${
          item.itemName
        }" style="width:100%; height:100%; object-fit:cover;">
        </div>
        <div>
          <p style="margin:0; font-weight:bold;">${item.itemName}</p>
          <p style="margin:0; color:#6b7280;">Quantity: ${item.itemQuantity}</p>
          <p style="margin:0; color:#7c3aed; font-weight:bold;">RM${item.itemTotalPrice.toFixed(
            2
          )}</p>
        </div>
      </div>
    `
      )
      .join("")}
  </div>
  <div style="margin-top:16px; border-top:1px solid #ccc; padding-top:16px;">
    <p style="margin:0; color:#6b7280;">Sub Total: RM ${subTotalPrice.toFixed(
      2
    )}</p>
    <p style="margin:0; color:#6b7280;">Shipping Fee: RM ${shippingFee.toFixed(
      2
    )}</p>
    <p style="margin-top:12px; font-size:18px; font-weight:bold;">Total: RM ${totalPrice.toFixed(
      2
    )}</p>
  </div>
  <p style="margin-top:16px;">Thank you for shopping with us️</p>
</div>
  `;
}
