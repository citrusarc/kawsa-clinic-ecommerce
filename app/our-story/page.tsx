import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "iconoir-react";

import { spectral } from "@/config/font";

const images = [
  {
    src: "/Images/our-story-banner-1.jpg",
    alt: "Our Story Banner 1",
    title: "PROTECT",
  },
  {
    src: "/Images/our-story-banner-2.jpg",
    alt: "Our Story Banner 2",
    title: "SHINE",
  },
  {
    src: "/Images/our-story-banner-3.jpg",
    alt: "Our Story Banner 3",
    title: "CONFIDENT",
  },
];

const partners = [
  {
    name: "PRESTIGE MEDISPA GOMBAK",
    address:
      "No 1, 03A, Jalan Prima SG 1, Prima Seri Gombak, 68100 Batu Caves, Selangor",
    href: "https://maps.app.goo.gl/VZeq1XmtYDd2pyt58",
  },
  {
    name: "PRESTIGE MEDISPA AMPANG",
    address:
      "100A, Lrg Memanda 2, Taman Dato Ahmad Razali, 68000 Ampang, Selangor",
    href: "https://maps.app.goo.gl/kW4Z5C52MNDaDrha7",
  },
  {
    name: "PRESTIGE MEDISPA JOHOR BAHRU",
    address:
      "39-01, 8, Jalan Padi Emas 1, Bandar Baru Uda, 81200 Johor Bahru, Johor",
    href: "https://maps.app.goo.gl/6wCYwSA7UmQ87v587",
  },
  {
    name: "FS PHARMACY PLT",
    address:
      "Lot 6, 01, Jalan Dataran Larkin 6, TAMAN DATARAN LARKIN, 80350 Johor Bahru, Johor Darul Ta'zim",
    href: "https://maps.app.goo.gl/tepmnpcUKstTrxnGA",
  },
];

export default function OurStoryPage() {
  return (
    <section className="flex flex-col p-4 sm:p-24 gap-8 sm:gap-16">
      <h2 className={`text-4xl sm:text-6xl ${spectral.className} text-black`}>
        The Story Behind the Glow
      </h2>
      <div className="w-full h-72 sm:h-150 overflow-hidden">
        <Image
          src="/Images/our-story-hero-banner.png"
          alt="Our Story Hero Banner"
          width={1600}
          height={1600}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex flex-col sm:flex-row gap-8 sm:gap-16 py-8 sm:py-24">
        <div className="flex flex-col gap-8 sm:gap-16 w-full sm:w-1/2 text-md sm:text-lg">
          <h2
            className={`text-4xl sm:text-6xl ${spectral.className} text-black`}
          >
            Made for Your Skin
          </h2>
          <p className="text-neutral-500">
            Kawsa Skincare was founded by Dr. Kauthar Ismail (MBBS, MSc Healthy
            Aging, Medical Aesthetic & Regenerative Medicine), a medical doctor
            passionate about anti-aging and wellness. With over nine years of
            experience, Dr. Kauthar and her team at Prestige Medispa Malaysia
            have treated skin concerns such as acne, hyperpigmentation, and
            irregularities since 2017.
          </p>
          <p className="text-neutral-500">
            Over time, they saw how many Malaysians suffered from using
            unsuitable or even mercury-based products. This inspired the
            creation of Kawsa Skincare: safe, effective formulas free from
            SLES/SLS, parabens, mercury, and heavy metals.
          </p>
          <p className="text-neutral-500">
            At Kawsa, we believe skincare should not harm. It should heal,
            protect, and give you the confidence to feel good in your own skin.
          </p>
        </div>
        <div className="w-full sm:w-1/2 max-h-128 aspect-square overflow-hidden">
          <Image
            src="/Images/our-story-banner-1.png"
            alt="Our Story Banner 1"
            width={1600}
            height={1600}
            className="object-cover object-top w-full h-full"
          />
        </div>
      </div>
      <div className="-mx-4 sm:-mx-24 w-screen">
        <div className="grid grid-cols-1 sm:grid-cols-3 w-full h-[640px]">
          {images.map((item, index) => (
            <div
              key={index}
              className="relative w-full h-full overflow-hidden group"
            >
              <Image
                fill
                src={item.src}
                alt={item.alt}
                className="object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/15" />
              <h1
                className={`absolute inset-0 flex items-center justify-center text-2xl sm:text-4xl ${spectral.className} text-center text-white`}
              >
                {item.title}
              </h1>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col py-8 sm:py-24 gap-8 sm:gap-16 font-medium text-black">
        <div>
          <h2 className={`text-4xl sm:text-6xl ${spectral.className}`}>
            Your Nearest Kawsa Partner
          </h2>
          <p className="italic text-neutral-500">
            Also used in treatments at Prestige Medispa.
          </p>
        </div>
        {partners.map((item, index) => (
          <div key={index}>
            <h2 className={`text-lg font-semibold ${spectral.className}`}>
              {index + 1}. {item.name}
            </h2>
            <Link
              target="_blank"
              rel="noopener noreferrer"
              href={item.href}
              className="flex gap-2 items-center hover:underline text-neutral-500"
            >
              {item.address}
              <ArrowUpRight className="hidden sm:block w-5 h-5" />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
