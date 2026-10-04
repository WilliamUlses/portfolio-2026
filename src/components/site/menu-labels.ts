import type { Dictionary } from "@/i18n/get-dictionary";
import type { MenuLabels } from "./SiteMenu";

/** Menu labels extracted from dictionary for client component */
export function menuLabels(dict: Dictionary): MenuLabels {
  return {
    label: dict.nav.label,
    projects: dict.nav.projects,
    projectsCount: dict.nav.projectsCount,
    about: dict.nav.about,
    contact: dict.nav.contactCta,
    contactShort: dict.nav.contact,
    language: `${dict.language.label} : ${dict.language.switchTo}`,
    home: `${dict.meta.siteName} — ${dict.nav.home}`,
    theme: dict.nav.theme,
    dark: dict.nav.dark,
    light: dict.nav.light,
    menu: dict.nav.menu,
    close: dict.nav.close,
  };
}
