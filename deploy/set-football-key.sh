#!/usr/bin/env bash
# API-Football kalitini serverga o'rnatadi.
#
# Kalit terminaldan o'qiladi va faqat serverga uzatiladi —
# ekranda ko'rinmaydi, faylga yozilmaydi, git'ga tushmaydi.
#
# Ishlatish:  ./deploy/set-football-key.sh
set -euo pipefail

SERVER="${DEPLOY_SERVER:-root@189.74.96.196}"

echo "API-Football kalitini sozlash"
echo "-----------------------------"
echo "Kalit: dashboard.api-football.com -> Profile -> API Key"
echo

read -rsp "API kaliti: " KEY
echo
[ -n "$KEY" ] || { echo "Kalit bosh."; exit 1; }

echo
echo "Kalit tekshirilmoqda..."
STATUS=$(curl -s --max-time 20 "https://v3.football.api-sports.io/status" \
  -H "x-apisports-key: ${KEY}" || true)

if ! grep -q '"account"' <<<"$STATUS"; then
  echo "Kalit ishlamadi. Javob: $(head -c 200 <<<"$STATUS")"
  exit 1
fi

node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{const r=JSON.parse(d).response||{};console.log("  tarif:",r.subscription&&r.subscription.plan);console.log("  limit:",r.requests&&r.requests.current,"/",r.requests&&r.requests.limit_day);});' <<<"$STATUS"

echo
echo "Tarkib sinovdan otkazilmoqda..."
SQUAD=$(curl -s --max-time 20 "https://v3.football.api-sports.io/players/squads?team=33" \
  -H "x-apisports-key: ${KEY}" || true)

COUNT=$(node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{const j=JSON.parse(d);const p=(j.response&&j.response[0]&&j.response[0].players)||[];console.log(p.length);});' <<<"$SQUAD")

if [ "$COUNT" -lt 1 ]; then
  echo "Tarkib olinmadi - bu endpoint kalitingizda ochiq emasmi?"
  exit 1
fi
echo "  ${COUNT} ta oyinchi olindi."

ssh "$SERVER" bash -s -- "$KEY" <<'REMOTE'
set -euo pipefail
ENV_FILE=/etc/red-devils.env
umask 077
touch "$ENV_FILE"
grep -v '^FOOTBALL_API_KEY' "$ENV_FILE" > "${ENV_FILE}.new" || true
echo "FOOTBALL_API_KEY=$1" >> "${ENV_FILE}.new"
mv "${ENV_FILE}.new" "$ENV_FILE"
chmod 600 "$ENV_FILE"
chown root:root "$ENV_FILE"
systemctl restart red-devils
echo "Server yangilandi."
REMOTE

echo
echo "Tayyor. Jamoa tarkibi endi haqiqiy malumotdan olinadi."
echo "Tekshirish: https://manchester-united.uz/#squad"
