import type { Metadata } from "next";
import { Geist_Mono, Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import ChatWidget from "@/components/chat/ChatWidget";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Permohonan Perubahan Data",
  description: "Layanan pengajuan permohonan perubahan data secara online",
};

// Script kecil ini jalan sebelum React hydrate, supaya tidak ada "kedipan"
// (flash) dari mode terang ke gelap saat halaman pertama kali dimuat.
const themeInitScript = `
  (function () {
    try {
      var stored = localStorage.getItem('theme');
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var theme = stored || (prefersDark ? 'dark' : 'light');
      if (theme === 'dark') document.documentElement.classList.add('dark');
    } catch (e) {}
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${jakarta.variable} ${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-white dark:bg-slate-950 transition-colors">
        <ThemeProvider>
          {children}
          <ChatWidget />
        </ThemeProvider>
      </body>
    </html>
  );
}