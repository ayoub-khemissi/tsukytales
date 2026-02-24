"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";

import { ChevronLeftIcon, ChevronRightIcon, InstagramIcon } from "@/components/icons";

interface InstaPost {
  id: string;
  media_url: string;
  permalink: string;
  caption?: string;
  media_type: string;
}

const FALLBACK_POSTS: InstaPost[] = Array.from({ length: 6 }, (_, i) => ({
  id: `fallback-${i}`,
  media_url: "",
  permalink: "https://www.instagram.com/tsukytales/",
  caption: "Tsuky Tales",
  media_type: "IMAGE",
}));

export function InstagramCarousel() {
  const t = useTranslations("home");
  const [posts, setPosts] = useState<InstaPost[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/store/instagram")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch");
        return r.json();
      })
      .then((data) => {
        const items = data.posts || data.data || data.items || data;
        if (Array.isArray(items) && items.length > 0) {
          setPosts(items.slice(0, 12));
        } else {
          setPosts(FALLBACK_POSTS);
        }
      })
      .catch(() => setPosts(FALLBACK_POSTS))
      .finally(() => setLoading(false));
  }, []);

  function scroll(direction: "left" | "right") {
    if (!scrollRef.current) return;
    const amount = 300;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }

  return (
    <section className="section-reveal py-16 md:py-24">
      <div className="container mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-sm font-medium uppercase tracking-widest text-accent-gold mb-2">
            {t("instagram_follow")}
          </p>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-text-brand dark:text-white">
            {t("instagram_universe")}{" "}
            <span className="magic-text">Instagram</span>
          </h2>
          <p className="mt-3 text-text-light dark:text-gray-400 max-w-xl mx-auto">
            {t("instagram_desc")}
          </p>
        </div>

        {/* Carousel */}
        <div className="relative">
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-[44px] h-[44px] rounded-full bg-white/80 dark:bg-gray-800/80 shadow-md flex items-center justify-center hover:bg-primary hover:text-white hover:scale-110 transition-all -translate-x-1/2"
            aria-label="Scroll left"
          >
            <ChevronLeftIcon size={20} />
          </button>

          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scroll-smooth scrollbar-hide py-2 px-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {loading
              ? Array.from({ length: 6 }, (_, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 w-[280px] h-[280px] rounded-2xl bg-default-100 animate-pulse"
                  />
                ))
              : posts.map((post) => (
                  <a
                    key={post.id}
                    href={post.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 w-[280px] h-[280px] rounded-2xl overflow-hidden relative group instagram-card-hover border border-[rgba(88,22,104,0.05)] shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
                  >
                    {post.media_url ? (
                      <Image
                        src={post.media_url}
                        alt={post.caption || "Instagram post"}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="280px"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                        <InstagramIcon size={48} className="text-white/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center" style={{ background: "linear-gradient(transparent 40%, rgba(88,22,104,0.85) 100%)" }}>
                      <InstagramIcon
                        size={32}
                        className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      />
                    </div>
                  </a>
                ))}
          </div>

          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-[44px] h-[44px] rounded-full bg-white/80 dark:bg-gray-800/80 shadow-md flex items-center justify-center hover:bg-primary hover:text-white hover:scale-110 transition-all translate-x-1/2"
            aria-label="Scroll right"
          >
            <ChevronRightIcon size={20} />
          </button>
        </div>

        {/* CTA */}
        <div className="text-center mt-8">
          <a
            href="https://www.instagram.com/tsukytales/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:text-primary-light transition-colors font-medium"
          >
            <InstagramIcon size={20} />
            @tsukytales
          </a>
        </div>
      </div>
    </section>
  );
}
