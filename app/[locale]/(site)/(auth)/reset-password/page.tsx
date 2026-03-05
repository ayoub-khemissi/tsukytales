"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Form } from "@heroui/form";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import { Link } from "@/i18n/navigation";

export default function ResetPasswordPage() {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== passwordConfirm) {
      setError(t("error_passwords_mismatch"));

      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (!res.ok) {
        const data = await res.json();

        setError(data.error || t("reset_error"));
        setLoading(false);

        return;
      }
      setSuccess(true);
    } catch {
      setError(t("reset_error"));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="container mx-auto max-w-md px-6 py-16">
        <Card className="p-4">
          <CardBody className="text-center space-y-4">
            <p className="text-danger">{t("reset_invalid_link")}</p>
            <Link className="text-primary font-medium" href="/forgot-password">
              {t("forgot_button")}
            </Link>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-md px-6 py-16">
      <Card className="p-4">
        <CardHeader className="flex-col items-start gap-1 pb-2">
          <h1 className="text-2xl font-bold">{t("reset_title")}</h1>
          <p className="text-sm text-default-500">{t("reset_subtitle")}</p>
        </CardHeader>
        <CardBody>
          {success ? (
            <div className="space-y-4">
              <div className="bg-success-50 text-success text-sm p-3 rounded-lg">
                {t("reset_success")}
              </div>
              <p className="text-sm text-center">
                <Link className="text-primary font-medium" href="/login">
                  {t("login_button")}
                </Link>
              </p>
            </div>
          ) : (
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
                description={t("password_min")}
                errorMessage={t("error_password_min")}
                label={t("new_password")}
                minLength={8}
                type="password"
                value={password}
                onValueChange={setPassword}
              />
              <Input
                isRequired
                errorMessage={t("error_passwords_mismatch")}
                label={t("password_confirm")}
                type="password"
                validate={(value) =>
                  value !== password ? t("error_passwords_mismatch") : true
                }
                value={passwordConfirm}
                onValueChange={setPasswordConfirm}
              />
              <Button
                className="btn-brand bg-primary mt-2 w-full font-semibold"
                isLoading={loading}
                type="submit"
              >
                {t("reset_button")}
              </Button>
            </Form>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
