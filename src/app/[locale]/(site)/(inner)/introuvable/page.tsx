import type { Metadata } from "next";
import { NotFoundContent } from "@/components/site/NotFoundContent";
import { getLocaleContext } from "@/i18n/server";

// Static 404 page served by edge proxy with HTTP 404 status.
export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getLocaleContext();
  return {
    title: dict.notFound.title,
    robots: { index: false, follow: false },
  };
}

export default async function NotFoundPage() {
  const { locale, dict } = await getLocaleContext();
  return <NotFoundContent locale={locale} dict={dict} />;
}
