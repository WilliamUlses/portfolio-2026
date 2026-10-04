"use client";

import { useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { BookingModal } from "./BookingModal";

interface BookingButtonProps {
  label: string;
  locale: Locale;
  dict: Dictionary["booking"];
  className?: string;
  showIcon?: boolean;
}

export function BookingButton({
  label,
  locale,
  dict,
  className,
  showIcon = true,
}: BookingButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => setIsOpen(true)}
        aria-haspopup="dialog"
      >
        <span>
          {label}
          {showIcon && <span aria-hidden="true"> ↗</span>}
        </span>
      </button>

      <BookingModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        locale={locale}
        dict={dict}
      />
    </>
  );
}
