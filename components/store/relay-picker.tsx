"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { useTranslations } from "next-intl";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";

import "leaflet/dist/leaflet.css";

export interface RelayPoint {
  code: string;
  name: string;
  distanceInMeters: number;
  address: {
    street: string;
    zipCode: string;
    city: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };
  openingDays?: Array<{
    dayOfWeek: string;
    openingHours: Array<{ openTime: string; closeTime: string }>;
  }>;
}

interface RelayPickerProps {
  country: string;
  onSelect: (relay: RelayPoint) => void;
  selectedRelay?: RelayPoint | null;
}

const defaultIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const selectedIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [30, 49],
  iconAnchor: [15, 49],
  popupAnchor: [1, -40],
  shadowSize: [49, 49],
  className: "selected-relay-marker",
});

function FitBounds({ points }: { points: RelayPoint[] }) {
  const map = useMap();

  useEffect(() => {
    const coords = points
      .filter((p) => p.address.latitude && p.address.longitude)
      .map(
        (p) => [p.address.latitude!, p.address.longitude!] as [number, number],
      );

    if (coords.length > 0) {
      map.fitBounds(L.latLngBounds(coords), { padding: [30, 30] });
    }
  }, [map, points]);

  return null;
}

const ORDERED_DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Lun",
  TUESDAY: "Mar",
  WEDNESDAY: "Mer",
  THURSDAY: "Jeu",
  FRIDAY: "Ven",
  SATURDAY: "Sam",
  SUNDAY: "Dim",
};

export default function RelayPicker({
  country,
  onSelect,
  selectedRelay,
}: RelayPickerProps) {
  const t = useTranslations("checkout");
  const [zip, setZip] = useState("");
  const [relays, setRelays] = useState<RelayPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = async (zipValue: string) => {
    if (!zipValue.trim()) return;
    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const res = await fetch(
        `/api/store/shipping/relays?zip=${encodeURIComponent(zipValue)}&country=${country}`,
      );

      if (!res.ok) throw new Error("API error");
      const data = await res.json();

      setRelays(data.items || []);
    } catch {
      setError(t("relay_error"));
      setRelays([]);
    } finally {
      setLoading(false);
    }
  };

  const handleZipChange = (value: string) => {
    setZip(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const digits = value.replace(/\s/g, "");

    if (digits.length >= 4) {
      debounceRef.current = setTimeout(() => search(digits), 500);
    }
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleSelect = (relay: RelayPoint) => {
    onSelect(relay);
  };

  const scrollToItem = (code: string) => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector(`[data-relay="${code}"]`);

    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  return (
    <div className="space-y-3 mt-3">
      {/* Search */}
      <div className="flex gap-2">
        <Input
          className="flex-1"
          placeholder={t("relay_search_placeholder")}
          size="sm"
          value={zip}
          onValueChange={handleZipChange}
        />
        <Button
          isLoading={loading}
          size="sm"
          variant="bordered"
          onPress={() => search(zip)}
        >
          {t("relay_search_button")}
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-6">
          <Spinner size="sm" />
          <span className="ml-2 text-sm text-default-500">
            {t("relay_searching")}
          </span>
        </div>
      )}

      {/* Error */}
      {error && <p className="text-danger text-sm">{error}</p>}

      {/* No results */}
      {searched && !loading && !error && relays.length === 0 && (
        <p className="text-default-500 text-sm">{t("relay_no_results")}</p>
      )}

      {/* Map + List */}
      {relays.length > 0 && (
        <>
          <div className="rounded-lg overflow-hidden border border-divider">
            <MapContainer
              center={[46.603354, 1.888334]}
              scrollWheelZoom={false}
              style={{ height: 280, width: "100%" }}
              zoom={6}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FitBounds points={relays} />
              {relays.map(
                (relay) =>
                  relay.address.latitude &&
                  relay.address.longitude && (
                    <Marker
                      key={relay.code}
                      eventHandlers={{
                        click: () => {
                          handleSelect(relay);
                          scrollToItem(relay.code);
                        },
                      }}
                      icon={
                        selectedRelay?.code === relay.code
                          ? selectedIcon
                          : defaultIcon
                      }
                      position={[
                        relay.address.latitude,
                        relay.address.longitude,
                      ]}
                    >
                      <Popup>
                        <strong>{relay.name}</strong>
                        <br />
                        {relay.address.street}
                        <br />
                        {relay.address.zipCode} {relay.address.city}
                      </Popup>
                    </Marker>
                  ),
              )}
            </MapContainer>
          </div>

          {/* List */}
          <div
            ref={listRef}
            className="max-h-[250px] overflow-y-auto space-y-2"
          >
            {relays.map((relay) => {
              const isSelected = selectedRelay?.code === relay.code;

              return (
                <button
                  key={relay.code}
                  className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                    isSelected
                      ? "border-primary bg-primary/10"
                      : "border-divider hover:border-default-400"
                  }`}
                  data-relay={relay.code}
                  type="button"
                  onClick={() => handleSelect(relay)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{relay.name}</p>
                      <p className="text-xs text-default-500">
                        {relay.address.street}, {relay.address.zipCode}{" "}
                        {relay.address.city}
                      </p>
                    </div>
                    {relay.distanceInMeters > 0 && (
                      <span className="text-xs text-default-400 whitespace-nowrap ml-2">
                        {relay.distanceInMeters >= 1000
                          ? `${(relay.distanceInMeters / 1000).toFixed(1)} km`
                          : `${relay.distanceInMeters} m`}
                      </span>
                    )}
                  </div>

                  {/* Opening hours (shown when selected) */}
                  {isSelected && relay.openingDays && (
                    <div className="mt-2 pt-2 border-t border-divider">
                      <p className="text-xs font-medium mb-1">
                        {t("relay_hours")}
                      </p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                        {ORDERED_DAYS.map((dayKey) => {
                          const periods =
                            (relay.openingDays as any)?.[dayKey] || [];

                          return (
                            <div
                              key={dayKey}
                              className="flex justify-between text-xs text-default-500"
                            >
                              <span>{DAY_LABELS[dayKey]}</span>
                              <span>
                                {periods.length > 0
                                  ? periods
                                      .map(
                                        (h: any) =>
                                          `${h.openingTime}-${h.closingTime}`,
                                      )
                                      .join(", ")
                                  : "—"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
