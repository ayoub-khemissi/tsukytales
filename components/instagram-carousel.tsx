"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  InstagramIcon,
} from "@/components/icons";

interface InstaPost {
  id: string;
  media_url: string;
  permalink: string;
  caption?: string;
  media_type: string;
  hashtags?: string[];
  timestamp?: string;
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
    <section className="section-reveal py-16 md:py-24 max-w-[100vw] overflow-x-clip">
      {/* Header */}
      <div className="text-center mb-10 px-6">
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
      <div className="relative max-w-7xl mx-auto">
        <button
          aria-label="Scroll left"
          className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 w-[44px] h-[44px] rounded-full bg-white/80 dark:bg-gray-800/80 shadow-md items-center justify-center hover:bg-primary hover:text-white hover:scale-110 transition-all"
          onClick={() => scroll("left")}
        >
          <ChevronLeftIcon size={20} />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scroll-smooth scrollbar-hide py-2 px-6"
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
                  className="flex-shrink-0 w-[280px] h-[280px] rounded-2xl overflow-hidden relative group instagram-card-hover border border-[rgba(88,22,104,0.05)] shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
                  href={post.permalink}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {post.media_url ? (
                    <Image
                      fill
                      alt={post.caption || "Instagram post"}
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      sizes="280px"
                      src={post.media_url}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                      <InstagramIcon className="text-white/30" size={48} />
                    </div>
                  )}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 flex flex-col justify-end p-5 text-white"
                    style={{
                      background:
                        "linear-gradient(transparent 40%, rgba(88,22,104,0.85) 100%)",
                    }}
                  >
                    {post.caption && (
                      <p className="text-[0.8rem] leading-relaxed line-clamp-3 mb-2">
                        {post.caption.substring(0, 120)}
                        {post.caption.length > 120 ? "..." : ""}
                      </p>
                    )}
                    <div className="flex gap-3 text-xs opacity-80">
                      {post.hashtags && post.hashtags.length > 0 && (
                        <span>
                          {post.hashtags
                            .slice(0, 3)
                            .map((tag) => `#${tag}`)
                            .join(" ")}
                        </span>
                      )}
                      {post.timestamp && (
                        <span>
                          {new Date(post.timestamp).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </a>
              ))}
        </div>

        <button
          aria-label="Scroll right"
          className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 w-[44px] h-[44px] rounded-full bg-white/80 dark:bg-gray-800/80 shadow-md items-center justify-center hover:bg-primary hover:text-white hover:scale-110 transition-all"
          onClick={() => scroll("right")}
        >
          <ChevronRightIcon size={20} />
        </button>
      </div>

      {/* CTA */}
      <div className="text-center mt-8 px-6">
        <a
          className="inline-flex items-center gap-2 text-primary hover:text-primary-light transition-colors font-medium"
          href="https://www.instagram.com/tsukytales/"
          rel="noopener noreferrer"
          target="_blank"
        >
          <InstagramIcon size={20} />
          @tsukytales
        </a>
      </div>
    </section>
  );
}
