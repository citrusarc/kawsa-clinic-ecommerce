import { spectral } from "@/config/font";

export default function PrivacyPolicyPage() {
  return (
    <section className="flex flex-col p-4 pb-16 sm:p-24 gap-8 sm:gap-16 font-medium text-black">
      <h2 className={`text-4xl sm:text-6xl ${spectral.className}`}>
        Privacy Policy
      </h2>
      <p className="text-neutral-500">
        Welcome to https://kawsaskincare.com/. This site is owned by Drkay
        Medibeauty Sdn. Bhd. This Privacy Policy is designed to tell you about
        our practices regarding collection, use, and disclosure of information
        that you may provide via this website. We hope you read this entire
        Privacy Policy before using, or submitting any information, to this
        website.
        <br />
        <br />
        If you have any questions, concerns, or comments about this Privacy
        Policy or about any information of this website, please contact us.
      </p>
      <div>
        <h2 className="text-lg font-semibold">1. USER CONSENT</h2>
        <p className="text-neutral-500">
          By using this website, you agree with the terms of this Privacy
          Policy. Wherenever you submit information via this website, you
          consent to the collection, use, and disclosure of the information in
          accordance with this Privacy Policy.
        </p>
      </div>
      <div>
        <h2 className="text-lg font-semibold">2. INFORMATION COLLECTION</h2>
        <p className="text-neutral-500">
          Kawsa Skincare website is actively collects information from its
          visitors by asking you specific questions and permitting you to
          communicate directly with us via e-mail or chat rooms. Some of the
          information that you share or submit may be personally identifiable
          information such as (full name, address, e-mail address, phone number,
          and so on).
          <br />
          <br />
          Some areas from this website may require you to submit information in
          order for you to benefit from the specific features such as
          (newsletter subscriptions).
        </p>
      </div>
      <div>
        <h2 className="text-lg font-semibold">
          3. USE AND DISCLOSURE OF INFORMATION
        </h2>
        <p className="text-neutral-500">
          Like many website, we may use your information to improve the content
          of our site, customize site suit your preferences, communicate with
          you and share information with you. We may collect two types of
          information about you when you visit our website:
          <br />
          <br />
          • Personal information.
          <br />
          <br />
          • The only personally identifying information that we collect and
          store about you is the information that you choose to provide to us
          (your name, address, telephone number and email address). Using this
          information we will use to respond to your email or chat. We also may
          use this information to send you notifications about our products or
          any changes from our site.
          <br />
          <br />
          • Non-personal information (information such as the pages of our site
          that you have visited and your IP address). We collect and use this
          information about you in the following ways:
          <br />
          <br />
          IP Address and other Non-Personal Information, the “IP Address” is a
          number used by computer network to identify your computer so that data
          can be transmitted to you. We collect all of this information to allow
          us to detect broad demographic trends, that can provide us information
          suits your interest and to enhance your experience on Kawsa Skincare
          websites.
          <br />
          <br />
          Sharing your information with third parties.
          <br />
          <br />
          Like many other website, we may share your personally identifiable
          information such as (name, address, email address, and telephone
          number) with our affiliates such as (technical support, delivery
          services, and fulfillment services) without prior consent. However, we
          will not share your management of account (credit card processing) and
          personally identifiable information with non-affiliated third parties
          without your prior consent.
        </p>
      </div>
      <div>
        <h2 className="text-lg font-semibold">4. ACCESS AND CORRECTION</h2>
        <p className="text-neutral-500">
          To keep your identifiable information accurate, current, and complete,
          please contact us as specified below. We will take reasoneable steps
          to update or correct your information in our site that you have
          previously submitted via this website.
        </p>
      </div>
      <div>
        <h2 className="text-lg font-semibold">5. ABOUT CHILDREN</h2>
        <p className="text-neutral-500">
          Kawsa Skincare is not targeted to children under the age of 13 and we
          will not collect any identifiable information from any child under the
          age of 13 without parental consent. We encourage parents to talk to
          their children about their use of the internet and information they
          disclose to the website.
        </p>
      </div>
      <div>
        <h2 className="text-lg font-semibold">6. SECURITY</h2>
        <p className="text-neutral-500">
          We take precautions to protect your identifiable information from any
          disclosure, missuse or intrusion by third parties. Some of this
          precautions involve technologies like farewalls and secure access. You
          should keep in mind that no Internet transmission is 100% secure or
          error-free. If you have questions about the security at our websites,
          you can send email to us or chat us.
        </p>
      </div>
    </section>
  );
}
