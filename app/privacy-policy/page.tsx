import { spectral } from "@/config/font";

export default function PrivacyPolicyPage() {
  return (
    <section className="flex flex-col p-4 sm:p-24 gap-8 sm:gap-16 font-medium text-black">
      <h2 className={`text-4xl sm:text-6xl ${spectral.className}`}>
        Privacy Policy
      </h2>
      <p className="text-neutral-500">Description</p>
      <div>
        <h2 className="text-lg font-semibold">Title</h2>
        <p className="text-neutral-500">Content description</p>
      </div>
    </section>
  );
}
