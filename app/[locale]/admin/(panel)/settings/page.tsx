"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { useTranslations } from "next-intl";

export default function SettingsPage() {
  const t = useTranslations("admin");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError(t("settings_password_error"));

      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (res.ok) {
        setSuccess(t("settings_password_changed"));
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setError(t("settings_password_error"));
      }
    } catch {
      setError(t("settings_password_error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t("settings_title")}</h1>

      <Card className="max-w-lg border border-divider">
        <CardHeader className="flex-col items-start gap-1 px-6 pt-6">
          <h2 className="text-lg font-semibold">
            {t("settings_change_password")}
          </h2>
        </CardHeader>
        <CardBody className="px-6 pb-6">
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {success && (
              <div className="bg-success-50 text-success text-sm p-3 rounded-lg text-center">
                {success}
              </div>
            )}
            {error && (
              <div className="bg-danger-50 text-danger text-sm p-3 rounded-lg text-center">
                {error}
              </div>
            )}
            <Input
              isRequired
              autoComplete="current-password"
              label={t("settings_current_password")}
              type="password"
              value={currentPassword}
              onValueChange={setCurrentPassword}
            />
            <Input
              isRequired
              autoComplete="new-password"
              label={t("settings_new_password")}
              type="password"
              value={newPassword}
              onValueChange={setNewPassword}
            />
            <Input
              isRequired
              autoComplete="new-password"
              label={t("settings_confirm_password")}
              type="password"
              value={confirmPassword}
              onValueChange={setConfirmPassword}
            />
            <Button
              className="mt-2"
              color="primary"
              isLoading={loading}
              type="submit"
            >
              {t("settings_submit")}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
