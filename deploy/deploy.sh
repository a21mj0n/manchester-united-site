#!/usr/bin/env bash
# Serverda ishga tushiriladi: yangi kodni tortadi, build qiladi va
# ishlab turgan versiyani almashtiradi.
#
# Ishlatish:  ./deploy/deploy.sh
set -euo pipefail

APP_DIR="/var/www/manchester-united-site"
REPO_DIR="$APP_DIR/repo"
SERVICE="red-devils"

echo "→ Yangi kod tortilmoqda…"
cd "$REPO_DIR"
git fetch --all
git reset --hard origin/main

echo "→ Paketlar o'rnatilmoqda…"
npm ci

echo "→ Build…"
npm run build

echo "→ Standalone yig'ilmoqda…"
rm -rf "$APP_DIR/current.new"
cp -r .next/standalone "$APP_DIR/current.new"
cp -r public          "$APP_DIR/current.new/"
cp -r .next/static    "$APP_DIR/current.new/.next/"

echo "→ Versiya almashtirilmoqda…"
rm -rf "$APP_DIR/previous"
[ -d "$APP_DIR/current" ] && mv "$APP_DIR/current" "$APP_DIR/previous"
mv "$APP_DIR/current.new" "$APP_DIR/current"

echo "→ Servis qayta ishga tushirilmoqda…"
sudo systemctl restart "$SERVICE"

sleep 3
if curl -fsS http://127.0.0.1:3000/api/health > /dev/null; then
  echo "✓ Deploy muvaffaqiyatli — sayt ishlayapti"
else
  echo "✗ Sayt javob bermayapti! Orqaga qaytarish:"
  echo "  rm -rf $APP_DIR/current && mv $APP_DIR/previous $APP_DIR/current && sudo systemctl restart $SERVICE"
  echo "  Loglar: sudo journalctl -u $SERVICE -n 50 --no-pager"
  exit 1
fi
