import { EmailSendConfirmationTemplateProps } from "@/types";

export function emailSendConfirmationTemplate({
  orderNumber,
  fullName,
  items,
  subTotalPrice,
  shippingFee,
  totalPrice,
}: EmailSendConfirmationTemplateProps) {
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
    We’re happy to let you know that your order 
    <span style="font-weight:bold;">${orderNumber}</span> has been successfully confirmed.
  </p>

  <hr style="margin:16px 0; border:none; border-top:1px solid #ccc;" />

  <h3 >Order Summary</h3>
 

  <ul>
      ${items
        .map(
          (item) =>
            `<li>${item.itemSrc} ${item.itemName} × ${item.itemQuantity}</li>` // //
        )
        .join("")}
    </ul>

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
