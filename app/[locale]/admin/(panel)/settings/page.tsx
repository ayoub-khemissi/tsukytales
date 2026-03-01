"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Form } from "@heroui/form";
import { Tabs, Tab } from "@heroui/tabs";
import { Spinner } from "@heroui/spinner";
import { useTranslations } from "next-intl";

interface RateTier {
  maxWeight: number;
  price: number;
}

type RateKey =
  | "shipping_rates_relay_fr"
  | "shipping_rates_relay_eu"
  | "shipping_rates_home_fr"
  | "shipping_rates_home_eu1"
  | "shipping_rates_home_eu2"
  | "shipping_rates_home_om"
  | "shipping_rates_home_world";

type AllRates = Record<RateKey, RateTier[]>;

const RELAY_ZONES: { key: RateKey; labelKey: string }[] = [
  {
    key: "shipping_rates_relay_fr",
    labelKey: "settings_shipping_zone_relay_fr",
  },
  {
    key: "shipping_rates_relay_eu",
    labelKey: "settings_shipping_zone_relay_eu",
  },
];

const HOME_ZONES: { key: RateKey; labelKey: string }[] = [
  { key: "shipping_rates_home_fr", labelKey: "settings_shipping_zone_home_fr" },
  {
    key: "shipping_rates_home_eu1",
    labelKey: "settings_shipping_zone_home_eu1",
  },
  {
    key: "shipping_rates_home_eu2",
    labelKey: "settings_shipping_zone_home_eu2",
  },
  { key: "shipping_rates_home_om", labelKey: "settings_shipping_zone_home_om" },
  {
    key: "shipping_rates_home_world",
    labelKey: "settings_shipping_zone_home_world",
  },
];

