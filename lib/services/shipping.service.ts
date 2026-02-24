import axios from "axios";

import * as mailService from "./mail.service";

import { orderRepository } from "@/lib/repositories/order.repository";
import { logger } from "@/lib/utils/logger";

const BASE_URL = "https://api.boxtal.com";

async function getBoxtalToken(): Promise<string> {
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
  logger.info(
    `[Boxtal] Searching relays for ${zipCode}, country: ${countryCode}, weight: ${weight}kg`,
  );
  const token = await getBoxtalToken();

  const response = await axios.get(
    `${BASE_URL}/shipping/v3.2/parcel-point-by-network`,
    {
      params: {
        postalCode: zipCode,
        countryIsoCode: countryCode.toUpperCase(),
        weight,
        searchNetworks: "MONR_NETWORK",
      },
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    },
  );

  const points = extractPoints(response.data);

  logger.info(`[Boxtal] Found ${points.length} points`);

  return { items: points, totalItems: points.length };
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

export async function createShipment(orderId: number) {
  const order = await orderRepository.findById(orderId);

  if (!order) throw new Error("Order not found");

  logger.info(`[Boxtal] Creating real shipment for order ${orderId}`);
  const token = await getBoxtalToken();

  const addr: any = order.shipping_address || {};
  const isRelay = !!(addr.relay || order.metadata?.shipping_method === "relay");
  const offerCode = isRelay
    ? process.env.BOXTAL_OFFER_RELAY || "MONR-CpourToi"
    : process.env.BOXTAL_OFFER_HOME || "COLI-Standard";

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

  const nameParts = (order.email || "").split("@")[0].split(".");
  const firstName = nameParts[0] || "Client";
  const lastName = nameParts[1] || "Tsuky";

  const totalWeight =
    (order.items || []).reduce(
      (sum: number, item: any) =>
        sum + (item.weight || 0.3) * (item.quantity || 1),
      0,
    ) || 0.5;

  const body = {
    shippingOfferCode: offerCode,
    labelType: "PDF_A4",
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
          phone: order.metadata?.phone || "0600000000",
        },
        location: {
          street: destStreet,
          city: destCity,
          postalCode: destZip,
          countryIsoCode: destCountry,
        },
      },
      ...(isRelay && dest.code ? { dropOffPointCode: dest.code } : {}),
      ...(isRelay
        ? { pickupPointCode: process.env.BOXTAL_PICKUP_CODE || "17199" }
        : {}),
    },
  };

  const response = await axios.post(
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

  const shippingOrderId = response.data?.content?.id;

  logger.info(`[Boxtal] Shipping order created: ${shippingOrderId}`);

  await orderRepository.update(orderId, {
    fulfillment_status: "fulfilled",
    metadata: JSON.stringify({
      ...(order.metadata || {}),
      shipping_order_id: shippingOrderId,
    }),
  });

  return { shippingOrderId };
}

export async function getTrackingInfo(trackingNumber: string) {
  const steps = [
    {
      date: new Date(Date.now() - 86400000 * 2).toISOString(),
      label: "Commande préparée par Tsuky Tales",
      location: "Entrepôt",
    },
    {
      date: new Date(Date.now() - 86400000).toISOString(),
      label: "Colis remis au transporteur",
      location: "Centre de tri",
    },
    {
      date: new Date().toISOString(),
      label: "En cours de livraison",
      location: "Agence locale",
    },
  ];

  return {
    tracking_number: trackingNumber,
    status: "in_transit",
    status_label: "En cours de livraison",
    carrier: "Mondial Relay",
    estimated_delivery: new Date(Date.now() + 86400000 * 2).toISOString(),
    steps,
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

export function getShippingRates(
  totalWeight: number,
  countryCode: string = "FR",
) {
  const weight = Math.max(totalWeight, 0.1);
  const cc = (countryCode || "FR").toUpperCase();

  const findRate = (rates: RateTier[]) => {
    const tier = rates.find((r) => weight <= r.maxWeight);

    return tier ? tier.price : rates[rates.length - 1].price;
  };

  // Mondial Relay
  const relayAvailable = RELAY_COUNTRIES.includes(cc);
  const relayRates: RateTier[] =
    cc === "FR"
      ? [
          { maxWeight: 0.5, price: 3.9 },
          { maxWeight: 1, price: 4.5 },
          { maxWeight: 3, price: 5.5 },
          { maxWeight: 5, price: 6.9 },
          { maxWeight: 10, price: 8.9 },
        ]
      : [
          { maxWeight: 0.5, price: 6.9 },
          { maxWeight: 1, price: 7.9 },
          { maxWeight: 3, price: 9.9 },
          { maxWeight: 5, price: 12.9 },
          { maxWeight: 10, price: 16.9 },
        ];

  // Colissimo
  let homeRates: RateTier[];
  let homeCarrier: string;

  if (cc === "FR") {
    homeCarrier = "Colissimo";
    homeRates = [
      { maxWeight: 0.5, price: 5.9 },
      { maxWeight: 1, price: 6.9 },
      { maxWeight: 2, price: 7.9 },
      { maxWeight: 5, price: 9.9 },
      { maxWeight: 10, price: 13.9 },
    ];
  } else if (["BE", "LU", "NL", "DE", "AT"].includes(cc)) {
    homeCarrier = "Colissimo International";
    homeRates = [
      { maxWeight: 0.5, price: 9.9 },
      { maxWeight: 1, price: 12.9 },
      { maxWeight: 2, price: 15.9 },
      { maxWeight: 5, price: 19.9 },
      { maxWeight: 10, price: 26.9 },
    ];
  } else if (
    [
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
    ].includes(cc)
  ) {
    homeCarrier = "Colissimo International";
    homeRates = [
      { maxWeight: 0.5, price: 12.9 },
      { maxWeight: 1, price: 15.9 },
      { maxWeight: 2, price: 19.9 },
      { maxWeight: 5, price: 25.9 },
      { maxWeight: 10, price: 34.9 },
    ];
  } else if (["GP", "MQ", "GF", "RE", "YT"].includes(cc)) {
    homeCarrier = "Colissimo Outre-Mer";
    homeRates = [
      { maxWeight: 0.5, price: 9.9 },
      { maxWeight: 1, price: 14.9 },
      { maxWeight: 2, price: 19.9 },
      { maxWeight: 5, price: 29.9 },
      { maxWeight: 10, price: 44.9 },
    ];
  } else {
    homeCarrier = "Colissimo International";
    homeRates = [
      { maxWeight: 0.5, price: 16.9 },
      { maxWeight: 1, price: 22.9 },
      { maxWeight: 2, price: 29.9 },
      { maxWeight: 5, price: 42.9 },
      { maxWeight: 10, price: 59.9 },
    ];
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
      .sendShippingNotification(order, trackingNumber)
      .catch((err) =>
        logger.error(
          "Email error: " + (err instanceof Error ? err.message : String(err)),
        ),
      );
  }
}
