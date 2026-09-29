import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Cormorant_Infant, Manrope } from "next/font/google";
import "./globals.css";

const display = Cormorant_Infant({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-display",
  display: "swap",
});

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Jhuma Jewellers — Gold salon, Zindabazar, Sylhet",
    template: "%s — Jhuma Jewellers",
  },
  description:
    "Necklace sets, chains, rings and earrings, photographed and filmed inside Jhuma Jewellers on the fourth floor of Sylhet Plaza.",
  keywords: ["Jhuma Jewellers", "gold jewellery", "Sylhet", "Zindabazar", "Sylhet Plaza"],
  applicationName: "Jhuma Jewellers",
  openGraph: {
    title: "Jhuma Jewellers — Gold salon, Zindabazar, Sylhet",
    description: "The salon, photographed and filmed as it stands. Sets, chains, rings and earrings.",
    type: "website",
    siteName: "Jhuma Jewellers",
  },
};

export const viewport: Viewport = {
  themeColor: "#0c1018",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "JewelryStore",
  name: "Jhuma Jewellers",
  alternateName: "ঝুমা জুয়েলার্স",
  description: "A gold salon on the fourth floor of Sylhet Plaza, Zindabazar.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Sylhet Plaza Market, 4th Floor",
    addressLocality: "Zindabazar, Sylhet",
    addressCountry: "BD",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${serif.variable} ${sans.variable}`}>
      {/* Browser extensions can inject body attributes before React hydrates. */}
      <body suppressHydrationWarning>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        {children}
      </body>
    </html>
  );
}
