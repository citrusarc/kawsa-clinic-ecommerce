"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, use } from "react";
import { NavArrowLeft, NavArrowRight } from "iconoir-react";

import { supabase } from "@/utils/supabase/client";
import { spectral } from "@/config/font";
import { ProductsItem } from "@/types";

interface ProductDetailsProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetailsPage({ params }: ProductDetailsProps) {
  const { id } = use(params);
  const [product, setProduct] = useState<ProductsItem | null>(null);
  const [products, setProducts] = useState<ProductsItem[]>([]);
  const [itemsToShow, setItemsToShow] = useState(4);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: prod, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single<ProductsItem>();

      if (!error && prod) {
        setProduct(prod);
      }

      const { data: others } = await supabase
        .from("products")
        .select("*")
        .neq("id", id)
        .returns<ProductsItem[]>();

      setProducts(
        (others || []).filter(
          (item) => !item.status?.isHidden && !item.status?.isDisabled
        )
      );
      setLoading(false);
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    const updateItemsToShow = () => {
      setItemsToShow(window.innerWidth < 640 ? 1 : 4);
      setCurrentIndex(0);
    };
    updateItemsToShow();
    window.addEventListener("resize", updateItemsToShow);
    return () => window.removeEventListener("resize", updateItemsToShow);
  }, []);

  const handlePrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? products.length - itemsToShow : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prev) =>
      prev >= products.length - itemsToShow ? 0 : prev + 1
    );
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  if (!product)
    return <div className="p-8 text-center">Product not found.</div>;

  return (
    <section className="flex flex-col gap-8 p-4 sm:p-24 items-start justify-center">
      <div className="flex flex-col sm:flex-row gap-8 sm:gap-16 w-full">
        <div className="relative w-full sm:w-1/2 max-w-2xl aspect-square">
          <Image
            fill
            src={product.src}
            alt={product.alt}
            className="object-cover"
          />
        </div>
        <div className="flex flex-col gap-8 sm:gap-16 w-full sm:w-1/2 text-md sm:text-lg">
          <h2
            className={`text-4xl sm:text-6xl ${spectral.className} text-black`}
          >
            {product.name}
          </h2>
          <div className="flex flex-col gap-8">
            {product.description?.map((paragraph: string, index: number) => (
              <p key={index} className="text-neutral-500">
                {paragraph}
              </p>
            ))}
          </div>
          <p className="text-2xl sm:text-4xl text-black">
            {product.currency}
            {product.price}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <button className="p-4 w-full cursor-pointer border text-violet-600 bg-white border-violet-600 hover:text-white hover:bg-violet-600 hover:border-white">
              ADD TO CART
            </button>
            <button className="p-4 w-full cursor-pointer border text-white bg-violet-600 hover:text-violet-600 hover:bg-white hover:border-violet-600">
              BUY NOW
            </button>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-8 sm:gap-16 py-8 sm:py-24 w-full text-left">
        <h2 className={`text-4xl sm:text-6xl ${spectral.className} text-black`}>
          INGREDIENTS
        </h2>
        <div className="flex flex-col gap-8">
          {product.additionalInfo1?.map((paragraph: string, index: number) => (
            <p key={index} className="text-neutral-500">
              {paragraph}
            </p>
          ))}
        </div>
        <h2 className={`text-4xl sm:text-6xl ${spectral.className} text-black`}>
          DIRECTIONS
        </h2>
        <div className="flex flex-col gap-8">
          {product.additionalInfo2?.map((paragraph: string, index: number) => (
            <p key={index} className="text-neutral-500">
              {paragraph}
            </p>
          ))}
        </div>
        <h2 className={`text-4xl sm:text-6xl ${spectral.className} text-black`}>
          YOU MAY ALSO LIKE
        </h2>
        <div className="relative w-full flex items-center">
          <button
            onClick={handlePrev}
            className="flex sm:hidden absolute left-0 z-10 p-2 rounded-full shadow text-black hover:text-white bg-white hover:bg-violet-600 "
          >
            <NavArrowLeft className="w-6 h-6 " />
          </button>

          <div className="w-full overflow-hidden ">
            <div
              className={`flex transition-transform duration-500 ${
                itemsToShow === 4 ? "gap-8" : ""
              }`}
              style={{
                transform: `translateX(-${
                  (currentIndex * 100) / itemsToShow
                }%)`,
              }}
            >
              {products.map((item, index) => (
                <div
                  key={index}
                  className={`flex flex-col flex-shrink-0 gap-4 items-center text-center`}
                  style={{
                    flex:
                      itemsToShow === 1
                        ? "0 0 100%"
                        : `0 0 calc(${100 / itemsToShow}% - ${
                            itemsToShow === 4 ? "2rem" : "0rem"
                          })`,
                  }}
                >
                  <Link
                    key={item.id}
                    href={`/shop-our-products/${item.id}`}
                    className="flex flex-col gap-4 w-full items-center text-center border border-transparent hover:border-violet-600"
                  >
                    <div className="relative w-full aspect-square">
                      <Image
                        fill
                        src={item.src}
                        alt={item.alt}
                        className="object-cover"
                      />
                    </div>
                    <h2
                      className={`w-80 text-lg sm:text-xl font-semibold ${spectral.className}`}
                    >
                      {item.name}
                    </h2>
                    <p className="text-neutral-500">
                      {item.currency}
                      {item.price}
                    </p>
                  </Link>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={handleNext}
            className="flex sm:hidden absolute right-0 z-10 p-2 rounded-full shadow text-black hover:text-white bg-white hover:bg-violet-600 "
          >
            <NavArrowRight className="w-6 h-6 " />
          </button>
        </div>
      </div>
    </section>
  );
}
