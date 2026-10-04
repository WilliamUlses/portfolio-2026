import localFont from "next/font/local";

// Schibsted Grotesk variable font for the admin back-office
export const schibsted = localFont({
  src: [
    {
      path: "../../public/fonts/schibsted-grotesk/SchibstedGrotesk-latin-wght.woff2",
      weight: "400 900",
      style: "normal",
    },
    {
      path: "../../public/fonts/schibsted-grotesk/SchibstedGrotesk-latin-wght-italic.woff2",
      weight: "400 900",
      style: "italic",
    },
  ],
  variable: "--font-schibsted",
  display: "swap",
  preload: true,
});
