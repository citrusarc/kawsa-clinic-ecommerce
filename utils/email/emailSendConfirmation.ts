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
 <div style="background-color: #fafafa; padding: 24px; font-family: Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    <div style="padding: 24px;">
      <img 
        src="https://kawsa-clinic-ecommerce.vercel.app/Images/brand-logo-black.png" 
        alt="Kawsa MD Formula Logo" 
        style="width: 120px; height: auto; margin-bottom: 16px;" 
      />
      
      <h2 style="font-size: 20px; margin: 0 0 16px 0; font-weight: bold;">
        Your Order Has Been Confirmed!
      </h2>
      
      <p style="font-size: 14px; margin: 0 0 12px 0;">Hi ${fullName},</p>
      
      <p style="font-size: 14px; margin: 0 0 24px 0; line-height: 1.5;">
        Thank you for your purchase!<br/>
        We're happy to let you know that your order 
        <span style="font-weight: bold;">${orderNumber}</span> has been successfully confirmed.
      </p>
      
      <h3 style="font-size: 16px; margin: 0 0 16px 0; font-weight: bold;">Order Summary</h3>
      
      <div>
        ${items
          .map(
            (item) => `
          <div style="display: flex; gap: 12px; margin-bottom: 12px; align-items: flex-start;">
            <div style="width: 96px; height: 96px; overflow: hidden; border-radius: 12px; flex-shrink: 0;">
              <img 
                src="${getAbsoluteImageUrl(item.itemSrc)}" 
                alt="${item.itemName}" 
                style="width: 100%; height: 100%; object-fit: cover;"
              />
            </div>
            <div>
              <p style="margin: 0 0 4px 0; font-weight: bold; font-size: 14px;">${
                item.itemName
              }</p>
              <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">Quantity: ${
                item.itemQuantity
              }</p>
              <p style="margin: 0; color: #7c3aed; font-weight: bold; font-size: 14px;">RM${item.itemTotalPrice.toFixed(
                2
              )}</p>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
      
      <div style="margin-top: 16px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Sub Total: RM ${subTotalPrice.toFixed(
          2
        )}</p>
        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Shipping Fee: RM ${shippingFee.toFixed(
          2
        )}</p>
        <p style="margin: 12px 0 0 0; font-size: 16px; font-weight: bold;">Total: RM ${totalPrice.toFixed(
          2
        )}</p>
      </div>
      
      <p style="margin: 24px 0 0 0; font-size: 14px;">Thank you for shopping with us! ❤️</p>
    </div>
  </div>
</div>
  `;
}
