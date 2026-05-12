import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { SessionProvider } from "@/components/auth/session-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ChatProvider } from "@/components/ai/chat-provider";
import { ChatInputBar } from "@/components/ai/chat-input-bar";
import { StarBackground } from "@/components/layout/star-background";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "common" });

  return {
    title: {
      default: t("appName"),
      template: `%s | ${t("appName")}`,
    },
    description:
      locale === "uk"
        ? "Ігровий магазин з AI-пошуком та рекомендаціями"
        : "Game store with AI-powered search and recommendations",
    alternates: {
      canonical: `${APP_URL}/${locale}`,
      languages: {
        uk: `${APP_URL}/uk`,
        en: `${APP_URL}/en`,
      },
    },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      ],
      apple: "/apple-touch-icon.png",
    },
    openGraph: {
      title: t("appName"),
      description:
        locale === "uk"
          ? "Ігровий магазин з AI-пошуком та рекомендаціями"
          : "Game store with AI-powered search and recommendations",
      locale: locale === "uk" ? "uk_UA" : "en_US",
      type: "website",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = (await import(`../../../../messages/${locale}.json`))
    .default;

  return (
    <html lang={locale} suppressHydrationWarning>
      {process.env.NODE_ENV === "development" && (
        <head>
          {/* Must be in <head> as a plain script — next/script loads too late */}
          <script src="https://unpkg.com/react-scan/dist/auto.global.js" async />
        </head>
      )}
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} antialiased`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SessionProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem
              disableTransitionOnChange={false}
            >
              <TooltipProvider>
                <ChatProvider>
                  <StarBackground />
                  <div className="relative flex min-h-screen flex-col">
                    <Header />
                    <main className="flex-1 pb-16">{children}</main>
                    <Footer />
                    <ChatInputBar />
                  </div>
                </ChatProvider>
              </TooltipProvider>
            </ThemeProvider>
          </SessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
