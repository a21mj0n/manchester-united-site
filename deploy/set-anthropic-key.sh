#!/usr/bin/env bash
# Anthropic API kalitini serverga o'rnatadi (yangiliklarni o'zbekchaga
# o'girish uchun).
#
# Kalit terminaldan o'qiladi va faqat serverga uzatiladi.
#
# Ishlatish:  ./deploy/set-anthropic-key.sh
set -euo pipefail

SERVER="${DEPLOY_SERVER:-root@189.74.96.196}"

echo "Anthropic API kalitini sozlash"
echo "------------------------------"
echo "Kalit: console.anthropic.com -> API Keys"
echo

read -rsp "API kaliti: " KEY
echo
[ -n "$KEY" ] || { echo "Kalit bosh."; exit 1; }

echo
echo "Kalit tekshirilmoqda..."
RESP=$(curl -s --max-time 30 https://api.anthropic.com/v1/messages \
  -H "x-api-key: ${KEY}" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-opus-5","max_tokens":16,"messages":[{"role":"user","content":"Javob: OK"}]}' || true)

if ! grep -q '"content"' <<<"$RESP"; then
  echo "Kalit ishlamadi. Javob: $(head -c 250 <<<"$RESP")"
  exit 1
fi
echo "  kalit ishlayapti."

ssh "$SERVER" bash -s -- "$KEY" <<'REMOTE'
set -euo pipefail
ENV_FILE=/etc/red-devils.env
umask 077
touch "$ENV_FILE"
grep -v '^ANTHROPIC_API_KEY' "$ENV_FILE" > "${ENV_FILE}.new" || true
echo "ANTHROPIC_API_KEY=$1" >> "${ENV_FILE}.new"
mv "${ENV_FILE}.new" "$ENV_FILE"
chmod 600 "$ENV_FILE"
chown root:root "$ENV_FILE"
systemctl restart red-devils
echo "Server yangilandi."
REMOTE

echo
echo "Tayyor. Keyingi sinxronizatsiyada sarlavhalar o'zbekchaga o'giriladi."
echo "Darhol sinash uchun: /admin/sync -> Hozir yangilash"
