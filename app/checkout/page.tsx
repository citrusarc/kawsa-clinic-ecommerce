"use client";

import Image from "next/image";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import ReactCountryFlag from "react-country-flag";
import { Country, State, City } from "country-state-city";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useCheckout } from "@/components/store/Checkout";
import { useCart } from "@/components/store/Cart";

const formSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  countryCode: z.string().min(1, "Select country code"),
  phoneNumber: z.string().min(6, "Enter valid phone number"),
  addressLine1: z.string().min(1, "Address line 1 is required"),
  addressLine2: z.string().optional(),
  state: z.string().min(1, "Please select your state"),
  city: z.string().min(1, "Please select your state"),
  postcode: z
    .string()
    .min(5, "Postcode must be 5 digits")
    .max(5, "Postcode must be 5 digits"),
  country: z.string().min(1, "Please select your country"),
});

export default function CheckoutPage() {
  const { items, total } = useCheckout();
  const clearCart = useCart((s) => s.clearCart);
  const [submitting, setSubmitting] = useState(false);
  const [country, setCountry] = useState("Malaysia");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [postcode, setPostcode] = useState("");

  const states = State.getStatesOfCountry(
    Country.getAllCountries().find((c) => c.name === country)?.isoCode || "MY"
  );

  const cities =
    City.getCitiesOfState(
      Country.getAllCountries().find((c) => c.name === country)?.isoCode ||
        "MY",
      states.find((s) => s.name === selectedState)?.isoCode || ""
    ) || [];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      countryCode: "+60",
      phoneNumber: "",
      addressLine1: "",
      addressLine2: "",
      state: "",
      city: "",
      postcode: "",
      country: "Malaysia",
    },
  });

  const {
    formState: { errors },
  } = form;

  // SAVE STATE IF FAIL
  useEffect(() => {
    const savedData = localStorage.getItem("checkoutData");
    if (savedData) {
      const parsed = JSON.parse(savedData);
      form.reset({
        fullName: parsed.fullName,
        email: parsed.email,
        countryCode: parsed.phoneNumber.slice(0, 3),
        phoneNumber: parsed.phoneNumber.slice(3),
        addressLine1: parsed.address.split(",")[0] || "",
        addressLine2: parsed.address.split(",")[1]?.trim() || "",
        postcode: parsed.address.split(",")[2]?.trim() || "",
        city: parsed.address.split(",")[3]?.trim() || "",
        state: parsed.address.split(",")[4]?.trim() || "",
        country: parsed.address.split(",")[5]?.trim() || "Malaysia",
      });
    }
  }, []);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setSubmitting(true);
    try {
      const payload = {
        fullName: values.fullName,
        email: values.email,
        phoneNumber: `${values.countryCode}${values.phoneNumber}`,
        address: `${values.addressLine1}${
          values.addressLine2 ? ", " + values.addressLine2 : ""
        }, ${values.postcode}, ${values.city}, ${values.state}, ${
          values.country
        }`,
        totalPrice: total,
        shippingFee: 10, //
        paymentMethod: "fpx", //
        courierName: "J&T", //
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId || null,
          variantOptionId: item.variantOptionId || null,
          itemName: item.name,
          itemCurrency: "RM",
          itemUnitPrice: item.currentPrice ?? item.unitPrice,
          itemQuantity: item.quantity,
        })),
      };

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        localStorage.setItem("checkoutData", JSON.stringify(payload));
        throw new Error(data.error || "Failed to submit order");
      }

      if (typeof clearCart === "function") clearCart();
      localStorage.removeItem("cartItems");
      localStorage.removeItem("checkoutData");

      window.location.href = data.checkout_url;
      form.reset();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Error submitting booking";
      console.log(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="flex flex-col gap-8 py-8 p-4 sm:p-24">
      {items.length === 0 ? (
        <div className="space-y-4 sm:space-y-8">
          <h2 className="text-xl font-semibold text-violet-600">
            Nothing to checkout
          </h2>
          <p className="text-neutral-400">
            Looks like you haven’t added any items to your cart.
          </p>
          <Link
            href="/shop-our-products"
            className="block p-4 w-fit rounded-lg overflow-hidden cursor-pointer border border-violet-600 text-violet-600 bg-white hover:text-white hover:bg-violet-600"
          >
            Explore Our Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-16 w-full">
          <div className="order-2 sm:order-1 space-y-4 sm:space-y-8">
            <h2 className="text-xl font-semibold text-violet-600">
              Order Summary
            </h2>
            <div className="flex flex-col gap-4 sm:gap-8">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 items-start">
                  <div className="relative shrink-0 w-32 h-32 rounded-xl sm:rounded-2xl overflow-hidden">
                    <Image
                      fill
                      src={item.src}
                      alt={item.name}
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="line-clamp-2 wrap-break-words font-semibold">
                      {item.name}
                    </p>
                    <p className="text-neutral-400">
                      Quantity: {item.quantity}
                    </p>
                    <p className="text-violet-600 font-semibold">
                      RM {item.totalPrice}
                    </p>
                  </div>
                </div>
              ))}
              <p className="text-xl font-semibold">
                Total: RM{total.toFixed(2)}
              </p>
            </div>
          </div>
          <div className="order-1 sm:order-2 p-6 sm:p-8 w-full h-fit rounded-2xl sm:rounded-4xl overflow-hidden shadow-md border border-neutral-200 text-neutral-600 bg-white">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6 sm:space-y-8"
              >
                {/* Name */}
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel
                        className={`${
                          errors.fullName ? "text-red-600" : "text-neutral-400"
                        }`}
                      >
                        Full Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="John Doe"
                          className="w-full h-12 items-center justify-start text-left rounded-xl sm:rounded-2xl"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col sm:flex-row gap-6 sm:gap-4">
                  {/* Email */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel
                          className={`${
                            errors.email ? "text-red-600" : "text-neutral-400"
                          }`}
                        >
                          Email
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            {...field}
                            placeholder="example@example.com"
                            className="w-full h-12 items-center justify-start text-left rounded-xl sm:rounded-2xl"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* PhoneNumber */}
                  <div className="space-y-1 flex-1">
                    <h2
                      className={`text-sm font-medium ${
                        errors.countryCode || errors.phoneNumber
                          ? "text-red-600"
                          : "text-neutral-400"
                      }`}
                    >
                      Phone Number
                    </h2>
                    <div className="flex w-full gap-2">
                      <FormField
                        control={form.control}
                        name="countryCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <SelectTrigger className="h-12! rounded-xl sm:rounded-2xl">
                                  <SelectValue placeholder="+60">
                                    {field.value}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent
                                  align="start"
                                  className="rounded-xl sm:rounded-2xl"
                                >
                                  <SelectItem
                                    value="+60"
                                    className="h-12 rounded-xl sm:rounded-2xl"
                                  >
                                    <ReactCountryFlag
                                      countryCode="MY"
                                      svg
                                      style={{
                                        width: "20px",
                                        height: "20px",
                                      }}
                                    />
                                    <span>Malaysia (+60)</span>
                                  </SelectItem>
                                  <SelectItem
                                    value="+62"
                                    className="h-12 rounded-xl sm:rounded-2xl"
                                  >
                                    <ReactCountryFlag
                                      countryCode="ID"
                                      svg
                                      style={{
                                        width: "20px",
                                        height: "20px",
                                      }}
                                    />
                                    <span>Indonesia (+62)</span>
                                  </SelectItem>
                                  <SelectItem
                                    value="+65"
                                    className="h-12 rounded-xl sm:rounded-2xl"
                                  >
                                    <ReactCountryFlag
                                      countryCode="SG"
                                      svg
                                      style={{
                                        width: "20px",
                                        height: "20px",
                                      }}
                                    />
                                    <span>Singapore (+65)</span>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="123456789"
                                className="w-full h-12 items-center justify-start text-left rounded-xl sm:rounded-2xl"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    {(errors.countryCode || errors.phoneNumber) && (
                      <p className="mt-2 text-sm text-red-600">
                        {errors.countryCode?.message ||
                          errors.phoneNumber?.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-1 flex-1">
                  <h2
                    className={`text-sm font-medium ${
                      errors.addressLine1 ||
                      errors.addressLine2 ||
                      errors.state ||
                      errors.city ||
                      errors.postcode ||
                      errors.country
                        ? "text-red-600"
                        : "text-neutral-400"
                    }`}
                  >
                    Address
                  </h2>
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                      {/* Address Line 1 */}
                      <FormField
                        control={form.control}
                        name="addressLine1"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Address Line 1"
                                className="w-full h-12 items-center justify-start text-left rounded-xl sm:rounded-2xl"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {/* Address Line 2 */}
                      <FormField
                        control={form.control}
                        name="addressLine2"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Address Line 2 (Optional)"
                                className="w-full h-12 items-center justify-start text-left rounded-xl sm:rounded-2xl"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                      {/* State */}
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Select
                                onValueChange={(value) => {
                                  setSelectedState(value);
                                  setSelectedCity("");
                                  form.setValue("state", value);
                                }}
                                value={selectedState}
                              >
                                <SelectTrigger
                                  className={`w-full h-12! rounded-xl sm:rounded-2xl border ${
                                    errors.state
                                      ? "border-red-600"
                                      : "border-neutral-200"
                                  }`}
                                >
                                  <SelectValue placeholder="Select state...">
                                    {field.value}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent
                                  align="start"
                                  className="rounded-xl sm:rounded-2xl"
                                >
                                  {states.map((state) => (
                                    <SelectItem
                                      key={state.isoCode}
                                      value={state.name}
                                    >
                                      {state.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {/* City */}
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Select
                                onValueChange={(value) => {
                                  setSelectedCity(value);
                                  form.setValue("city", value);
                                }}
                                value={selectedCity}
                              >
                                <SelectTrigger
                                  className={`w-full h-12! rounded-xl sm:rounded-2xl border ${
                                    errors.state
                                      ? "border-red-600"
                                      : "border-neutral-200"
                                  }`}
                                >
                                  <SelectValue placeholder="Select city...">
                                    {field.value}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent
                                  align="start"
                                  className="rounded-xl sm:rounded-2xl"
                                >
                                  {cities.map((city) => (
                                    <SelectItem
                                      key={city.name}
                                      value={city.name}
                                    >
                                      {city.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                      {/* Postcode */}
                      <FormField
                        control={form.control}
                        name="postcode"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="12345"
                                value={postcode}
                                onChange={(e) => {
                                  setPostcode(e.target.value);
                                  field.onChange(e.target.value);
                                }}
                                className="w-full h-12 items-center justify-start text-left rounded-xl sm:rounded-2xl"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {/* Country */}
                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Select
                                onValueChange={(value) => {
                                  setCountry(value);
                                  setSelectedState("");
                                  setSelectedCity("");
                                  form.setValue("country", value);
                                }}
                                value={country}
                              >
                                <SelectTrigger className="w-full h-12! rounded-xl sm:rounded-2xl">
                                  <SelectValue>{field.value}</SelectValue>
                                </SelectTrigger>
                                <SelectContent
                                  align="start"
                                  className="rounded-xl sm:rounded-2xl"
                                >
                                  {Country.getAllCountries().map((country) => (
                                    <SelectItem
                                      key={country.name}
                                      value={country.name}
                                    >
                                      {country.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  {(errors.addressLine1 ||
                    errors.addressLine2 ||
                    errors.state ||
                    errors.city ||
                    errors.postcode ||
                    errors.country) && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.addressLine1?.message ||
                        errors.addressLine2?.message ||
                        errors.state?.message ||
                        errors.city?.message ||
                        errors.postcode?.message ||
                        errors.country?.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="p-4 w-full sm:w-fit rounded-lg overflow-hidden cursor-pointer border border-violet-600 text-white bg-violet-600 hover:text-violet-600 hover:bg-white"
                >
                  {submitting ? "Submitting..." : "Place Order"}
                </button>
              </form>
            </Form>
          </div>
        </div>
      )}
    </section>
  );
}
