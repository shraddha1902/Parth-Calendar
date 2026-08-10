export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    // ignore
  }
  const correct = Netlify.env.get("APP_PIN");
  if (body.pin && correct && body.pin === correct) {
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "content-type": "application/json" }
    });
  }
  return new Response(JSON.stringify({ ok: false }), {
    status: 401,
    headers: { "content-type": "application/json" }
  });
};

export const config = {
  path: "/api/auth"
};
