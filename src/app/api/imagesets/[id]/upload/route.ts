import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { utapi } from "@/app/api/uploadthing/core";

const API_BASE_URL = process.env.SLIDESCOCKPIT_API || "http://localhost:3000";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();

  try {
    const form = await request.formData();
    const files = form
      .getAll("images")
      .filter((f): f is File => f instanceof File);
    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // 1) Originaldateien zu UploadThing hochladen
    const uploaded = await Promise.all(
      files.map(async (f) => {
        const buf = Buffer.from(await f.arrayBuffer());
        const res = await utapi.uploadFiles(
          new File([buf], f.name, {
            type: f.type || "application/octet-stream",
          }),
        );
        const fileUrl = (res?.data?.ufsUrl ?? res?.data?.url) as string | undefined;
        if (!fileUrl) throw new Error("UploadThing failed");
        return { url: fileUrl, filename: f.name };
      }),
    );

    // 2) Backend direkt befüllen – ohne Cropping
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (session?.user?.id) headers["x-user-id"] = session.user.id;
    if (session?.user?.email) headers["x-user-email"] = session.user.email!;
    if (session?.user?.name) headers["x-user-name"] = session.user.name!;

    const createRes = await fetch(`${API_BASE_URL}/imagesets/${id}/images`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        images: uploaded.map((img, index) => ({
          ...img,
          processing: "none",
          fit: "contain",
          keepOriginal: true,
          originalFilename: files[index]?.name ?? img.filename,
        })),
      }),
    });
    if (createRes.ok) {
      const data = await createRes.json();
      return NextResponse.json(data, { status: 200 });
    }

    // 3) Fallback: alter Proxy (nur wenn nötig)
    const fallbackForm = new FormData();
    form.forEach((v, k) => fallbackForm.append(k, v));
    fallbackForm.set("preserveOriginal", "1");
    const proxied = await fetch(`${API_BASE_URL}/imagesets/${id}/upload`, {
      method: "POST",
      headers: Object.fromEntries(
        Object.entries({
          "x-user-id": session?.user?.id,
          "x-user-email": session?.user?.email,
          "x-user-name": session?.user?.name,
        }).filter(([, v]) => !!v),
      ) as Record<string, string>,
      body: fallbackForm,
    });
    const proxiedData = await proxied.json().catch(() => ({}));
    return NextResponse.json(proxiedData, { status: proxied.status || 200 });
  } catch {
    return NextResponse.json({ error: "Failed to upload images" }, { status: 500 });
  }
}
