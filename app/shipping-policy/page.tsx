import { spectral } from "@/config/font";

export default function ShippingPolicyPage() {
  return (
    <section className="flex flex-col p-4 sm:p-24 gap-8 sm:gap-16 font-medium text-black">
      <h2 className={`text-4xl sm:text-6xl ${spectral.className}`}>
        Shipping Policy
      </h2>
      <p className="text-neutral-500">
        The product will be delivered to the delivery address you specify in our
        order. Signature may be required to receive your item.
        <br />
        <br />
        Under normal circumstances, the ordered goods will be delivered within
        2-4 working days after payment for Peninsular Malaysia (except Langkawi)
        and within 6-7 working days after payment for main cities in East
        Malaysia and Langkawi. However, these estimated delivery dates are
        indicative only and we reserves the right to extend estimated delivery
        dates.
        <br />
        <br />
        **Notes: working days is according to Kuala Lumpur calendar, excluding
        the date of payment and local public holiday.
        <br />
        <br />
        If you have not received the products within the estimated delivery
        time, you should contact us via our website or by email or by
        telephoning us. Orders can be delivered only in Malaysia. We don't
        support cross border delivery.
        <br />
        <br />
        **Notes: Once your order has been prepared for dispatch or has been
        dispatched, you may no longer change the delivery address.
        <br />
        <br />
        For courier deliveries you can track the status of your order at any
        time via online order status. On the account page, you can view your
        current status of your order, views the items ordered, see estimated
        dispatch and delivery times, and track your delivery.
      </p>
    </section>
  );
}
