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
  matches/             # o'yinlar ro'yxati + [id] tafsilot sahifasi
  standings/           # to'liq turnir jadvali
  squad/               # tarkib + [id] futbolchi statistikasi
  api/
    join/route.ts      # POST — fan-klub arizasi
    squad/route.ts     # GET  — tarkib (?pos=FW filtri bilan)
    standings/route.ts # GET  — turnir jadvali
    matches/route.ts   # GET  — mavsum o'yinlari (?season=2026)
    matches/[id]/      # GET  — o'yin tafsilotlari
    live/route.ts      # GET  — jonli o'yin (yoki null)
components/            # bo'limlar: Header, Hero, Squad, Matches, ...
config/
  football.ts          # team ID, musobaqalar, mavsum, kesh muddatlari
types/
  football.ts          # API-Football javob type'lari + domain type'lar
lib/
  types.ts             # sayt bo'ylab ishlatiladigan interfeyslar
  data.ts              # demo ma'lumotlar
  queries.ts           # ma'lumot qatlami (async — baza uchun tayyor)
  matches.ts           # /matches sahifasi uchun manba tanlash
  live.ts              # jonli o'yin (faqat o'yin oynasida so'raladi)
  football/            # API-Football: client, fixtures, standings, players, teams
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

## API-Football integratsiyasi

Manba: [API-Football v3](https://www.api-football.com/documentation-v3) —
`FOOTBALL_API_KEY` kerak. Kalit **faqat serverda** o'qiladi; brauzer API
bilan bevosita gaplashmaydi:

```
Brauzer → Next.js server / route handler → API-Football
```

Kalitni o'rnatish (terminaldan o'qiladi, git'ga tushmaydi):

```bash
./deploy/set-football-key.sh
```

### Qaysi bo'lim nimani beradi

| Bo'lim | Endpoint | Kesh |
|---|---|---|
| Keyingi o'yin | `fixtures?team=33&next=1` | 15 daqiqa |
| Oxirgi o'yin | `fixtures?team=33&last=1` | 15 daqiqa |
| Mavsum o'yinlari | `fixtures?team=33&season=…` | 15 daqiqa |
| O'yin tafsilotlari | `fixtures?id=…` | tugagan 60 daq. / jonli 2 daq. |
| Voqealar | `fixtures/events?fixture=…` | o'yin holatiga qarab |
| Tarkiblar | `fixtures/lineups?fixture=…` | o'yin holatiga qarab |
| Statistika | `fixtures/statistics?fixture=…` | o'yin holatiga qarab |
| Turnir jadvali | `standings?league=39&season=…` | 15 daqiqa |
| Jamoa tarkibi | `players/squads?team=33` | 24 soat |
| Futbolchi statistikasi | `players?id=…&season=…` | 6 soat |
| Jonli o'yin | `fixtures?live=all` | 2 daqiqa |

Kesh muddatlari `config/football.ts` dagi `CACHE` da — bir joyda
o'zgartiriladi. Kalit yo'q bo'lsa so'rov umuman ketmaydi.

Tarkiblar ikki ko'rinishda: **sxema** (maydon ustidagi joylashuv) va
**ro'yxat**. Joylashuv API beradigan `grid` ("qator:ustun") qiymatidan
hisoblanadi — 1-qator darvozabon, 1-ustun chap qanot. Uy egalari
chapdan o'ngga hujum qiladi, mehmonlar teskarisiga, shuning uchun
mehmon jamoada ustunlar teskari o'qiladi
([components/LineupPitch.tsx](components/LineupPitch.tsx)).
Manba `grid` bermagan o'yinlarda faqat ro'yxat ko'rsatiladi.

### Team ID va mavsum

`config/football.ts`:

- `MANCHESTER_UNITED_TEAM_ID = 33` — `GET /teams?id=33` orqali tekshiriladi;
  har sinxronizatsiyada `verifyTeamId()` ishlaydi va natija `/admin/sync`
  sahifasida ko'rinadi
- `currentApiSeason()` — sanadan hisoblanadi (mavsum iyulda almashadi),
  `FOOTBALL_SEASON` env orqali qo'lda ham belgilanadi
- `COMPETITIONS` — Premer-liga, Chempionlar ligasi, FA Kubogi, EFL va h.k.
  Hech qayerda hardcode qilinmaydi

### Jonli o'yin

`/api/live` — server tomonda **faqat o'yin oynasida** (boshlanishidan
15 daqiqa oldin, tugashidan 150 daqiqa keyingacha) API ga murojaat
qiladi, javob 2 daqiqa keshlanadi. Klient shu manzilni 90 soniyada bir
so'rab turadi, ya'ni tashqi API ga klientdan hech qachon bormaydi.

