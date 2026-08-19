#!/usr/bin/env bash
# Telegram bot ma'lumotlarini serverga o'rnatadi.
#
# Token terminaldan o'qiladi va faqat serverga uzatiladi —
# hech qayerga yozib qo'yilmaydi va ekranda ko'rinmaydi.
#
# Ishlatish:  ./deploy/set-telegram.sh
set -euo pipefail

SERVER="${DEPLOY_SERVER:-root@189.74.96.196}"
ENV_FILE=/etc/red-devils.env

echo "Telegram botni sozlash"
echo "----------------------"
echo "Bot yaratish: Telegramda @BotFather ga /newbot deb yozing."
echo

read -rsp "Bot tokeni: " TOKEN
echo
[ -n "$TOKEN" ] || { echo "Token bo'sh."; exit 1; }

echo
echo "Chat ID aniqlanmoqda… (botga Telegramda istalgan xabar yozgan bo'lishingiz kerak)"
UPDATES=$(curl -s --max-time 15 "https://api.telegram.org/bot${TOKEN}/getUpdates" || true)

if ! grep -q '"ok":true' <<<"$UPDATES"; then
  echo "Telegram javob bermadi yoki token noto'g'ri."
  echo "Javob: $(head -c 200 <<<"$UPDATES")"
  exit 1
fi

# Topilgan chatlarni ko'rsatamiz
FOUND=$(node -e '
let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{
  const r=JSON.parse(d).result||[];
  const seen=new Map();
  for(const u of r){
    const c=(u.message||u.channel_post||{}).chat;
    if(c) seen.set(c.id,[c.title,c.first_name,c.username].filter(Boolean).join(" "));
  }
  for(const [id,name] of seen) console.log(id+"\t"+name);
});' <<<"$UPDATES")

if [ -z "$FOUND" ]; then
  echo "Hech qanday chat topilmadi. Botga Telegramda xabar yozing va qayta urinib ko'ring."
  exit 1
fi

echo "Topilgan chatlar:"
echo "$FOUND" | sed 's/^/  /'
echo
read -rp "Qaysi Chat ID ishlatilsin: " CHAT_ID
[ -n "$CHAT_ID" ] || { echo "Chat ID bo'sh."; exit 1; }

echo
echo "Sinov xabari yuborilmoqda…"
RESULT=$(curl -s --max-time 15 -X POST "https://api.telegram.org/bot${TOKEN}/sendMessage" \
  -H 'Content-Type: application/json' \
  -d "{\"chat_id\":\"${CHAT_ID}\",\"text\":\"Red Devils Uzbekistan: bildirishnomalar ulandi.\"}")

grep -q '"ok":true' <<<"$RESULT" || { echo "Yuborilmadi: $(head -c 200 <<<"$RESULT")"; exit 1; }
echo "Telegramda xabarni ko'rdingizmi? Ha bo'lsa davom etamiz."

ssh "$SERVER" bash -s -- "$TOKEN" "$CHAT_ID" <<'REMOTE'
set -euo pipefail
ENV_FILE=/etc/red-devils.env
umask 077
touch "$ENV_FILE"
# Eski qiymatlarni olib tashlab, yangisini qo'shamiz
grep -v '^TELEGRAM_' "$ENV_FILE" > "${ENV_FILE}.new" || true
{
  echo "TELEGRAM_BOT_TOKEN=$1"
  echo "TELEGRAM_CHAT_ID=$2"
} >> "${ENV_FILE}.new"
mv "${ENV_FILE}.new" "$ENV_FILE"
chmod 600 "$ENV_FILE"
chown root:root "$ENV_FILE"
systemctl restart red-devils
echo "Server yangilandi."
REMOTE

echo
echo "Tayyor. Endi har yangi arizada Telegramga xabar keladi."
