"use client";

import { useState } from "react";
import { Card, CardBody } from "@heroui/card";
import { Input, Textarea } from "@heroui/input";
import { Button } from "@heroui/button";
import { useTranslations } from "next-intl";

export default function ContactPage() {
  const t = useTranslations("contact");
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const update = (field: string) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");

    try {
      const res = await fetch("/api/store/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus("success");
        setForm({ name: "", email: "", subject: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl px-6 py-16">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="mt-2 text-default-500">{t("subtitle")}</p>
      </div>

      <Card className="border border-divider">
        <CardBody className="p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {status === "success" && (
              <div className="bg-success-50 text-success p-3 rounded-lg text-sm">{t("success")}</div>
            )}
            {status === "error" && (
              <div className="bg-danger-50 text-danger p-3 rounded-lg text-sm">{t("error")}</div>
            )}
            <Input label={t("name")} value={form.name} onValueChange={update("name")} isRequired />
            <Input label={t("email")} type="email" value={form.email} onValueChange={update("email")} isRequired />
            <Input label={t("subject")} value={form.subject} onValueChange={update("subject")} isRequired />
            <Textarea label={t("message")} value={form.message} onValueChange={update("message")} minRows={5} isRequired />
            <Button type="submit" color="primary" size="lg" isLoading={loading} className="mt-2">
              {t("send")}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
