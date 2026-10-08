import { Cursor } from "@/components/site/Cursor";
import { Footer } from "@/components/site/Footer";
import { Preloader } from "@/components/site/Preloader";
import { getProfile } from "@/content/profile";
import { getLocaleContext } from "@/i18n/server";
import { PageTransition, SmoothScroll } from "@/motion";
import { getSiteSettings } from "@/server/queries";

// Storefront layout: preloader, smooth scrolling, page transitions, custom cursor, skip link, and footer.
export default async function SiteLayout({
  children,
}: LayoutProps<"/[locale]">) {
  const { locale, dict } = await getLocaleContext();
  const settings = await getSiteSettings();
  return (
    <div id="top">
      <Preloader name={settings.name} label={dict.meta.loading} />
      <SmoothScroll />
      <PageTransition name={settings.name} />
      <Cursor viewLabel={dict.meta.viewProject} />
      <a className="skip" href="#contenu">
        {dict.meta.skipToContent}
      </a>
      {children}
      <Footer
        settings={settings}
        profile={getProfile(locale)}
        dict={dict}
        locale={locale}
      />
    </div>
  );
}
