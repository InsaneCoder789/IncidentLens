import type { Metadata } from "next";
import { Barlow_Condensed, DM_Sans, JetBrains_Mono } from "next/font/google";
import "@/app/globals.css";
import { RouteShell } from "@/components/route-shell";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" });
const barlowCondensed = Barlow_Condensed({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700"] });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: { default: "IncidentLens", template: "%s / IncidentLens" },
  description: "Evidence-grounded incident intelligence for engineering teams.",
  icons: { icon: "/brand/incidentlens-mark-v2.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${barlowCondensed.variable} ${jetbrainsMono.variable} dark`}>
      <body className="font-sans antialiased">
        <RouteShell>{children}</RouteShell>
      </body>
    </html>
  );
}
