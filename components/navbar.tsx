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
      shouldHideOnScroll
      classNames={{
        base: `navbar-shrink bg-background/90 backdrop-blur-[15px] border-b border-[rgba(88,22,104,0.05)] transition-all duration-300 ${scrolled ? "py-1 shadow-md bg-background/95" : "py-2"}`,
      }}
      maxWidth="xl"
    >
      {/* Left nav */}
      <NavbarContent className="hidden lg:flex basis-1/3" justify="start">
        <NavbarItem>
          <Link
            className="text-[0.95rem] font-medium uppercase tracking-[0.5px] text-foreground hover:text-primary transition-colors"
            href="/"
          >
            {t("home")}
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link
            className="text-[0.95rem] font-medium uppercase tracking-[0.5px] text-foreground hover:text-primary transition-colors"
            href="/about"
          >
            {t("about")}
          </Link>
        </NavbarItem>
      </NavbarContent>

      {/* Center logo */}
      <NavbarContent className="basis-1/3" justify="center">
        <Link className="flex items-center" href="/">
          <Image
            priority
            alt="Tsuky Tales"
            className="transition-all duration-300 object-contain"
            height={logoSize}
            src="/assets/img/logo.png"
            width={logoSize}
          />
        </Link>
      </NavbarContent>

      {/* Right nav */}
      <NavbarContent className="hidden lg:flex basis-1/3" justify="end">
        <NavbarItem>
          <Link
            className="text-[0.95rem] font-medium uppercase tracking-[0.5px] text-foreground hover:text-primary transition-colors"
            href="/contact"
          >
            {t("contact")}
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link
            className="text-[0.95rem] font-medium uppercase tracking-[0.5px] text-foreground hover:text-primary transition-colors"
            href="/subscription"
          >
            {t("subscription")}
          </Link>
        </NavbarItem>
        <NavbarItem className="flex gap-1 items-center">
          <LocaleSwitcher />
          <ThemeSwitch />
          <Link href="/cart">
            <Badge
              color="primary"
              content={itemCount > 0 ? itemCount : undefined}
              shape="circle"
              size="sm"
            >
              <Button
                isIconOnly
                aria-label={t("cart")}
                size="sm"
                variant="light"
              >
                <CartIcon className="text-default-500" />
              </Button>
            </Badge>
          </Link>
          {session?.user ? (
            <Link href="/account">
              <Button
                isIconOnly
                aria-label={t("account")}
                size="sm"
                variant="light"
              >
                <UserIcon className="text-default-500" />
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button
                isIconOnly
                aria-label={t("login")}
                size="sm"
                variant="light"
              >
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
            color="primary"
            content={itemCount > 0 ? itemCount : undefined}
            shape="circle"
            size="sm"
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
            <Link className="w-full text-lg text-foreground" href="/">
              {t("home")}
            </Link>
          </NavbarMenuItem>
          <NavbarMenuItem>
            <Link className="w-full text-lg text-foreground" href="/shop">
              {t("shop")}
            </Link>
          </NavbarMenuItem>
          <NavbarMenuItem>
            <Link
              className="w-full text-lg text-foreground"
              href="/subscription"
            >
              {t("subscription")}
            </Link>
          </NavbarMenuItem>
          <NavbarMenuItem>
            <Link className="w-full text-lg text-foreground" href="/about">
              {t("about")}
            </Link>
          </NavbarMenuItem>
          <NavbarMenuItem>
            <Link className="w-full text-lg text-foreground" href="/contact">
              {t("contact")}
            </Link>
          </NavbarMenuItem>
          <NavbarMenuItem>
            <Link className="w-full text-lg text-foreground" href="/cart">
              {t("cart")}
            </Link>
          </NavbarMenuItem>
          {session?.user ? (
            <NavbarMenuItem>
              <Link className="w-full text-lg text-primary" href="/account">
                {t("account")}
              </Link>
            </NavbarMenuItem>
          ) : (
            <NavbarMenuItem>
              <Link className="w-full text-lg text-primary" href="/login">
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
