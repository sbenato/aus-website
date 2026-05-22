import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { auth } from "@/auth";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "AUS – Asociación Uruguaya de Speedcubing",
    template: "%s | AUS",
  },
  description:
    "La comunidad oficial de speedcubing en Uruguay. Competencias, rankings y más. Seguinos en Instagram: @aus.uy",
  icons: {
    icon: [
      { url: "/logos/logo-favicon.webp", type: "image/webp"},
      { url: "/logos/logo-negro-chico.svg", type: "image/svg+xml"},
      { url: "/logos/logo-negro-chico.png", type: "image/png" },
    ],
  },
  openGraph: {
    title: "AUS – Asociación Uruguaya de Speedcubing",
    description:
      "Competencias, rankings y comunidad de speedcubing en Uruguay",
    locale: "es_UY",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="es">
      <body className={inter.className}>
        <SessionProvider session={session}>{children}</SessionProvider>
      </body>
    </html>
  );
}
