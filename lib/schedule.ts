/**
 * O'yin vaqtini hisoblash — server va klientda bir xil ishlaydi.
 * Alohida fayl, chunki NextMatch (client component) buni import qiladi
 * va bunda butun ma'lumot qatlami klientga tushib ketmasligi kerak.
 */

/** Keyingi o'yin — eng yaqin shanba, soat 21:30. */
export function getNextKickoff(from: Date = new Date()): Date {
  const d = new Date(from);
  d.setHours(21, 30, 0, 0);
  const diff = (6 - d.getDay() + 7) % 7; // 6 = shanba
  if (diff === 0 && d <= from) d.setDate(d.getDate() + 7);
  else d.setDate(d.getDate() + diff);
  return d;
}
