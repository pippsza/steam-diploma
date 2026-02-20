import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("common");

  return (
    <footer className="border-t py-4">
      <div className="container flex items-center justify-end text-sm text-muted-foreground">
        <p>
          &copy; {new Date().getFullYear()} {t("appName")}. Diploma Project.
        </p>
      </div>
    </footer>
  );
}
