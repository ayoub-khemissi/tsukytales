import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireAdmin } from "@/lib/auth/helpers";
import { orderRepository } from "@/lib/repositories/order.repository";

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();

  const idsParam = req.nextUrl.searchParams.get("ids");
  let orders;

  if (idsParam) {
    const ids = idsParam.split(",").map(Number).filter(Boolean);
    orders = ids.length ? await orderRepository.findByIds(ids) : [];
  } else {
    orders = await orderRepository.findAll({ orderBy: "createdAt DESC" });
  }

  const rows = orders.map((o) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const meta = o.metadata as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const addr = o.shipping_address as any;
    return {
      "ID": `TSK-${o.id}`,
      "Email": o.email,
      "Total (€)": Number(o.total) || 0,
      "Statut": o.status,
      "Expédition": o.fulfillment_status || "",
      "Date": new Date(o.createdAt).toLocaleString("fr-FR"),
      "Numéro suivi": meta?.tracking_number || "",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      "Type": meta?.subscription ? "Abonnement" : o.items?.some((i: any) => i.is_preorder) ? "Précommande" : "Standard",
      "Adresse livraison": addr?.relay?.name || `${addr?.street || ""} ${addr?.city || ""}`.trim(),
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [
    { wch: 12 }, { wch: 30 }, { wch: 10 }, { wch: 12 },
    { wch: 14 }, { wch: 20 }, { wch: 18 }, { wch: 14 }, { wch: 30 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Commandes");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="commandes-tsuky-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
});
