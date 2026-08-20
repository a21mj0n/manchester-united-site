#!/usr/bin/env bash
# Admin parolini serverda almashtiradi.
#
# Parol terminaldan o'qiladi, shu yerda xeshlanadi va faqat xesh
# serverga uzatiladi. Parolning o'zi hech qayerga yozilmaydi va
# ekranda ko'rinmaydi.
#
# Ishlatish:  ./deploy/set-admin-password.sh
set -euo pipefail

SERVER="${DEPLOY_SERVER:-root@189.74.96.196}"

echo "Admin parolini almashtirish"
echo "---------------------------"

read -rsp "Yangi parol: " P1; echo
read -rsp "Yana bir marta: " P2; echo

[ "$P1" = "$P2" ] || { echo "Parollar mos kelmadi."; exit 1; }
[ "${#P1}" -ge 10 ] || { echo "Parol kamida 10 belgi bolishi kerak."; exit 1; }

HASH=$(P="$P1" node -e '
const {randomBytes,scrypt}=require("node:crypto");
const {promisify}=require("node:util");
const s=promisify(scrypt);
(async()=>{
  const salt=randomBytes(16);
  const d=await s(process.env.P,salt,64);
  console.log("scrypt:"+salt.toString("hex")+":"+d.toString("hex"));
})();')

[ -n "$HASH" ] || { echo "Xesh yaratilmadi."; exit 1; }

ssh "$SERVER" bash -s -- "$HASH" <<'REMOTE'
set -euo pipefail
ENV_FILE=/etc/red-devils.env
umask 077
touch "$ENV_FILE"
grep -v '^ADMIN_PASSWORD_HASH' "$ENV_FILE" > "${ENV_FILE}.new" || true
echo "ADMIN_PASSWORD_HASH=$1" >> "${ENV_FILE}.new"
mv "${ENV_FILE}.new" "$ENV_FILE"
chmod 600 "$ENV_FILE"
chown root:root "$ENV_FILE"
systemctl restart red-devils
echo "Server yangilandi."
REMOTE

echo
echo "Tayyor. Yangi parol bilan kiring: https://manchester-united.uz/login"
