/**
 * Single source of truth for business contact details and external links.
 * Before this file existed the phone number differed between Footer, Contact
 * and the locale files, and the social links pointed at bare domains.
 *
 * TODO(owner): replace the placeholder values below with the real showroom data.
 */
export const site = {
  name: 'Faxr Mebel',
  /** Public origin used for absolute links (QR codes, canonical URLs). */
  appUrl: (import.meta.env.VITE_APP_URL || 'https://faxr-mebel.vercel.app').replace(/\/+$/, ''),
  phone: {
    display: '+998 71 200 00 00',
    href: 'tel:+998712000000',
  },
  email: 'info@faxrmebel.uz',
  address: ['Tashkent, Uzbekistan', "Yunusobod tumani, 19-mavze, 12-uy"],
  social: {
    instagram: 'https://instagram.com/faxrmebel',
    telegram: 'https://t.me/faxrmebel',
    facebook: 'https://facebook.com/faxrmebel',
  },
} as const;
