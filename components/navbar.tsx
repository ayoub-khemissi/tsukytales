"use client";

import { useEffect, useState } from "react";
import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarMenu,
  NavbarMenuToggle,
  NavbarItem,
  NavbarMenuItem,
} from "@heroui/navbar";
import { Button } from "@heroui/button";
import { Badge } from "@heroui/badge";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import Image from "next/image";

import { Link } from "@/i18n/navigation";
import { ThemeSwitch } from "@/components/theme-switch";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useCart } from "@/lib/store/cart-context";
import { CartIcon, UserIcon } from "@/components/icons";

export const Navbar = () => {
  const t = useTranslations("nav");
  const { itemCount } = useCart();
  const { data: session } = useSession();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 50);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const logoSize = scrolled ? 90 : 130;

  return (
    <HeroUINavbar
      maxWidth="xl"
      shouldHideOnScroll
      classNames={{
        base: `navbar-shrink bg-background/90 backdrop-blur-[15px] border-b border-[rgba(88,22,104,0.05)] transition-all duration-300 ${scrolled ? "py-1 shadow-md bg-background/95" : "py-2"}`,
      }}
    >
      {/* Left nav */}
      <NavbarContent className="hidden lg:flex basis-1/3" justify="start">
        <NavbarItem>
          <Link
            href="/"
            className="text-[0.95rem] font-medium uppercase tracking-[0.5px] text-foreground hover:text-primary transition-colors"
          >
            {t("home")}
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link
            href="/about"
            className="text-[0.95rem] font-medium uppercase tracking-[0.5px] text-foreground hover:text-primary transition-colors"
          >
            {t("about")}
          </Link>
        </NavbarItem>
      </NavbarContent>

      {/* Center logo */}
      <NavbarContent justify="center" className="basis-1/3">
        <Link href="/" className="flex items-center">
          <Image
            src="/assets/img/logo.png"
            alt="Tsuky Tales"
            width={logoSize}
            height={logoSize}
            className="transition-all duration-300 object-contain"
            priority
          />
        </Link>
      </NavbarContent>

      {/* Right nav */}
      <NavbarContent className="hidden lg:flex basis-1/3" justify="end">
        <NavbarItem>
          <Link
            href="/contact"
            className="text-[0.95rem] font-medium uppercase tracking-[0.5px] text-foreground hover:text-primary transition-colors"
          >
            {t("contact")}
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link
            href="/subscription"
            className="text-[0.95rem] font-medium uppercase tracking-[0.5px] text-foreground hover:text-primary transition-colors"
          >
            {t("subscription")}
          </Link>
        </NavbarItem>
        <NavbarItem className="flex gap-1 items-center">
          <LocaleSwitcher />
          <ThemeSwitch />
          <Link href="/cart">
            <Badge
              content={itemCount > 0 ? itemCount : undefined}
              color="primary"
              size="sm"
              shape="circle"
            >
              <Button isIconOnly variant="light" aria-label={t("cart")} size="sm">
                <CartIcon className="text-default-500" />
              </Button>
            </Badge>
          </Link>
          {session?.user ? (
            <Link href="/account">
              <Button isIconOnly variant="light" aria-label={t("account")} size="sm">
                <UserIcon className="text-default-500" />
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button isIconOnly variant="light" aria-label={t("login")} size="sm">
                <UserIcon className="text-default-500" />
              </Button>
            </Link>
          )}
        </NavbarItem>
      </NavbarContent>

      {/* Mobile */}
      <NavbarContent className="lg:hidden basis-1 pl-4" justify="end">
        <Link href="/cart">
          <Badge
            content={itemCount > 0 ? itemCount : undefined}
            color="primary"
            size="sm"
            shape="circle"
          >
            <CartIcon className="text-default-500" size={20} />
          </Badge>
        </Link>
        <ThemeSwitch />
        <NavbarMenuToggle />
      </NavbarContent>

      <NavbarMenu>
        <div className="mx-4 mt-2 flex flex-col gap-2">
          <NavbarMenuItem>
            <Link href="/" className="w-full text-lg text-foreground">
              {t("home")}
            </Link>
          </NavbarMenuItem>
          <NavbarMenuItem>
            <Link href="/shop" className="w-full text-lg text-foreground">
              {t("shop")}
            </Link>
          </NavbarMenuItem>
          <NavbarMenuItem>
            <Link href="/subscription" className="w-full text-lg text-foreground">
              {t("subscription")}
            </Link>
          </NavbarMenuItem>
          <NavbarMenuItem>
            <Link href="/about" className="w-full text-lg text-foreground">
              {t("about")}
            </Link>
          </NavbarMenuItem>
          <NavbarMenuItem>
            <Link href="/contact" className="w-full text-lg text-foreground">
              {t("contact")}
            </Link>
          </NavbarMenuItem>
          <NavbarMenuItem>
            <Link href="/cart" className="w-full text-lg text-foreground">
              {t("cart")}
            </Link>
          </NavbarMenuItem>
          {session?.user ? (
            <NavbarMenuItem>
              <Link href="/account" className="w-full text-lg text-primary">
                {t("account")}
              </Link>
            </NavbarMenuItem>
          ) : (
            <NavbarMenuItem>
              <Link href="/login" className="w-full text-lg text-primary">
                {t("login")}
              </Link>
            </NavbarMenuItem>
          )}
          <NavbarMenuItem className="mt-2">
            <LocaleSwitcher />
          </NavbarMenuItem>
        </div>
      </NavbarMenu>
    </HeroUINavbar>
  );
};
