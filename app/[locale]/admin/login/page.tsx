"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Form } from "@heroui/form";
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
      <Card className="w-full max-w-md p-6 bg-background/80 backdrop-blur-md border border-[#D4AF37]/20 shadow-2xl shadow-[#D4AF37]/10">
        <CardHeader className="flex-col items-center gap-2 pb-4">
          {/* Brand logo */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#F2D479] flex items-center justify-center text-2xl font-bold text-[#1a0a1f] mb-2 shadow-lg shadow-[#D4AF37]/30">
            T
          </div>
          <h1 className="font-heading italic text-2xl font-bold">
            {t("login_title")}
          </h1>
          <p className="text-sm text-default-500">{t("login_subtitle")}</p>
        </CardHeader>
        <CardBody>
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
              className="btn-brand mt-2"
              isLoading={loading}
              size="lg"
              type="submit"
            >
              {t("login_button")}
            </Button>
          </Form>
        </CardBody>
      </Card>
    </div>
  );
}
