# Red Devils Uzbekistan 🔴

O'zbekistondagi Manchester United muxlislari uchun rasmiy bo'lmagan fan-klub sayti.
**Next.js 16 (App Router) + React 19 + TypeScript.**

## Ishga tushirish

```bash
npm install
npm run dev
```

Brauzerda: http://localhost:3000

Boshqa buyruqlar:

```bash
npm run build      # ishlab chiqarish uchun build
npm start          # build qilingan versiyani ishga tushirish
npm run typecheck  # TypeScript tekshiruvi
```

## Tuzilma

```
app/
  layout.tsx           # root layout, next/font (Anton + Inter), metadata
  page.tsx             # bosh sahifa — server component, ma'lumotni o'zi oladi
  globals.css          # butun dizayn (klub ranglari :root da)
  api/
    join/route.ts      # POST — fan-klub arizasi
    squad/route.ts     # GET  — tarkib (?pos=FW filtri bilan)
    standings/route.ts # GET  — turnir jadvali
components/            # bo'limlar: Header, Hero, Squad, Matches, ...
lib/
  types.ts             # TypeScript interfeyslari
  data.ts              # demo ma'lumotlar
  queries.ts           # ma'lumot qatlami (async — baza uchun tayyor)
  schedule.ts          # keyingi o'yin vaqtini hisoblash
public/assets/         # SVG emblema, favicon, fon naqshlari
legacy/                # eskirgan statik HTML/CSS/JS versiya — o'chirsa bo'ladi
```

## Server va client komponentlar

Ko'pchilik bo'limlar **server component** — HTML serverda tayyorlanadi (SEO uchun yaxshi).
Faqat interaktiv qismlar `"use client"`:

| Komponent | Nega client |
|---|---|
| `Header` | skroll holati, mobil menyu, scrollspy |
| `Counter` | raqamlarni jonlantirish |
| `NextMatch` | har soniyada yangilanadigan sanoq |
| `Matches` | tablar |
| `Squad` | pozitsiya filtri |
| `FanClub` | forma va `fetch('/api/join')` |
| `ToTop`, `RevealProvider` | skrollga bog'liq effektlar |

## Backend qo'shish

Ma'lumot qatlami allaqachon ajratilgan — barcha funksiyalar `async`:

```ts
// lib/queries.ts
export async function getSquad(): Promise<Player[]> {
  return SQUAD;               // ← hozir demo massiv
  // return prisma.player.findMany();   ← baza ulanganda shunday bo'ladi
}
```

`app/page.tsx` va API route'lar faqat shu funksiyalarni chaqiradi,
shuning uchun **baza ulanganda komponentlarga tegish shart emas**.

Ariza formasi uchun ham joy tayyor — `app/api/join/route.ts` ichidagi `TODO` ga
`prisma.fanApplication.create(...)` qo'shilsa yetarli.

### Tavsiya etiladigan keyingi qadamlar

1. `npm i prisma @prisma/client` + Postgres (Neon, Supabase yoki lokal)
2. `lib/queries.ts` ichini bazaga ulash
3. Admin panel uchun `app/admin/` + autentifikatsiya (NextAuth / Clerk)
4. Yangiliklar uchun CMS yoki `app/news/[slug]/page.tsx` dinamik route

## Deploy

Serverga (VPS) deploy qilish bo'yicha to'liq yo'riqnoma: [deploy/README.md](deploy/README.md)

Qisqacha: nginx (80/443) → Next.js standalone (127.0.0.1:3000), systemd boshqaruvida,
TLS — Let's Encrypt. Yangilash uchun serverda `./deploy/deploy.sh`.

## Ranglar

`app/globals.css` boshidagi `:root` blokida:

| O'zgaruvchi | Qiymat |
|---|---|
| `--red` | `#DA291C` |
| `--gold` | `#FBE122` |
| `--black` | `#08080A` |

## Eslatma

Sayt rasmiy emas va Manchester United FC bilan bog'liq emas.
Statistika, o'yin jadvali va turnir jadvali — namunaviy (demo) ma'lumotlar.
Emblema — original chizma, klubning haqiqiy gerbi emas.
