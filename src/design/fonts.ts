import localFont from "next/font/local";

// Self-hosted OFL fonts for the storefront.
// Archivo: variable font used for display titles with width and weight axes.
export const archivo = localFont({
  src: "../../public/fonts/archivo/Archivo-latin-wdth-wght.woff2",
  weight: "100 900",
  style: "normal",
  declarations: [{ prop: "font-stretch", value: "62% 125%" }],
  variable: "--font-archivo",
  display: "swap",
  preload: true,
});

// Hanken Grotesk: body typography and interface elements.
export const hanken = localFont({
  src: [
    {
      path: "../../public/fonts/hanken-grotesk/HankenGrotesk-latin-wght.woff2",
      weight: "100 900",
      style: "normal",
    },
    {
      path: "../../public/fonts/hanken-grotesk/HankenGrotesk-latin-wght-italic.woff2",
      weight: "100 900",
      style: "italic",
    },
  ],
  variable: "--font-hanken",
  display: "swap",
  preload: false,
});
