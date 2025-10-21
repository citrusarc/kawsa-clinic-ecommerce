import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Flower } from "iconoir-react";

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
      <div className="relative -m-4 sm:-m-24 w-screen">
        <div className="w-full h-72 sm:h-150">
          <Image
            src="/Images/our-story-hero-banner.png"
            alt="Our Story Hero Banner"
            width={1600}
            height={1600}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-violet-600/50" />
        <h2
          className={`absolute inset-0 flex items-center justify-center text-center text-4xl sm:text-6xl ${spectral.className} text-white`}
        >
          The Story Behind the Glow
        </h2>
      </div>
      <div className="flex flex-col sm:flex-row gap-8 sm:gap-16 py-8 sm:py-24 mt-4 sm:mt-24">
        <div className="flex flex-col gap-8 sm:gap-16 w-full sm:w-1/2 text-md sm:text-lg">
          <h2
            className={`text-4xl sm:text-6xl ${spectral.className} text-violet-600`}
          >
            Made for Your Skin
          </h2>
          <p className="text-neutral-500">
            Kawsa Skincare was founded by Dr. Kauthar Ismail (MBBS, MSc Healthy
            Aging, Medical Aesthetic & Regenerative Medicine), a medical doctor
            deeply passionate about anti-aging and wellness. With over 9 years’
            experience, she and her team at Prestige Medispa Malaysia have been
            treating skin concerns such as acne, hyperpigmentation and
            irregularities.
          </p>
          <p className="text-neutral-500">
            Over time, they noticed the alarmingly high number of Malaysians
            using unsuitable — sometimes even mercury-based — skincare products.
            This realisation prompted the creation of Kawsa Skincare: safe,
            effective formulas free from SLES/SLS, parabens, mercury and heavy
            metals.
          </p>
          <p className="text-neutral-500">
            At Kawsa, we believe skincare should not harm. It should heal,
            protect and give you the confidence to feel good in your own skin.
          </p>
          <div className="flex flex-col sm:flex-row gap-8 w-full items-center">
            <p
              className={`flex flex-col p-4 gap-4 w-full h-36 items-center justify-center text-center rounded-2xl overflow-hidden text-2xl ${spectral.className} text-violet-200 bg-violet-800`}
            >
              <Flower
                style={{ strokeWidth: 1 }}
                className="w-16 h-16 text-violet-400"
              />
              Since 2017
            </p>
            <p
              className={`flex flex-col p-4 gap-4 w-full h-36 items-center justify-center text-center rounded-2xl overflow-hidden text-2xl ${spectral.className} text-violet-200 bg-violet-800`}
            >
              <Flower
                style={{ strokeWidth: 1 }}
                className="w-16 h-16 text-violet-400"
              />
              16,500+ Clients
            </p>
            <p
              className={`flex flex-col p-4 gap-4 w-full h-36 items-center justify-center text-center rounded-2xl overflow-hidden text-2xl ${spectral.className} text-violet-200 bg-violet-800`}
            >
              <Flower
                style={{ strokeWidth: 1 }}
                className="w-16 h-16 text-violet-400"
              />
              Across Malaysia
            </p>
          </div>
        </div>
        <div className="w-full sm:w-1/2 aspect-square overflow-hidden">
          <Image
            src="/Images/our-story-hero-banner-2.jpg"
            alt="Our Story Banner 1"
            width={640}
            height={640}
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
      <div className="flex flex-col p-8 sm:px-8 sm:py-24 gap-8 sm:gap-16 rounded-4xl overflow-hidden font-medium bg-violet-600">
        <div>
          <h2
            className={`text-4xl sm:text-6xl ${spectral.className} text-white`}
          >
            Your Nearest Kawsa Partner
          </h2>
          <p className="italic text-violet-300">
            Also used in treatments at Prestige Medispa.
          </p>
        </div>
        {partners.map((item, index) => (
          <div key={index}>
            <h2
              className={`text-lg font-semibold ${spectral.className} text-amber-400`}
            >
              {index + 1}. {item.name}
            </h2>
            <Link
              target="_blank"
              rel="noopener noreferrer"
              href={item.href}
              className="flex gap-2 items-center hover:underline text-violet-200"
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
