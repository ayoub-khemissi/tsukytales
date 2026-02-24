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
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 h-[200px] bg-gradient-to-t from-bg-brand dark:from-bg-dark to-transparent pointer-events-none z-[5]" />
        <div className="relative z-10 max-w-[900px] mx-auto px-6 py-20 text-center">
          <div className="glass rounded-[40px]" style={{ padding: "4rem" }}>
            <span className="magic-text block uppercase tracking-[8px] text-[1rem] font-semibold mb-8">
              {t("hero_subtitle")}
            </span>
            <h1
              className="font-heading font-bold text-primary dark:text-white leading-none mb-8"
              style={{ fontSize: "5.5rem", letterSpacing: "-2px" }}
            >
              {t("hero_title_1")} <br />
              {t("hero_title_2")}{" "}
              <span className="magic-text">{t("hero_title_accent")}</span>
            </h1>
            <p className="text-[1.4rem] font-medium max-w-[700px] mx-auto text-primary dark:text-gray-300">
              {t("hero_desc")}
            </p>
          </div>
        </div>
      </section>

      {/* ========== STORY ========== */}
      <section className="section-reveal py-24 md:py-48">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-32 items-center">
            {/* Image with gold frame */}
            <div className="relative group">
              <div className="absolute -top-[30px] -left-[30px] right-[30px] bottom-[30px] border-2 border-accent-gold rounded-[40px] -z-10" />
              <Image
                alt="Tsuky Tales Atelier"
                className="w-full rounded-[40px] shadow-lg transition-transform duration-500 -rotate-3 group-hover:rotate-0 group-hover:scale-[1.02]"
                height={600}
                src="/assets/img/bg.png"
                width={600}
              />
            </div>

            {/* Text card */}
            <div className="glass rounded-[40px]" style={{ padding: "4rem" }}>
              <h2 className="font-heading text-3xl md:text-[3.5rem] font-bold text-text-brand dark:text-white mb-12 leading-tight">
                {t("story_title")}{" "}
                <span className="magic-text">{t("story_title_accent")}</span>
              </h2>
              <div className="mb-8">
                <span
                  className="font-heading font-bold text-primary dark:text-secondary float-left leading-none mr-4"
                  style={{ fontSize: "6rem", marginTop: "-0.1em" }}
                >
                  T
                </span>
                <p className="text-[1.5rem] leading-snug text-primary dark:text-secondary">
                  {t("story_lead").slice(1)}
                </p>
              </div>
              <p className="text-[1.1rem] text-text-brand dark:text-gray-300 mb-8 clear-left">
                {t("story_p1")}
              </p>
              <p className="text-[1.1rem] text-text-brand dark:text-gray-300">
                {t("story_p2")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== VALUES ========== */}
      <section className="section-reveal relative py-24 md:py-48 overflow-hidden">
        <div className="container mx-auto max-w-6xl px-6">
          <h2
            className="font-heading italic text-3xl md:text-[3.5rem] font-bold text-center text-text-brand dark:text-white mb-16 md:mb-24 leading-tight"
            style={{ textShadow: "0 4px 15px rgba(88,22,104,0.2)" }}
          >
            {t("values_title")}{" "}
            <span className="magic-text">{t("values_title_accent")}</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-16">
            {VALUES.map((v) => (
              <div
                key={v.key}
                className="group bg-white dark:bg-gray-900 rounded-[30px] text-center shadow-md border border-[rgba(88,22,104,0.05)] relative transition-all duration-500 ease-out hover:-translate-y-5 hover:shadow-lg"
                style={{
                  padding: "5rem 3rem",
                  paddingTop: "5.5rem",
                  marginTop: "2.5rem",
                }}
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
        </div>
      </section>

      {/* ========== VISION ========== */}
      <section className="section-reveal py-32 md:py-60 text-center">
        <div className="container mx-auto max-w-[1000px] px-6">
          <div className="relative">
            <span className="absolute top-[-60px] left-1/2 -translate-x-1/2 text-[10rem] opacity-10 text-primary font-heading select-none">
              &ldquo;
            </span>
            <p className="font-heading italic text-2xl md:text-[3.5rem] leading-snug text-primary dark:text-white">
              {t("vision_quote")}
            </p>
          </div>
          <div className="flex items-center justify-center gap-8 mt-16">
            <div className="w-[60px] h-px bg-primary opacity-30" />
            <span className="uppercase tracking-[5px] font-semibold text-primary dark:text-white">
              {t("vision_author")}
            </span>
            <div className="w-[60px] h-px bg-primary opacity-30" />
          </div>
          <div className="mt-24">
            <Button
              as={Link}
              className="btn-brand bg-primary font-semibold px-8"
              href="/subscription"
              radius="none"
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
