"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOCALE_COOKIE, type Locale } from "@/i18n/config";
import { switchLocalePath } from "@/i18n/routes";

// Locale switcher link preserving current page path and persisting preference in cookie
export function LanguageSwitcher({
  target,
  label,
  text,
  className,
}: {
  className?: string;
  target: Locale;
  label: string;
  text: string;
}) {
  const pathname = usePathname();
  return (
    <Link
      href={switchLocalePath(pathname, target)}
      className={className}
      hrefLang={target}
      lang={target}
      aria-label={label}
      onClick={() => {
        // biome-ignore lint/suspicious/noDocumentCookie: non-sensitive preference cookie read by proxy
        document.cookie = `${LOCALE_COOKIE}=${target}; path=/; max-age=31536000; samesite=lax`;
      }}
    >
      {text}
    </Link>
  );
}
