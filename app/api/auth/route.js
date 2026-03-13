export async function POST(request) {
  const { password } = await request.json();
  const correct = process.env.SITE_PASSWORD;
  if (!correct) return Response.json({ ok: true });
  return Response.json({ ok: password === correct });
}
