const TRANSLATOR_URL = process.env.TRANSLATOR_URL ?? "http://localhost:5003";

export async function POST(request: Request) {
  const formData = await request.formData();
  const image = formData.get("image") as File;

  if (!image) {
    return Response.json({ error: "image is required" }, { status: 400 });
  }

  const body = new FormData();
  body.append("file", image);
  body.append("translator", (formData.get("translator") as string) ?? "openai");
  body.append("target_lang", (formData.get("target_lang") as string) ?? "KOR");

  const res = await fetch(`${TRANSLATOR_URL}/translate/with-form/image`, {
    method: "POST",
    body,
  });

  if (!res.ok) {
    return Response.json(
      { error: "translation failed" },
      { status: res.status },
    );
  }

  const blob = await res.blob();
  return new Response(blob, {
    headers: { "Content-Type": "image/png" },
  });
}
