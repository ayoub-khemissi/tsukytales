"use client";

import { useTranslations } from "next-intl";
import { Button } from "@heroui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faBoxOpen,
  faBookReader,
} from "@fortawesome/free-solid-svg-icons";

import { Link } from "@/i18n/navigation";
import { ChevronDownIcon } from "@/components/icons";
import { InstagramCarousel } from "@/components/instagram-carousel";
import { ThemedLogo } from "@/components/themed-logo";
import { useScrollReveal } from "@/lib/hooks/use-scroll-reveal";

const STEP_ICONS = [faEdit, faBoxOpen, faBookReader] as const;

export default function HomePage() {
  const t = useTranslations("home");

  useScrollReveal();

  return (
    <>
      {/* ========== HERO ========== */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Bottom fade gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-[200px] bg-gradient-to-t from-bg-brand/60 dark:from-bg-dark/60 to-transparent pointer-events-none z-[5]" />
        <div className="relative z-10 container mx-auto max-w-6xl px-6 py-20 text-center">
          <div className="glass rounded-[24px] sm:rounded-[40px] px-5 py-8 sm:px-10 sm:py-10 md:px-16 md:py-10">
            {/* Subtitle */}
            <p className="text-[0.75rem] sm:text-[0.9rem] font-medium uppercase tracking-[3px] sm:tracking-[8px] mb-4 sm:mb-6">
              <span className="magic-text">{t("hero_subtitle_art")}</span>
            </p>

            {/* Hero Logo */}
            <div className="flex justify-center -mb-2 mt-4">
              <ThemedLogo
                priority
                alt="Tsuky Tales"
                className="object-contain"
                height={200}
                style={{
                  animation: "float 6s ease-in-out infinite",
                  transformOrigin: "center bottom",
                }}
                variant="hero-logo"
                width={200}
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
                className="btn-brand bg-primary w-full sm:w-auto font-semibold"
                href="/subscription"
                size="lg"
              >
                {t("hero_cta_subscribe")}
              </Button>
              <Button
                as={Link}
                className="btn-brand-outline w-full sm:w-auto font-semibold"
                href="/about"
                size="lg"
              >
                {t("hero_cta_story")}
              </Button>
            </div>
          </div>

          {/* Scroll indicator */}
          <button
            aria-label="Scroll to next section"
            className="mt-10 cursor-pointer bg-transparent border-none"
            style={{ animation: "bounce 2s infinite" }}
            onClick={() =>
              document
                .getElementById("how-it-works")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <ChevronDownIcon
              className="mx-auto text-text-brand/50 dark:text-white/50"
              size={24}
            />
          </button>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section
        className="section-reveal relative min-h-screen flex flex-col items-center justify-center py-16 bg-bg-brand dark:bg-bg-dark"
        id="how-it-works"
      >
        {/* Bottom fade to blend with next section */}
        <div className="absolute left-0 right-0 -bottom-[100px] h-[100px] bg-gradient-to-b from-bg-brand/60 dark:from-bg-dark/60 to-transparent pointer-events-none z-[1]" />
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
                  <div className="step-card relative bg-white dark:bg-surface rounded-[40px] shadow-lg border border-white/50 dark:border-white/10 pb-2">
                    {/* Step number badge */}
                    <span className="absolute -top-[17px] left-1/2 -translate-x-1/2 z-10 w-[35px] h-[35px] rounded-full bg-gradient-to-br from-accent-gold to-accent-gold-light flex items-center justify-center text-white font-bold text-sm shadow-md">
                      {step}
                    </span>
                    {/* Icon circle */}
                    <div className="flex justify-center pt-10">
                      <div className="step-icon w-20 h-20 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                        <FontAwesomeIcon
                          className="text-primary text-2xl"
                          icon={icon}
                        />
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-center font-heading text-sm font-bold text-text-brand dark:text-white mt-5 px-6 uppercase tracking-[3px]">
                      {t(`how_step${step}_title`)}
                    </h3>

                    {/* Bubble */}
                    <div className="mx-4 sm:mx-6 mt-4 p-4 sm:p-5 bg-bg-brand dark:bg-surface-alt rounded-[20px] sm:rounded-[30px] min-h-[140px] sm:min-h-[180px] flex items-center justify-center border border-primary/5">
                      <p className="text-xs text-text-light dark:text-muted-light text-center leading-relaxed uppercase tracking-[1px]">
                        {t(`how_step${step}_bubble`)}
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-6 mt-4 border-t border-gray-100 dark:border-surface-alt">
                      <h4 className="font-heading font-semibold text-lg italic text-text-brand dark:text-white">
                        {t(`how_step${step}_footer_title`)}
                      </h4>
                      <p className="text-sm text-text-light dark:text-muted mt-1">
                        {t(`how_step${step}_footer_desc`)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA */}
          <div className="text-center mt-12 px-4 sm:px-0">
            <Button
              as={Link}
              className="btn-brand bg-primary w-full sm:w-auto font-semibold"
              href="/subscription"
              size="lg"
            >
              {t("how_cta")}
            </Button>
          </div>

          {/* Scroll indicator */}
          <button
            aria-label="Scroll to next section"
            className="mt-10 mx-auto block cursor-pointer bg-transparent border-none"
            style={{ animation: "bounce 2s infinite" }}
            onClick={() =>
              document
                .getElementById("instagram")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <ChevronDownIcon
              className="mx-auto text-text-brand/50 dark:text-white/50"
              size={24}
            />
          </button>
        </div>
      </section>

      {/* ========== INSTAGRAM ========== */}
      <div
        className="min-h-screen flex flex-col items-center justify-center py-16"
        id="instagram"
      >
        <InstagramCarousel />
      </div>
    </>
  );
}
