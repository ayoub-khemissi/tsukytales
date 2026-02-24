"use client";

import { Divider } from "@heroui/divider";
import { useTranslations } from "next-intl";
import Image from "next/image";

import { Link } from "@/i18n/navigation";
import { InstagramIcon, XTwitterIcon, TiktokIcon } from "@/components/icons";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="w-full bg-bg-brand dark:bg-bg-dark border-t border-divider">
      <div className="container mx-auto max-w-7xl px-6 py-12">
        {/* Logo centered */}
        <div className="flex justify-center mb-6">
          <Link href="/">
            <Image
              src="/assets/img/logo.png"
              alt="Tsuky Tales"
              width={130}
              height={130}
              className="object-contain"
            />
          </Link>
        </div>

        {/* Social icons */}
        <div className="flex justify-center gap-10 mb-6">
          <a
            href="https://www.instagram.com/tsukytales/"
            target="_blank"
            rel="noopener noreferrer"
            className="social-link-hover w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all duration-300"
            aria-label="Instagram"
          >
            <InstagramIcon size={18} />
          </a>
          <a
            href="https://x.com/tsukytales"
            target="_blank"
            rel="noopener noreferrer"
            className="social-link-hover w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all duration-300"
            aria-label="X (Twitter)"
          >
            <XTwitterIcon size={18} />
          </a>
          <a
            href="https://www.tiktok.com/@tsukytales"
            target="_blank"
            rel="noopener noreferrer"
            className="social-link-hover w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all duration-300"
            aria-label="TikTok"
          >
            <TiktokIcon size={18} />
          </a>
        </div>

        {/* Legal links */}
        <div className="flex flex-wrap justify-center gap-6 mb-6">
          <Link
            href="/terms"
            className="text-[0.8rem] uppercase tracking-[1.5px] font-medium text-text-light dark:text-gray-400 hover:text-primary transition-colors"
          >
            {t("terms")}
          </Link>
          <Link
            href="/legal"
            className="text-[0.8rem] uppercase tracking-[1.5px] font-medium text-text-light dark:text-gray-400 hover:text-primary transition-colors"
          >
            {t("legal")}
          </Link>
          <Link
            href="/privacy"
            className="text-[0.8rem] uppercase tracking-[1.5px] font-medium text-text-light dark:text-gray-400 hover:text-primary transition-colors"
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
