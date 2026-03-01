import axios from "axios";
import { ResultSetHeader } from "mysql2/promise";

import * as mailService from "@/lib/mail";
import { pool } from "@/lib/db/connection";
import { cached, cacheKey } from "@/lib/cache";
import { orderRepository } from "@/lib/repositories/order.repository";
import { settingsRepository } from "@/lib/repositories/settings.repository";
import { logger } from "@/lib/utils/logger";

const BASE_URL = process.env.BOXTAL_API_URL || "https://api.boxtal.com";

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getBoxtalToken(): Promise<string> {
  // Return cached token if still valid (with 60s safety margin)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }

  const clientId = process.env.BOXTAL_CLIENT_ID;
  const clientSecret = process.env.BOXTAL_CLIENT_SECRET;
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await axios.post(
    `${BASE_URL}/iam/account-app/token`,
    {},
    {
      headers: { Authorization: `Basic ${auth}` },
    },
  );
  const token = response.data.accessToken || response.data.access_token;

  if (!token) throw new Error("Token missing in Boxtal response");

  const expiresIn = response.data.expiresIn || 3600;

  cachedToken = { token, expiresAt: Date.now() + expiresIn * 1000 };

  return token;
}

function extractPoints(data: any) {
  const mapPoint = (item: any) => {
    const point = item.parcelPoint || item;

    return {
      code: point.code,
      name: point.name,
      distanceInMeters: item.distanceFromSearchLocation || 0,
      address: {
        street: point.location?.street || "",
        zipCode: point.location?.postalCode || "",
        city: point.location?.city || "",
        country: point.location?.countryIsoCode || "FR",
        latitude: point.location?.position?.latitude,
        longitude: point.location?.position?.longitude,
      },
      location: point.location,
      openingDays: point.openingDays,
      compatibleNetworks: point.compatibleNetworks,
    };
  };

  if (Array.isArray(data.parcelPoints)) return data.parcelPoints.map(mapPoint);
  if (Array.isArray(data.content)) return data.content.map(mapPoint);
  if (Array.isArray(data)) return data;

  return [];
}

