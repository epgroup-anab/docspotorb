import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Docspot AI",
  description:
    "Docspot AI helps handle dental calls and support patient conversations.",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "Docspot AI",
    description:
      "Docspot AI helps handle dental calls and support patient conversations.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Docspot AI",
    description:
      "Docspot AI helps handle dental calls and support patient conversations.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
