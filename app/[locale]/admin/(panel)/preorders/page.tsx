"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Pagination } from "@heroui/pagination";
import { Spinner } from "@heroui/spinner";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { useTranslations } from "next-intl";

interface PreorderItem {
  product_name: string;
  quantity: number;
}

interface Preorder {
  id: string;
  order_number: string;
  customer_email: string;
  items: PreorderItem[];
  status: string;
  created_at: string;
}

export default function PreordersPage() {
  const t = useTranslations("admin");
  const [preorders, setPreorders] = useState<Preorder[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [shipping, setShipping] = useState(false);
  const limit = 20;

  const fetchPreorders = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/preorders?page=${page}&limit=${limit}`)
      .then((r) => r.json())
      .then((data) => {
        setPreorders(data.items || []);
        setTotal(data.total || 0);
      })
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    fetchPreorders();
  }, [fetchPreorders]);

  const handleShipAll = async () => {
    setShipping(true);
    try {
      const res = await fetch("/api/admin/preorders/ship-all", {
        method: "POST",
      });

      if (res.ok) {
        fetchPreorders();
      }
    } finally {
      setShipping(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("preorders_title")}</h1>
        {preorders.length > 0 && (
          <Button color="primary" isLoading={shipping} onPress={handleShipAll}>
            {t("preorders_ship_all")}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner color="primary" size="lg" />
        </div>
      ) : preorders.length === 0 ? (
        <Card className="border border-divider">
          <CardBody className="py-16 text-center">
            <p className="text-default-500">{t("preorders_empty")}</p>
          </CardBody>
        </Card>
      ) : (
        <>
          <Table aria-label={t("preorders_title")} className="mb-6">
            <TableHeader>
              <TableColumn>{t("preorders_order_number")}</TableColumn>
              <TableColumn>{t("preorders_customer")}</TableColumn>
              <TableColumn>{t("preorders_items")}</TableColumn>
              <TableColumn>{t("preorders_status")}</TableColumn>
              <TableColumn>{t("preorders_date")}</TableColumn>
            </TableHeader>
            <TableBody>
              {preorders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.order_number}</TableCell>
                  <TableCell>{order.customer_email}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {order.items.map((item, i) => (
                        <span key={i} className="text-sm">
                          {item.product_name} x{item.quantity}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip color="warning" size="sm" variant="flat">
                      {order.status}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    {new Date(order.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination
                showControls
                color="primary"
                page={page}
                total={totalPages}
                onChange={setPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
