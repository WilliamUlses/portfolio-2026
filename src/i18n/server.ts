import { notFound } from "next/navigation";
import { locale as rootLocale } from "next/root-params";
import { isLocale, type Locale } from "./config";
import { type Dictionary, getDictionary } from "./get-dictionary";

/** Current storefront locale and dictionary from route params. Server components only. */
export async function getLocaleContext(): Promise<{
  locale: Locale;
  dict: Dictionary;
}> {
  const locale = await rootLocale();
  if (!isLocale(locale)) notFound();
  return { locale, dict: getDictionary(locale) };
}
