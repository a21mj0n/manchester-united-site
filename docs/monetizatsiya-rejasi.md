# Monetizatsiya rejasi

Maqsad: server va API-Football xarajatlarini foydalanuvchilar to'lovi va donatlari
hisobiga qoplash, keyin saytni rivojlantirish uchun daromad manbai yaratish.

Sana: 2026-09-03

## Hozirgi holat

- Oddiy foydalanuvchi akkauntlari yo'q, faqat admin login (`middleware.ts`, `/login`).
- Fan-klub arizasi bor (`FanApplication` modeli, `/api/join`).
- Telegram bot sozlangan (`deploy/set-telegram.sh`), hozircha admin xabarnomalari uchun.
- `/tomosha` sahifasida bazadan o'qiladigan yashirin efir havolasi bor (`Setting` jadvali).
- PWA bor, push-xabarnomalar yo'q.
- Baza: Prisma 7 + SQLite.

## Dastlabki fikrlar tahlili

### 1. Bo'limlarni yashirib, to'lovdan keyin ochish

Ishlaydi, lekin faqat "fan-klub a'zoligi" sifatida ramkalansa. Odamlar statistika
uchun emas, jamoaga tegishlilik uchun to'laydi. Ko'p narsa yashirilsa trafik va SEO
tushadi. Yashirilgan qism kichik va aniq bo'lishi kerak.

### 2. Efir havolasini to'lovdan keyin push orqali yuborish

**Qilmaslik kerak.** Agar havola rasmiy bo'lmagan translyatsiya bo'lsa, unga pul
olish mualliflik huquqi buzilishini savdo qilish hisoblanadi:

- Payme, Click, Uzum bunday faoliyat uchun merchant hisobini yopadi.
- Telegram shikoyat bo'lsa botni bloklaydi.
- Push texnik jihatdan ishonchsiz: iOS'da faqat o'rnatilgan PWA'da ishlaydi,
  ko'pchilik ruxsat bermaydi.

Qaror: efir havolasi pulga bog'lanmaydi, bepul bonus bo'lib qoladi. Yetkazish
kerak bo'lsa Telegram orqali.

### 3. Statistikani pullik qilish

To'lashga tayyorlik past: xuddi shu ma'lumot Sofascore va FotMob'da bepul.
API-Football shartnomasida ma'lumotni qayta sotish cheklangan, o'z saytda
ko'rsatish odatda mumkin, shartlarni tekshirish kerak. Alohida mahsulot emas,
a'zolik ichidagi kichik bonus sifatida qoldiriladi.

## Daromad manbalari (foyda va mehnat bo'yicha tartibda)

| # | Manba | Mehnat | Login kerakmi | Izoh |
|---|---|---|---|---|
| 1 | Donat sahifasi + oylik maqsad | Kichik | Yo'q | Xarajat ochiq ko'rsatiladi, progress-bar bilan |
| 2 | Fan-klub pullik a'zoligi | O'rta | Ha | Yopiq Telegram guruh, "A'zo" belgisi, chegirmalar |
| 3 | Telegram orqali to'lov | O'rta | Telegram Login | Bot Payments Payme/Click'ni qo'llaydi, Stars yuridik shaxssiz ishlaydi |
| 4 | Homiylik va mahalliy reklama | Kichik | Yo'q | "O'yin homiysi" bloki; bukmeker reklamasi yo'q |
| 5 | Merch oldindan buyurtma | Kichik | Yo'q | Sharf, kepka, futbolka; buyurtma formasi + Payme |
| 6 | Tadbir chiptalari | O'rta | Yo'q | Birga tomosha kechalari, mini-turnir; a'zolarga chegirma |

### 1. Donat sahifasi

- Sahifa: "Saytni qo'llab-quvvatlash".
- Oylik xarajat (server + API) ochiq ko'rsatiladi, yig'ilgan summa progress-bar bilan.
- To'lov usullari: Payme/Click havolasi, karta raqami, Telegram Stars botda.
- Rekvizitlar admin panelda kiritiladi (`Setting` jadvali), kodga yozilmaydi.
- Yig'ilgan summa admin panelda qo'lda yangilanadi (webhook keyin).

### 2. Fan-klub a'zoligi

Yillik yoki oylik badal evaziga:

