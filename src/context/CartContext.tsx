import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { BespokeDetails, CartItem } from '../types/domain';
import { readJson, writeJson } from '../lib/storage';

export type { CartItem };

/** What the UI passes in; the line id and quantity are computed here. */
export interface CartItemInput {
  productId: string;
  name: string;
  price: number;
  image: string;
  category: string;
  bespokeDetails?: BespokeDetails;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItemInput, quantity?: number) => void;
  removeFromCart: (lineId: string) => void;
  updateQuantity: (lineId: string, qty: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
}

const STORAGE_KEY = 'cart';
const MAX_QUANTITY = 99;

/**
 * A customised product is a separate line from the stock one, otherwise
 * "add custom walnut sofa" used to just bump the quantity of the plain sofa.
 */
export function cartLineId(productId: string, bespoke?: BespokeDetails): string {
  return bespoke ? `${productId}::${bespoke.wood}::${bespoke.fabric}` : productId;
}

function clampQuantity(qty: number): number {
  if (!Number.isFinite(qty)) return 1;
  return Math.min(MAX_QUANTITY, Math.max(1, Math.floor(qty)));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseCartItem(raw: unknown): CartItem | null {
  if (!isRecord(raw)) return null;
  const { id, productId, name, price, quantity, image, category, bespokeDetails } = raw;
  if (typeof id !== 'string' || typeof name !== 'string' || typeof price !== 'number') return null;
  if (typeof image !== 'string' || typeof category !== 'string') return null;

  let bespoke: BespokeDetails | undefined;
  if (isRecord(bespokeDetails) && typeof bespokeDetails.wood === 'string' && typeof bespokeDetails.fabric === 'string') {
    bespoke = { wood: bespokeDetails.wood, fabric: bespokeDetails.fabric };
  }

  return {
    id,
    // Entries saved before `productId` existed used the product id as the line id.
    productId: typeof productId === 'string' ? productId : id,
    name,
    price,
    quantity: clampQuantity(typeof quantity === 'number' ? quantity : 1),
    image,
    category,
    bespokeDetails: bespoke,
  };
}

function parseCart(raw: unknown): CartItem[] | null {
  if (!Array.isArray(raw)) return null;
  return raw.map(parseCartItem).filter((item): item is CartItem => item !== null);
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => readJson(STORAGE_KEY, parseCart, []));

  useEffect(() => {
    writeJson(STORAGE_KEY, cart);
  }, [cart]);

  const addToCart = useCallback((input: CartItemInput, quantity = 1) => {
    const lineId = cartLineId(input.productId, input.bespokeDetails);
    const qty = clampQuantity(quantity);
    setCart(prev => {
      const existing = prev.find(item => item.id === lineId);
      if (existing) {
        return prev.map(item =>
          item.id === lineId ? { ...item, quantity: clampQuantity(item.quantity + qty) } : item
        );
      }
      return [...prev, { ...input, id: lineId, quantity: qty }];
    });
  }, []);

  const removeFromCart = useCallback((lineId: string) => {
    setCart(prev => prev.filter(item => item.id !== lineId));
  }, []);

  const updateQuantity = useCallback((lineId: string, qty: number) => {
    setCart(prev => {
      if (qty < 1) return prev.filter(item => item.id !== lineId);
      const next = clampQuantity(qty);
      return prev.map(item => (item.id === lineId ? { ...item, quantity: next } : item));
    });
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const totalItems = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);
  const totalAmount = useMemo(() => cart.reduce((acc, item) => acc + item.price * item.quantity, 0), [cart]);

  const value = useMemo<CartContextType>(
    () => ({ cart, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalAmount }),
    [cart, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalAmount]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
