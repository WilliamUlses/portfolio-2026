import type { Metadata } from "next";
import { Toaster } from "@/components/admin/ui/sonner";
import { schibsted } from "@/design/admin-fonts";
import "../globals.css";

// Root layout for the admin area (separate root layout from public storefront).
// Admin routes are strictly excluded from search engine indexing.
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s — Admin" },
  robots: { index: false, follow: false },
};

// Admin dark theme layout container and toast notifications.
export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html lang="fr" className={schibsted.variable}>
      <body>
        <div className="admin dark min-h-dvh antialiased">
          {children}
          <Toaster position="bottom-right" />
        </div>
      </body>
    </html>
  );
}
