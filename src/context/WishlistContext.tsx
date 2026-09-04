import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { readJson, writeJson } from '../lib/storage';

export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
}

interface WishlistContextType {
  wishlist: WishlistItem[];
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (id: string) => void;
  toggleWishlist: (item: WishlistItem) => void;
  isInWishlist: (id: string) => boolean;
  clearWishlist: () => void;
  totalWishlistItems: number;
}

const STORAGE_KEY = 'wishlist';

function parseWishlist(raw: unknown): WishlistItem[] | null {
  if (!Array.isArray(raw)) return null;
  const items: WishlistItem[] = [];
  for (const entry of raw) {
    if (typeof entry !== 'object' || entry === null) continue;
    const { id, name, price, image, category } = entry as Record<string, unknown>;
    if (typeof id !== 'string' || typeof name !== 'string' || typeof price !== 'number') continue;
    if (typeof image !== 'string' || typeof category !== 'string') continue;
    items.push({ id, name, price, image, category });
  }
  return items;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<WishlistItem[]>(() => readJson(STORAGE_KEY, parseWishlist, []));

  useEffect(() => {
    writeJson(STORAGE_KEY, wishlist);
  }, [wishlist]);

  const addToWishlist = useCallback((item: WishlistItem) => {
    setWishlist(prev => (prev.some(i => i.id === item.id) ? prev : [...prev, item]));
  }, []);

  const removeFromWishlist = useCallback((id: string) => {
    setWishlist(prev => prev.filter(item => item.id !== id));
  }, []);

  // Functional updater: safe even when toggled twice before a re-render.
  const toggleWishlist = useCallback((item: WishlistItem) => {
    setWishlist(prev => (prev.some(i => i.id === item.id) ? prev.filter(i => i.id !== item.id) : [...prev, item]));
  }, []);

  const isInWishlist = useCallback((id: string) => wishlist.some(item => item.id === id), [wishlist]);

  const clearWishlist = useCallback(() => setWishlist([]), []);

  const value = useMemo<WishlistContextType>(
    () => ({
      wishlist,
      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
      isInWishlist,
      clearWishlist,
      totalWishlistItems: wishlist.length,
    }),
    [wishlist, addToWishlist, removeFromWishlist, toggleWishlist, isInWishlist, clearWishlist]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within a WishlistProvider');
  return context;
};
