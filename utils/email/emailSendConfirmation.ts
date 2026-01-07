import { EmailSendConfirmationTemplateProps } from "@/types";

export function emailSendConfirmationTemplate({
  orderNumber,
  fullName,
  items,
  subTotalPrice,
  shippingFee,
  totalPrice,
}: EmailSendConfirmationTemplateProps) {
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
        Your Order Has Been Confirmed!
      </h2>
      
      <p style="margin: 0 0 12px 0; font-size: 14px;">Hi ${fullName},</p>
      
      <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.5;">
        Thank you for your purchase!<br/>
        We're happy to let you know that your order 
        <span style="font-weight: bold;">${orderNumber}</span> has been successfully confirmed.
      </p>
      
      <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: bold;">Order Summary</h3>
      
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
      
      <p style="margin: 24px 0 0 0; font-size: 14px;">Thank you for shopping with us! ❤️</p>
    </div>
  </div>
</div>
  `;
}