export async function getRelayPoints(
  zipCode: string,
  weight: number = 1.0,
  countryCode: string = "FR",
) {
  const cc = (countryCode || "FR").toUpperCase();

  return cached(
    cacheKey("shipping:relays", cc, zipCode, weight),
    86400,
    async () => {
      logger.info(
        `[Boxtal] Searching relays for ${zipCode}, country: ${cc}, weight: ${weight}kg`,
      );
      const token = await getBoxtalToken();

      const response = await axios.get(
        `${BASE_URL}/shipping/v3.2/parcel-point-by-network`,
        {
          params: {
            postalCode: zipCode,
            countryIsoCode: cc,
            weight,
            searchNetworks: "MONR_NETWORK",
          },
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );

      const points = extractPoints(response.data);

      logger.info(`[Boxtal] Found ${points.length} points`);

      return { items: points, totalItems: points.length };
    },
  );
}

export async function findRelayByCode(code: string) {
  const SEARCH_GROUPS = [
    ["75001", "69001", "13001", "31000", "44000"],
    ["59000", "67000", "33000", "06000", "35000"],
    ["76000", "63000", "38000", "34000", "87000"],
    ["21000", "29000", "57000", "14000", "45000"],
    ["18400", "49000", "72000", "64000", "20000"],
    ["80000", "76600", "25000", "66000", "51100"],
  ];

  try {
    const token = await getBoxtalToken();

    for (const group of SEARCH_GROUPS) {
      const results = await Promise.all(
        group.map((zip) =>
          axios
            .get(`${BASE_URL}/shipping/v3.2/parcel-point-by-network`, {
              params: {
                postalCode: zip,
                countryIsoCode: "FR",
                weight: 1,
                searchNetworks: "MONR_NETWORK",
              },
              headers: { Authorization: `Bearer ${token}` },
            })

            .then((r: any) => {
              const items = r.data.content || r.data.parcelPoints || [];

              const item = items.find(
                (i: any) => (i.parcelPoint || i).code === code,
              );

              if (!item) return null;
              const point = item.parcelPoint || item;

              return {
                code: point.code,
                name: point.name,
                address: {
                  street: point.location?.street || "",
                  zipCode: point.location?.postalCode || "",
                  city: point.location?.city || "",
                  country: point.location?.countryIsoCode || "FR",
                },
              };
            })
            .catch(() => null),
        ),
      );
      const found = results.find((r) => r !== null);

      if (found) return found;
    }
  } catch (e) {
    logger.error(
      `[Boxtal] findRelayByCode error: ${e instanceof Error ? e.message : String(e)}`,
    );
  }

  return null;
}

export async function cancelShipment(
  shippingOrderId: string,
): Promise<boolean> {
  try {
    const token = await getBoxtalToken();

    await axios.delete(
      `${BASE_URL}/shipping/v3.1/shipping-order/${shippingOrderId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      },
    );
    logger.info(`[Shipping] Cancelled Boxtal order: ${shippingOrderId}`);

    return true;
  } catch (err) {
    // 422 = order can't be cancelled (already shipped/delivered) — not a blocker for refund
    logger.warn(
      `[Shipping] Cancel failed for ${shippingOrderId}: ${err instanceof Error ? err.message : String(err)}`,
    );

    return false;
  }
}

function getOfferCode(isRelay: boolean, country: string): string {
  if (isRelay) {
    return country === "FR" ? "MONR-CpourToi" : "MONR-CpourToiEurope";
  }
  if (country === "FR") return "POFR-ColissimoAccess";
  if (HOME_OM_COUNTRIES.includes(country))
    return "POFR-ColissimoAccessOutreMer";

  return "POFR-ColissimoAccessInternational";
}

export async function createShipment(orderId: number) {
  const order = await orderRepository.findById(orderId);

  if (!order) throw new Error("Order not found");

  // B1: Guard against double shipment
  if (order.metadata?.shipping_order_id) {
    logger.info(
      `[Shipping] Order ${orderId} already shipped (${order.metadata.shipping_order_id}), skipping`,
    );

    return { shippingOrderId: order.metadata.shipping_order_id as string };
  }

  // Atomic claim: only proceed if order is still not_fulfilled
  const [claimed] = await pool.execute<ResultSetHeader>(
    "UPDATE orders SET fulfillment_status = 'fulfilled' WHERE id = ? AND fulfillment_status = 'not_fulfilled'",
    [orderId],
  );

  if ((claimed as ResultSetHeader).affectedRows === 0) {
    logger.info(`[Shipping] Order ${orderId}: fulfillment already in progress`);
    const fresh = await orderRepository.findById(orderId);

    return {
      shippingOrderId: (fresh?.metadata?.shipping_order_id as string) || "",
    };
  }

  logger.info(`[Shipping] Creating shipment for order ${orderId}`);
  const token = await getBoxtalToken();

  const addr: any = order.shipping_address || {};
  const isRelay = !!(addr.relay || order.metadata?.shipping_method === "relay");

  const dest = isRelay ? addr.relay || addr : addr;
  const destStreet = dest.street || dest.address?.street || "";
  const destCity = dest.city || dest.address?.city || "";
  const destZip = String(
    dest.zipCode ||
      dest.zip_code ||
      dest.postalCode ||
      dest.address?.zipCode ||
      "",
  );
  const destCountry = (
    dest.country ||
    dest.address?.country ||
    order.metadata?.shipping_country ||
    "FR"
  ).toUpperCase();

  const offerCode = getOfferCode(isRelay, destCountry);

  // A2: Use shipping address name, fallback to email only if absent
  const firstName =
    addr.first_name ||
    (order.email || "").split("@")[0].split(".")[0] ||
    "Client";
  const lastName =
    addr.last_name ||
    (order.email || "").split("@")[0].split(".")[1] ||
    "Tsuky";

  // A3: Phone from shipping address with fallbacks
  const phone =
    addr.phone || order.shipping_address?.phone || order.metadata?.phone || "";

  // A4: Relay code from metadata (saved at order creation) or address
  const relayCode = dest.code || (order.metadata?.relay_code as string) || "";

  const totalWeight =
    (order.items || []).reduce(
      (sum: number, item: any) =>
        sum + (item.weight || 0.3) * (item.quantity || 1),
      0,
    ) || 0.5;

  const body = {
    shippingOfferCode: offerCode,
    labelType: "PDF_10x15",
    shipment: {
      externalId: `TSK-${order.id}`,
      packages: [
        {
          type: "PARCEL",
          weight: Math.max(totalWeight, 0.1),
          length: 30,
          width: 20,
          height: 5,
          value: { value: order.total || 10, currency: "EUR" },
          content: { id: "content:v1:10120", description: "Livres" },
        },
      ],
      fromAddress: {
        type: "BUSINESS",
        contact: {
          firstName: process.env.BOXTAL_SENDER_FIRST_NAME || "Tsuky",
          lastName: process.env.BOXTAL_SENDER_LAST_NAME || "Tales",
          email: process.env.BOXTAL_SENDER_EMAIL || "hello@tsukytales.com",
          phone: process.env.BOXTAL_SENDER_PHONE || "0600000000",
        },
        location: {
          street: process.env.BOXTAL_SENDER_STREET || "1 Rue de la Librairie",
          city: process.env.BOXTAL_SENDER_CITY || "Paris",
          postalCode: process.env.BOXTAL_SENDER_POSTAL_CODE || "75001",
          countryIsoCode: process.env.BOXTAL_SENDER_COUNTRY || "FR",
        },
      },
      toAddress: {
        type: "RESIDENTIAL",
        contact: {
          firstName,
          lastName,
          email: order.email,
          phone: phone || "0600000000",
        },
        location: {
          street: destStreet,
          city: destCity,
          postalCode: destZip,
          countryIsoCode: destCountry,
        },
      },
      ...(isRelay && relayCode ? { dropOffPointCode: relayCode } : {}),
    },
  };

  let response;

  try {
    response = await axios.post(
      `${BASE_URL}/shipping/v3.1/shipping-order`,
      body,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
    );
  } catch (err) {
    // Rollback: restore fulfillment_status and flag the failure
    const msg = err instanceof Error ? err.message : String(err);

    logger.error(`[Shipping] Boxtal API failed for order ${orderId}: ${msg}`);
    await orderRepository.update(orderId, {
      fulfillment_status: "not_fulfilled",
      metadata: JSON.stringify({
        ...(order.metadata || {}),
        shipping_failed: true,
        shipping_error: msg,
      }),
    });
    throw err;
  }

  const shippingOrderId = response.data?.content?.id;

  logger.info(`[Shipping] Shipping order created: ${shippingOrderId}`);

  await orderRepository.update(orderId, {
    fulfillment_status: "fulfilled",
    metadata: JSON.stringify({
      ...(order.metadata || {}),
      shipping_order_id: shippingOrderId,
      shipping_failed: undefined,
      shipping_error: undefined,
    }),
  });

  return { shippingOrderId };
}

export async function getTrackingInfo(trackingNumber: string) {
  // Look up order by shipping_order_id or tracking_number in a single query
  const order =
    await orderRepository.findByShippingOrderIdOrTracking(trackingNumber);

  const meta = (order?.metadata || {}) as any;
  const history = (meta.history || []) as Array<Record<string, string>>;

  return {
    tracking_number: meta.tracking_number || trackingNumber,
    status: order?.fulfillment_status || "unknown",
    status_label: order?.fulfillment_status || "Inconnu",
    carrier: meta.carrier || null,
    tracking_url: meta.tracking_url || null,
    shipping_order_id: meta.shipping_order_id || null,
    steps: history.filter(
      (h) =>
        h.status === "shipped" ||
        h.status === "fulfilled" ||
        h.status === "delivered",
    ),
  };
}

const RELAY_COUNTRIES = [
  "FR",
  "BE",
  "LU",
  "NL",
  "DE",
  "ES",
  "PT",
  "AT",
  "IT",
  "PL",
];

interface RateTier {
  maxWeight: number;
  price: number;
}

// Default hardcoded rates (fallback when DB has no overrides)
const DEFAULT_RATES: Record<string, RateTier[]> = {
  shipping_rates_relay_fr: [
    { maxWeight: 0.5, price: 3.9 },
    { maxWeight: 1, price: 4.5 },
    { maxWeight: 3, price: 5.5 },
    { maxWeight: 5, price: 6.9 },
    { maxWeight: 10, price: 8.9 },
  ],
  shipping_rates_relay_eu: [
    { maxWeight: 0.5, price: 6.9 },
    { maxWeight: 1, price: 7.9 },
    { maxWeight: 3, price: 9.9 },
    { maxWeight: 5, price: 12.9 },
    { maxWeight: 10, price: 16.9 },
  ],
  shipping_rates_home_fr: [
    { maxWeight: 0.5, price: 5.9 },
    { maxWeight: 1, price: 6.9 },
    { maxWeight: 2, price: 7.9 },
    { maxWeight: 5, price: 9.9 },
    { maxWeight: 10, price: 13.9 },
  ],
  shipping_rates_home_eu1: [
    { maxWeight: 0.5, price: 9.9 },
    { maxWeight: 1, price: 12.9 },
    { maxWeight: 2, price: 15.9 },
    { maxWeight: 5, price: 19.9 },
    { maxWeight: 10, price: 26.9 },
  ],
  shipping_rates_home_eu2: [
    { maxWeight: 0.5, price: 12.9 },
    { maxWeight: 1, price: 15.9 },
    { maxWeight: 2, price: 19.9 },
    { maxWeight: 5, price: 25.9 },
    { maxWeight: 10, price: 34.9 },
  ],
  shipping_rates_home_om: [
    { maxWeight: 0.5, price: 9.9 },
    { maxWeight: 1, price: 14.9 },
    { maxWeight: 2, price: 19.9 },
    { maxWeight: 5, price: 29.9 },
    { maxWeight: 10, price: 44.9 },
  ],
  shipping_rates_home_world: [
    { maxWeight: 0.5, price: 16.9 },
    { maxWeight: 1, price: 22.9 },
    { maxWeight: 2, price: 29.9 },
    { maxWeight: 5, price: 42.9 },
    { maxWeight: 10, price: 59.9 },
  ],
};

export { DEFAULT_RATES as SHIPPING_DEFAULT_RATES };

const HOME_EU1_COUNTRIES = ["BE", "LU", "NL", "DE", "AT"];
const HOME_EU2_COUNTRIES = [
  "ES",
  "PT",
  "IT",
  "GB",
  "IE",
  "CH",
  "PL",
  "CZ",
  "DK",
  "SE",
  "NO",
  "FI",
  "HU",
  "RO",
  "BG",
  "HR",
  "GR",
  "SK",
  "SI",
  "EE",
  "LV",
  "LT",
];
const HOME_OM_COUNTRIES = ["GP", "MQ", "GF", "RE", "YT"];

const SHIPPING_KEYS = Object.keys(DEFAULT_RATES);

export async function getShippingRates(
  totalWeight: number,
  countryCode: string = "FR",
) {
  const weight = Math.max(totalWeight, 0.1);
  const cc = (countryCode || "FR").toUpperCase();

  return cached(cacheKey("shipping:rates", cc, weight), 3600, async () => {
    // Load rates from DB, fallback to defaults
    let rates: Record<string, RateTier[]>;

    try {
      const dbRates = await settingsRepository.getMultiple(SHIPPING_KEYS);

      rates = { ...DEFAULT_RATES };
      for (const key of SHIPPING_KEYS) {
        if (dbRates[key]) rates[key] = dbRates[key];
      }
    } catch {
      rates = DEFAULT_RATES;
    }

    const findRate = (tiers: RateTier[]) => {
      const tier = tiers.find((r) => weight <= r.maxWeight);

      return tier ? tier.price : tiers[tiers.length - 1].price;
    };

    // Mondial Relay
    const relayAvailable = RELAY_COUNTRIES.includes(cc);
    const relayRates =
      cc === "FR"
        ? rates.shipping_rates_relay_fr
        : rates.shipping_rates_relay_eu;

    // Colissimo
    let homeRates: RateTier[];
    let homeCarrier: string;

    if (cc === "FR") {
      homeCarrier = "Colissimo";
      homeRates = rates.shipping_rates_home_fr;
    } else if (HOME_EU1_COUNTRIES.includes(cc)) {
      homeCarrier = "Colissimo International";
      homeRates = rates.shipping_rates_home_eu1;
    } else if (HOME_EU2_COUNTRIES.includes(cc)) {
      homeCarrier = "Colissimo International";
      homeRates = rates.shipping_rates_home_eu2;
    } else if (HOME_OM_COUNTRIES.includes(cc)) {
      homeCarrier = "Colissimo Outre-Mer";
      homeRates = rates.shipping_rates_home_om;
    } else {
      homeCarrier = "Colissimo International";
      homeRates = rates.shipping_rates_home_world;
    }

    const result: any = {
      home: {
        price: findRate(homeRates),
        carrier: homeCarrier,
        label: "Domicile",
      },
      weight,
      country: cc,
      relay_available: relayAvailable,
    };

    if (relayAvailable) {
      result.relay = {
        price: findRate(relayRates),
        carrier: "Mondial Relay",
        label: "Point Relais",
      };
    }

    return result;
  });
}

export async function handleStatusUpdate(
  trackingNumber: string,
  newStatus: string,
) {
  const order = await orderRepository.findByShippingOrderId(trackingNumber);

  if (!order) return;

  if (newStatus === "in_transit" && order.fulfillment_status !== "shipped") {
    await orderRepository.update(order.id, { fulfillment_status: "shipped" });
    mailService
      .sendShippingNotification({
        email: order.email,
        orderId: order.id,
        trackingNumber,
        labelUrl: order.metadata?.label_url as string | undefined,
      })
      .catch((err) =>
        logger.error(
          "Email error: " + (err instanceof Error ? err.message : String(err)),
        ),
      );
  }
}
