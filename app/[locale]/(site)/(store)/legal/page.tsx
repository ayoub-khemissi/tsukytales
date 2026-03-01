"use client";

import { useTranslations } from "next-intl";

const SECTIONS = Array.from({ length: 8 }, (_, i) => i + 1);

export default function LegalPage() {
  const t = useTranslations("legal");

  return (
    <section className="py-20 sm:py-28">
      <div className="container mx-auto max-w-4xl px-6">
        <div className="text-center mb-12 sm:mb-16">
          <h1
            className="font-heading font-bold text-primary dark:text-white leading-tight mb-4"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
          >
            {t("title")}{" "}
            <span className="magic-text">{t("title_accent")}</span>
          </h1>
          <p className="text-sm text-text-light dark:text-gray-400">
            {t("last_updated")}
          </p>
        </div>

        <div className="glass rounded-[24px] sm:rounded-[40px] px-5 py-8 sm:px-10 sm:py-12 md:px-16 md:py-16 space-y-10">
          {SECTIONS.map((n) => (
            <article key={n}>
              <h2 className="font-heading text-lg sm:text-xl font-bold text-text-brand dark:text-white mb-3">
                {t(`section_${n}_title`)}
              </h2>
              <p className="text-text-light dark:text-gray-300 leading-relaxed whitespace-pre-line">
                {t(`section_${n}_text`)}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
