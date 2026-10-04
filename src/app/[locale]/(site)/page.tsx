import type { Metadata } from "next";
import { About } from "@/components/site/home/About";
import { Approach } from "@/components/site/home/Approach";
import { Contact } from "@/components/site/home/Contact";
import { Hero } from "@/components/site/home/Hero";
import { KeyMetrics } from "@/components/site/home/KeyMetrics";
import { Lab } from "@/components/site/home/Lab";
import { Selection } from "@/components/site/home/Selection";
import { Stack } from "@/components/site/home/Stack";
import { JsonLd } from "@/components/site/JsonLd";
import { getProfile } from "@/content/profile";
import { getLocaleContext } from "@/i18n/server";
import { identityJsonLd } from "@/seo/identity";
import { pageMetadata } from "@/seo/metadata";
import { getPublishedProjects, getSiteSettings } from "@/server/queries";

// Home page layout: Hero, Approach, Selection, About, Stack, Lab, and Contact sections.
const MAX_FEATURED = 6;
export async function generateMetadata(): Promise<Metadata> {
  const [{ locale, dict }, settings] = await Promise.all([
    getLocaleContext(),
    getSiteSettings(),
  ]);
  const text = settings.i18n[locale];
  return pageMetadata({
    page: "home",
    locale,
    title: null,
    siteName: settings.name,
    // Fallback description if custom SEO description is not configured
    description:
      text.seoDefaultDescription ||
      text.positioning.filter(Boolean).join(" ") ||
      dict.meta.homeDescription,
  });
}

export default async function HomePage() {
  const { locale, dict } = await getLocaleContext();
  const [settings, projects] = await Promise.all([
    getSiteSettings(),
    getPublishedProjects(locale),
  ]);
  const profile = getProfile(locale);
  const featured = projects.filter((p) => p.featured).slice(0, MAX_FEATURED);

  return (
    <>
      <JsonLd data={identityJsonLd(settings, locale)} />
      <Hero
        locale={locale}
        dict={dict}
        siteName={settings.name}
        profile={profile}
        projectCount={projects.length}
      />
      <main id="contenu">
        <Approach profile={profile} dict={dict} />
        <Selection projects={featured} locale={locale} dict={dict} />
        <About profile={profile} dict={dict} locale={locale} />
        <Stack dict={dict} />
        <KeyMetrics dict={dict} metrics={[]} />
        <Lab projects={projects} locale={locale} dict={dict} />
        <Contact settings={settings} locale={locale} dict={dict} />
      </main>
    </>
  );
}
