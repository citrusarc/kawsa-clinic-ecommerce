"use client";

import { ToastProps, ToastType } from "@/types";

export function Toast({
  message,
  type = "default",
}: ToastProps & { type?: ToastType }) {
  const colors = {
    default: "bg-neutral-100 text-neutral-800",
    success: "bg-green-100 text-green-800",
    error: "bg-red-100 text-red-800",
  };

  return (
    <div className="fixed top-12 right-0 z-9999 p-4 w-full sm:w-96 h-fit">
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative p-4 rounded-2xl shadow-md ${colors[type]}`}
      >
        <p>{message}</p>
      </div>
    </div>
  );
}
