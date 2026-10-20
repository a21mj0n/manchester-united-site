#!/usr/bin/env bash
# football-data.org kalitini serverga o'rnatadi.
#
# Kalit terminaldan o'qiladi va faqat serverga uzatiladi —
# ekranda ko'rinmaydi, faylga yozilmaydi, git'ga tushmaydi.
#
# Ishlatish:  ./deploy/set-football-data-key.sh
set -euo pipefail

SERVER="${DEPLOY_SERVER:-root@189.74.96.196}"

echo "football-data.org kalitini sozlash"
echo "----------------------------------"
echo "Kalit: football-data.org/client/register -> emailga keladi"
echo "       (keyin football-data.org/client/login -> API token)"
echo

read -rsp "API kaliti: " KEY
echo
[ -n "$KEY" ] || { echo "Kalit bosh."; exit 1; }

echo
echo "Kalit tekshirilmoqda (Manchester United tarkibi)..."
TEAM=$(curl -s --max-time 20 "https://api.football-data.org/v4/teams/66" \
  -H "X-Auth-Token: ${KEY}" || true)

if ! grep -q '"squad"' <<<"$TEAM"; then
  echo "Kalit ishlamadi. Javob: $(head -c 200 <<<"$TEAM")"
  exit 1
fi

COUNT=$(node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{const j=JSON.parse(d);console.log((j.squad||[]).length);});' <<<"$TEAM")
echo "  ${COUNT} ta oyinchi olindi."

echo
echo "Mavsum oyinlari sinovdan otkazilmoqda..."
MATCHES=$(curl -s --max-time 20 "https://api.football-data.org/v4/teams/66/matches" \
  -H "X-Auth-Token: ${KEY}" || true)
MCOUNT=$(node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{const j=JSON.parse(d);console.log((j.matches||[]).length);});' <<<"$MATCHES")
if [ "$MCOUNT" -lt 1 ]; then
  echo "Oyinlar olinmadi. Javob: $(head -c 200 <<<"$MATCHES")"
  exit 1
fi
echo "  ${MCOUNT} ta oyin olindi."

ssh "$SERVER" bash -s -- "$KEY" <<'REMOTE'
set -euo pipefail
ENV_FILE=/etc/red-devils.env
umask 077
touch "$ENV_FILE"
grep -v '^FOOTBALL_DATA_KEY' "$ENV_FILE" > "${ENV_FILE}.new" || true
echo "FOOTBALL_DATA_KEY=$1" >> "${ENV_FILE}.new"
mv "${ENV_FILE}.new" "$ENV_FILE"
chmod 600 "$ENV_FILE"
chown root:root "$ENV_FILE"
systemctl restart red-devils
echo "Server yangilandi."
REMOTE

echo
echo "Tayyor. Keyingi sinxronizatsiyada oyinlar, jadval va tarkib"
echo "football-data.org dan olinadi. Hozir ishga tushirish uchun:"
echo "  sudo systemctl start red-devils-sync.service"