### Tarif (2026-08-24 da tekshirilgan)

`GET /status` orqali: **Pro**, kuniga **7500** so'rov.

Pro'da hammasi ochiq — joriy mavsum, `next`/`last` parametrlari,
jonli hisob, events/lineups/statistics va futbolchi statistikasi.

Solishtirish uchun **Free** tarifda tekshirilgan cheklovlar
(tarif tushirilsa sayt shu holatga qaytadi, kod o'zgartirilmaydi):

| Imkoniyat | Free |
|---|---|
| `teams`, `players/squads`, `live=all` | ✅ |
| `fixtures?season=` 2022–2024 | ✅ |
| `fixtures/events` · `lineups` · `statistics` | ✅ |
| `next` / `last` parametrlari | ❌ |
| Joriy (2025–2026) mavsumlar | ❌ |
| Kunlik limit | 100 |

Kod har ikkala holatda ham ishlaydi: joriy mavsum yopiq bo'lsa
zaxira manbaga tushadi, ochiq bo'lsa o'zi API-Football'ga o'tadi.

### Limitni asrash

Yopiq endpoint har safar qayta so'ralsa 100 talik limit bir necha
soatda tugaydi. Shuning uchun `lib/football/client.ts` xato bergan
so'rovni xotirada belgilab qo'yadi:

- **tarif xatosi** → 6 soat so'ralmaydi (o'z-o'zidan tuzalmaydi)
- **tarmoq xatosi** → 1 daqiqa (o'tkinchi bo'lishi mumkin)
- `x-ratelimit-requests-remaining` nolga tushsa — barcha so'rovlar
  1 soatga to'xtatiladi

Bu Next.js keshining ustiga qo'shimcha qatlam: kesh muddati tugagach
so'rov qaytadan ketishining oldini oladi.

### Zaxira manbalar

Har bir so'rov xatolikda `null` qaytaradi va sayt pastroq bosqichga
tushadi — foydalanuvchi bo'sh sahifa ko'rmaydi, API xatosining
tafsilotlari esa frontendga chiqmaydi (faqat server log'ida):

```
API-Football → baza (kunlik sinxronizatsiya) → TheSportsDB → demo ma'lumot
```

Turnir jadvalida tartib boshqacha — API-Football birinchi, chunki u
to'liq 20 talik jadvalni beradi, TheSportsDB bepul tarifi esa faqat
yuqori bir necha o'rinni.

`events`, `lineups`, `statistics` va futbolchi statistikasi faqat
API-Football'da bor — kalit yo'q bo'lsa bu sahifalar tushunarli xato
holati ko'rsatadi.

## Kunlik sinxronizatsiya

Har kuni **Toshkent vaqti bilan 06:30** da systemd timer ochiq manbalardan
ma'lumot olib bazaga yozadi. Sayt esa bazadan o'qiydi.

| Bo'lim | Manba |
|---|---|
| Team ID tekshiruvi | API-Football (`FOOTBALL_API_KEY`) |
| Tarkib | API-Football |
| O'yinlar | API-Football → TheSportsDB |
| Turnir jadvali | API-Football → TheSportsDB |
| Jamoa gerblari | Premer-liga (bir marta yuklab olinadi) |

O'yin yozuvidagi `extId` manba prefiksi bilan saqlanadi —
`af:1557368` (API-Football) yoki `sdb:2052641` (TheSportsDB).
Shu bois sayt qaysi o'yin uchun tafsilot sahifasi ochilishini
biladi ([lib/match-id.ts](lib/match-id.ts)).

Yangiliklar sinxronizatsiyaga kirmaydi — ular admin panelda qo'lda
yoziladi (`/admin/news`).

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

## Yangiliklar

Yangiliklar bazada saqlanadi va `/admin/news` sahifasidan boshqariladi:
qo'shish, tahrirlash, vaqtincha yashirish, o'chirish. Har bir karta uchun
yorliq, yorliq rangi, fon naqshi (1-4) va "katta karta" belgisi tanlanadi.

Baza bo'sh bo'lsa bosh sahifa bo'm-bo'sh qolmaydi — `lib/news-defaults.ts`
dagi standart kartalar ko'rsatiladi.

Yangiliklar avtomatik olinmaydi: avval RSS orqali import qilinardi,
lekin bu olib tashlandi. Bazadagi eski import qilingan yozuvlar
(`sourceUrl` bilan) asl maqolaga havola qilib turaveradi.

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