function RateTable({
  tiers,
  onChange,
  t,
}: {
  tiers: RateTier[];
  onChange: (tiers: RateTier[]) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const updateTier = (
    index: number,
    field: "maxWeight" | "price",
    value: string,
  ) => {
    const updated = [...tiers];

    updated[index] = { ...updated[index], [field]: parseFloat(value) || 0 };
    onChange(updated);
  };

  const addTier = () => {
    const lastWeight = tiers.length > 0 ? tiers[tiers.length - 1].maxWeight : 0;

    onChange([...tiers, { maxWeight: lastWeight + 1, price: 0 }]);
  };

  const removeTier = (index: number) => {
    onChange(tiers.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs font-semibold text-default-500 px-1">
        <span>{t("settings_shipping_weight")}</span>
        <span>{t("settings_shipping_price")}</span>
        <span className="w-[70px]" />
      </div>
      {tiers.map((tier, i) => (
        <div
          key={i}
          className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center"
        >
          <Input
            min="0.1"
            size="sm"
            step="0.1"
            type="number"
            value={String(tier.maxWeight)}
            onValueChange={(v) => updateTier(i, "maxWeight", v)}
          />
          <Input
            min="0"
            size="sm"
            step="0.1"
            type="number"
            value={String(tier.price)}
            onValueChange={(v) => updateTier(i, "price", v)}
          />
          <Button
            className="min-w-[70px]"
            color="danger"
            size="sm"
            variant="light"
            onPress={() => removeTier(i)}
          >
            {t("settings_shipping_remove_tier")}
          </Button>
        </div>
      ))}
      <Button size="sm" variant="flat" onPress={addTier}>
        {t("settings_shipping_add_tier")}
      </Button>
    </div>
  );
}

export default function SettingsPage() {
  const t = useTranslations("admin");

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Shipping rates state
  const [rates, setRates] = useState<AllRates | null>(null);
  const [shippingLoading, setShippingLoading] = useState(true);
  const [shippingSaving, setShippingSaving] = useState(false);
  const [shippingSuccess, setShippingSuccess] = useState("");
  const [shippingError, setShippingError] = useState("");

  // Subscription dates state
  const [subDates, setSubDates] = useState<string[]>([]);
  const [newDate, setNewDate] = useState("");
  const [dateError, setDateError] = useState("");
  const [dateSaving, setDateSaving] = useState(false);

  const fetchSubDates = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings/subscription-dates");

      if (res.ok) {
        const data = await res.json();

        setSubDates(data.dates || []);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchSubDates();
  }, [fetchSubDates]);

  const suggestNextDate = useCallback((): string => {
    if (subDates.length > 0) {
      const base = new Date(subDates[subDates.length - 1] + "T00:00:00");

      base.setMonth(base.getMonth() + 3);

      return base.toISOString().split("T")[0];
    }

    const tomorrow = new Date();

    tomorrow.setDate(tomorrow.getDate() + 1);

    return tomorrow.toISOString().split("T")[0];
  }, [subDates]);

  useEffect(() => {
    setNewDate(suggestNextDate());
  }, [suggestNextDate]);

  const saveSubDates = async (dates: string[]) => {
    setDateSaving(true);
    try {
      const res = await fetch("/api/admin/settings/subscription-dates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dates }),
      });

      if (res.ok) {
        const data = await res.json();

        setSubDates(data.dates);
        setDateError("");
      } else {
        const err = await res.json();

        setDateError(err.error || "Erreur");
      }
    } finally {
      setDateSaving(false);
    }
  };

  const handleAddDate = async () => {
    if (!newDate) return;
    const today = new Date().toISOString().split("T")[0];

    if (newDate < today) {
      setDateError(t("sub_dates_error_past"));

      return;
    }
    if (subDates.includes(newDate)) {
      setDateError(t("sub_dates_error_duplicate"));

      return;
    }
    await saveSubDates([...subDates, newDate]);
    setNewDate("");
  };

  const handleRemoveDate = async (date: string) => {
    await saveSubDates(subDates.filter((d) => d !== date));
  };

  const fetchRates = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings/shipping");

      if (res.ok) {
        setRates(await res.json());
      }
    } catch {
      // silently fail, will show empty
    } finally {
      setShippingLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
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
        const data = await res.json().catch(() => null);

        setError(data?.error || t("settings_password_error"));
      }
    } catch {
      setError(t("settings_password_error"));
    } finally {
      setLoading(false);
    }
  };

  const updateRate = (key: RateKey, tiers: RateTier[]) => {
    if (!rates) return;
    setRates({ ...rates, [key]: tiers });
  };

  const handleShippingSave = async () => {
    if (!rates) return;
    setShippingError("");
    setShippingSuccess("");
    setShippingSaving(true);

    try {
      const res = await fetch("/api/admin/settings/shipping", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rates),
      });

      if (res.ok) {
        setShippingSuccess(t("settings_shipping_saved"));
      } else {
        const data = await res.json().catch(() => null);

        setShippingError(data?.error || t("settings_shipping_error"));
      }
    } catch {
      setShippingError(t("settings_shipping_error"));
    } finally {
      setShippingSaving(false);
    }
  };

  const renderZones = (zones: { key: RateKey; labelKey: string }[]) => {
    if (!rates) return null;

    return (
      <div className="space-y-6">
        {zones.map(({ key, labelKey }) => (
          <div key={key}>
            <h4 className="font-heading text-sm font-semibold mb-2">
              {t(labelKey as any)}
            </h4>
            <RateTable
              t={t}
              tiers={rates[key]}
              onChange={(tiers) => updateRate(key, tiers)}
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <h1 className="font-heading italic text-2xl font-bold text-text-brand dark:text-white mb-6">
        {t("settings_title")}
      </h1>

      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Password Card */}
          <Card className="admin-glass rounded-xl">
            <CardHeader className="flex-col items-start gap-1 px-6 pt-6">
              <h2 className="font-heading text-lg font-semibold">
                {t("settings_change_password")}
              </h2>
            </CardHeader>
            <CardBody className="px-6 pb-6">
              <Form
                className="flex flex-col gap-4"
                validationBehavior="native"
                onSubmit={handlePasswordSubmit}
              >
                {success && (
                  <Chip
                    className="w-full max-w-full py-4 text-center"
                    color="success"
                    variant="flat"
                  >
                    {success}
                  </Chip>
                )}
                {error && (
                  <Chip
                    className="w-full max-w-full py-4 text-center"
                    color="danger"
                    variant="flat"
                  >
                    {error}
                  </Chip>
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
                  minLength={8}
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
              </Form>
            </CardBody>
          </Card>

          {/* Subscription Dates Card */}
          <Card className="admin-glass rounded-xl">
            <CardHeader className="flex-col items-start gap-1 px-6 pt-6">
              <h2 className="font-heading text-lg font-semibold">
                {t("sub_dates_title")}
              </h2>
            </CardHeader>
            <CardBody className="px-6 pb-6 space-y-3">
              {subDates.length > 0 && (
                <ul className="space-y-2">
                  {subDates.map((d) => (
                    <li
                      key={d}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>
                        {new Date(d + "T00:00:00").toLocaleDateString("fr-FR")}
                      </span>
                      <Button
                        isIconOnly
                        className="min-w-6 w-6 h-6"
                        color="danger"
                        isDisabled={dateSaving}
                        radius="full"
                        size="sm"
                        variant="light"
                        onPress={() => handleRemoveDate(d)}
                      >
                        &times;
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex gap-2">
                <Input
                  size="sm"
                  type="date"
                  value={newDate}
                  onValueChange={(v) => {
                    setNewDate(v);
                    setDateError("");
                  }}
                />
                <Button
                  color="primary"
                  isLoading={dateSaving}
                  size="sm"
                  variant="flat"
                  onPress={handleAddDate}
                >
                  {t("sub_dates_add")}
                </Button>
              </div>
              {dateError && (
                <Chip
                  className="w-full max-w-full py-4 text-center"
                  color="danger"
                  variant="flat"
                >
                  {dateError}
                </Chip>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Shipping Rates Card */}
        <Card className="admin-glass rounded-xl">
          <CardHeader className="flex-col items-start gap-1 px-6 pt-6">
            <h2 className="font-heading text-lg font-semibold">
              {t("settings_shipping_title")}
            </h2>
          </CardHeader>
          <CardBody className="px-6 pb-6">
            {shippingLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : rates ? (
              <div className="space-y-4">
                {shippingSuccess && (
                  <Chip
                    className="w-full max-w-full py-4 text-center"
                    color="success"
                    variant="flat"
                  >
                    {shippingSuccess}
                  </Chip>
                )}
                {shippingError && (
                  <Chip
                    className="w-full max-w-full py-4 text-center"
                    color="danger"
                    variant="flat"
                  >
                    {shippingError}
                  </Chip>
                )}

                <Tabs aria-label="Shipping method" variant="underlined">
                  <Tab key="relay" title={t("settings_shipping_relay")}>
                    <div className="pt-4">{renderZones(RELAY_ZONES)}</div>
                  </Tab>
                  <Tab key="home" title={t("settings_shipping_home")}>
                    <div className="pt-4">{renderZones(HOME_ZONES)}</div>
                  </Tab>
                </Tabs>

                <Button
                  className="mt-4"
                  color="primary"
                  isLoading={shippingSaving}
                  onPress={handleShippingSave}
                >
                  {t("settings_shipping_save")}
                </Button>
              </div>
            ) : null}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
