import { Merriweather } from "next/font/google";
import { Spectral } from "next/font/google";

export const merriweather = Merriweather({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

export const spectral = Spectral({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});
