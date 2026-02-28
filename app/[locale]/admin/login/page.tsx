"use client";

import { useState } from "react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Form } from "@heroui/form";
import { useTranslations } from "next-intl";
import { signIn } from "next-auth/react";
import Image from "next/image";

export default function AdminLoginPage() {
  const t = useTranslations("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("admin-credentials", {
      password,
      redirect: false,
    });

    if (result?.error) {
      setError(t("login_error"));
      setLoading(false);
    } else {
      window.location.href = "/admin";
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
      {/* Fixed cloud layer */}
      <div className="admin-login-bg-fixed" />
      {/* Moving cloud layer */}
      <div className="admin-login-bg-drift" />
      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        <div className="glass rounded-[24px] sm:rounded-[40px] px-6 py-10 sm:px-10 sm:py-14 border border-[#D4AF37]/15 shadow-2xl shadow-[#D4AF37]/10">
          <div className="flex flex-col items-center gap-2 pb-6">
            <Image
              alt="Tsuky Tales"
              className="mb-2"
              height={56}
              src="/assets/img/logo-round.svg"
              width={56}
            />
            <h1 className="font-heading italic text-2xl font-bold">
              {t("login_title")}
            </h1>
            <p className="text-sm text-default-500">{t("login_subtitle")}</p>
          </div>
          <Form
            className="flex flex-col gap-4"
            validationBehavior="native"
            onSubmit={handleSubmit}
          >
            {error && (
              <div className="bg-danger-50 text-danger text-sm p-3 rounded-lg text-center">
                {error}
              </div>
            )}
            <Input
              isRequired
              autoComplete="current-password"
              label={t("password")}
              size="lg"
              type="password"
              value={password}
              onValueChange={setPassword}
            />
            <Button
              className="btn-brand mt-2 w-full sm:w-auto sm:mx-auto"
              isLoading={loading}
              size="lg"
              type="submit"
            >
              {t("login_button")}
            </Button>
          </Form>
        </div>
      </div>
    </div>
  );
}
