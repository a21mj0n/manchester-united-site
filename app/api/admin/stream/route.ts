import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getSecretStreamUrl, setSecretStreamUrl } from "@/lib/settings";

/** GET /api/admin/stream — joriy yashirin efir havolasi. */
export async function GET() {
  return NextResponse.json({ url: await getSecretStreamUrl() });
}

/** PUT /api/admin/stream — havolani yangilash. */
export async function PUT(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "So'rov formati noto'g'ri." }, { status: 400 });
  }

  const url =
    typeof body === "object" && body !== null && "url" in body
      ? String((body as { url: unknown }).url).trim()
      : "";

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Havola noto'g'ri." }, { status: 400 });
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return NextResponse.json(
      { error: "Faqat http yoki https havola bo'lishi mumkin." },
      { status: 400 },
    );
  }

  try {
    await setSecretStreamUrl(url);
    // Tomosha sahifasi yangi havolani darhol ko'rsatsin
    revalidatePath("/tomosha");
    return NextResponse.json({ url });
  } catch (error) {
    console.error("[admin/stream] saqlashda xatolik:", error);
    return NextResponse.json({ error: "Saqlab bo'lmadi." }, { status: 500 });
  }
}
