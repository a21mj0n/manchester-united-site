#!/usr/bin/env bash
# Lokal mashinada build qilib, natijani serverga yuklaydi.
#
# Kam xotirali serverlar uchun (1 GB RAM) — serverda build qilinmaydi,
# u yerga faqat tayyor standalone to'plami boradi (~50 MB).
#
# Ishlatish:
#   ./deploy/deploy-local.sh
#   DEPLOY_SERVER=deploy@1.2.3.4 ./deploy/deploy-local.sh
set -euo pipefail

SERVER="${DEPLOY_SERVER:-deploy@manchester-united.uz}"
APP_DIR="/var/www/manchester-united-site"
SERVICE="red-devils"
BUILD_DIR=".deploy-build"

# better-sqlite3 — native modul: qaysi tizimda build qilinsa, o'sha
# tizim uchun binar hosil bo'ladi. macOS'da yig'ilgan to'plam Linux
# serverda ishlamaydi, shuning uchun bu skript faqat Linux'da ruxsat etiladi.
if [ "$(uname -s)" != "Linux" ]; then
  echo "✗ Bu skript faqat Linux'da ishlaydi (hozir: $(uname -s))."
  echo "  Sababi: better-sqlite3 native moduli tizimga bog'liq."
  echo "  Deploy uchun 'git push' qiling — GitHub Actions Ubuntu'da build qiladi."
  exit 1
fi

echo "→ Paketlar tekshirilmoqda…"
npm ci

echo "→ Build (lokal mashinada)…"
npm run build

echo "→ To'plam yig'ilmoqda…"
rm -rf "$BUILD_DIR"
cp -r .next/standalone "$BUILD_DIR"
cp -r public           "$BUILD_DIR/"
cp -r .next/static     "$BUILD_DIR/.next/"
cp -r prisma           "$BUILD_DIR/"        # migratsiyalar server uchun

SIZE=$(du -sh "$BUILD_DIR" | cut -f1)
echo "→ Serverga yuborilmoqda ($SIZE) → $SERVER"
# macOS dagi openrsync --info bayrog'ini bilmaydi, shuning uchun tekshiramiz
RSYNC_FLAGS="-az --delete"
if rsync --info=progress2 --version >/dev/null 2>&1; then
  RSYNC_FLAGS="$RSYNC_FLAGS --info=progress2"
fi
rsync $RSYNC_FLAGS "$BUILD_DIR/" "$SERVER:$APP_DIR/incoming/"

echo "→ Versiya almashtirilmoqda…"
ssh "$SERVER" bash -euo pipefail <<REMOTE
  rm -rf "$APP_DIR/previous"
  [ -d "$APP_DIR/current" ] && mv "$APP_DIR/current" "$APP_DIR/previous"
  mv "$APP_DIR/incoming" "$APP_DIR/current"
  sudo systemctl restart "$SERVICE"
REMOTE

echo "→ Tekshirilmoqda…"
sleep 3
if ssh "$SERVER" "curl -fsS http://127.0.0.1:3000/api/health" > /dev/null; then
  echo "✓ Deploy muvaffaqiyatli — https://manchester-united.uz"
else
  echo "✗ Sayt javob bermayapti! Orqaga qaytarish:"
  echo "  ssh $SERVER 'rm -rf $APP_DIR/current && mv $APP_DIR/previous $APP_DIR/current && sudo systemctl restart $SERVICE'"
  echo "  Loglar: ssh $SERVER 'sudo journalctl -u $SERVICE -n 50 --no-pager'"
  exit 1
fi

rm -rf "$BUILD_DIR"
