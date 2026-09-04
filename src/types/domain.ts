import type { Timestamp } from 'firebase/firestore';

export interface BespokeDetails {
  wood: string;
  fabric: string;
}

export interface CartItem {
  /** Cart line id: the product id, or `productId::wood::fabric` for a customised item. */
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  category: string;
  bespokeDetails?: BespokeDetails;
}

export type OrderStatus = 'pending' | 'wood' | 'artisan' | 'quality' | 'completed';
export type PaymentMethod = 'click_payme' | 'consultation';
export type PaymentStatus = 'paid' | 'pending';

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  image: string;
  bespokeDetails: BespokeDetails | null;
}

export interface OrderAddons {
  premiumBox: boolean;
  artisanCert: boolean;
}

export interface Order {
  id: string;
  userId: string;
  client: string;
  phone: string;
  address: string;
  wishes: string;
  items: OrderItem[];
  addons: OrderAddons;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  /** ISO string written by the client. Faza 4 adds a server-side createdAt timestamp. */
  date: string;
  createdAt?: Timestamp | null;
}
