import crypto from "crypto";

import { NextRequest, NextResponse } from "next/server";

import { orderRepository } from "@/lib/repositories/order.repository";
import * as mailService from "@/lib/services/mail.service";
import { logger } from "@/lib/utils/logger";

export async function POST(req: NextRequest) {
  // Respond immediately (Boxtal expects < 2s)
  const rawBody = await req.text();

  const signature = req.headers.get("x-bxt-signature");
  const webhookSecret = process.env.BOXTAL_WEBHOOK_SECRET;

  // HMAC SHA256 verification
  if (webhookSecret) {
    if (!signature) {
      logger.warn("[Boxtal Webhook] Missing x-bxt-signature header");

      return NextResponse.json({ received: true });
    }
    const expected = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    try {
      if (
        !crypto.timingSafeEqual(
          new Uint8Array(Buffer.from(signature)),
          new Uint8Array(Buffer.from(expected)),
        )
      ) {
        logger.error("[Boxtal Webhook] Invalid signature - request rejected");

        return NextResponse.json({ received: true });
      }
    } catch {
      logger.error("[Boxtal Webhook] Signature comparison failed");

      return NextResponse.json({ received: true });
    }
  }

  try {
    const event = JSON.parse(rawBody);
    const eventType = event.type || event.eventType || "";
    const shippingOrderId = event.shippingOrderId;

    logger.info(`[Boxtal Webhook] Event received: ${eventType}`);

    // Find order by shippingOrderId or externalId
    const findOrder = async () => {
      if (shippingOrderId) {
        const found =
          await orderRepository.findByShippingOrderId(shippingOrderId);

        if (found) return found;
      }
      const extId = event.shipmentExternalId;

      if (extId && extId.startsWith("TSK-")) {
        return orderRepository.findById(parseInt(extId.replace("TSK-", "")));
      }

      return null;
    };

    if (eventType === "TRACKING_CHANGED") {
      const tracking = event.payload?.trackings?.[0];

      if (!tracking) {
        logger.warn("[Boxtal Webhook] No tracking data in payload");

        return NextResponse.json({ received: true });
      }

      const trackingNumber = tracking.trackingNumber || tracking.packageId;
      const status = tracking.status || "";

      logger.info(
        `[Boxtal Webhook] Tracking update: ${trackingNumber} -> ${status}`,
      );

      const order = await findOrder();

      if (!order) {
        logger.warn(
          `[Boxtal Webhook] No order found for shippingOrderId: ${shippingOrderId}`,
        );

        return NextResponse.json({ received: true });
      }

      const meta = { ...(order.metadata || {}) };

      if (trackingNumber && !meta.tracking_number)
        meta.tracking_number = trackingNumber;
      if (tracking.packageTrackingUrl)
        meta.tracking_url = tracking.packageTrackingUrl;

      if (tracking.isFinal || status === "DELIVERED") {
        await orderRepository.update(order.id, {
          fulfillment_status: "delivered",
          status: "completed",
          metadata: JSON.stringify(meta),
        });
        logger.info(
          `[Boxtal Webhook] Order TSK-${order.id} marked as delivered`,
        );
      } else if (
        ["ANNOUNCED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "PICKED_UP"].includes(
          status,
        )
      ) {
        if (
          order.fulfillment_status !== "shipped" &&
          order.fulfillment_status !== "delivered"
        ) {
          await orderRepository.update(order.id, {
            fulfillment_status: "shipped",
            metadata: JSON.stringify(meta),
          });
          mailService
            .sendShippingNotification(
              {
                id: order.id,
                email: order.email,
                items: order.items || [],
                total: Number(order.total),
                metadata: meta,
              },
              trackingNumber,
            )
            .catch((err) =>
              logger.error(
                "Email error: " +
                  (err instanceof Error ? err.message : String(err)),
              ),
            );
          logger.info(
            `[Boxtal Webhook] Order TSK-${order.id} marked as shipped, email sent`,
          );
        } else {
          await orderRepository.update(order.id, {
            metadata: JSON.stringify(meta),
          });
        }
      } else {
        await orderRepository.update(order.id, {
          metadata: JSON.stringify(meta),
        });
      }
    } else if (eventType === "DOCUMENT_CREATED") {
      const labelDoc =
        event.payload?.documents?.find(
          (d: { type: string }) => d.type === "LABEL",
        ) || event.payload?.documents?.[0];
      const labelUrl = labelDoc?.url;

      const order = await findOrder();

      if (order && labelUrl) {
        await orderRepository.update(order.id, {
          metadata: JSON.stringify({
            ...(order.metadata || {}),
            label_url: labelUrl,
          }),
        });
        logger.info(`[Boxtal Webhook] Label URL saved for TSK-${order.id}`);
      }
    }
  } catch (err) {
    logger.error(
      `[Boxtal Webhook] Processing error: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  return NextResponse.json({ received: true });
}