- yopiq Telegram guruhga avtomatik qo'shish (bot orqali);
- saytda "A'zo" belgisi va ismi a'zolar ro'yxatida;
- o'yinlarni birga tomosha qilish uchrashuvlariga chegirma;
- merch'ga chegirma;
- bonus: kengaytirilgan statistika.

Mahsulot bu jamoa, kontent emas.

### 3. Telegram orqali to'lov

Saytda parol bilan ro'yxatdan o'tish o'rniga Telegram Login Widget: auditoriya
uchun tanish, parol saqlash shart emas. To'lov Telegram Bot Payments (Payme, Click)
yoki Stars orqali.

### 4. Homiylik va reklama

- "Ushbu o'yin homiysi" bloki keyingi o'yin bannerida.
- Mahalliy sport-bar, do'kon, fitnes klublar.
- Bukmeker reklamasidan uzoq turish (huquqiy muammo).
- AdSense mumkin, lekin kichik trafikda daromad arzimas.

## Huquqiy va moliyaviy shartlar

- Payme Business, Click, Uzum merchant uchun YaTT yoki yuridik shaxs kerak.
- Boshlanish uchun "o'zini o'zi band qilgan" maqomi yetarli, soliq oddiy.
- Usiz faqat karta raqami, P2P havola va Telegram Stars qoladi.
- API-Football shartnomasini ma'lumotni pullik ko'rsatish bo'yicha tekshirish.

## Texnik reja

### Bosqich 1 (donat) — kodga minimal o'zgarish

**Holat: bajarildi (2026-09-03).** Telegram Stars botda hali yo'q, keyingi qadam.

- `app/support/page.tsx` — donat sahifasi.
- `Setting` jadvalida bitta `donate` kaliti, JSON qiymat (`lib/donate.ts`).
- Admin panelda forma: `/admin/support` (`components/admin/SupportForm.tsx`, `/api/admin/support`).
- Header va footer'da "Qo'llab-quvvatlash" havolasi.
- Telegram botda `/donate` buyrug'i va Stars invoice — **hali qilinmadi**, bot webhook talab qiladi.

### Bosqich 2 (a'zolik) — yangi modellar

```prisma
model User {
  id          Int      @id @default(autoincrement())
  telegramId  String   @unique
  name        String
  username    String?
  photo       String?
  createdAt   DateTime @default(now())
  memberships Membership[]
  payments    Payment[]
}

model Membership {
  id        Int      @id @default(autoincrement())
  userId    Int
  user      User     @relation(fields: [userId], references: [id])
  /// monthly | yearly
  plan      String
  startsAt  DateTime
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([userId, expiresAt])
}

model Payment {
  id        Int      @id @default(autoincrement())
  userId    Int?
  user      User?    @relation(fields: [userId], references: [id])
  /// payme | click | telegram_stars | manual
  provider  String
  /// Provayderdagi tranzaksiya identifikatori
  extId     String?  @unique
  amount    Int
  currency  String   @default("UZS")
  /// pending | paid | cancelled
  status    String   @default("pending")
  /// donation | membership | ticket | merch
  purpose   String
  createdAt DateTime @default(now())

  @@index([status, createdAt])
}
```

- Telegram Login Widget → `/api/auth/telegram` → sessiya cookie.
- Payme/Click webhook → `/api/payments/[provider]` → `Payment` yozuvi → `Membership`.
- To'lovdan keyin bot foydalanuvchini yopiq guruhga taklif havolasi bilan qo'shadi.
- `middleware.ts` a'zolar uchun yopiq sahifalarni ham himoyalaydi.

### Bosqich 3 (homiylik, merch, tadbirlar)

- `Sponsor` modeli va admin panelda banner boshqaruvi.
- Merch buyurtma formasi (`/api/orders`), to'lov Payme.
- `Event` va `Ticket` modellari, QR-kod bilan chipta.

## Bajarish tartibi

1. **Shu hafta:** donat sahifasi, oylik maqsad progress-bari, Telegram Stars botda.
2. **Keyin:** YaTT ochish, Telegram Login, pullik a'zolik, yopiq guruhga avtomatik qo'shish.
3. **Undan keyin:** homiy bloklari, merch, tadbir chiptalari.

## Ochiq savollar

- Oylik a'zolik narxi qancha bo'ladi? (Taxminan: server + API xarajati / kutilayotgan a'zolar soni.)
- Yopiq Telegram guruh yangi ochiladimi yoki mavjudi ishlatiladimi?
- YaTT qachon ochiladi? Ungacha faqat karta raqami va Stars.
