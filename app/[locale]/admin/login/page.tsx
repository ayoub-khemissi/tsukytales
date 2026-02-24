"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { useTranslations } from "next-intl";
import { signIn } from "next-auth/react";

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a0a1f] via-[#2d1038] to-[#1a0a1f] px-4">
      <Card className="w-full max-w-md p-6 bg-background/80 backdrop-blur-md border border-white/10 shadow-2xl">
        <CardHeader className="flex-col items-center gap-2 pb-4">
          {/* Brand logo */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#581668] to-[#7a218f] flex items-center justify-center text-2xl font-bold text-white mb-2 shadow-lg shadow-purple-900/40">
            T
          </div>
          <h1 className="text-2xl font-bold">{t("login_title")}</h1>
          <p className="text-sm text-default-500">{t("login_subtitle")}</p>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="bg-danger-50 text-danger text-sm p-3 rounded-lg text-center">
                {error}
              </div>
            )}
            <Input
              label={t("password")}
              type="password"
              value={password}
              onValueChange={setPassword}
              isRequired
              autoComplete="current-password"
              size="lg"
            />
            <Button
              type="submit"
              color="primary"
              isLoading={loading}
              className="mt-2"
              size="lg"
            >
              {t("login_button")}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
