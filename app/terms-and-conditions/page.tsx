import { spectral } from "@/config/font";

export default function TermsAndConditionsPage() {
  return (
    <section className="flex flex-col p-4 sm:p-24 gap-8 sm:gap-16 font-medium text-black">
      <h2 className={`text-4xl sm:text-6xl ${spectral.className}`}>
        Terms & Conditions
      </h2>
      <p className="text-neutral-500">
        Welcome to Kawsa Skincare website. This website is owned and operated by
        Drkay Medibeauty Sdn. Bhd. This website is made for you (the user)
        subject to these terms and conditions. By accessing or using this
        website, you are acknowledging that you have read, understand, and agree
        to be bound by these Terms & Conditions. Drkay Medibeauty Sdn. Bhd. may
        modify and change these terms & conditions from time to time. We advice
        you to review these terms & conditions whenever accessing or using this
        website.
        <br />
        <br />
        Your use of this website after the posting of modifications or changes
        of the terms & conditions shows your acceptance of the terms and
        conditions as modified or changed.
      </p>

      <div>
        <h2 className="text-lg font-semibold">
          1. CORPORATE IDENTIFICATION AND TRADEMARKS
        </h2>
        <p className="text-neutral-500">
          All registered or unregistered trademarks or service marks used or
          referred to on this website are the property ofDrkay Medibeauty Sdn.
          Bhd. and its affiliates, unless otherwise noted. User may not use,
          reproduce, copy, republish, upload, post, distribute or modify this
          marks for any purpose without Drkay Medibeauty Sdn. Bhd. prior written
          permission.
        </p>
      </div>
      <div>
        <h2 className="text-lg font-semibold">
          2. PROPRIETARY RIGHTS TO CONTENT
        </h2>
        <p className="text-neutral-500">
          All materials contained in this website are copyrighted. User
          acknowledge and agrees that content in this website such as music,
          sound, photographs, video, graphics or other material contains in this
          website is protected by copyrights, trademarks, service marks, patents
          or other proprietary rights and laws. User understand and agrees that
          user is not permitted to copy, republish, reproduce, distribute or
          create published work from this website.
        </p>
      </div>
      <div>
        <h2 className="text-lg font-semibold">3. USE OF THE SITE</h2>
        <p className="text-neutral-500">
          If you wish to access to the website, you may be required to apply and
          maintain a user account. To do so, you need to complete the
          registration process. During the registration process, you agree to
          provide true, accurate, current and complete information about
          yourself. DRKAY MEDIBEAUTY SDN. BHD. will have no liable for failure
          to deliver information, notifications, or otherwise that result from
          inaccurate account information or otherwise.
          <br />
          <br />
          In any cases when the Registration Information is found to be untrue,
          inaccurate, not current or incomplete, DRKAY MEDIBEAUTY SDN. BHD. has
          the right to suspend or terminate your account and refuse any and all
          current or future use of the site. You will be required to provide
          your chosen user name and password during the registration process.
          <br />
          <br />
          In addition, DRKAY MEDIBEAUTY SDN. BHD. may suspend, remove or revoke
          any registration if the account remains inactive for more than 6-12
          consecutive months or if Drkay Medibeauty Sdn. Bhd. believes that the
          information provided is untrue, illegal, defamatory or offensive in
          any way.
        </p>
      </div>
      <div>
        <h2 className="text-lg font-semibold">4. LIMITATION OF LIABILITY</h2>
        <p className="text-neutral-500">
          User agrees and understand that DRKAY MEDIBEAUTY SDN. BHD. shall not
          be liable for any loss or damage (direct, indirect, incidental, exempt
          or otherwise) resulting from any use of, or inability to use the
          website, or resulting from any errors from the site. You agree that
          your use of this website is at your sole risk. This website is
          provided “as is”, “as available” basis without warranties of any kind,
          either express or implied. Drkay Medibeauty Sdn. Bhd. does not
          warranty that this website is free from errors or viruses, worms,
          malware, spyware, adware or otherwise and is not liable for any
          damages you may suffer as a result of such destructive features.
        </p>
      </div>
      <div>
        <h2 className="text-lg font-semibold">5. DISCLAIMER OF WARRANTIES</h2>
        <p className="text-neutral-500">
          Drkay Medibeauty Sdn. Bhd. makes no warranty that this website will
          meet you requirements or that it will be uninterrupted, timely, secure
          or error free. Under no circumstances, including negligence, Drkay
          Medibeauty Sdn. Bhd. shall not be responsible or liable for any lost,
          punitive, incidental, direc or indirect or consequential damages
          incurred by you or by any other party in respect of these terms and
          conditions and the use of the website.
        </p>
      </div>
    </section>
  );
}
