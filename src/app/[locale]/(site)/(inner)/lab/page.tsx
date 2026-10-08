import type { Metadata } from "next";
import { JsonLd } from "@/components/site/JsonLd";
import { LabWorkbench } from "@/components/site/lab/LabWorkbench";
import { href } from "@/i18n/routes";
import { getLocaleContext } from "@/i18n/server";
import { breadcrumbJsonLd } from "@/seo/jsonld";
import { pageMetadata } from "@/seo/metadata";
import { siteUrl } from "@/seo/site";
import { getSiteSettings } from "@/server/queries";

// Optical shader lab: interactive real-time test bench for custom WebGL shaders
export async function generateMetadata(): Promise<Metadata> {
  const [{ locale, dict }, settings] = await Promise.all([
    getLocaleContext(),
    getSiteSettings(),
  ]);
  return pageMetadata({
    page: "lab",
    locale,
    title: dict.lab.title,
    siteName: settings.name,
    description: dict.lab.description,
  });
}

export default async function LabPage() {
  const { locale, dict } = await getLocaleContext();

  const base = siteUrl();
  const labUrl = `${base}${href("lab", locale)}`;
  const jsonLd = [
    breadcrumbJsonLd([
      { name: dict.nav.home, url: `${base}${href("home", locale)}` },
      { name: dict.lab.title, url: labUrl },
    ]),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <LabWorkbench dict={dict} />
    </>
  );
}
