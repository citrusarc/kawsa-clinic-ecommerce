import HeroSection from "@/components/sections/Hero";
import OverviewSection from "@/components/sections/Overview";
import ProductsSection from "@/components/sections/Products";
import IngredientsSection from "@/components/sections/Ingredients";
import TestimonialSection from "@/components/sections/Testimonial";

export default function Home() {
  return (
    <>
      <HeroSection />
      <OverviewSection />
      <ProductsSection />
      <IngredientsSection />
      <TestimonialSection />
    </>
  );
}
