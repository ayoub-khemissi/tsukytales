"use client";

import { Radio, RadioGroup } from "@heroui/radio";
import { Chip } from "@heroui/chip";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCreditCard } from "@fortawesome/free-solid-svg-icons";

export interface SavedCard {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
}

export function SavedCardPicker({
  cards,
  selected,
  onSelect,
  newCardLabel,
  defaultLabel,
}: {
  cards: SavedCard[];
  selected: string;
  onSelect: (value: string) => void;
  newCardLabel: string;
  defaultLabel: string;
}) {
  if (cards.length === 0) return null;

  // Default card first
  const sorted = [...cards].sort(
    (a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0),
  );

  return (
    <RadioGroup className="w-full" value={selected} onValueChange={onSelect}>
      {sorted.map((card) => (
        <Radio key={card.id} value={card.id}>
          <div className="flex items-center gap-2">
            <FontAwesomeIcon
              className="text-primary text-sm"
              icon={faCreditCard}
            />
            <span className="capitalize font-medium">{card.brand}</span>
            <span className="text-default-500">****{card.last4}</span>
            <span className="text-default-400 text-sm">
              {String(card.exp_month).padStart(2, "0")}/{card.exp_year}
            </span>
            {card.is_default && (
              <Chip color="primary" size="sm" variant="flat">
                {defaultLabel}
              </Chip>
            )}
          </div>
        </Radio>
      ))}
      <Radio value="new">{newCardLabel}</Radio>
    </RadioGroup>
  );
}
