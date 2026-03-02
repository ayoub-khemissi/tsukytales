"use client";

import { useTheme } from "next-themes";
import { useIsSSR } from "@react-aria/ssr";
import Image from "next/image";

const LOGOS: Record<string, { light: string; dark: string }> = {
  logo: {
    light: "/assets/img/logo.svg",
    dark: "/assets/img/logo-dark.svg",
  },
  "hero-logo": {
    light: "/assets/img/hero-logo.svg",
    dark: "/assets/img/hero-logo-dark.svg",
  },
};

interface ThemedLogoProps {
  variant: "logo" | "hero-logo";
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  style?: React.CSSProperties;
}

export function ThemedLogo({
  variant,
  alt,
  width,
  height,
  className,
  priority,
  style,
}: ThemedLogoProps) {
  const { theme } = useTheme();
  const isSSR = useIsSSR();

  const pair = LOGOS[variant];
  const src = !isSSR && theme === "dark" ? pair.dark : pair.light;

  return (
    <Image
      alt={alt}
      className={className}
      height={height}
      priority={priority}
      src={src}
      style={style}
      width={width}
    />
  );
}
