# Serverga deploy — manchester-united.uz

Ubuntu 22.04/24.04 VPS uchun qadamba-qadam yo'riqnoma.
Arxitektura: **nginx** (443/80) → **Next.js standalone** (127.0.0.1:3000), systemd boshqaruvida.

## Qaysi usulni tanlash

O'lchangan xotira sarfi:

| Amal | Xotira |
|---|---|
| Saytni ishlatish | **~95 MB** |
| Build qilish | **~1.2 GB** (eng yuqori nuqta) |

| Serveringiz RAM | Usul |
|---|---|
| **1 GB** | **B usuli** — build lokal mashinada, serverga tayyor to'plam yuboriladi |
| 2 GB va undan ko'p | A usuli — build serverning o'zida (`deploy/deploy.sh`) |

1 GB serverda build qilishga urinish xotira yetishmasligi tufayli uziladi.
B usulida serverga umuman `npm` kerak emas — faqat Node.js runtime.

---

## 1. DNS sozlash

Domen registratoringiz panelida A yozuvlarini serveringiz IP manziliga yo'naltiring:

| Type | Name | Value |
|---|---|---|
| A | `@` | `SERVER_IP` |
| A | `www` | `SERVER_IP` |

Tekshirish (tarqalishi 15 daqiqadan bir necha soatgacha vaqt olishi mumkin):

```bash
dig +short manchester-united.uz
```

TLS sertifikatini olishdan **oldin** DNS ishlashi shart.

---

## 2. Serverni tayyorlash

```bash
# Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs nginx git

# Ilova uchun alohida foydalanuvchi (root ostida ishlatmaymiz)
sudo adduser --system --group --home /var/www/manchester-united-site deploy
sudo mkdir -p /var/www/manchester-united-site
sudo chown -R deploy:deploy /var/www/manchester-united-site
```

## 3. Kodni tortish va birinchi build

> **B usulida** (1 GB server) bu bo'limni o'tkazib yuboring — serverda git ham,
> npm ham kerak emas. Buning o'rniga lokal mashinangizda `./deploy/deploy-local.sh`
> ishga tushiring, u papkalarni o'zi yaratadi. Keyin 4-bo'limdan davom eting.

```bash
sudo -u deploy git clone https://github.com/a21mj0n/manchester-united-site.git \
  /var/www/manchester-united-site/repo

cd /var/www/manchester-united-site/repo
sudo -u deploy npm ci
sudo -u deploy npm run build

# standalone yig'ish
sudo -u deploy cp -r .next/standalone /var/www/manchester-united-site/current
sudo -u deploy cp -r public           /var/www/manchester-united-site/current/
sudo -u deploy cp -r .next/static     /var/www/manchester-united-site/current/.next/
```

## 4. Systemd servisi

```bash
sudo cp deploy/red-devils.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now red-devils
sudo systemctl status red-devils
```

Tekshirish:

```bash
curl http://127.0.0.1:3000/api/health
# {"status":"ok","uptime":5,...}
```

## 5. Nginx

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/manchester-united.uz
sudo ln -s /etc/nginx/sites-available/manchester-united.uz /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

## 6. HTTPS (Let's Encrypt)

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d manchester-united.uz -d www.manchester-united.uz
```

Certbot nginx konfiguratsiyasiga HTTPS blokini o'zi qo'shadi va HTTP ni redirect qiladi.
Sertifikat avtomatik yangilanadi — tekshirish: `sudo certbot renew --dry-run`

---

## Keyingi yangilanishlar

### B usuli — build lokal mashinada (1 GB server uchun)

O'z kompyuteringizda:

```bash
./deploy/deploy-local.sh
```

Skript build qiladi, natijani (~50 MB) rsync orqali serverga yuboradi, versiyani
almashtiradi va servisni qayta ishga tushiradi. Oxirida `/api/health` orqali tekshiradi.

Server manzilini o'zgartirish kerak bo'lsa:

```bash
DEPLOY_SERVER=deploy@1.2.3.4 ./deploy/deploy-local.sh
```

### A usuli — build serverda (2 GB va undan ko'p)

```bash
cd /var/www/manchester-united-site/repo
./deploy/deploy.sh
```

Ikkala skript ham muvaffaqiyatsizlikda orqaga qaytarish buyrug'ini ko'rsatadi.

## Ma'lumotlar bazasi

SQLite fayli **reliz papkasidan tashqarida** turadi, shuning uchun deploy
paytida almashmaydi:

```
/var/www/manchester-united-site/
  data/app.db          # baza — deploy'da tegilmaydi
  data/app.db.bak      # har deploy oldidan avtomatik zaxira
  tools/               # migratsiyalar uchun Prisma CLI
  current/             # joriy reliz (har deploy'da almashadi)
  previous/            # oldingi reliz — rollback uchun
```

`activate-release.sh` har deploy'da: bazani zaxiralaydi → relizni
almashtiradi → `prisma migrate deploy` ishlatadi → servisni qayta ishga
tushiradi → tekshiradi. Xatolik bo'lsa kod ham, baza ham qaytariladi.

Bazani qo'lda ko'rish:

```bash
ssh deploy@189.74.96.196
cd /var/www/manchester-united-site/tools
DATABASE_URL="file:../data/app.db" ./node_modules/.bin/prisma migrate status
```

## Foydali buyruqlar

```bash
sudo systemctl status red-devils          # holat
sudo journalctl -u red-devils -f          # jonli loglar
sudo journalctl -u red-devils -n 100      # oxirgi 100 qator
sudo systemctl restart red-devils         # qayta ishga tushirish
sudo nginx -t                             # nginx konfiguratsiyasini tekshirish
```

## Orqaga qaytarish (rollback)

`deploy.sh` oldingi versiyani `previous/` papkasida saqlaydi:

```bash
cd /var/www/manchester-united-site
rm -rf current && mv previous current
sudo systemctl restart red-devils
```

---

## Docker varianti

systemd o'rniga Docker ishlatmoqchi bo'lsangiz, loyiha ildizida `Dockerfile` bor:

```bash
docker build -t red-devils .
docker run -d -p 127.0.0.1:3000:3000 --name red-devils --restart unless-stopped red-devils
```

Nginx konfiguratsiyasi o'zgarishsiz qoladi — u baribir `127.0.0.1:3000` ga proksi qiladi.
