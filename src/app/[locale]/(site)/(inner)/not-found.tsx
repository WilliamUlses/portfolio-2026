import { NotFoundContent } from "@/components/site/NotFoundContent";
import { getLocaleContext } from "@/i18n/server";

// Storefront not-found boundary for programmatic notFound() calls.
export default async function NotFound() {
  const { locale, dict } = await getLocaleContext();
  return <NotFoundContent locale={locale} dict={dict} />;
}
