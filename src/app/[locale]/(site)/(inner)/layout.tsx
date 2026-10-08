import { menuLabels } from "@/components/site/menu-labels";
import { SiteMenu } from "@/components/site/SiteMenu";
import { getLocaleContext } from "@/i18n/server";
import { getPublishedPosts, getPublishedProjects } from "@/server/queries";
import styles from "./inner.module.css";

// Inner pages layout: floating bottom navigation pill with monogram home link.
export default async function InnerLayout({
  children,
}: LayoutProps<"/[locale]">) {
  const { locale, dict } = await getLocaleContext();
  const [projects, posts] = await Promise.all([
    getPublishedProjects(locale),
    getPublishedPosts(locale),
  ]);
  return (
    <>
      <header>
        <SiteMenu
          locale={locale}
          labels={menuLabels(dict)}
          projectCount={projects.length}
          hasJournal={posts.length > 0}
          variant="page"
        />
      </header>
      <main id="contenu" className={styles.main}>
        {children}
      </main>
    </>
  );
}
