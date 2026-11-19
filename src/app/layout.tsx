import type { Metadata } from "next";
import "./globals.css";
import "./design.css";
export const metadata: Metadata = { title: "Katio Business", description: "Gestión interna" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="es"><body>{children}</body></html>; }
