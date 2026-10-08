import type { Metadata } from "next";
import { getLocaleContext } from "@/i18n/server";

// Coming soon page served when SITE_OPEN != "true"
export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getLocaleContext();
  return { title: dict.comingSoon.title };
}

export default async function ComingSoon() {
  const { dict } = await getLocaleContext();
  return (
    <main>
      <h1>{dict.comingSoon.title}</h1>
      <p>
        {dict.comingSoon.text}{" "}
        <a href="https://portfolio.williamulses.fr">
          portfolio.williamulses.fr
        </a>
      </p>
    </main>
  );
}
