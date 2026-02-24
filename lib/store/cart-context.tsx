"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

export interface CartItem {
  id: number;
  variantId?: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  slug?: string;
  weight?: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (id: number, variantId?: number) => void;
  updateQuantity: (id: number, quantity: number, variantId?: number) => void;
  clearCart: () => void;
  itemCount: number;
  total: number;
}

const CartContext = createContext<CartContextType | null>(null);

const CART_KEY = "tsuky-cart";

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(CART_KEY);

    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setItems(loadCart());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveCart(items);
  }, [items, loaded]);

  const addItem = useCallback(
    (newItem: Omit<CartItem, "quantity"> & { quantity?: number }) => {
      setItems((prev) => {
        const key = newItem.variantId ?? newItem.id;
        const existing = prev.find((i) => (i.variantId ?? i.id) === key);

        if (existing) {
          return prev.map((i) =>
            (i.variantId ?? i.id) === key
              ? { ...i, quantity: i.quantity + (newItem.quantity || 1) }
              : i,
          );
        }

        return [...prev, { ...newItem, quantity: newItem.quantity || 1 }];
      });
    },
    [],
  );

  const removeItem = useCallback((id: number, variantId?: number) => {
    setItems((prev) =>
      prev.filter((i) => !((i.variantId ?? i.id) === (variantId ?? id))),
    );
  }, []);

  const updateQuantity = useCallback(
    (id: number, quantity: number, variantId?: number) => {
      if (quantity <= 0) {
        removeItem(id, variantId);

        return;
      }
      setItems((prev) =>
        prev.map((i) =>
          (i.variantId ?? i.id) === (variantId ?? id) ? { ...i, quantity } : i,
        ),
      );
    },
    [removeItem],
  );

  const clearCart = useCallback(() => setItems([]), []);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);

  if (!ctx) throw new Error("useCart must be used within CartProvider");

  return ctx;
}
