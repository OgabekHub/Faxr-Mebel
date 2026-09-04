# Faxr Mebel — operatsion qo'llanma

Loyiha egasi uchun: deploy, Firestore qoidalari, admin huquqi, Telegram tokeni.
Kod bilan bog'liq tafsilotlar `README.md` da (Faza 8 da yangilanadi).

## 1. Deploy oqimi

- Hosting: Vercel, GitHub `main` branch'iga har push avtomatik deploy qilinadi.
- Ish tartibi: o'zgarishlar alohida branch'da → `npm run build` yashil → `main` ga merge → push.

```bash
git checkout main
git merge --ff-only <branch>
git push origin main
```

## 2. Vercel muhit o'zgaruvchilari

Vercel → loyiha → Settings → Environment Variables. Env o'zgargandan keyin **yangi deploy** shart (Deployments → ⋯ → Redeploy).

| Nomi | Muhit | Izoh |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | Production, Preview | BotFather tokeni. `VITE_` prefiksi **bo'lmasin**: `VITE_*` qiymatlar brauzer bundle'iga kiradi. |
| `TELEGRAM_CHAT_ID` | Production, Preview | Xabarlar boradigan chat/guruh ID. |
| `ALLOWED_ORIGINS` | faqat Production | `https://faxr-mebel.vercel.app` (shaxsiy domen bo'lsa vergul bilan). Preview'ga qo'ymang: ro'yxat bo'sh bo'lsa hamma origin'ga ruxsat, preview URL'lar har deploy'da boshqacha. |
| `VITE_APP_URL` | Production | QR kod va kanonik havolalar uchun sayt manzili. |

Eski `VITE_TELEGRAM_BOT_TOKEN` va `VITE_TELEGRAM_CHAT_ID` o'chirilgan bo'lishi kerak.

Lokal ishlash uchun `.env.local` (git'ga kirmaydi): `.env.example` dagi kalitlar. `npm run dev` da `/api/notify` xuddi Vercel'dagidek ishlaydi.

## 3. Firestore qoidalarini chop etish

Loyiha: `gen-lang-client-0514709959`. Baza **nomlangan**: `ai-studio-9e20a7a9-1a8b-431c-9c9c-364fe5ae68c0` (`(default)` emas). Qoidalar manbai: repodagi `firestore.rules`.

**Console orqali:** Firebase Console → Firestore Database → yuqoridagi baza tanlagichdan nomlangan bazani tanlang → Rules → faylning to'liq matnini qo'ying → Publish.

**CLI orqali** (`firebase.json` va `.firebaserc` allaqachon sozlangan):

```bash
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules
```

Faqat `firestore:rules`. Indekslar Faza 4 da qo'shiladi; `--only firestore` (indekslar bilan) hozircha ishlatilmasin.

Tekshirish: Rules Playground → `get`, yo'l `admins/<UID>`, auth shu UID bilan → Allow.

## 4. Admin huquqi berish

`/admin` faqat `admins/{uid}` hujjati bor foydalanuvchiga ochiladi. Hujjat faqat Console'dan yaratiladi, klient yozolmaydi.

1. Authentication → Users → kerakli akkaunt → User UID ni nusxalang.
2. Firestore → nomlangan baza → `admins` kolleksiyasi (yo'q bo'lsa Start collection).
3. Document ID = UID (Auto-ID emas). Maydon: `role` (string) = `admin`. Save.
4. Tekshirish: saytga shu akkaunt bilan kiring → navbar'da "Admin" havolasi → `/admin` ochiladi, qizil xato banneri yo'q.

Huquqni olib tashlash: hujjatni o'chiring; foydalanuvchi keyingi kirishda oddiy mijozga aylanadi.

## 5. Telegram tokenini almashtirish

Token sizib chiqqan yoki eskirgan bo'lsa:

1. BotFather → `/mybots` → bot → API Token → Revoke.
2. Yangi tokenni Vercel env (`TELEGRAM_BOT_TOKEN`) va lokal `.env.local` ga yozing.
3. Vercel'da Redeploy.
4. Saytdagi Aloqa formasi orqali test xabar yuboring, chatga kelishini tekshiring.

Tokenni hech qachon `VITE_` prefiksi bilan yozmang va git'ga commit qilmang.

## 6. Buyurtmalar

- `orders` kolleksiyasi: mijoz faqat o'z buyurtmasini yaratadi va o'qiydi, holatni faqat admin o'zgartiradi.
- Admin panel → "Aktiv Buyurtmalar" → "Keyingi bosqich": `pending → wood → artisan → quality → completed`. Mijoz Profile'da shu holatni ko'radi.
- Telegram xabarnomasi ketmasa ham buyurtma saqlanadi; mijozga sariq ogohlantirish chiqadi. Xabar ketmagan buyurtmalarni Admin panelda ko'rish mumkin.
