#!/usr/bin/env node
/**
 * Admin paroli uchun xesh yaratadi.
 *
 *   npm run admin:password
 *
 * Parol ekranda ko'rinmaydi va hech qayerga saqlanmaydi —
 * faqat xesh chiqariladi, uni ADMIN_PASSWORD_HASH ga qo'yasiz.
 *
 * Xesh formati lib/password.ts bilan bir xil: scrypt:<salt>:<hash>
 */
import { randomBytes, scrypt } from "node:crypto";
import { createInterface } from "node:readline";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });

    process.stdout.write(question);
    // Yozilayotgan belgilar ekranda ko'rinmasin
    rl._writeToOutput = () => {};

    rl.question("", (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

const password = await askHidden("Yangi admin paroli: ");

if (password.length < 10) {
  console.error("Parol kamida 10 belgidan iborat bo'lishi kerak.");
  process.exit(1);
}

const salt = randomBytes(16);
const derived = await scryptAsync(password, salt, KEY_LENGTH);
const hash = "scrypt:" + salt.toString("hex") + ":" + derived.toString("hex");

console.log("\nADMIN_PASSWORD_HASH qiymati:\n");
console.log(hash);
console.log("\nLokal uchun .env ga qo'ying.");
console.log("Serverda: /etc/systemd/system/red-devils.service ichiga qo'shib,");
console.log("  sudo systemctl daemon-reload && sudo systemctl restart red-devils");
