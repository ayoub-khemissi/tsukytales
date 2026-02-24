"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Checkbox } from "@heroui/checkbox";
import { Divider } from "@heroui/divider";
import { Chip } from "@heroui/chip";

/* ------------------------------------------------------------------ */
/*  Types & constants                                                  */
/* ------------------------------------------------------------------ */

interface BannerPreset {
  label: string;
  width: number;
  height: number;
}

type Category = "social" | "web" | "print";

const PRESETS: Record<Category, BannerPreset[]> = {
  social: [
    { label: "Instagram Post", width: 1080, height: 1080 },
    { label: "Instagram Story", width: 1080, height: 1920 },
    { label: "Facebook Cover", width: 820, height: 312 },
    { label: "Twitter/X Header", width: 1500, height: 500 },
    { label: "YouTube Banner", width: 2560, height: 1440 },
  ],
  web: [
    { label: "Website Banner", width: 1920, height: 600 },
    { label: "Blog Header", width: 1200, height: 630 },
    { label: "Email Header", width: 600, height: 200 },
    { label: "Leaderboard Ad", width: 728, height: 90 },
  ],
  print: [
    { label: "A4 Landscape", width: 3508, height: 2480 },
    { label: "A5 Flyer", width: 2480, height: 1748 },
    { label: "Business Card", width: 1050, height: 600 },
    { label: "Bookmark", width: 600, height: 1800 },
  ],
};

const CATEGORY_KEYS: Category[] = ["social", "web", "print"];

/* ------------------------------------------------------------------ */
/*  Download helper                                                    */
/* ------------------------------------------------------------------ */

