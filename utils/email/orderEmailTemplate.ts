// import { OrderEmailTemplateProps } from "@/types";

// export function orderEmailTemplate({ orderNumber }: OrderEmailTemplateProps) {
//   return `
//   <div style="background-color:#f4f4f4; padding:24px;">
//   <div style="max-width:600px; margin:0 auto; font-family:Arial,sans-serif; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.1);">
//     <div style="padding:24px;">
//       <img src="https://www.goldcoastmoribresort.com/Images/brand-logo-horizontal.png"
//            alt="Gold Coast Morib International Resort Logo"
//            style="width:200px; height:auto;" />
//       <hr style="border:none; border-top:2px solid #e63946; margin:16px 0"/>
//       <h2 style="font-size:22px; font-weight:600; margin:0 0 12px;">Hey ${firstName}!</h2>
//       <p style="margin:0 0 8px; font-size:14px; color:#333;">
//         Packed your bags yet?<br/>Your booking is all set. Here’s a quick look at your stay:
//       </p>

//       <table style="width:100%; border-collapse:collapse; margin-top:12px; font-size:14px;">
//         <tbody>
//           <tr style="background-color:#ffffff;">
//             <td style="padding:8px; font-weight:bold; width:40%;">Booking Number</td>
//             <td style="padding:8px;">${bookingNumber}</td>
//           </tr>
//           <tr style="background-color:#f9f9f9;">
//             <td style="padding:8px; font-weight:bold;">Order Created</td>
//             <td style="padding:8px;">${createdAt}</td>
//           </tr>
//           <tr style="background-color:#ffffff;">
//             <td style="padding:8px; font-weight:bold;">Room Type</td>
//             <td style="padding:8px;">${roomsName}</td>
//           </tr>
//           <tr style="background-color:#f9f9f9;">
//             <td style="padding:8px; font-weight:bold;">Check In</td>
//             <td style="padding:8px;">${checkInDate} (${
//     earlyCheckIn ? `${earlyCheckIn} GMT+8` : "15:00 GMT+8"
//   })</td>
//           </tr>
//           <tr style="background-color:#ffffff;">
//             <td style="padding:8px; font-weight:bold;">Check Out</td>
//             <td style="padding:8px;">${checkOutDate} (12:00 GMT+8)</td>
//           </tr>
//           <tr style="background-color:#f9f9f9;">
//             <td style="padding:8px; font-weight:bold;">Total Guests</td>
//             <td style="padding:8px;">${adults} Adult${adults !== 1 ? "s" : ""}${
//     children ? `, ${children} Child${children !== 1 ? "ren" : ""}` : ""
//   }</td>
//           </tr>
//           <tr style="background-color:#ffffff;">
//             <td style="padding:8px; font-weight:bold;">Early Check In</td>
//             <td style="padding:8px;">${
//               earlyCheckIn ? `${earlyCheckIn} (GMT+8)` : "-"
//             }</td>
//           </tr>
//           <tr style="background-color:#f9f9f9;">
//             <td style="padding:8px; font-weight:bold;">Remarks</td>
//             <td style="padding:8px;">${remarks || "-"}</td>
//           </tr>
//         </tbody>
//       </table>

//       <div style="margin-top:16px;">
//         <p style="margin:0;">Paid Amount:</p>
//         <p style="font-size:20px; font-weight:bold; margin:4px 0;">${currency} ${totalPrice}</p>
//       </div>
//     </div>

//     <!-- Footer -->
//     <div style="background:#1d4ed8; color:#fff; text-align:center; padding:20px; font-size:14px;">
//       <p style="margin:4px 0;">
//         <a href="mailto:info@goldcoastresort.com.my" style="color:#fff; text-decoration:none;"
//            onmouseover="this.style.textDecoration='underline';"
//            onmouseout="this.style.textDecoration='none';">
//            info@goldcoastresort.com.my
//         </a>
//       </p>
//       <p style="margin:4px 0;">
//         <a href="tel:+60331981028" style="color:#fff; text-decoration:none;"
//            onmouseover="this.style.textDecoration='underline';"
//            onmouseout="this.style.textDecoration='none';">
//            +60331981028
//         </a>
//       </p>
//       <p style="margin:4px 0;">
//         <a href="https://www.goldcoastmoribresort.com/" style="color:#fff; text-decoration:none;"
//            onmouseover="this.style.textDecoration='underline';"
//            onmouseout="this.style.textDecoration='none';">
//            www.goldcoastmoribresort.com
//         </a>
//       </p>
//       <p style="margin:8px 0 0;">© ${new Date().getFullYear()} Gold Coast Morib International Resort. All rights reserved.</p>
//     </div>
//   </div>
// </div>
//   `;
// }
