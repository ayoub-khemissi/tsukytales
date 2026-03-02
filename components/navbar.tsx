"use client";

import { useState } from "react";
import {
  Navbar as HeroUINavbar,
  NavbarBrand,
  NavbarContent,
  NavbarMenu,
  NavbarMenuToggle,
  NavbarItem,
  NavbarMenuItem,
} from "@heroui/navbar";
import { Button } from "@heroui/button";
import { Badge } from "@heroui/badge";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSection,
} from "@heroui/dropdown";
import { Divider } from "@heroui/divider";
import { useTranslations } from "next-intl";
import { useSession, signOut } from "next-auth/react";

import { Link } from "@/i18n/navigation";
import { ThemeSwitch } from "@/components/theme-switch";
import { ThemedLogo } from "@/components/themed-logo";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useCart } from "@/lib/store/cart-context";
import { CartIcon, UserIcon } from "@/components/icons";

const NAV_LINK_CLASS =
  "text-[0.95rem] font-medium uppercase tracking-[0.5px] text-primary hover:text-primary/60 transition-colors";

export const Navbar = () => {
  const t = useTranslations("nav");
  const account = useTranslations("account");
  const { itemCount } = useCart();
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <HeroUINavbar
      shouldHideOnScroll
      classNames={{
        base: "bg-background/90 backdrop-blur-[15px] border-b border-[rgba(88,22,104,0.05)] dark:border-[rgba(180,150,210,0.15)] h-[80px] lg:h-[100px]",
      }}
      isMenuOpen={isMenuOpen}
      maxWidth="xl"
      onMenuOpenChange={setIsMenuOpen}
    >
      {/* Left: nav links (desktop) */}
      <NavbarContent className="hidden lg:flex" justify="start">
        <NavbarItem>
          <Link className={NAV_LINK_CLASS} href="/">
            {t("home")}
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link className={NAV_LINK_CLASS} href="/about">
            {t("about")}
          </Link>
        </NavbarItem>
      </NavbarContent>

      {/* Center: Logo */}
      <NavbarBrand className="flex justify-center">
        <Link className="flex items-center" href="/" onClick={closeMenu}>
          <ThemedLogo
            priority
            alt="Tsuky Tales"
            className="object-contain"
            height={185}
            variant="logo"
            width={185}
          />
        </Link>
      </NavbarBrand>

      {/* Right: nav links + utilities (desktop) */}
      <NavbarContent className="hidden lg:flex" justify="end">
        <NavbarItem>
          <Link className={NAV_LINK_CLASS} href="/contact">
            {t("contact")}
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link className={NAV_LINK_CLASS} href="/subscription">
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
                <CartIcon className="text-primary" />
              </Button>
            </Badge>
          </Link>
          {session?.user?.role === "customer" ? (
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <Button
                  aria-label={t("account")}
                  size="sm"
                  startContent={<UserIcon className="text-primary" />}
                  variant="light"
                >
                  <span className="text-sm font-medium text-primary">
                    {session.user.name?.split(" ")[0]}
                  </span>
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label={t("account")}>
                <DropdownSection showDivider>
                  <DropdownItem
                    key="profile"
                    as={Link}
                    href="/account?tab=profile"
                  >
                    {account("tab_profile")}
                  </DropdownItem>
                  <DropdownItem
                    key="orders"
                    as={Link}
                    href="/account?tab=orders"
                  >
                    {account("tab_orders")}
                  </DropdownItem>
                  <DropdownItem
                    key="subscription"
                    as={Link}
                    href="/account?tab=subscription"
                  >
                    {account("tab_subscription")}
                  </DropdownItem>
                  <DropdownItem
                    key="payments"
                    as={Link}
                    href="/account?tab=payments"
                  >
                    {account("tab_payments")}
                  </DropdownItem>
                  <DropdownItem
                    key="addresses"
                    as={Link}
                    href="/account?tab=addresses"
                  >
                    {account("tab_addresses")}
                  </DropdownItem>
                </DropdownSection>
                <DropdownSection>
                  <DropdownItem
                    key="logout"
                    className="text-danger"
                    color="danger"
                    onPress={() => signOut()}
                  >
                    {t("logout")}
                  </DropdownItem>
                </DropdownSection>
              </DropdownMenu>
            </Dropdown>
          ) : (
            <Link href="/login">
              <Button
                isIconOnly
                aria-label={t("login")}
                size="sm"
                variant="light"
              >
                <UserIcon className="text-primary" />
              </Button>
            </Link>
          )}
        </NavbarItem>
      </NavbarContent>

      {/* Right: utilities (mobile) */}
      <NavbarContent className="lg:hidden" justify="end">
        <Link href="/cart">
          <Badge
            color="primary"
            content={itemCount > 0 ? itemCount : undefined}
            shape="circle"
            size="sm"
          >
            <CartIcon className="text-primary" size={20} />
          </Badge>
        </Link>
        <ThemeSwitch />
        <NavbarMenuToggle />
      </NavbarContent>

      {/* Mobile menu */}
      <NavbarMenu>
        <div className="mx-4 mt-2 flex flex-col gap-2">
          {session?.user?.role === "customer" ? (
            <>
              <NavbarMenuItem>
                <Link
                  className="w-full text-lg text-primary hover:text-primary/60 transition-colors"
                  href="/account?tab=profile"
                  onClick={closeMenu}
                >
                  {account("tab_profile")}
                </Link>
              </NavbarMenuItem>
              <NavbarMenuItem>
                <Link
                  className="w-full text-lg text-primary hover:text-primary/60 transition-colors"
                  href="/account?tab=orders"
                  onClick={closeMenu}
                >
                  {account("tab_orders")}
                </Link>
              </NavbarMenuItem>
              <NavbarMenuItem>
                <Link
                  className="w-full text-lg text-primary hover:text-primary/60 transition-colors"
                  href="/account?tab=subscription"
                  onClick={closeMenu}
                >
                  {account("tab_subscription")}
                </Link>
              </NavbarMenuItem>
              <NavbarMenuItem>
                <Link
                  className="w-full text-lg text-primary hover:text-primary/60 transition-colors"
                  href="/account?tab=payments"
                  onClick={closeMenu}
                >
                  {account("tab_payments")}
                </Link>
              </NavbarMenuItem>
              <NavbarMenuItem>
                <Link
                  className="w-full text-lg text-primary hover:text-primary/60 transition-colors"
                  href="/account?tab=addresses"
                  onClick={closeMenu}
                >
                  {account("tab_addresses")}
                </Link>
              </NavbarMenuItem>
              <Divider className="my-2" />
            </>
          ) : null}
          <NavbarMenuItem>
            <Link
              className="w-full text-lg text-primary hover:text-primary/60 transition-colors"
              href="/"
              onClick={closeMenu}
            >
              {t("home")}
            </Link>
          </NavbarMenuItem>
          <NavbarMenuItem>
            <Link
              className="w-full text-lg text-primary hover:text-primary/60 transition-colors"
              href="/about"
              onClick={closeMenu}
            >
              {t("about")}
            </Link>
          </NavbarMenuItem>
          <NavbarMenuItem>
            <Link
              className="w-full text-lg text-primary hover:text-primary/60 transition-colors"
              href="/contact"
              onClick={closeMenu}
            >
              {t("contact")}
            </Link>
          </NavbarMenuItem>
          <NavbarMenuItem>
            <Link
              className="w-full text-lg text-primary hover:text-primary/60 transition-colors"
              href="/subscription"
              onClick={closeMenu}
            >
              {t("subscription")}
            </Link>
          </NavbarMenuItem>
          {session?.user?.role === "customer" ? (
            <>
              <Divider className="my-2" />
              <NavbarMenuItem>
                <div className="flex items-center justify-between">
                  <button
                    className="text-lg text-danger text-left"
                    onClick={() => {
                      closeMenu();
                      signOut();
                    }}
                  >
                    {t("logout")}
                  </button>
                  <LocaleSwitcher />
                </div>
              </NavbarMenuItem>
            </>
          ) : (
            <>
              <NavbarMenuItem>
                <div className="flex items-center justify-between">
                  <Link
                    className="text-lg text-primary"
                    href="/login"
                    onClick={closeMenu}
                  >
                    {t("login")}
                  </Link>
                  <LocaleSwitcher />
                </div>
              </NavbarMenuItem>
            </>
          )}
        </div>
      </NavbarMenu>
    </HeroUINavbar>
  );
};
