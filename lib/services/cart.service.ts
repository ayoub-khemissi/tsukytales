import type { CartItem } from "@/types/db.types";

import { v4 as uuid } from "uuid";

import { cartRepository } from "@/lib/repositories/cart.repository";
import { productRepository } from "@/lib/repositories/product.repository";
import { discountRepository } from "@/lib/repositories/discount.repository";
import { AppError } from "@/lib/errors/app-error";

export async function create(data?: { customer_id?: number; email?: string }) {
  const id = uuid();

  await cartRepository.create({
    id,
    customer_id: data?.customer_id ?? null,
    email: data?.email ?? null,
    items: JSON.stringify([]),
    context: JSON.stringify({}),
  });

  return cartRepository.findById(id);
}

export async function retrieve(cartId: string) {
  const cart = await cartRepository.findByIdWithItems(cartId);

  if (!cart) throw new AppError("Panier introuvable", 404);

  return cart;
}

export async function addLineItem(
  cartId: string,
  productId: number,
  quantity: number,
) {
  const cart = await retrieve(cartId);
  const product = await productRepository.findById(productId);

  if (!product) throw new AppError("Produit introuvable", 404);

  const items: CartItem[] = Array.isArray(cart.items) ? [...cart.items] : [];
  const idx = items.findIndex((item) => item.product_id === productId);

  if (idx > -1) {
    items[idx].quantity += quantity;
  } else {
    items.push({ product_id: productId, quantity });
  }

  await cartRepository.update(cartId, { items: JSON.stringify(items) });

  return retrieve(cartId);
}

export async function applyDiscount(cartId: string, code: string) {
  const cart = await retrieve(cartId);
  const discount = await discountRepository.findByCode(code);

  if (!discount || discount.is_disabled) {
    throw new AppError("Code promo invalide ou expiré", 400);
  }

  const context = {
    ...(cart.context || {}),
    discount_code: code,
    discount_rule: discount.rule,
  };

  await cartRepository.update(cartId, { context: JSON.stringify(context) });

  return retrieve(cartId);
}
