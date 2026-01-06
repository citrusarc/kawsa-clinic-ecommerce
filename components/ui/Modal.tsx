"use client";

import ReactDOM from "react-dom";
import { useEffect } from "react";

import { ModalProps } from "@/types";

export function Modal({ title, message, CTA, isOpen, onClose }: ModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return ReactDOM.createPortal(
    <div
      onClick={onClose}
      className="flex fixed inset-0 z-9999 p-4 items-center justify-center"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col gap-4 p-4 w-full sm:w-96 rounded-2xl bg-white"
      >
        <h2 className="text-xl sm:text-2xl font-semibold text-amber-500">
          {title}
        </h2>
        <p className="text-neutral-600">{message}</p>
        <button
          onClick={onClose}
          className="flex p-2 w-full items-center justify-center rounded-full cursor-pointer border text-white hover:text-amber-600 border-transparent hover:border-amber-600 bg-amber-500 hover:bg-white"
        >
          {CTA}
        </button>
      </div>
    </div>,
    document.body
  );
}
