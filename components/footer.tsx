"use client";

import { Divider } from "@heroui/divider";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { ThemedLogo } from "@/components/themed-logo";
import { InstagramIcon, XTwitterIcon, TiktokIcon } from "@/components/icons";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="w-full bg-bg-brand dark:bg-bg-dark border-t border-divider">
      <div className="container mx-auto max-w-7xl px-6 py-12">
        {/* Logo centered */}
        <div className="flex justify-center mb-6">
          <Link href="/">
            <ThemedLogo
              alt="Tsuky Tales"
              className="object-contain"
              height={130}
              variant="logo"
              width={130}
            />
          </Link>
        </div>

        {/* Social icons */}
        <div className="flex justify-center gap-10 mb-6">
          <a
            aria-label="Instagram"
            className="social-link-hover w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all duration-300"
            href="https://www.instagram.com/tsukytales/"
            rel="noopener noreferrer"
            target="_blank"
          >
            <InstagramIcon size={18} />
          </a>
          <a
            aria-label="X (Twitter)"
            className="social-link-hover w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all duration-300"
            href="https://x.com/tsukytales"
            rel="noopener noreferrer"
            target="_blank"
          >
            <XTwitterIcon size={18} />
          </a>
          <a
            aria-label="TikTok"
            className="social-link-hover w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all duration-300"
            href="https://www.tiktok.com/@tsukytales"
            rel="noopener noreferrer"
            target="_blank"
          >
            <TiktokIcon size={18} />
          </a>
        </div>

        {/* Legal links */}
        <div className="flex flex-wrap justify-center gap-6 mb-6">
          <Link
            className="text-[0.8rem] uppercase tracking-[1.5px] font-medium text-text-light dark:text-muted hover:text-primary transition-colors"
            href="/terms"
          >
            {t("terms")}
          </Link>
          <Link
            className="text-[0.8rem] uppercase tracking-[1.5px] font-medium text-text-light dark:text-muted hover:text-primary transition-colors"
            href="/legal"
          >
            {t("legal")}
          </Link>
          <Link
            className="text-[0.8rem] uppercase tracking-[1.5px] font-medium text-text-light dark:text-muted hover:text-primary transition-colors"
            href="/privacy"
          >
            {t("privacy")}
          </Link>
        </div>

        <Divider className="my-4" />

        {/* Copyright */}
        <p className="text-center text-xs text-default-400">
          {t("rights", { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  );
}
