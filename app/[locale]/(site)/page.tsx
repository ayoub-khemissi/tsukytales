"use client";

import { useTranslations } from "next-intl";
import { Button } from "@heroui/button";
import Image from "next/image";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faBoxOpen, faBookReader } from "@fortawesome/free-solid-svg-icons";

import { Link } from "@/i18n/navigation";
import { ChevronDownIcon } from "@/components/icons";
import { InstagramCarousel } from "@/components/instagram-carousel";
import { useScrollReveal } from "@/lib/hooks/use-scroll-reveal";

const STEP_ICONS = [faEdit, faBoxOpen, faBookReader] as const;

export default function HomePage() {
  const t = useTranslations("home");
  useScrollReveal();

  return (
    <>
      {/* ========== HERO ========== */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        {/* Bottom fade gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-[200px] bg-gradient-to-t from-bg-brand dark:from-bg-dark to-transparent pointer-events-none z-[5]" />
        <div className="relative z-10 container mx-auto max-w-6xl px-6 py-20 text-center">
          <div className="glass rounded-[40px]" style={{ padding: "2.5rem 4rem" }}>
            {/* Subtitle */}
            <p className="text-[0.9rem] font-medium uppercase tracking-[8px] mb-6">
              <span className="magic-text">{t("hero_subtitle_art")}</span>
            </p>

            {/* Hero Logo */}
            <div className="flex justify-center -mb-2 mt-4">
              <Image
                src="/assets/img/hero_logo.png"
                alt="Tsuky Tales"
                width={200}
                height={200}
                className="object-contain"
                style={{ animation: "float 6s ease-in-out infinite", transformOrigin: "center bottom" }}
                priority
              />
            </div>

            {/* Title */}
            <h1 className="font-heading italic text-4xl md:text-5xl lg:text-6xl font-bold text-text-brand dark:text-white leading-tight mb-8">
              {t("hero_title_editions")}{" "}
              <span className="magic-text">{t("hero_title_collector")}</span>
              <br />
              {t("hero_title_boxes")}
            </h1>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                as={Link}
                href="/subscription"
                size="lg"
                radius="none"
                className="btn-brand bg-primary font-semibold px-8"
              >
                {t("hero_cta_subscribe")}
              </Button>
              <Button
                as={Link}
                href="/about"
                size="lg"
                variant="bordered"
                radius="none"
                className="border-primary text-primary hover:bg-primary hover:text-white font-semibold px-8 transition-colors !rounded-[14px]"
              >
                {t("hero_cta_story")}
              </Button>
            </div>
          </div>

          {/* Scroll indicator */}
          <button
            onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
            className="mt-10 cursor-pointer bg-transparent border-none"
            style={{ animation: "bounce 2s infinite" }}
            aria-label="Scroll to next section"
          >
            <ChevronDownIcon size={24} className="mx-auto text-text-brand/50 dark:text-white/50" />
          </button>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section id="how-it-works" className="section-reveal py-16 md:py-24 bg-bg-brand dark:bg-bg-dark">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="text-center mb-14">
            <h2 className="font-heading italic text-3xl md:text-4xl font-bold text-text-brand dark:text-white">
              {t("how_title")}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[1, 2, 3].map((step, index) => {
              const icon = STEP_ICONS[index];
              return (
                <div
                  key={step}
                  className="step-card-reveal pt-5"
                  style={{ transitionDelay: `${index * 0.15}s` }}
                >
                  <div className="step-card relative bg-white dark:bg-gray-900 rounded-[40px] shadow-lg border border-white/50 dark:border-white/10 pb-2">
                    {/* Step number badge */}
                    <span className="absolute -top-[17px] left-1/2 -translate-x-1/2 z-10 w-[35px] h-[35px] rounded-full bg-gradient-to-br from-accent-gold to-accent-gold-light flex items-center justify-center text-white font-bold text-sm shadow-md">
                      {step}
                    </span>
                    {/* Icon circle */}
                    <div className="flex justify-center pt-10">
                      <div className="step-icon w-20 h-20 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                        <FontAwesomeIcon icon={icon} className="text-primary text-2xl" />
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-center font-heading text-sm font-bold text-text-brand dark:text-white mt-5 px-6 uppercase tracking-[3px]">
                      {t(`how_step${step}_title`)}
                    </h3>

                    {/* Bubble */}
                    <div className="mx-6 mt-4 p-5 bg-bg-brand dark:bg-gray-800 rounded-[30px] min-h-[180px] flex items-center justify-center border border-primary/5">
                      <p className="text-xs text-text-light dark:text-gray-300 text-center leading-relaxed uppercase tracking-[1px]">
                        {t(`how_step${step}_bubble`)}
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-6 mt-4 border-t border-gray-100 dark:border-gray-800">
                      <h4 className="font-heading font-semibold text-lg italic text-text-brand dark:text-white">
                        {t(`how_step${step}_footer_title`)}
                      </h4>
                      <p className="text-sm text-text-light dark:text-gray-400 mt-1">
                        {t(`how_step${step}_footer_desc`)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <Button
              as={Link}
              href="/subscription"
              size="lg"
              radius="full"
              className="btn-brand bg-primary font-semibold px-8"
            >
              {t("how_cta")}
            </Button>
          </div>
        </div>
      </section>

      {/* ========== INSTAGRAM ========== */}
      <InstagramCarousel />
    </>
  );
}
