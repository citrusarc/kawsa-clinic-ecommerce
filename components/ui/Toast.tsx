"use client";

import { ToastProps } from "@/types";

export function Toast({ message }: ToastProps) {
  return (
    <div className="flex fixed inset-0 z-9999 p-4 items-center justify-center">
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col gap-4 p-4 w-full sm:w-96 rounded-2xl bg-white"
      >
        <p className="text-neutral-600">{message}</p>
      </div>
    </div>
  );
}
