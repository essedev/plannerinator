import { Geist } from "next/font/google";
import { Space_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ConditionalLayout } from "@/components/layout/ConditionalLayout";
import { createMetadata } from "@/lib/metadata";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

export const metadata = createMetadata({});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${spaceMono.variable} font-sans antialiased min-h-screen flex flex-col`}
      >
        <Providers>
          <ConditionalLayout>{children}</ConditionalLayout>
        </Providers>
      </body>
    </html>
  );
}
