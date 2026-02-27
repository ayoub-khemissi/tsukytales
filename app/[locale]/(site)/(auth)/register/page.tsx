"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Divider } from "@heroui/divider";
import { Form } from "@heroui/form";
import { useTranslations } from "next-intl";
import { signIn } from "next-auth/react";

import { Link } from "@/i18n/navigation";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field: string) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.passwordConfirm) {
      setError(t("passwords_mismatch"));

      return;
    }
    if (form.password.length < 8) {
      setError(t("password_min"));

      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          password: form.password,
        }),
      });

      if (!res.ok) {
        const data = await res.json();

        setError(data.error || t("error_exists"));
        setLoading(false);

        return;
      }
      const result = await signIn("customer-credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        setLoading(false);
      } else {
        window.location.href = "/account";
      }
    } catch {
      setError("Erreur réseau");
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-md px-6 py-16">
      <Card className="p-4">
        <CardHeader className="flex-col items-start gap-1 pb-2">
          <h1 className="text-2xl font-bold">{t("register_title")}</h1>
          <p className="text-sm text-default-500">{t("register_subtitle")}</p>
        </CardHeader>
        <CardBody>
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
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                isRequired
                label={t("first_name")}
                value={form.first_name}
                onValueChange={update("first_name")}
              />
              <Input
                isRequired
                label={t("last_name")}
                value={form.last_name}
                onValueChange={update("last_name")}
              />
            </div>
            <Input
              isRequired
              autoComplete="email"
              label={t("email")}
              type="email"
              value={form.email}
              onValueChange={update("email")}
            />
            <Input
              isRequired
              description={t("password_min")}
              label={t("password")}
              type="password"
              value={form.password}
              onValueChange={update("password")}
            />
            <Input
              isRequired
              label={t("password_confirm")}
              type="password"
              value={form.passwordConfirm}
              onValueChange={update("passwordConfirm")}
            />
            <Button
              className="btn-brand bg-primary mt-2 w-full font-semibold"
              isLoading={loading}
              type="submit"
            >
              {t("register_button")}
            </Button>
          </Form>
          <Divider className="my-6" />
          <Button
            className="btn-brand-outline w-full font-semibold"
            onPress={() => signIn("google", { callbackUrl: "/account" })}
          >
            {t("or_continue_with")} {t("google")}
          </Button>
          <p className="text-sm text-center mt-6 text-default-500">
            {t("has_account")}{" "}
            <Link className="text-primary font-medium" href="/login">
              {t("login_button")}
            </Link>
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
