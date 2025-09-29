import { spectral } from "@/config/font";

export default function RefundPolicyPage() {
  return (
    <section className="flex flex-col p-4 sm:p-24 gap-8 sm:gap-16 font-medium text-black">
      <h2 className={`text-4xl sm:text-6xl ${spectral.className}`}>
        Refund Policy
      </h2>
      <p className="text-neutral-500">
        Dear user, we recommend you to read our policy first prior to making any
        purchase from our website. We also recommend you immediately check your
        items that we deliver to you or that you collect from one of our stores,
        to ensure you completely satisfied with the goods, including that the
        goods are of acceptable quality, and match the description we have
        provided to you. However, this returns policy only applies where you
        make a purchase online from our website.
        <br />
        <br />
        We’ll gladly accept returns or exchanges for any Kawsa products that you
        purchase at this website and will issue a refund upon receiving your
        items within 5 days of the RECEIVED date.
        <br />
        <br />
        However, please note that we ONLY ACCEPT exchange of equal or lower
        value which have been pre-approved by our Customer Service. The refund
        and exchange might be rejected if the product packaging has been opened
        or used.
        <br />
        <br />
        We regret to inform you that we do not entertain any refunds or returns
        in the event that the designated recipient of your order cannot be
        contacted/located. In this case, the product will be returned to the
        purchaser and any delivery charges to re-deliver or re-route to any new
        address shall be borne by the purchaser.
        <br />
        <br />
        Once the order has been successfully submitted with payment, Drkay
        Medibeauty Sdn. Bhd. will not entertain any request for cancellation of
        the order. As such, please ensure that you have checked all details
        prior to submitting your order for processing.
      </p>
    </section>
  );
}
