import { ProductsItem, ItemStatus } from "@/types";

const defaultStatus: ItemStatus = {
  isDisabled: false,
  isHidden: false,
  isComingSoon: false,
  isPromo: false,
  isBestSeller: false,
};

export const products: ProductsItem[] = [
  {
    id: "product-1",
    src: "/Images/product-banner-1.jpg",
    alt: "Product Image 1",
    name: "GENTLE EXFOLIATING GEL CLEANSER",
    description: [
      "Suitable for ALL SKIN TYPES",
      "SLES, PARABEN FREE",
      "An effective exfoliating facial gel cleanser which contain Alpha Hydroxy Acid (AHA) and Beta Hydroxy Acid (BHA) to mildly slough away dead cells. This purifying gel cleanser effortlessly lifts and removed environmental pollutants, makeup, excess sebum and bacteria while decongesting pores to leave your skin feeling refreshed and calm. Regular usage will remarkably improves skin's tone & texture, hydrate and condition skin making the skin sleek , clear , radiant & even- toned.",
    ],
    additionalInfo1: [
      "Water, Coco Beatine, Glycerine, Polysorbate 20, Phenoxythenol, Xanthum Gum, Propylene Glycol, Glycolic acid, Salicylic Acid, Fragrance",
    ],
    additionalInfo2: [
      "1. Wet face and apply a small amount of cleanser (1-2 pumps) to your face and eye area with vigorous, yet gentle, circular motion.",
      "2. Rinse well.",
      "3. To remove heavy makeup, repeat or use with a clean, wet washcloth.",
    ],
    currency: "RM",
    status: { ...defaultStatus },
    variants: [
      {
        id: "variant-1",
        variantName: "Size",
        options: [
          {
            id: "option-1",
            optionName: "50ml (1.7oz)",
            weight: 1.0,
            width: 1.0,
            length: 1.0,
            height: 1.0,
            currency: "RM",
            unitPrice: 70.0,
            originalPrice: 70.0,
            currentPrice: 70.0,
          },
        ],
      },
    ],
  },
  {
    id: "product-2",
    src: "/Images/product-banner-2.jpg",
    alt: "Product Image 2",
    name: "NIGHT REPAIR BRIGHTENING SERUM",
    description: [
      "Suitable for ALL SKIN TYPES.",
      "SLES, PARABEN FREE",
      "Helps to minimise the appearance of hyperpigmentation (sun spots, age spots and post-breakout marks) and improving the plumpness, and firmness of the skin",
    ],
    additionalInfo1: [
      "Water, Glycerine, Phenoxyethenol, Xanthum Gum, Propylene glycol, Hyaluronic Acid, Kojic Acid, Alpha arbutin, Cucumber extract, Fragrance.",
    ],
    additionalInfo2: [
      "1. Smooth a few drops onto face, neck and eye area before moisturising.",
      "2. For optimal results, use twice daily day and night.",
    ],
    currency: "RM",
    status: { ...defaultStatus },
    variants: [
      {
        id: "variant-2",
        variantName: "Size",
        options: [
          {
            id: "option-2",
            optionName: "15ml (0.5oz)",
            weight: 1.0,
            width: 1.0,
            length: 1.0,
            height: 1.0,
            currency: "RM",
            unitPrice: 85.0,
            originalPrice: 85.0,
            currentPrice: 85.0,
          },
        ],
      },
    ],
  },
  {
    id: "product-3",
    src: "/Images/product-banner-3.jpg",
    alt: "Product Image 3",
    name: "KAWSA COMPLETE SKINCARE SET",
    description: [
      "This KAWSA Skincare set will help you achieve glowing and brighter complexion. The set includes all 3 products:",
      "1. Gentle Exfoliating Gel Cleanser 50ml",
      "2. Night Repair Brightening Serum 15ml",
      "3. Hydrate + Brighten Facial Moisturiser 30g",
    ],
    additionalInfo1: [""],
    additionalInfo2: [""],
    currency: "RM",
    status: { ...defaultStatus },
    variants: [
      {
        id: "variant-3",
        variantName: "Package",
        options: [
          {
            id: "option-3",
            optionName: "1 Set",
            weight: 1.0,
            width: 1.0,
            length: 1.0,
            height: 1.0,
            currency: "RM",
            unitPrice: 210.0,
            originalPrice: 210.0,
            currentPrice: 210.0,
          },
        ],
      },
    ],
  },
  {
    id: "product-4",
    src: "/Images/product-banner-4.jpg",
    alt: "Product Image 4",
    name: "HYDRATE + BRIGHTEN FACIAL MOISTURISER",
    description: [
      "Suitable for ALL SKIN TYPES.",
      "SLES, PARABEN FREE | HYPOALLERGENIC | NON-COMEDOGENIC",
      "This ideal multi-tasker is perfect for those struggling with signs of ageing and hyperpigmentation. Alpha Arbutin and Pitera join forces to provide immediate hydration while nourishing, maintaining healthier, younger-looking skin and a brighter complexion. Cucumber and Aloe Vera extract infused to soothe and calm the appearance of redness and sensitivity while further moisten the skin.",
    ],
    additionalInfo1: [
      "Distilled Water, Glyceryl Monostearate (GMS), White Oil, Capric Triglycerides, Aloevera Oil, Glycerine, Shea Butter, Simethicone350, Stearic Acid, Proplene Glycol, Cucumber Extract, Phenoxyethanol, Polysorbate 20, Carbomer, Titanium Dioxide, Tetraethanolamine (TEA), Aloevera Extract, Pitera, Collagen, Alpha Arbutin, Pearl, Fragrance.",
    ],
    additionalInfo2: [
      "1. Apply moisturiser gently in a circular, upward motion, and pat gently around eye area.",
      "2. Aim to moisturise twice a day on a cleansed face and after applying serum.",
    ],
    currency: "RM",
    status: { ...defaultStatus },
    variants: [
      {
        id: "variant-4",
        variantName: "Size",
        options: [
          {
            id: "option-4",
            optionName: "30g (1oz)",
            weight: 1.0,
            width: 1.0,
            length: 1.0,
            height: 1.0,
            currency: "RM",
            unitPrice: 75.0,
            originalPrice: 75.0,
            currentPrice: 75.0,
          },
        ],
      },
    ],
  },
  {
    id: "product-5",
    src: "/Images/product-banner-5.jpg",
    alt: "Product Image 5",
    name: "KAWSA MASK",
    description: [
      "A luxurious hydrating facial mask crafted to deeply nourish, soothe, and rejuvenate your skin. Infused with natural botanical extracts, Kawsa Mask delivers instant moisture, enhances skin elasticity, and restores a youthful glow. Perfect for all skin types, it leaves your complexion feeling refreshed, radiant, and silky smooth after every use.",
    ],
    additionalInfo1: [
      "Aqua (Water), Glycerin, Niacinamide, Aloe Barbadensis Leaf Extract, Camellia Sinensis (Green Tea) Extract, Centella Asiatica Extract, Sodium Hyaluronate, Collagen, Panthenol (Vitamin B5), Allantoin, Tocopheryl Acetate (Vitamin E), Carbomer, Phenoxyethanol, Ethylhexylglycerin, Fragrance.",
    ],
    additionalInfo2: [
      "1. Cleanse your face thoroughly and pat dry.",
      "2. Apply an even layer of Kawsa Mask over the face, avoiding the eye and lip areas.",
      "3. Leave on for 10–15 minutes to allow full absorption of nutrients.",
      "4. Rinse off gently with lukewarm water and follow with your regular skincare routine.",
      "5. Use 2–3 times a week for optimal results.",
    ],
    currency: "RM",
    status: { ...defaultStatus },
    variants: [
      {
        id: "variant-5",
        variantName: "Package",
        options: [
          {
            id: "option-5",
            optionName: "1 Piece",
            weight: 1.0,
            width: 1.0,
            length: 1.0,
            height: 1.0,
            currency: "RM",
            unitPrice: 38.0,
            originalPrice: 38.0,
            currentPrice: 38.0,
          },
          {
            id: "option-6",
            optionName: "1 Box",
            weight: 1.0,
            width: 1.0,
            length: 1.0,
            height: 1.0,
            currency: "RM",
            unitPrice: 115.0,
            originalPrice: 115.0,
            currentPrice: 115.0,
          },
        ],
      },
    ],
  },
] satisfies ProductsItem[];
