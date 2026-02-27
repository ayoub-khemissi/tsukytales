"use client";

import { useTranslations } from "next-intl";
import { Button } from "@heroui/button";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFeatherAlt,
  faGem,
  faCrown,
} from "@fortawesome/free-solid-svg-icons";

import { Link } from "@/i18n/navigation";
import { ChevronDownIcon } from "@/components/icons";
import { useScrollReveal } from "@/lib/hooks/use-scroll-reveal";

const VALUES = [
  { key: "design", icon: faFeatherAlt },
  { key: "jaspage", icon: faGem },
  { key: "quality", icon: faCrown },
] as const;

export default function AboutPage() {
  const t = useTranslations("about");

  useScrollReveal();

  return (
    <>
      {/* ========== HERO ========== */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="relative z-10 max-w-[900px] mx-auto px-6 py-20 text-center">
          <div className="glass rounded-[24px] sm:rounded-[40px] px-5 py-8 sm:px-10 sm:py-12 md:px-16 md:py-16">
            <span className="magic-text block uppercase tracking-[4px] sm:tracking-[8px] text-[0.8rem] sm:text-[1rem] font-semibold mb-6 sm:mb-8">
              {t("hero_subtitle")}
            </span>
            <h1
              className="font-heading font-bold text-primary dark:text-white leading-none mb-6 sm:mb-8"
              style={{
                fontSize: "clamp(2.2rem, 8vw, 5.5rem)",
                letterSpacing: "-2px",
              }}
            >
              {t("hero_title_1")} <br />
              {t("hero_title_2")}{" "}
              <span className="magic-text">{t("hero_title_accent")}</span>
            </h1>
            <p className="text-[1rem] sm:text-[1.2rem] md:text-[1.4rem] font-medium max-w-[700px] mx-auto text-primary dark:text-gray-300">
              {t("hero_desc")}
            </p>
          </div>

          {/* Scroll indicator */}
          <button
            aria-label="Scroll to next section"
            className="mt-10 cursor-pointer bg-transparent border-none"
            style={{ animation: "bounce 2s infinite" }}
            onClick={() =>
              document
                .getElementById("story")
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

      {/* ========== STORY ========== */}
      <section
        className="section-reveal min-h-screen flex flex-col items-center justify-center py-16"
        id="story"
      >
        <div className="container mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-32 items-center">
            {/* Image with gold frame */}
            <div className="relative group hidden lg:block">
              <div className="absolute -top-[15px] -left-[15px] right-[15px] bottom-[15px] sm:-top-[30px] sm:-left-[30px] sm:right-[30px] sm:bottom-[30px] border-2 border-accent-gold rounded-[24px] sm:rounded-[40px] -z-10" />
              <Image
                alt="Tsuky Tales Atelier"
                className="w-full rounded-[40px] shadow-lg transition-transform duration-500 -rotate-3 group-hover:rotate-0 group-hover:scale-[1.02]"
                height={600}
                src="/assets/img/bg.png"
                width={600}
              />
            </div>

            {/* Text card */}
            <div className="glass rounded-[24px] sm:rounded-[40px] px-5 py-8 sm:px-10 sm:py-12 md:px-16 md:py-16">
              <h2 className="font-heading text-2xl sm:text-3xl md:text-[3.5rem] font-bold text-text-brand dark:text-white mb-8 sm:mb-12 leading-tight">
                {t("story_title")}{" "}
                <span className="magic-text">{t("story_title_accent")}</span>
              </h2>
              <div className="mb-8">
                <span
                  className="font-heading font-bold text-primary dark:text-secondary float-left leading-none mr-1"
                  style={{
                    fontSize: "clamp(3.5rem, 6vw, 6rem)",
                    marginTop: "-0.1em",
                    marginLeft: "-0.1em",
                  }}
                >
                  T
                </span>
                <p className="text-[1.1rem] sm:text-[1.3rem] md:text-[1.5rem] leading-snug text-primary dark:text-secondary">
                  {t("story_lead").slice(1)}
                </p>
              </div>
              <p className="text-base sm:text-[1.1rem] text-text-brand dark:text-gray-300 mb-8 clear-left">
                {t("story_p1")}
              </p>
              <p className="text-base sm:text-[1.1rem] text-text-brand dark:text-gray-300">
                {t("story_p2")}
              </p>
            </div>
          </div>

          {/* Scroll indicator */}
          <button
            aria-label="Scroll to next section"
            className="mt-10 mx-auto block cursor-pointer bg-transparent border-none"
            style={{ animation: "bounce 2s infinite" }}
            onClick={() =>
              document
                .getElementById("values")
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

      {/* ========== VALUES ========== */}
      <section
        className="section-reveal relative min-h-screen flex flex-col items-center justify-center py-16 bg-bg-brand dark:bg-bg-dark"
        id="values"
      >
        {/* Top gradient — smooth entry from transparent to rose */}
        <div className="absolute left-0 right-0 -top-[100px] h-[100px] bg-gradient-to-t from-bg-brand/60 dark:from-bg-dark/60 to-transparent pointer-events-none z-[1]" />
        {/* Bottom gradient — smooth exit from rose to transparent */}
        <div className="absolute left-0 right-0 -bottom-[100px] h-[100px] bg-gradient-to-b from-bg-brand/60 dark:from-bg-dark/60 to-transparent pointer-events-none z-[1]" />
        <div className="container mx-auto max-w-6xl px-6">
          <h2 className="font-heading italic text-2xl sm:text-3xl md:text-[3.5rem] font-bold text-center text-text-brand dark:text-white mb-10 sm:mb-16 md:mb-24 leading-tight">
            {t("values_title")}{" "}
            <span className="magic-text">{t("values_title_accent")}</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-16">
            {VALUES.map((v, i) => (
              <div
                key={v.key}
                className={`group bg-white dark:bg-gray-900 rounded-[30px] text-center shadow-md border border-[rgba(88,22,104,0.05)] relative transition-all duration-500 ease-out hover:-translate-y-5 hover:shadow-lg px-5 pb-8 pt-14 sm:px-10 sm:pb-16 sm:pt-20 md:px-12 md:pb-20 md:pt-[5.5rem] mt-10${i === VALUES.length - 1 ? " sm:col-span-2 sm:max-w-[50%] sm:mx-auto lg:col-span-1 lg:max-w-none" : ""}`}
              >
                {/* Icon circle attached to card top */}
                <div className="absolute -top-[35px] left-1/2 -translate-x-1/2 z-10 w-[70px] h-[70px] rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary text-2xl transition-all duration-500 group-hover:bg-primary group-hover:text-white group-hover:rotate-[10deg]">
                  <FontAwesomeIcon icon={v.icon} />
                </div>
                <h3 className="font-heading italic text-[1.5rem] font-bold text-text-brand dark:text-white mb-8">
                  {t(`value_${v.key}`)}
                </h3>
                <p className="text-text-light dark:text-gray-400 leading-loose">
                  {t(`value_${v.key}_text`)}
                </p>
              </div>
            ))}
          </div>

          {/* Scroll indicator */}
          <button
            aria-label="Scroll to next section"
            className="mt-10 mx-auto block cursor-pointer bg-transparent border-none"
            style={{ animation: "bounce 2s infinite" }}
            onClick={() =>
              document
                .getElementById("vision")
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

      {/* ========== VISION ========== */}
      <section
        className="section-reveal min-h-screen flex flex-col items-center justify-center py-16 text-center"
        id="vision"
      >
        <div className="container mx-auto max-w-[1000px] px-6">
          <div className="relative">
            <span className="absolute top-[-30px] sm:top-[-60px] left-1/2 -translate-x-1/2 text-[6rem] sm:text-[10rem] opacity-10 text-primary font-heading select-none">
              &ldquo;
            </span>
            <p className="font-heading italic text-2xl md:text-[3.5rem] leading-snug text-primary dark:text-white">
              {t("vision_quote")}
            </p>
          </div>
          <div className="flex items-center justify-center gap-4 sm:gap-8 mt-10 sm:mt-16">
            <div className="w-[60px] h-px bg-primary opacity-30" />
            <span className="uppercase tracking-[5px] font-semibold text-primary dark:text-white">
              {t("vision_author")}
            </span>
            <div className="w-[60px] h-px bg-primary opacity-30" />
          </div>
          <div className="mt-12 sm:mt-24 px-4 sm:px-0">
            <Button
              as={Link}
              className="btn-brand bg-primary w-full sm:w-auto font-semibold"
              href="/subscription"
              size="lg"
            >
              {t("vision_cta")}
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
