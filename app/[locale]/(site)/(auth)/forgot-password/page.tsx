"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Form } from "@heroui/form";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        setError(t("forgot_error"));
        setLoading(false);

        return;
      }
      setSent(true);
    } catch {
      setError(t("forgot_error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-md px-6 py-16">
      <Card className="p-4">
        <CardHeader className="flex-col items-start gap-1 pb-2">
          <h1 className="text-2xl font-bold">{t("forgot_title")}</h1>
          <p className="text-sm text-default-500">{t("forgot_subtitle")}</p>
        </CardHeader>
        <CardBody>
          {sent ? (
            <div className="space-y-4">
              <div className="bg-success-50 text-success text-sm p-3 rounded-lg">
                {t("forgot_sent")}
              </div>
              <p className="text-sm text-center text-default-500">
                <Link className="text-primary font-medium" href="/login">
                  {t("login_button")}
                </Link>
              </p>
            </div>
          ) : (
            <>
              <Form
                className="flex flex-col gap-4"
                validationBehavior="native"
                onSubmit={handleSubmit}
              >
                {error && (
                  <div className="bg-danger-50 text-danger text-sm p-3 rounded-lg">
                    {error}
                  </div>
                )}
                <Input
                  isRequired
                  autoComplete="email"
                  label={t("email")}
                  type="email"
                  value={email}
                  onValueChange={setEmail}
                />
                <Button
                  className="btn-brand bg-primary mt-2 w-full font-semibold"
                  isLoading={loading}
                  type="submit"
                >
                  {t("forgot_button")}
                </Button>
              </Form>
              <p className="text-sm text-center mt-6 text-default-500">
                <Link className="text-primary font-medium" href="/login">
                  {t("back_to_login")}
                </Link>
              </p>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