function downloadBanner(width: number, height: number, filename: string) {
  const canvas = document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) return;

  // Gradient background
  const grad = ctx.createLinearGradient(0, 0, width, height);

  grad.addColorStop(0, "#581668");
  grad.addColorStop(1, "#7a218f");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Title
  const titleSize = Math.max(16, Math.round(width * 0.05));

  ctx.font = `bold ${titleSize}px sans-serif`;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("TSUKY TALES", width / 2, height / 2 - titleSize * 0.4);

  // Tagline
  const tagSize = Math.max(10, Math.round(titleSize * 0.45));

  ctx.font = `${tagSize}px sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fillText(
    "Cr\u00e9ateur d\u2019imaginaires",
    width / 2,
    height / 2 + titleSize * 0.6,
  );

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, "image/png");
}

/* ------------------------------------------------------------------ */
/*  BannerPreview component                                            */
/* ------------------------------------------------------------------ */

function BannerPreview({
  width,
  height,
  maxWidth = 200,
}: {
  width: number;
  height: number;
  maxWidth?: number;
}) {
  const aspect = width / height;
  const displayW = Math.min(maxWidth, width);
  const displayH = displayW / aspect;

  return (
    <div
      className="relative flex flex-col items-center justify-center rounded-md overflow-hidden"
      style={{
        width: displayW,
        height: Math.min(displayH, 300),
        background: "linear-gradient(135deg, #581668, #7a218f)",
      }}
    >
      <span
        className="font-bold text-white select-none"
        style={{ fontSize: Math.max(8, displayW * 0.07) }}
      >
        TSUKY TALES
      </span>
      <span
        className="text-white/60 select-none"
        style={{ fontSize: Math.max(6, displayW * 0.035) }}
      >
        Cr&eacute;ateur d&rsquo;imaginaires
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function BrandingPage() {
  const t = useTranslations("branding");

  const [activeCategory, setActiveCategory] = useState<Category>("social");
  const [customWidth, setCustomWidth] = useState(1200);
  const [customHeight, setCustomHeight] = useState(630);
  const [locked, setLocked] = useState(false);

  const resizableRef = useRef<HTMLDivElement>(null);
  const isObserving = useRef(false);

  /* Sync resize observer -> inputs */
  useEffect(() => {
    const el = resizableRef.current;

    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      if (!isObserving.current) return;
      for (const entry of entries) {
        const w = Math.round(entry.contentRect.width);
        const h = Math.round(entry.contentRect.height);

        if (w > 0 && h > 0) {
          setCustomWidth(w);
          setCustomHeight(h);
        }
      }
    });

    // Small delay to avoid capturing the initial programmatic resize
    const timer = setTimeout(() => {
      isObserving.current = true;
      observer.observe(el);
    }, 100);

    return () => {
      clearTimeout(timer);
      isObserving.current = false;
      observer.disconnect();
    };
  }, []);

  /* Sync inputs -> resizable div */
  useEffect(() => {
    const el = resizableRef.current;

    if (!el) return;

    isObserving.current = false;
    el.style.width = `${customWidth}px`;
    el.style.height = `${customHeight}px`;

    // Re-enable observer after the programmatic resize settles
    const timer = setTimeout(() => {
      isObserving.current = true;
    }, 50);

    return () => clearTimeout(timer);
  }, [customWidth, customHeight]);

  const clamp = (v: number) => Math.max(100, Math.min(5000, v));

  const handleWidthChange = useCallback((val: string) => {
    const n = parseInt(val, 10);

    if (!isNaN(n)) setCustomWidth(clamp(n));
  }, []);

  const handleHeightChange = useCallback((val: string) => {
    const n = parseInt(val, 10);

    if (!isNaN(n)) setCustomHeight(clamp(n));
  }, []);

  const categoryTranslationKey: Record<Category, string> = {
    social: "preset_social",
    web: "preset_web",
    print: "preset_print",
  };

  return (
    <div className="container mx-auto max-w-7xl px-6 py-12 space-y-16">
      {/* ============================================================ */}
      {/* A) Project presentation                                      */}
      {/* ============================================================ */}
      <section>
        <Card className="bg-gradient-to-br from-[#581668] to-[#2d0b35] text-white shadow-xl border-none">
          <CardBody className="py-16 px-8 flex flex-col items-center text-center">
            <h1 className="text-3xl md:text-5xl font-bold mb-6">
              {t("about_title")}
            </h1>
            <p className="max-w-3xl text-base md:text-lg leading-relaxed text-white/85">
              {t("about_text")}
            </p>
          </CardBody>
        </Card>
      </section>

      <Divider />

      {/* ============================================================ */}
      {/* B) Standard banners                                          */}
      {/* ============================================================ */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold">
            {t("banners_title")}
          </h2>
          <p className="text-default-500">{t("banners_subtitle")}</p>
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap justify-center gap-3">
          {CATEGORY_KEYS.map((cat) => (
            <Chip
              key={cat}
              className="cursor-pointer select-none"
              color="secondary"
              variant={activeCategory === cat ? "solid" : "bordered"}
              onClick={() => setActiveCategory(cat)}
            >
              {t(categoryTranslationKey[cat])}
            </Chip>
          ))}
        </div>

        {/* Preset grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {PRESETS[activeCategory].map((preset) => (
            <Card key={preset.label} className="border border-divider">
              <CardHeader className="flex flex-col items-start pb-0">
                <h3 className="font-semibold text-foreground">
                  {preset.label}
                </h3>
                <span className="text-xs text-default-400">
                  {preset.width} &times; {preset.height} px
                </span>
              </CardHeader>
              <CardBody className="flex flex-col items-center gap-4">
                <BannerPreview height={preset.height} width={preset.width} />
                <Button
                  color="primary"
                  size="sm"
                  variant="flat"
                  onPress={() =>
                    downloadBanner(
                      preset.width,
                      preset.height,
                      `tsuky-tales-${preset.label.toLowerCase().replace(/[\s/]+/g, "-")}-${preset.width}x${preset.height}.png`,
                    )
                  }
                >
                  {t("banner_download")}
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      <Divider />

      {/* ============================================================ */}
      {/* C) Custom size                                               */}
      {/* ============================================================ */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold">{t("custom_size")}</h2>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 max-w-xl mx-auto">
          <Input
            className="flex-1"
            endContent={<span className="text-default-400 text-xs">px</span>}
            label={t("width")}
            max={5000}
            min={100}
            type="number"
            value={String(customWidth)}
            onValueChange={handleWidthChange}
          />
          <Input
            className="flex-1"
            endContent={<span className="text-default-400 text-xs">px</span>}
            label={t("height")}
            max={5000}
            min={100}
            type="number"
            value={String(customHeight)}
            onValueChange={handleHeightChange}
          />
        </div>

        <div className="flex flex-col items-center gap-2">
          <Checkbox
            color="secondary"
            isSelected={locked}
            onValueChange={setLocked}
          >
            {t("lock_resize")}
          </Checkbox>
          <span className="text-xs text-default-400">{t("resize_hint")}</span>
        </div>

        {/* Resizable preview */}
        <div className="flex justify-center overflow-auto pb-4">
          <div
            ref={resizableRef}
            className="relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-default-300"
            style={{
              width: customWidth,
              height: customHeight,
              maxWidth: "100%",
              maxHeight: 800,
              resize: locked ? "none" : "both",
              overflow: "hidden",
              background: "linear-gradient(135deg, #581668, #7a218f)",
            }}
          >
            <span
              className="font-bold text-white select-none"
              style={{
                fontSize: Math.max(12, Math.min(customWidth, 600) * 0.05),
              }}
            >
              TSUKY TALES
            </span>
            <span
              className="text-white/60 select-none"
              style={{
                fontSize: Math.max(8, Math.min(customWidth, 600) * 0.028),
              }}
            >
              Cr&eacute;ateur d&rsquo;imaginaires
            </span>
          </div>
        </div>

        {/* Custom download */}
        <div className="text-center">
          <Button
            color="primary"
            variant="shadow"
            onPress={() =>
              downloadBanner(
                customWidth,
                customHeight,
                `tsuky-tales-custom-${customWidth}x${customHeight}.png`,
              )
            }
          >
            {t("banner_download")} ({customWidth} &times; {customHeight})
          </Button>
        </div>
      </section>
    </div>
  );
}
