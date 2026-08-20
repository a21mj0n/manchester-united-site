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

## Ma'lumotlar bazasi

**Prisma 7 + SQLite.** SQLite tanlangan, chunki server 1 GB RAM — alohida baza
jarayoni qo'shimcha xotira olmaydi, baza oddiy fayl.

```
prisma/schema.prisma   # modellar
prisma/migrations/     # migratsiya tarixi
lib/prisma.ts          # klient (lazy singleton)
```

Lokal ishlash:

```bash
npm run db:migrate    # sxema o'zgargach yangi migratsiya
npm run db:studio     # bazani brauzerda ko'rish
```

Baza fayli: lokal `prisma/dev.db`, serverda
`/var/www/manchester-united-site/data/app.db` — reliz papkasidan tashqarida,
shuning uchun deploy paytida almashmaydi.

### Modellar

| Model | Vazifasi |
|---|---|
| `FanApplication` | Fan-klub arizalari (`new` / `approved` / `rejected`) |

### Postgres'ga o'tish

Trafik yoki ma'lumot o'sib ketsa: `schema.prisma` da `provider` ni
`postgresql` ga o'zgartiring, `DATABASE_URL` ni yangilang, adapterni
`@prisma/adapter-pg` ga almashtiring va migratsiyalarni qayta yarating.
Qolgan kod o'zgarishsiz qoladi.

## Admin panel

`/admin` — fan-klub arizalarini boshqarish: ro'yxat, holat bo'yicha filtr,
qidiruv va holatni o'zgartirish (`Yangi` → `Qabul qilingan` / `Rad etilgan`).

Kirish `/login` orqali, parol bilan. Sessiya 12 soat amal qiladi.

### Xavfsizlik

Tashqi kutubxonasiz: parol **scrypt** bilan xeshlanadi (`node:crypto`),
sessiya esa **HMAC-SHA256** bilan imzolangan HttpOnly cookie'da saqlanadi.
`middleware.ts` `/admin` va `/api/admin` yo'llarini himoyalaydi.
Kirish urinishlari cheklangan: bitta IP uchun 5 daqiqada 10 marta.

### Parolni o'zgartirish

```bash
./deploy/set-admin-password.sh
```

Parol terminaldan o'qiladi, shu yerda xeshlanadi va faqat xesh serverga
uzatiladi — parolning o'zi hech qayerga yozilmaydi.

Faqat xesh kerak bo'lsa (masalan lokal `.env` uchun):

```bash
npm run admin:password
```

Sirlar git'da saqlanmaydi — ular faqat serverdagi `/etc/red-devils.env`
faylida (`chmod 600`) va lokal `.env` da turadi.

## O'yinlar va turnir jadvali — real ma'lumot

