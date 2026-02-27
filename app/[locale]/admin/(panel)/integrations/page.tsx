"use client";

import { useState, useEffect } from "react";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { useTranslations } from "next-intl";

interface IntegrationStatus {
  connected: boolean;
  error?: string;
}

interface IntegrationsResponse {
  stripe: IntegrationStatus;
  boxtal: IntegrationStatus;
  mail: IntegrationStatus;
}

export default function IntegrationsPage() {
  const t = useTranslations("admin");
  const [integrations, setIntegrations] = useState<IntegrationsResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/integrations/status")
      .then((r) => r.json())
      .then((data) => setIntegrations(data))
      .finally(() => setLoading(false));
  }, []);

  const getStatusChip = (status: IntegrationStatus) => {
    if (status.error) {
      return (
        <Chip color="warning" size="sm" variant="flat">
          {t("integrations_error")}
        </Chip>
      );
    }

    if (status.connected) {
      return (
        <Chip color="success" size="sm" variant="flat">
          {t("integrations_connected")}
        </Chip>
      );
    }

    return (
      <Chip color="danger" size="sm" variant="flat">
        {t("integrations_disconnected")}
      </Chip>
    );
  };

  const integrationCards = integrations
    ? [
        {
          key: "stripe",
          label: t("integrations_stripe"),
          status: integrations.stripe,
        },
        {
          key: "boxtal",
          label: t("integrations_boxtal"),
          status: integrations.boxtal,
        },
        {
          key: "mail",
          label: t("integrations_mail"),
          status: integrations.mail,
        },
      ]
    : [];

  return (
    <div>
      <h1 className="font-heading italic text-2xl font-bold text-text-brand dark:text-white mb-6">
        {t("integrations_title")}
      </h1>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner color="primary" size="lg" />
        </div>
      ) : !integrations ? (
        <Card className="admin-glass rounded-xl">
          <CardBody className="py-16 text-center">
            <p className="text-default-500">{t("integrations_no_data")}</p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrationCards.map((integration) => (
            <Card key={integration.key} className="admin-glass rounded-xl">
              <CardBody className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-heading text-lg font-semibold">
                    {integration.label}
                  </h2>
                  {getStatusChip(integration.status)}
                </div>
                {integration.status.error && (
                  <p className="text-sm text-danger">
                    {integration.status.error}
                  </p>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
