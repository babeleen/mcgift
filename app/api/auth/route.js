export async function POST(request) {
  const { password } = await request.json();
  const familyPw = process.env.SITE_PASSWORD;
  const adminPin = process.env.ADMIN_PIN;

  if (!familyPw) return Response.json({ ok: true, role: "admin" });

  if (adminPin && password === adminPin) {
    return Response.json({ ok: true, role: "admin" });
  }

  if (password === familyPw) {
    return Response.json({ ok: true, role: "family" });
  }

  return Response.json({ ok: false });
}