Manba: [TheSportsDB](https://www.thesportsdb.com) — API kaliti shart emas,
bepul `3` test kaliti ishlaydi. Ko'proq so'rov kerak bo'lsa `SPORTSDB_KEY`
orqali o'z kalitingizni bering.

- Kelgusi o'yinlar va natijalar — Manchester United jamoasi bo'yicha
- Turnir jadvali — Angliya Premer-ligasi, joriy mavsum
- Vaqtlar Toshkent vaqtiga (UTC+5) o'giriladi
- Javoblar **1 soat keshlanadi** — API ortiqcha bezovta qilinmaydi

Ikki bosqichli zaxira:

1. Joriy mavsum jadvali hali to'lmagan bo'lsa (mavsum endi boshlangan),
   oldingi mavsumning yakuniy jadvali ko'rsatiladi va shunday deb belgilanadi
2. API umuman javob bermasa — `lib/data.ts` dagi demo ma'lumot ishlatiladi,
   ya'ni sayt baribir ochiladi

## Jamoa tarkibi — real ma'lumot

Manba: [API-Football](https://www.api-football.com) — `FOOTBALL_API_KEY` kerak.
Beradi: joriy ro'yxat, o'yinchi raqami, pozitsiyasi, yoshi va rasmi.
Javob **24 soat keshlanadi** (bepul tarifda kuniga 100 so'rov).

Kalitni o'rnatish (terminaldan o'qiladi, git'ga tushmaydi):

```bash
./deploy/set-football-key.sh
```

Kalit yo'q bo'lsa `lib/data.ts` dagi demo tarkib ko'rsatiladi.

### Nega o'yinlar va jadval bu API dan olinmaydi

Bepul tarifda tekshirib ko'rilgan cheklovlar:

| Imkoniyat | Holat |
|---|---|
| Jamoa tarkibi | ✅ ishlaydi |
| Joriy mavsum jadvali | ❌ faqat 2022-2024 mavsumlari |
| `next` / `last` parametrlari | ❌ yopiq |
| Sana bo'yicha so'rov | ❌ faqat bugundan +2 kungacha |

Shu sababli o'yinlar va turnir jadvali TheSportsDB dan olinadi —
u kalitsiz ishlaydi va joriy mavsumni beradi.

## Kunlik sinxronizatsiya

Har kuni **Toshkent vaqti bilan 06:30** da systemd timer ochiq manbalardan
ma'lumot olib bazaga yozadi. Sayt esa bazadan o'qiydi.

| Bo'lim | Manba |
|---|---|
| Tarkib | API-Football (`FOOTBALL_API_KEY`) |
| Keyingi o'yin, o'yinlar | TheSportsDB |
| Turnir jadvali | TheSportsDB |
| Yangiliklar | Guardian va Manchester Evening News RSS |

Har bir bo'lim mustaqil — biri yiqilsa qolganlari baribir bajariladi,
natija `SyncLog` jadvaliga yoziladi va `/admin/sync` sahifasida ko'rinadi.

Ma'lumot uch bosqichda olinadi: **baza → jonli API → demo ma'lumot**.
Shu sababli sayt hech qachon bo'sh bo'lim ko'rsatmaydi.

### Qo'lda ishga tushirish

Admin panelda `/admin/sync` → "Hozir yangilash". Yoki serverda:

```bash
sudo systemctl start red-devils-sync.service
journalctl -u red-devils-sync -n 30 --no-pager
```

### Yangiliklar o'zbek tilida

Manbalar ingliz tilida, sayt esa o'zbekcha. Sinxronizatsiya sarlavhalarni
Claude API orqali o'zbekchaga o'giradi (`lib/translate.ts`).

Kerak: `ANTHROPIC_API_KEY`. O'rnatilmagan bo'lsa sarlavhalar asl tilida
qoladi — sayt baribir ishlayveradi.

```bash
./deploy/set-anthropic-key.sh
```

Bir so'rovda 20 tagacha sarlavha o'giriladi, kuniga bir marta — sarfi
oyiga bir necha dollardan oshmaydi. Sarlavha so'zma-so'z tarjima
qilinmaydi, o'z so'zlarimiz bilan qayta yoziladi; asl sarlavha
`originalTitle` maydonida saqlanadi.

### Yangiliklar va mualliflik huquqi

Tashqi manbalardan **faqat sarlavha, qisqa tavsif va havola** olinadi.
Maqola matni ko'chirilmaydi — karta bosilganda o'quvchi asl saytga o'tadi,
manba nomi kartada ko'rsatiladi.

## Yangiliklar (qo'lda)

Yangiliklar bazada saqlanadi va `/admin/news` sahifasidan boshqariladi:
qo'shish, tahrirlash, vaqtincha yashirish, o'chirish. Har bir karta uchun
yorliq, yorliq rangi, fon naqshi (1-4) va "katta karta" belgisi tanlanadi.

Baza bo'sh bo'lsa bosh sahifa bo'm-bo'sh qolmaydi — `lib/news-defaults.ts`
dagi standart kartalar ko'rsatiladi.

## Telegram bildirishnomalari

Yangi ariza kelganda Telegramga xabar tushadi. Ixtiyoriy — sozlanmasa
sayt baribir ishlayveradi, bildirishnoma shunchaki yuborilmaydi.

Sozlash (token terminaldan o'qiladi, hech qayerga yozilmaydi):

```bash
./deploy/set-telegram.sh
```

Skript bot tokenini so'raydi, chat ID ni o'zi topadi, sinov xabari
yuboradi va serverga o'rnatib servisni qayta ishga tushiradi.

Oldin Telegramda **@BotFather** ga `/newbot` deb yozib bot yarating,
so'ng o'sha botga istalgan xabar yuboring (chat ID shu orqali topiladi).

Bildirishnoma yetkazilmasa ariza baribir bazaga yoziladi — Telegram
xatosi foydalanuvchiga ko'rinmaydi, faqat server logiga tushadi.

## Backend qo'shish

Ma'lumot qatlami allaqachon ajratilgan — barcha funksiyalar `async`:

```ts
// lib/queries.ts
export async function getSquad(): Promise<Player[]> {
  return SQUAD;               // ← hozir demo massiv
  // return prisma.player.findMany();   ← baza ulanganda shunday bo'ladi
}
```

Fan-klub arizalari allaqachon bazaga yozilyapti (`app/api/join/route.ts`).
Tarkib, o'yinlar va jadval hali demo massivlarda — ularni ham bazaga
o'tkazish uchun `lib/queries.ts` ichini o'zgartirish yetarli.

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

## Jamoa gerblari

Manba: Premer-liganing rasmiy SVG fayllari —
`resources.premierleague.com/premierleague25/badges-alt/{opta_id}.svg`

Fayl raqami jamoaning **Opta identifikatoriga** teng (Arsenal `t3` → `3.svg`).
Ro'yxat Premer-liga API sidan olinadi (`lib/badges.ts`), shuning uchun mavsum
almashib liga tarkibi o'zgarsa ham o'zi yangilanadi.

Nomlar turli manbalarda turlicha yoziladi ("Spurs", "Nott'm Forest",
"AFC Bournemouth") — `normalizeTeam()` ularni bir ko'rinishga keltiradi.
Gerb topilmasa nom bosh harflari ko'rsatiladi, ya'ni Premer-ligadan
tashqari jamoalar ham chiroyli chiqadi.

Gerblar klublarning savdo belgisi. Ular jadval va o'yinlar yonida tanish
belgisi sifatida ishlatiladi; sayt rasmiy emasligi bosh sahifada va
footerda ochiq yozilgan.

## Ikonkalar

- **lucide-react** (MIT) — interfeys ikonkalari. Faqat ishlatilganlari
  bundlega tushadi (tree-shaking).
- **components/icons/Brands.tsx** — ijtimoiy tarmoq logotiplari.
  Yo'llar [Simple Icons](https://simpleicons.org) (CC0-1.0) dan bir marta
  chiqarib olingan, shuning uchun ishlash paytida qo'shimcha kutubxona
  yuklanmaydi.

Brend logotiplarini yangilash kerak bo'lsa:

```bash
npm i -D simple-icons
# components/icons/Brands.tsx ni qayta yaratish
npm uninstall simple-icons
```

Barcha ikonkalar `currentColor` ishlatadi — rangni ota element belgilaydi.

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
