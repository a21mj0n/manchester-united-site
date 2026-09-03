import { NextResponse } from "next/server";

import { contentTypeFor, readUpload } from "@/lib/uploads";

/** GET /uploads/<nom> — yuklangan rasmni beradi. */
export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const data = await readUpload(name);
  if (!data) return new NextResponse(null, { status: 404 });

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": contentTypeFor(name),
      "Cache-Control": "public, max-age=604800, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
