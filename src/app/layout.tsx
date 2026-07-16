import { type ReactNode } from "react";
import { DM_Sans, Instrument_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
});

export const metadata = {
  title: "Hyperwrike OS",
  description: "Internal CRM & Business Management System",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${instrumentSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
