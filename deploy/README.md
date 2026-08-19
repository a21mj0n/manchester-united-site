# Serverga deploy — manchester-united.uz

Ubuntu 22.04/24.04 VPS uchun qadamba-qadam yo'riqnoma.
Arxitektura: **nginx** (443/80) → **Next.js standalone** (127.0.0.1:3000), systemd boshqaruvida.

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

Lokalda `git push` qilgandan keyin, serverda:

```bash
cd /var/www/manchester-united-site/repo
./deploy/deploy.sh
```

Skript kodni tortadi, build qiladi, versiyani almashtiradi va servisni qayta ishga tushiradi.
Oxirida `/api/health` orqali tekshiradi — muvaffaqiyatsiz bo'lsa, orqaga qaytarish buyrug'ini ko'rsatadi.

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
