"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Divider } from "@heroui/divider";
import { useTranslations } from "next-intl";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

import { Link } from "@/i18n/navigation";

export default function LoginPage() {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/account";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("customer-credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError(t("error_invalid"));
      setLoading(false);
    } else {
      window.location.href = callbackUrl;
    }
  };

  return (
    <div className="container mx-auto max-w-md px-6 py-16">
      <Card className="p-4">
        <CardHeader className="flex-col items-start gap-1 pb-2">
          <h1 className="text-2xl font-bold">{t("login_title")}</h1>
          <p className="text-sm text-default-500">{t("login_subtitle")}</p>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="bg-danger-50 text-danger text-sm p-3 rounded-lg">{error}</div>
            )}
            <Input label={t("email")} type="email" value={email} onValueChange={setEmail} isRequired autoComplete="email" />
            <Input label={t("password")} type="password" value={password} onValueChange={setPassword} isRequired autoComplete="current-password" />
            <Button type="submit" color="primary" isLoading={loading} className="mt-2">
              {t("login_button")}
            </Button>
          </form>

          <Divider className="my-6" />

          <Button variant="bordered" className="w-full" onPress={() => signIn("google", { callbackUrl })}>
            {t("or_continue_with")} {t("google")}
          </Button>

          <p className="text-sm text-center mt-6 text-default-500">
            {t("no_account")}{" "}
            <Link href="/register" className="text-primary font-medium">{t("register_button")}</Link>
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
