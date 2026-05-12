"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import {
  Gamepad2,
  Heart,
  Library,
  Star,
  HelpCircle,
  Search,
  Menu,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { UserMenu } from "@/components/auth/user-menu";
import { MoodSurveyTrigger } from "@/components/mood-survey/mood-survey-trigger";
import { cn } from "@/lib/utils";

export function Header() {
  const t = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const navItems = [
    { href: `/${locale}`, label: t("home"), icon: Gamepad2, exact: true },
    { href: `/${locale}/search`, label: t("search"), icon: Search },
    { href: `/${locale}/tournaments`, label: t("tournaments"), icon: Trophy },
    { href: `/${locale}/library`, label: t("library"), icon: Library },
    { href: `/${locale}/favorites`, label: t("favorites"), icon: Heart },
    { href: `/${locale}/wishlist`, label: t("wishlist"), icon: Star },
    { href: `/${locale}/support`, label: t("support"), icon: HelpCircle },
  ];

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : !!pathname?.startsWith(href);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center px-4">
        <Link
          href={`/${locale}`}
          className="mr-4 flex items-center gap-2 font-bold lg:mr-6"
        >
          <Image
            src="/favicon-32x32.png"
            alt="Logo"
            width={24}
            height={24}
            className="rounded-sm"
          />
          <span className="hidden sm:inline">{t("appName")}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden flex-1 items-center gap-1 md:flex">
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden lg:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <MoodSurveyTrigger />
          <LocaleSwitcher />
          <ThemeToggle />
          <UserMenu />

          {/* Mobile burger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 py-3 px-3">
              <SheetTitle className="flex items-center gap-2 px-2 pb-4 text-lg font-bold">
                <Image
                  src="/favicon-32x32.png"
                  alt="Logo"
                  width={24}
                  height={24}
                  className="rounded-sm"
                />
                {t("appName")}
              </SheetTitle>
              <nav className="flex flex-col gap-1">
                {navItems.map((item) => {
                  const active = isActive(item.href, item.exact);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
